"""Local observation only. Never emits ACCEPTED or changes product/policy files."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import sqlite3
import subprocess
import sys
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
SAFE_DIRS = ('src/', 'scripts/', 'quality/', 'e2e/', '.github/')
SAFE_ROOT = {'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'playwright.config.ts'}
SECRET = re.compile(r'(^|/)(\.env[^/]*|[^/]*(?:secret|credential)[^/]*)(/|$)|\.(pem|key|p12)$', re.I)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def tree_manifest(root):
    paths = subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=root).decode().split('\0')
    entries = []
    for name in sorted(set(paths)):
        if name.startswith('quality/evidence/') or not name or SECRET.search(name) or not (name.startswith(SAFE_DIRS) or name in SAFE_ROOT):
            continue
        p = root / name
        if p.is_symlink():
            raise ValueError('Source symlink requires explicit review')
        entries.append({'path': name, 'sha256': digest(p.read_bytes()) if p.is_file() else 'DELETED'})
    return {'scope': 'code-and-quality-allowlist-v1', 'files': entries, 'sha256': digest(json.dumps(entries, sort_keys=True).encode())}


def parse_tests(report):
    total = report.get('numTotalTests', 0)
    failed = report.get('numFailedTests', 0)
    skipped = report.get('numPendingTests', 0) + report.get('numTodoTests', 0)
    passed = report.get('numPassedTests', 0)
    valid = all(type(v) is int and v >= 0 for v in (total, failed, skipped, passed))
    ok = valid and total > 0 and failed == 0 and skipped == 0 and passed == total and report.get('success') is True
    return {'total': total, 'passed': passed, 'failed': failed, 'skipped': skipped, 'valid': ok}


def observed_status(checks, before, after):
    if before != after:
        return 'source_changed'
    if not checks or any(c['exit_code'] != 0 or not c.get('valid', False) for c in checks):
        return 'checks_failed'
    return 'checks_passed_observe_only'


def execute(command, timeout, root):
    p = subprocess.Popen(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        raw, _ = p.communicate(timeout=timeout)
        return p.returncode, raw.decode(errors='replace')
    except (subprocess.TimeoutExpired, KeyboardInterrupt):
        os.killpg(p.pid, signal.SIGTERM)
        try:
            p.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            os.killpg(p.pid, signal.SIGKILL)
            p.communicate()
        raise


def reserve(db, project, event, task, source):
    db.execute('CREATE TABLE IF NOT EXISTS events (project TEXT, event TEXT, task TEXT, source TEXT, result TEXT, PRIMARY KEY(project,event))')
    with db:
        # Acquire the write lock before reading so concurrent claims serialize.
        db.execute('BEGIN IMMEDIATE')
        old = db.execute('SELECT task,source,result FROM events WHERE project=? AND event=?', (project,event)).fetchone()
        if old:
            if old[:2] != (task, source):
                raise ValueError('Event id already belongs to another task or source tree')
            if old[2] is None:
                raise ValueError('Event is in progress or interrupted; inspect it and use a new event id')
            return json.loads(old[2])
        db.execute('INSERT INTO events VALUES (?,?,?,?,NULL)', (project,event,task,source))
    return None


def observe(args):
    policy_path = ROOT / 'quality/kaizen/policy.json'
    policy = json.loads(policy_path.read_text())
    if policy['mode'] != 'observe' or policy['checks'] != ['typecheck','vitest','python']:
        raise ValueError('Only the fixed local observation plan is supported')
    before = tree_manifest(ROOT)
    output = ROOT / '.kaizen'
    output.mkdir(exist_ok=True, mode=0o700)
    db = sqlite3.connect(output / 'events.sqlite', timeout=5)
    db.execute('PRAGMA journal_mode=WAL')
    old = reserve(db, args.project, args.event, args.task, before['sha256'])
    if old:
        prior = ROOT / old['artifact']
        if not prior.is_file() or digest(prior.read_bytes()) != old['sha256']:
            raise ValueError('Stored evidence missing or checksum mismatch')
        print(json.dumps({'duplicate': True, **old}, ensure_ascii=False))
        return 0 if old['status'] == 'checks_passed_observe_only' else 1
    run = uuid.uuid4().hex
    folder = output / run
    folder.mkdir(mode=0o700)
    checks = []
    started = time.time()
    interrupted = None
    try:
        with tempfile.TemporaryDirectory(prefix='atlas-kaizen-') as tmp:
            report = Path(tmp) / 'vitest.json'
            commands = [
                ('typecheck', ['npm','run','typecheck']),
                ('vitest', ['npx','vitest','run','--reporter=json',f'--outputFile={report}']),
                ('python', [sys.executable,'-m','unittest','discover','-s','scripts/tests']),
            ]
            for name, command in commands:
                begin = time.monotonic()
                code, raw = execute(command, policy['timeout_seconds_per_check'], ROOT)
                check = {'name':name, 'exit_code':code, 'seconds':round(time.monotonic()-begin,3), 'valid':code == 0}
                if name == 'vitest':
                    check.update(parse_tests(json.loads(report.read_text())) if report.exists() else {'valid':False,'total':0})
                elif name == 'python':
                    count = re.search(r'Ran (\d+) tests?', raw)
                    check.update(total=int(count[1]) if count else 0)
                    check['valid'] = code == 0 and bool(count) and int(count[1]) > 0 and not re.search(r'skipped=\d*[1-9]', raw)
                # Raw stdout, trace bodies and test names are intentionally not persisted.
                checks.append(check)
    except (KeyboardInterrupt, subprocess.TimeoutExpired) as exc:
        interrupted = 'cancelled' if isinstance(exc, KeyboardInterrupt) else 'timeout'
    except Exception:
        interrupted = 'adapter_error'
    after = tree_manifest(ROOT)
    status = interrupted or observed_status(checks, before['sha256'], after['sha256'])
    evidence = {'project_id':args.project, 'task_id':args.task, 'event_id':args.event, 'run_id':run,
                'producer':'local-observer-v1', 'authoritative':False, 'status':status,
                'source':before, 'source_after':after['sha256'], 'policy_sha256':digest(policy_path.read_bytes()),
                'started_at':started, 'elapsed_seconds':round(time.time()-started,3), 'checks':checks,
                'cost':None, 'accepted_tasks':0, 'cost_per_accepted_task':None,
                'limits':['No independent authority','No build/endpoint identity adapter','No repair or promotion','No real-device validation']}
    payload = json.dumps(evidence, ensure_ascii=False, sort_keys=True).encode()
    artifact = folder / 'evidence.json'
    with artifact.open('xb') as f:
        f.write(payload)
    result = {'run_id':run,'status':status,'artifact':str(artifact.relative_to(ROOT)), 'sha256':digest(payload)}
    with db:
        db.execute('UPDATE events SET result=? WHERE project=? AND event=?', (json.dumps(result),args.project,args.event))
    # JSONL is a per-run export; SQLite is the transactional event source of truth.
    (folder / 'events.jsonl').write_text(json.dumps(result)+'\n')
    db.close()
    print(json.dumps(result, ensure_ascii=False))
    return 0 if status == 'checks_passed_observe_only' else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', default='agenticodex')
    parser.add_argument('--task', required=True)
    parser.add_argument('--event', required=True)
    args = parser.parse_args()
    if not all(re.fullmatch(r'[A-Za-z0-9_.-]{1,100}', x) for x in (args.project,args.task,args.event)):
        parser.error('Identifiers must be short, non-sensitive ASCII identifiers')
    sys.exit(observe(args))
