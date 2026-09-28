# -*- coding: utf-8 -*-
"""GenUI korpusunu analiz edip uygulamanın kullandığı JSON verisini üretir.

Girdi: ../ (araştırma raporları, evidence-register.json, partial-analyses/)
Çıktı: src/data/generated/*.json
"""
import glob
import hashlib
import json
import math
import os
import re
import sys
import urllib.parse
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(HERE, "..", "src", "data", "generated")
sys.path.insert(0, HERE)
from catalog import E, GOLDEN, LAYERS, TOPIC_KEYWORDS  # noqa: E402

os.makedirs(OUT, exist_ok=True)

MAIN_REPORTS = [
    "pre_research_chatgpt", "pre_research_claude", "pre_brief_chatgpt",
    "research_gemini", "research_chatgpt", "research_claude",
    "review_chatgpt", "review_claude",
]
REPORT_LABELS = {
    "pre_research_chatgpt": "Ön araştırma · ChatGPT",
    "pre_research_claude": "Ön araştırma · Claude",
    "pre_brief_chatgpt": "Ön sentez · ChatGPT",
    "research_gemini": "Araştırma · Gemini",
    "research_chatgpt": "Araştırma · ChatGPT",
    "research_claude": "Araştırma · Claude",
    "review_chatgpt": "Yeniden inceleme · ChatGPT",
    "review_claude": "Yeniden inceleme · Claude",
    "synthesis": "Sentez raporu",
    "partials": "Ara analizler (34)",
}


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def dump(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  → {name}: {os.path.getsize(path)/1024:.0f} KB")


def slugify(s):
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    s = s.translate(tr).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "x"


# ---------------------------------------------------------------- korpus
print("Korpus okunuyor…")
texts = {r: read(os.path.join(ROOT, r + ".md")) for r in MAIN_REPORTS}
synthesis = read(os.path.join(ROOT, "GENUI-SENTEZ-RAPORU.md"))
brief = read(os.path.join(ROOT, "original-research-brief.md"))
partials = {os.path.basename(p)[:-3]: read(p) for p in sorted(glob.glob(os.path.join(ROOT, "partial-analyses", "*.md")))}
register = json.load(open(os.path.join(ROOT, "evidence-register.json"), encoding="utf-8"))
manifest = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))

# ---------------------------------------------------------------- zenginleştirme
enrich = {}
for p in sorted(glob.glob(os.path.join(HERE, "enrich", "*.json"))):
    try:
        enrich.update(json.load(open(p, encoding="utf-8")))
    except Exception as ex:  # bozuk dosya tüm hattı durdurmasın
        print("  ! zenginleştirme okunamadı:", p, ex)
print(f"  zenginleştirme kaydı: {len(enrich)} / {len(E)}")

DEFAULTS = {
    "desc": "", "summary": "", "license": "Bilinmiyor", "maturity": "Bilinmiyor", "vendor": "Bilinmiyor",
    "platform": "Framework bağımsız", "effort": "Orta", "stance": "Referans", "rTopics": [], "facts": [],
    "risks": [], "url": "", "version": "",
}

# ---------------------------------------------------------------- araç derleme
tools = []
regex = {}
for (tid, name, aliases, kind, layer, golden, tags) in E:
    rx = re.compile("|".join(f"(?:{a})" for a in aliases))
    regex[tid] = rx
    t = {"id": tid, "name": name, "kind": kind, "layer": layer, "golden": golden, "tags": tags}
    en = enrich.get(tid, {})
    for k, v in DEFAULTS.items():
        t[k] = en.get(k, v) if en.get(k) not in (None, "") else v
    t["rTopics"] = sorted({r for r in t["rTopics"] if re.fullmatch(r"R\d\d", str(r))})
    if en.get("provenance"):
        t["provenance"] = en["provenance"]
    tools.append(t)
tool_by_id = {t["id"]: t for t in tools}

