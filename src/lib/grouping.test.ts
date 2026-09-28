import { describe, expect, it } from 'vitest';
import { mkTool } from '@/test/fixtures';
import { groupBy, nestedGroupBy, bucketize, type Dimension } from './grouping';
import { cond } from './rules';

const tools = [
  mkTool({ id: 'a', license: 'MIT', tags: ['x', 'y'], coverage: 8 }),
  mkTool({ id: 'b', license: 'Ticari', tags: ['y'], coverage: 2 }),
  mkTool({ id: 'c', license: 'MIT', tags: [], coverage: 5 }),
  mkTool({ id: 'd', license: 'Apache-2.0', tags: ['z'], coverage: 7 }),
];
const lic: Dimension = { key: 'license', label: 'Lisans', question: 'Neye göre?', rationale: '', type: 'single', get: (t) => t.license, order: ['MIT', 'Apache-2.0', 'Ticari'] };
const tag: Dimension = { key: 'tags', label: 'Etiket', question: '', rationale: '', type: 'multi', get: (t) => t.tags };

describe('groupBy', () => {
  it('tekil boyutta her öğe tam bir grupta, sayılar toplamı korunur', () => {
    const g = groupBy(tools, lic);
    expect(g.map((x) => x.key)).toEqual(['MIT', 'Apache-2.0', 'Ticari']);
    expect(g.reduce((s, x) => s + x.items.length, 0)).toBe(tools.length);
    expect(g[0].items.map((t) => t.id)).toEqual(['a', 'c']);
  });
  it('çok değerli boyutta öğe birden çok grupta olabilir; boşlar "—" grubunda', () => {
    const g = groupBy(tools, tag);
    const y = g.find((x) => x.key === 'y')!;
    expect(y.items.map((t) => t.id)).toEqual(['a', 'b']);
    expect(g.find((x) => x.key === '—')!.items.map((t) => t.id)).toEqual(['c']);
  });
  it('sıralama verilmezse büyük grup önce, eşitlikte alfabetik', () => {
    const g = groupBy(tools, tag);
    expect(g[0].key).toBe('y');
  });
});

describe('nestedGroupBy', () => {
  it('iki düzeyli gruplama alt toplamları doğru verir', () => {
    const n = nestedGroupBy(tools, lic, tag);
    const mit = n.find((x) => x.key === 'MIT')!;
    expect(mit.children!.map((c) => [c.key, c.items.length])).toEqual([
      ['x', 1],
      ['y', 1],
      ['—', 1],
    ]);
  });
});

describe('bucketize (koşullu gruplama)', () => {
  it('ilk eşleşen kova kazanır, eşleşmeyenler yedek kovaya düşer', () => {
    const b = bucketize(
      tools,
      [
        { id: 'strong', label: 'Güçlü', rule: cond('coverage', 'gte', 7) },
        { id: 'mit', label: 'MIT', rule: cond('license', 'eq', 'MIT') },
      ],
      'Diğer',
    );
    expect(b.map((x) => [x.key, x.items.map((t) => t.id)])).toEqual([
      ['strong', ['a', 'd']],
      ['mit', ['c']],
      ['__rest', ['b']],
    ]);
  });
  it('boş kovalar korunur (0 sayısıyla) ama yedek kova boşsa atlanır', () => {
    const b = bucketize(tools, [{ id: 'none', label: 'Yok', rule: cond('coverage', 'gt', 99) }, { id: 'all', label: 'Hepsi', rule: cond('coverage', 'gte', 0) }], 'Diğer');
    expect(b.map((x) => [x.key, x.items.length])).toEqual([
      ['none', 0],
      ['all', 4],
    ]);
  });
});
