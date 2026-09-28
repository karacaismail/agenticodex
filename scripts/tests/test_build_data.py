# -*- coding: utf-8 -*-
"""Veri hattı sözleşme testleri: python3 -m unittest discover -s scripts/tests"""
import json
import os
import re
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(HERE, "..", "..", "src", "data", "generated")
sys.path.insert(0, os.path.join(HERE, ".."))
from catalog import E, GOLDEN, LAYERS  # noqa: E402


def load(name):
    with open(os.path.join(GEN, name), encoding="utf-8") as f:
        return json.load(f)


class TestOutputsExist(unittest.TestCase):
    def test_all_files_present_and_valid_json(self):
        for n in ("meta.json", "tools.json", "topics.json", "edges.json", "claims.json", "sources.json"):
            self.assertTrue(os.path.exists(os.path.join(GEN, n)), n)
            load(n)


class TestTools(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tools = load("tools.json")
        cls.ids = {t["id"] for t in cls.tools}

    def test_catalog_complete_and_unique(self):
        self.assertEqual(len(self.tools), len(E))
        self.assertEqual(len(self.ids), len(E))

    def test_every_tool_is_grounded_in_corpus(self):
        zero = [t["id"] for t in self.tools if t["mentionTotal"] == 0 and not t.get("provenance")]
        self.assertEqual(zero, [], "korpusta hiç geçmeyen varlık katalogda olmamalı")

    def test_pi_external_provenance(self):
        pi = next(t for t in self.tools if t["id"] == "pi")
        self.assertEqual(pi["provenance"]["url"], "https://github.com/earendil-works/pi")
        self.assertEqual((pi["coverage"], pi["claimCount"], pi["mentionTotal"]), (0, 0, 0))
        self.assertEqual((pi["golden"], pi["layer"]), ("S2", "L13"))

    def test_golden_and_layer_references_valid(self):
        g = {x[0] for x in GOLDEN}
        l = {x[0] for x in LAYERS}
        for t in self.tools:
            self.assertIn(t["golden"], g, t["id"])
            self.assertIn(t["layer"], l, t["id"])

    def test_enumerated_fields(self):
        allowed = {
            "license": {"MIT", "Apache-2.0", "BSD", "ISC", "MPL-2.0", "Ticari", "Açık çekirdek/Pro", "Standart", "Bilinmiyor", "Uygulanmaz"},
            "maturity": {"Kararlı", "RC/Beta", "Taslak", "Deneysel", "Araştırma", "Bilinmiyor"},
            "platform": {"React", "Çoklu framework", "Framework bağımsız", "Tarayıcı yerel", "Sunucu", "Belirtim", "Tasarım"},
            "effort": {"Düşük", "Orta", "Yüksek"},
            "stance": {"Çekirdek aday", "Prototip adayı", "Seçimli", "Referans", "Ertele/Kaçın"},
            "ring": {"Benimse", "Dene", "Değerlendir", "Beklet"},
            "riskTier": {"Düşük", "Orta", "Yüksek"},
        }
        for t in self.tools:
            for k, vals in allowed.items():
                self.assertIn(t[k], vals, f"{t['id']}.{k}={t[k]}")

    def test_scores_in_range(self):
        for t in self.tools:
            if t["evidence"] is not None:
                self.assertTrue(0 <= t["evidence"] <= 100, t["id"])
            self.assertTrue(0 <= t["composite"] <= 100, t["id"])
            self.assertTrue(0 <= t["riskScore"] <= 100, t["id"])
            self.assertTrue(0 <= t["coverage"] <= 8, t["id"])

    def test_topics_are_valid_ids(self):
        for t in self.tools:
            for r in t["rTopics"]:
                self.assertRegex(r, r"^R(0[1-9]|1\d|2[0-8])$")

    def test_core_tools_have_full_consensus(self):
        by = {t["id"]: t for t in self.tools}
        for tid in ("a2ui", "ag-ui", "json-render", "tambo", "copilotkit", "react-dropzone"):
            self.assertGreaterEqual(by[tid]["coverage"], 7, tid)

    def test_neighbors_reference_known_tools(self):
        for t in self.tools:
            for n in t["neighbors"]:
                self.assertIn(n["id"], self.ids)
                self.assertNotEqual(n["id"], t["id"])

    def test_claim_links_are_consistent(self):
        claims = {c["slug"]: c for c in load("claims.json")}
        for t in self.tools:
            self.assertEqual(len(t["claimIds"]), t["claimCount"])
            for cid in t["claimIds"]:
                self.assertIn(t["id"], claims[cid]["tools"])


class TestClaimsAndSources(unittest.TestCase):
    def test_register_fully_preserved(self):
        claims = load("claims.json")
        self.assertEqual(len(claims), 889)
        self.assertEqual(len({c["slug"] for c in claims}), 889)
        self.assertEqual(len(load("sources.json")), 550)

    def test_claim_status_values(self):
        for c in load("claims.json"):
            self.assertIn(c["status"], {"supported", "unverified", "disputed", "rejected"})
            self.assertTrue(c["assessments"])
            for r in c["topics"]:
                self.assertRegex(r, r"^R\d\d$")

    def test_status_totals_match_register(self):
        # sicilde son değerlendirme durumlarının toplamı iddia sayısına eşit olmalı
        meta = load("meta.json")
        self.assertEqual(sum(meta["claimStatus"].values()), 889)

    def test_slugs_are_url_safe(self):
        for c in load("claims.json"):
            self.assertRegex(c["slug"], r"^[A-Za-z0-9_\-]+$")


class TestTopicsAndSynthesis(unittest.TestCase):
    def test_28_topics_7_segments(self):
        topics = load("topics.json")
        self.assertEqual([t["id"] for t in topics], [f"R{i:02d}" for i in range(1, 29)])
        for t in topics:
            self.assertTrue(t["question"], t["id"])
            self.assertEqual(len(t["subQuestions"]), 4, t["id"])
            self.assertTrue(t["expected"], t["id"])
        meta = load("meta.json")
        self.assertEqual([s["id"] for s in meta["segments"]], list("ABCDEFG"))

    def test_synthesis_structures(self):
        s = load("meta.json")["synthesis"]
        self.assertEqual([g["id"] for g in s["gates"]], list("ABCDEF"))
        self.assertEqual(len(s["sections"]), 12)
        self.assertEqual(len(s["decisions"]), 12)
        self.assertEqual(len(s["risks"]), 8)

    def test_tracks_cover_all_topics(self):
        tracks = load("meta.json")["tracks"]
        covered = {r for t in tracks for r in t["topics"]}
        self.assertEqual(covered, {f"R{i:02d}" for i in range(1, 29)})


class TestCommunities(unittest.TestCase):
    def test_communities_partition_tools(self):
        meta = load("meta.json")
        tools = {t["id"]: t for t in load("tools.json")}
        seen = set()
        self.assertGreaterEqual(len(meta["communities"]), 5)
        for c in meta["communities"]:
            self.assertGreaterEqual(len(c["members"]), 2)
            for m in c["members"]:
                self.assertNotIn(m, seen)
                seen.add(m)
                self.assertEqual(tools[m]["community"], c["id"])

    def test_edge_weights_normalised(self):
        for e in load("edges.json"):
            self.assertTrue(0 < e["w"] <= 1.0)
            self.assertGreaterEqual(e["c"], 3)



class TestSplitToolFiles(unittest.TestCase):
    HEAVY = {"summary", "facts", "risks", "excerpts", "mentions", "neighbors", "claimIds", "topicsFromClaims"}

    def test_core_has_no_heavy_fields_and_same_ids(self):
        core = load("tools-core.json")
        full = load("tools.json")
        self.assertEqual([t["id"] for t in core], [t["id"] for t in full])
        for t in core:
            self.assertFalse(self.HEAVY & set(t), t["id"])

    def test_detail_covers_every_tool(self):
        detail = load("tools-detail.json")
        full = {t["id"]: t for t in load("tools.json")}
        self.assertEqual(set(detail), set(full))
        for tid, d in detail.items():
            for k in ("summary", "facts", "risks", "excerpts", "mentions", "neighbors"):
                self.assertEqual(d[k], full[tid][k], f"{tid}.{k}")

    def test_core_is_much_smaller(self):
        size = lambda n: os.path.getsize(os.path.join(GEN, n))
        self.assertLess(size("tools-core.json"), size("tools.json") * 0.45)



class TestRadarCalibration(unittest.TestCase):
    def test_rings_are_discriminating(self):
        r = [t for t in load("tools.json") if t["radarEligible"]]
        from collections import Counter
        c = Counter(t["ring"] for t in r)
        for ring in ("Benimse", "Dene", "Değerlendir", "Beklet"):
            self.assertGreater(c[ring], 0, ring)
        self.assertLessEqual(c["Benimse"] / len(r), 0.35, c)

    def test_adopt_requires_report_endorsement(self):
        for t in load("tools.json"):
            if t["ring"] == "Benimse":
                self.assertIn(t["stance"], ("Çekirdek aday", "Prototip adayı"), t["id"])
            if t["stance"] == "Ertele/Kaçın":
                self.assertEqual(t["ring"], "Beklet", t["id"])


if __name__ == "__main__":
    unittest.main()