print("Geçiş sayıları hesaplanıyor…")
for t in tools:
    rx = regex[t["id"]]
    per = {r: len(rx.findall(texts[r])) for r in MAIN_REPORTS}
    per["synthesis"] = len(rx.findall(synthesis))
    per["partials"] = sum(len(rx.findall(v)) for v in partials.values())
    t["mentions"] = per
    t["mentionTotal"] = sum(per.values())
    t["coverage"] = sum(1 for r in MAIN_REPORTS if per[r] > 0)
    t["partialCoverage"] = sum(1 for v in partials.values() if rx.search(v))
    t["inSynthesis"] = per["synthesis"] > 0

# ---------------------------------------------------------------- araştırma konuları
print("Araştırma konuları ayrıştırılıyor…")
topics = []
segments = []
seg = None
for block in re.split(r"\n(?=## [A-G] — |### R\d\d — )", brief):
    m = re.match(r"## ([A-G]) — (.+)", block)
    if m:
        seg = {"id": m.group(1), "title": m.group(2).strip(), "topics": []}
        segments.append(seg)
        continue
    m = re.match(r"### (R\d\d) — (.+)", block)
    if not m:
        continue
    rid, title = m.group(1), m.group(2).strip()
    q = re.search(r"\*\*Ana soru:\*\* (.+)", block)
    out = re.search(r"\*\*Beklenen çıktı:\*\* (.+)", block)
    subs = [s.strip() for s in re.findall(r"^\d\. (.+)$", block, re.M)]
    topics.append({
        "id": rid, "title": title, "segment": seg["id"] if seg else "",
        "question": q.group(1).strip() if q else "", "subQuestions": subs,
        "expected": out.group(1).strip() if out else "",
    })
    seg["topics"].append(rid)

# sentez raporundaki kapsam haritası
coverage_rows = re.findall(r"^\| (R\d\d) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$", synthesis, re.M)
cov = {r: {"short": s.strip(), "clusters": [int(x) for x in re.findall(r"\d+", c)], "openCheck": o.strip()} for r, s, c, o in coverage_rows}
for tp in topics:
    tp.update(cov.get(tp["id"], {"short": tp["title"], "clusters": [], "openCheck": ""}))

# bağımlılık hatları (bölüm 6)
lines_tbl = re.findall(r"^\| ([^|]+) \| ([^|]+) \| ([^|]+) \|$", brief.split("## 6.")[1].split("## 7.")[0], re.M)
tracks = []
for a, b, c in lines_tbl:
    if a.strip() in ("Araştırma hattı", "---"):
        continue
    ids = []
    for m in re.finditer(r"R(\d\d)(?:–R(\d\d))?", b):
        s = int(m.group(1)); e = int(m.group(2) or s)
        ids += [f"R{i:02d}" for i in range(s, e + 1)]
    tracks.append({"name": a.strip(), "input": b.strip(), "output": c.strip(), "topics": ids})

# ---------------------------------------------------------------- sentez yapısı
print("Sentez yapısı ayrıştırılıyor…")
syn_sections = []
for m in re.finditer(r"^## (\d+)\. (.+)$\n\n\*Araştırma bağlantısı: ([^*]+)\*", synthesis, re.M):
    ids = []
    for mm in re.finditer(r"R(\d\d)(?:–R(\d\d))?", m.group(3)):
        s = int(mm.group(1)); e = int(mm.group(2) or s)
        ids += [f"R{i:02d}" for i in range(s, e + 1)]
    syn_sections.append({"n": int(m.group(1)), "title": m.group(2).strip(), "topics": ids})

gates = []
gsec = synthesis.split("### 12.2.")[1].split("### 12.3.")[0]
for a, b, c in re.findall(r"^\| ([A-F] — [^|]+) \| ([^|]+) \| ([^|]+) \|$", gsec, re.M):
    gid, gname = a.split(" — ", 1)
    gates.append({"id": gid.strip(), "name": gname.strip(), "output": b.strip(), "exit": c.strip()})

decisions = []
dsec = synthesis.split("## Karar defteri")[1].split("## Açık riskler")[0]
for a, b, c in re.findall(r"^\| ([^|]+) \| ([^|]+) \| ([^|]+) \|$", dsec, re.M):
    if a.strip() in ("Konu", "---"):
        continue
    decisions.append({"topic": a.strip(), "decision": b.strip(), "limit": c.strip()})

