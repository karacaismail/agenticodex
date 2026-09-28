import { describe, expect, it } from 'vitest';
import { tools } from '@/data';
import { DIMENSIONS, dimensionByKey, ruleForGroup } from './dimensions';
import { filterTools, validate } from './rules';
import { groupBy } from './grouping';

describe('gruplama boyutları (gerçek veri)', () => {
  it('en az 15 boyut, benzersiz anahtarlar, URL güvenli', () => {
    expect(DIMENSIONS.length).toBeGreaterThanOrEqual(15);
    const keys = DIMENSIONS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((k) => expect(k).toMatch(/^[a-z0-9-]+$/));
  });
  it('her boyut "neye göre?" sorusunu ve gerekçesini açıklar', () => {
    for (const d of DIMENSIONS) {
      expect(d.question.length, d.key).toBeGreaterThan(10);
      expect(d.rationale.length, d.key).toBeGreaterThan(20);
    }
  });
  it('tekil boyutlar bütün araçları tam bir kez dağıtır', () => {
    for (const d of DIMENSIONS.filter((x) => x.type === 'single')) {
      const total = groupBy(tools, d).reduce((s, g) => s + g.items.length, 0);
      expect(total, d.key).toBe(tools.length);
    }
  });
  it('her boyut en az iki grup üretir ve etiketleri boş değildir', () => {
    for (const d of DIMENSIONS) {
      const g = groupBy(tools, d);
      expect(g.length, d.key).toBeGreaterThanOrEqual(2);
      g.forEach((x) => expect(x.label.length, `${d.key}:${x.key}`).toBeGreaterThan(0));
    }
  });
  it('grup anahtarları URL segmentine kodlanabilir ve geri çözülür', () => {
    for (const d of DIMENSIONS) {
      for (const g of groupBy(tools, d)) expect(decodeURIComponent(encodeURIComponent(g.key))).toBe(g.key);
    }
  });
  it('dimensionByKey bilinmeyen anahtarda undefined döner', () => {
    expect(dimensionByKey('golden')?.label).toBeTruthy();
    expect(dimensionByKey('yok')).toBeUndefined();
  });

  it('ruleForGroup: her grubun kuralı tam olarak o grubun üyelerini verir', () => {
    for (const d of DIMENSIONS) {
      for (const g of groupBy(tools, d)) {
        if (g.key === '—') continue;
        const r = ruleForGroup(d.key, g.key)!;
        expect(r, `${d.key}:${g.key}`).toBeTruthy();
        expect(validate(r)).toEqual([]);
        expect(filterTools(tools, r).map((t) => t.id).sort(), `${d.key}:${g.key}`).toEqual(g.items.map((t) => t.id).sort());
      }
    }
  });
});
