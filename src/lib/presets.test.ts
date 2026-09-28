import { describe, expect, it } from 'vitest';
import { tools } from '@/data';
import { SMART_CLUSTERS, BUCKET_SCHEMES } from './presets';
import { filterTools, validate } from './rules';
import { bucketize } from './grouping';

describe('akıllı kümeler (koşullu, dinamik)', () => {
  it('en az 30 küme; kimlikler benzersiz ve URL güvenli', () => {
    expect(SMART_CLUSTERS.length).toBeGreaterThanOrEqual(30);
    const ids = SMART_CLUSTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((i) => expect(i).toMatch(/^[a-z0-9-]+$/));
  });
  it('her kural geçerli ve açıklaması var', () => {
    for (const c of SMART_CLUSTERS) {
      expect(validate(c.rule), c.id).toEqual([]);
      expect(c.why.length, c.id).toBeGreaterThan(20);
    }
  });
  it('her küme gerçek veride boş değil ve her şeyi kapsamıyor', () => {
    for (const c of SMART_CLUSTERS) {
      const n = filterTools(tools, c.rule).length;
      expect(n, c.id).toBeGreaterThan(0);
      expect(n, c.id).toBeLessThan(tools.length);
    }
  });
});

describe('koşullu kova şemaları', () => {
  it('en az 6 şema; her şema bütün araçları kapsar ve ≥2 dolu kova üretir', () => {
    expect(BUCKET_SCHEMES.length).toBeGreaterThanOrEqual(6);
    for (const s of BUCKET_SCHEMES) {
      s.buckets.forEach((b) => expect(validate(b.rule), `${s.id}/${b.id}`).toEqual([]));
      const g = bucketize(tools, s.buckets, s.restLabel);
      expect(g.reduce((n, x) => n + x.items.length, 0), s.id).toBe(tools.length);
      expect(g.filter((x) => x.items.length > 0).length, s.id).toBeGreaterThanOrEqual(2);
    }
  });
});