risks = []
rsec = synthesis.split("## Açık riskler ve bilinmeyenler")[1].split("## Özgün 28")[0]
for m in re.finditer(r"^\d+\. \*\*(.+?):\*\* (.+)$", rsec, re.M):
    risks.append({"title": m.group(1).strip(), "text": m.group(2).strip()})

# ---------------------------------------------------------------- kaynaklar
print("Kaynaklar ve iddialar eşleniyor…")
URL_HINTS = {
    "a2ui": ["a2ui"], "ag-ui": ["ag-ui", "docs.ag-ui"], "json-render": ["json-render"], "copilotkit": ["copilotkit"],
    "tambo": ["tambo"], "openui": ["openui"], "thesys": ["thesys"], "ai-elements": ["ai-elements", "elements.ai-sdk"],
    "ai-sdk": ["ai-sdk.dev"], "assistant-ui": ["assistant-ui"], "ant-design-x": ["x.ant.design", "ant-design/x"],
    "ant-design": ["ant.design/"], "mui-x": ["mui.com/x"], "mui": ["mui.com/material"], "mantine": ["mantine.dev"],
    "shadcn-ui": ["shadcn"], "react-aria": ["react-aria", "react-spectrum"], "radix": ["radix-ui"], "daisyui": ["daisyui"],
    "animate-ui": ["animate-ui"], "magic-ui": ["magicui"], "numberflow": ["number-flow"], "motion": ["motion.dev"],
    "gsap": ["gsap.com"], "animejs": ["animejs"], "autoanimate": ["auto-animate"], "rive": ["rive.app"],
    "dotlottie": ["lottie"], "view-transitions": ["view-transition"], "react-dropzone": ["react-dropzone"],
    "uppy": ["uppy"], "tus": ["tus.io"], "filepond": ["pqina", "filepond"], "sse": ["server-sent-events", "#server-sent-events"],
    "eventsource": ["eventsource"], "fetch-event-source": ["fetch-event-source"], "websocket": ["websocket"],
    "xstate": ["stately"], "tanstack-query": ["tanstack.com/query"], "tanstack-router": ["tanstack.com/router"],
    "tanstack-virtual": ["tanstack.com/virtual"], "echarts": ["echarts"], "vega-lite": ["vega-lite", "vega.github.io"],
    "owasp-llm": ["owasp"], "wcag": ["wcag", "w3.org/wai"], "design-tokens": ["designtokens"], "playwright": ["playwright"],
    "opentelemetry": ["opentelemetry"], "mcp-apps": ["ext-apps"], "mcp": ["modelcontextprotocol"], "react": ["react.dev"],
    "json-patch": ["rfc6902", "rfc/rfc6902"], "http2": ["rfc9113"], "can-i-use": ["caniuse"], "mdn": ["developer.mozilla.org"],
    "generative-interfaces": ["2508.19227"], "design-theater": ["2607.22928"], "counting-the-wait": ["2602.04138"],
    "nngroup": ["nngroup"], "viget-2017": ["viget"], "gajos-2008": ["gajos"], "carbon": ["carbondesignsystem"],
    "storybook": ["storybook"], "msw": ["mswjs"], "astro": ["astro.build"], "style-dictionary": ["styledictionary", "style-dictionary"],
    "flutter-genui": ["flutter/genui"], "semrush-intergalactic": ["semrush"], "kolibri": ["learningequality"],
    "oracle-apex": ["oracle.com"], "fluent": ["fluent2"], "atlassian-ds": ["atlassian.design"], "google-genui": ["research.google"],
    "chrome": ["developer.chrome.com", "chromestatus"], "safari": ["webkit.org"], "firefox": ["firefox", "mozilla/standards"],
    "whatwg": ["whatwg"], "w3c": ["w3.org"], "ietf": ["ietf.org", "rfc-editor"], "vercel-guidelines": ["vercel.com/design"],
    "pydantic-ai": ["pydantic"], "lynx": ["lynxjs"], "svelte": ["svelte.dev"], "acorn": ["acorn.firefox"],
}
sources = []
src_by_url = {}
for s in register["sources"]:
    u = urllib.parse.urlparse(s["url"])
    host = u.netloc.replace("www.", "")
    low = s["url"].lower()
    tl = [tid for tid, hints in URL_HINTS.items() if any(h in low for h in hints)]
    placeholder = any(x in host for x in ("example.", "localhost", "attacker.", "your-site"))
    rec = {"id": s["id"], "url": s["url"], "domain": host, "reports": s["reports"], "tools": tl,
           "placeholder": placeholder, "claims": []}
    sources.append(rec)
    src_by_url[s["url"]] = rec

