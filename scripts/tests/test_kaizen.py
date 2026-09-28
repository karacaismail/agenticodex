import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('kaizen', Path(__file__).parents[1] / 'kaizen.py')
k = importlib.util.module_from_spec(spec)
spec.loader.exec_module(k)

class KaizenTests(unittest.TestCase):
    def test_zero_tests_cannot_pass(self):
        self.assertFalse(k.parse_tests({'success': True})['valid'])

    def test_skipped_or_failed_cannot_pass(self):
        for extra in ({'numPendingTests':1}, {'numFailedTests':1}, {'numPassedTests':0}):
            r={'success':True,'numTotalTests':1,'numPassedTests':1,**extra}
            self.assertFalse(k.parse_tests(r)['valid'])

    def test_known_good_and_no_acceptance(self):
        self.assertTrue(k.parse_tests({'success':True,'numTotalTests':1,'numPassedTests':1})['valid'])
        self.assertEqual(k.observed_status([{'exit_code':0,'valid':True}],'a','a'), 'checks_passed_observe_only')
        self.assertEqual(k.observed_status([], 'a','a'), 'checks_failed')
        self.assertEqual(k.observed_status([{'exit_code':0,'valid':True}],'a','b'), 'source_changed')

    def test_duplicate_and_conflicting_event(self):
        db=sqlite3.connect(':memory:')
        self.assertIsNone(k.reserve(db,'p','e','t','hash'))
        with self.assertRaises(ValueError): k.reserve(db,'p','e','t','hash')
        db.execute('UPDATE events SET result=?', (json.dumps({'status':'checks_failed'}),))
        db.commit()
        self.assertEqual(k.reserve(db,'p','e','t','hash')['status'],'checks_failed')
        with self.assertRaises(ValueError): k.reserve(db,'p','e','t','different')
        self.assertEqual(db.execute('SELECT count(*) FROM events').fetchone()[0],1)

    def test_concurrent_reservation(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / 'events.sqlite')
            db = sqlite3.connect(path)
            k.reserve(db, 'setup', 'setup', 't', 'hash')
            db.close()
            barrier = Barrier(8)
            def attempt(_):
                connection = sqlite3.connect(path, timeout=5)
                try:
                    barrier.wait()
                    try:
                        return k.reserve(connection, 'p', 'e', 't', 'hash')
                    except ValueError:
                        return 'in_progress'
                finally:
                    connection.close()
            with ThreadPoolExecutor(max_workers=8) as pool:
                results = list(pool.map(attempt, range(8)))
            self.assertEqual(results.count(None), 1)
            self.assertEqual(results.count('in_progress'), 7)

    def test_dirty_source_and_secret_exclusion(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            subprocess.run(['git','init','-q',tmp],check=True)
            (root/'src').mkdir()
            (root/'src/a.ts').write_text('old')
            (root/'src/.env.local').write_text('token=not-for-manifest')
            before=k.tree_manifest(root)
            (root/'src/a.ts').write_text('new')
            after=k.tree_manifest(root)
            self.assertNotEqual(before['sha256'],after['sha256'])
            self.assertEqual([f['path'] for f in before['files']],['src/a.ts'])

    def test_timeout_terminates_runner(self):
        import sys
        with self.assertRaises(subprocess.TimeoutExpired):
            k.execute([sys.executable,'-c','import time; time.sleep(10)'],.05,Path.cwd())