STATUS_ORDER = {"supported": 0, "unverified": 1, "disputed": 2, "rejected": 3}


def topics_for(text):
    low = text.lower()
    sc = Counter()
    for rid, kws in TOPIC_KEYWORDS.items():
        for kw in kws:
            if kw.lower() in low:
                sc[rid] += 1
    return [r for r, _ in sc.most_common(3)]


claims = []
for c in register["claims"]:
    stmt = c["statement"]
    tl = [t["id"] for t in tools if regex[t["id"]].search(stmt)]
    ass = []
    for a in c["assessments"]:
        ass.append({
            "stage": a["stage"], "status": a["status"],
            "reason": a.get("reason", "")[:900], "counter": (a.get("counter_evidence") or "")[:700],
            "limits": (a.get("limits") or "")[:600], "counterSources": a.get("counter_sources", [])[:6],
        })
    final = ass[-1]["status"] if ass else "unverified"
    statuses = sorted({a["status"] for a in ass}, key=lambda x: STATUS_ORDER.get(x, 9))
    tp = topics_for(stmt)
    if not tp:
        for tid in tl:
            if tool_by_id[tid]["rTopics"]:
                tp = tool_by_id[tid]["rTopics"][:1]
                break
    slug = c["id"].replace(":", "--")
    claims.append({
        "id": c["id"], "slug": slug, "statement": stmt, "stage": c["original_stage"], "status": final,
        "statuses": statuses, "contested": len(statuses) > 1, "assessments": ass, "sources": c["sources"][:25],
        "tools": tl, "topics": tp,
    })
    for u in c["sources"]:
        if u in src_by_url:
            src_by_url[u]["claims"].append(slug)

# iddialardan kaynak–araç bağı güçlendirme
for cl in claims:
    for u in cl["sources"]:
        if u in src_by_url:
            for tid in cl["tools"][:3]:
                if tid not in src_by_url[u]["tools"] and len(cl["tools"]) <= 2:
                    src_by_url[u]["tools"].append(tid)

# ---------------------------------------------------------------- iddia metrikleri
for t in tools:
    cs = [c for c in claims if t["id"] in c["tools"]]
    cnt = Counter(c["status"] for c in cs)
    n = len(cs)
    t["claimIds"] = [c["slug"] for c in cs]
    t["claimCount"] = n
    t["claimStatus"] = {k: cnt.get(k, 0) for k in ("supported", "unverified", "disputed", "rejected")}
    if n:
        s, u, d, r = (cnt.get(k, 0) for k in ("supported", "unverified", "disputed", "rejected"))
        score = (s + 0.4 * u) / n * 100 - 50 * (d + r) / n
        t["evidence"] = round(max(0, min(100, score)))
    else:
        t["evidence"] = None
    t["contested"] = sum(1 for c in cs if c["contested"])
    t["sourceCount"] = sum(1 for s in sources if t["id"] in s["tools"])
    t["topicsFromClaims"] = [r for r, _ in Counter(r for c in cs for r in c["topics"]).most_common(5)]
    if not t["rTopics"]:
        t["rTopics"] = sorted(t["topicsFromClaims"][:3])

# ---------------------------------------------------------------- birlikte anılma
print("Birlikte anılma grafiği ve topluluklar…")
paras = []
seen = set()
for body in list(texts.values()) + [synthesis] + list(partials.values()):
    for p in re.split(r"\n\s*\n", body):
        p = p.strip()
        if len(p) < 40:
            continue
        chunks = [p] if len(p) < 2500 else [p[i:i + 2000] for i in range(0, len(p), 2000)]
        for ch in chunks:
            h = hashlib.md5(ch.encode("utf-8")).hexdigest()
            if h in seen:
                continue
            seen.add(h)
            paras.append(ch)
occ = Counter()
pair = Counter()
for p in paras:
    present = [t["id"] for t in tools if regex[t["id"]].search(p)]
    for a in present:
        occ[a] += 1
    present.sort()
    for i in range(len(present)):
        for j in range(i + 1, len(present)):
            pair[(present[i], present[j])] += 1
edges = []
for (a, b), c in pair.items():
    if c < 3:
        continue
    w = c / math.sqrt(occ[a] * occ[b])
    edges.append({"a": a, "b": b, "c": c, "w": round(w, 4)})
edges.sort(key=lambda e: -e["w"])
nbrs = defaultdict(list)
for e in edges:
    nbrs[e["a"]].append((e["b"], e["w"], e["c"]))
    nbrs[e["b"]].append((e["a"], e["w"], e["c"]))
for t in tools:
    t["paragraphs"] = occ.get(t["id"], 0)
    t["neighbors"] = [{"id": b, "w": w, "c": c} for b, w, c in sorted(nbrs[t["id"]], key=lambda x: -x[1])[:12]]


def louvain(nodes, edges_w, seed_order=None):
    """Tek düzeyli + birleştirmeli basit Louvain (modülerlik)."""
    adj = defaultdict(dict)
    for a, b, w in edges_w:
        adj[a][b] = adj[a].get(b, 0) + w
        adj[b][a] = adj[b].get(a, 0) + w
    comm = {n: n for n in nodes}
    members = {n: [n] for n in nodes}
    level_nodes = list(nodes)
    level_adj = adj
    for _level in range(6):
        m2 = sum(sum(v.values()) for v in level_adj.values()) or 1.0
        k = {n: sum(level_adj[n].values()) for n in level_nodes}
        c_of = {n: n for n in level_nodes}
        tot = {n: k[n] for n in level_nodes}
        improved = True
        moved_any = False
        it = 0
        while improved and it < 30:
            improved = False
            it += 1
            for n in level_nodes:
                cur = c_of[n]
                links = defaultdict(float)
                for nb, w in level_adj[n].items():
                    if nb != n:
                        links[c_of[nb]] += w
                tot[cur] -= k[n]
                best, best_gain = cur, links.get(cur, 0) - tot[cur] * k[n] / m2
                for c, lw in links.items():
                    gain = lw - tot[c] * k[n] / m2
                    if gain > best_gain + 1e-12:
                        best, best_gain = c, gain
                tot[best] += k[n]
                if best != cur:
                    c_of[n] = best
                    improved = True
                    moved_any = True
        if not moved_any:
            break
        # birleştir
        new_members = defaultdict(list)
        for n in level_nodes:
            new_members[c_of[n]].extend(members[n])
        new_adj = defaultdict(dict)
        for a in level_nodes:
            for b, w in level_adj[a].items():
                ca, cb = c_of[a], c_of[b]
                new_adj[ca][cb] = new_adj[ca].get(cb, 0) + w
        members = dict(new_members)
        level_nodes = list(members.keys())
        level_adj = new_adj
    out = {}
    for i, (_c, ms) in enumerate(sorted(members.items(), key=lambda x: -len(x[1]))):
        for n in ms:
            out[n] = i
    return out


node_ids = [t["id"] for t in tools if occ.get(t["id"], 0) > 0]
ew = [(e["a"], e["b"], e["w"]) for e in edges if e["w"] >= 0.05]
comm = louvain(node_ids, ew)
# tekil topluluklar "Bağımsız" altında toplanır
csize = Counter(comm.values())
communities = []
for cid, size in sorted(csize.items(), key=lambda x: -x[1]):
    ms = [n for n, c in comm.items() if c == cid]
    if size < 2:
        continue
    ms.sort(key=lambda n: -occ.get(n, 0))
    communities.append({"members": ms})
for i, c in enumerate(communities):
    c["id"] = f"C{i+1:02d}"
    top = [tool_by_id[m]["name"] for m in c["members"][:3]]
    c["name"] = " · ".join(top)
    gl = Counter(tool_by_id[m]["golden"] for m in c["members"])
    c["dominantGolden"] = gl.most_common(1)[0][0]
    ly = Counter(tool_by_id[m]["layer"] for m in c["members"])
    c["dominantLayer"] = ly.most_common(1)[0][0]
    ids = set(c["members"])
    inner = [e for e in edges if e["a"] in ids and e["b"] in ids]
    c["density"] = round(2 * len(inner) / max(1, len(ids) * (len(ids) - 1)), 3)
    c["cohesion"] = round(sum(e["w"] for e in inner) / max(1, len(inner)), 3)
    for m in c["members"]:
        tool_by_id[m]["community"] = c["id"]
for t in tools:
    t.setdefault("community", "C00")

# ---------------------------------------------------------------- türetilmiş puanlar
MAT = {"Kararlı": 1.0, "RC/Beta": 0.7, "Taslak": 0.45, "Deneysel": 0.35, "Araştırma": 0.3, "Bilinmiyor": 0.4}
STANCE = {"Çekirdek aday": 1.0, "Prototip adayı": 0.75, "Seçimli": 0.55, "Referans": 0.45, "Ertele/Kaçın": 0.1}
LIC_RISK = {"Ticari": 22, "Açık çekirdek/Pro": 14, "Bilinmiyor": 10}
MAT_RISK = {"Taslak": 22, "Deneysel": 25, "RC/Beta": 12, "Bilinmiyor": 10, "Araştırma": 8}
EFF_RISK = {"Yüksek": 16, "Orta": 7, "Düşük": 0}
RADAR_KINDS = {"Kütüphane", "Framework", "Protokol", "Format/Şema", "Standart", "Tarayıcı API", "Bileşen", "Test Aracı", "Platform/Servis", "Metrik"}
max_ment = max(math.log1p(t["mentionTotal"]) for t in tools) or 1
for t in tools:
    ev = (t["evidence"] if t["evidence"] is not None else 40) / 100
    cons = t["coverage"] / len(MAIN_REPORTS)
    composite = 0.33 * ev + 0.25 * cons + 0.24 * MAT.get(t["maturity"], 0.4) + 0.18 * STANCE.get(t["stance"], 0.45)
    t["composite"] = round(composite * 100)
    # Karar farkında halka: raporların duruşu üst halkalar için ön koşuldur.
    c100 = composite * 100
    ev100 = t["evidence"] if t["evidence"] is not None else 0
    st = t["stance"]
    if st == "Ertele/Kaçın":
        ring = "Beklet"
    elif (st == "Çekirdek aday" and c100 >= 70) or (st == "Prototip adayı" and c100 >= 78 and ev100 >= 60):
        ring = "Benimse"
    elif (st in ("Çekirdek aday", "Prototip adayı") and c100 >= 55) or (st == "Seçimli" and c100 >= 72):
        ring = "Dene"
    elif c100 >= 50:
        ring = "Değerlendir"
    else:
        ring = "Beklet"
    t["ring"] = ring
    t["radarEligible"] = t["kind"] in RADAR_KINDS
    disp_ratio = (t["claimStatus"]["disputed"] + t["claimStatus"]["rejected"]) / t["claimCount"] if t["claimCount"] else 0
    risk = disp_ratio * 40 + LIC_RISK.get(t["license"], 0) + MAT_RISK.get(t["maturity"], 0) + EFF_RISK.get(t["effort"], 0) + (8 if t["contested"] >= 3 else 0)
    t["riskScore"] = round(min(100, risk))
    t["riskTier"] = "Yüksek" if risk >= 40 else ("Orta" if risk >= 20 else "Düşük")
    c = t["coverage"]
    t["consensus"] = "Ortak (7–8 rapor)" if c >= 7 else ("Çoğunluk (4–6)" if c >= 4 else ("Azınlık (2–3)" if c >= 2 else ("Tekil (1)" if c == 1 else "Yalnız ara analiz/sentez")))
    if t.get("provenance", {}).get("kind") == "external" and not t["coverage"]:
        t["consensus"] = "Korpus dışı ekleme"
    ev_raw = t["evidence"]
    t["evidenceTier"] = "Kanıt yok" if ev_raw is None else ("Güçlü" if ev_raw >= 65 else ("Orta" if ev_raw >= 45 else ("Zayıf" if ev_raw >= 25 else "Tartışmalı")))
    t["visibility"] = round(math.log1p(t["mentionTotal"]) / max_ment * 100)
    t["segments"] = sorted({tp["segment"] for tp in topics if tp["id"] in t["rTopics"]})

# ---------------------------------------------------------------- alıntılar
print("Temsilî alıntılar seçiliyor…")
sent_pool = []
for src_name, body in [("synthesis", synthesis)] + [(r, texts[r]) for r in MAIN_REPORTS if not r.startswith("review_")]:
    for s in re.split(r"(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ*“\"])", re.sub(r"\s+", " ", body)):
        s = s.strip()
        if 70 <= len(s) <= 330 and not s.startswith("|") and "http" not in s:
            sent_pool.append((src_name, s))
for t in tools:
    rx = regex[t["id"]]
    picks = []
    used = set()
    for src_name, s in sent_pool:
        if rx.search(s) and src_name not in used:
            clean = re.sub(r"\*\*|\*|`", "", s)
            picks.append({"report": src_name, "text": clean})
            used.add(src_name)
        if len(picks) >= 3:
            break
    t["excerpts"] = picks

# ---------------------------------------------------------------- konu metrikleri
for tp in topics:
    rid = tp["id"]
    tp["tools"] = [t["id"] for t in sorted(tools, key=lambda x: -x["mentionTotal"]) if rid in t["rTopics"]]
    cs = [c for c in claims if rid in c["topics"]]
    tp["claimCount"] = len(cs)
    tp["claimStatus"] = dict(Counter(c["status"] for c in cs))
    tp["tracks"] = [tr["name"] for tr in tracks if rid in tr["topics"]]

# ---------------------------------------------------------------- yaz
print("Yazılıyor…")
golden = [{"id": g, "name": n, "ring": r, "job": j, "color": col,
           "members": [t["id"] for t in sorted(tools, key=lambda x: -x["composite"]) if t["golden"] == g]} for g, n, r, j, col in GOLDEN]
layers = [{"id": l, "name": n, "desc": d, "members": [t["id"] for t in tools if t["layer"] == l]} for l, n, d in LAYERS]
status_totals = Counter(c["status"] for c in claims)
meta = {
    "generatedAt": manifest.get("created_at"), "researchAsOf": manifest.get("original_research_as_of"),
    "reports": [{"id": r, "label": REPORT_LABELS[r], "bytes": len(texts[r].encode("utf-8"))} for r in MAIN_REPORTS],
    "reportLabels": REPORT_LABELS, "partialCount": len(partials),
    "counts": {"tools": len(tools), "claims": len(claims), "sources": len(sources), "topics": len(topics),
               "segments": len(segments), "communities": len(communities), "edges": len(edges),
               "paragraphs": len(paras)},
    "claimStatus": dict(status_totals),
    "golden": golden, "layers": layers, "segments": segments, "tracks": tracks,
    "synthesis": {"sections": syn_sections, "gates": gates, "decisions": decisions, "risks": risks},
    "communities": communities,
}
dump("meta.json", meta)
dump("tools.json", tools)
HEAVY = ("summary", "facts", "risks", "excerpts", "mentions", "neighbors", "claimIds", "topicsFromClaims")
dump("tools-core.json", [{k: v for k, v in t.items() if k not in HEAVY} for t in tools])
dump("tools-detail.json", {t["id"]: {k: t[k] for k in ("summary", "facts", "risks", "excerpts", "mentions", "neighbors")} for t in tools})
dump("topics.json", topics)
dump("edges.json", edges)
dump("claims.json", claims)
dump("sources.json", sources)
print("Bitti.")
