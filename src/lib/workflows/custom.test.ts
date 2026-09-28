// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { loadParsers } from '../../../scripts/lib/mermaid-multi.mjs';
import { tools, meta, topics } from '@/data';
import { clusterWorkflow, bucketWorkflow } from './clusters';
import { and, cond, or, not } from '../rules';

const input = { tools, meta, topics, claims: [] };
let parsers: Record<string, (c: string) => Promise<string | null>>;
beforeAll(async () => {
  parsers = await loadParsers();
}, 120000);

const RULES = [
  and(),
  and(cond('name', 'text', 'tırnak " ; # <script> `x` |y|')),
  or(cond('license', 'in', ['MIT', 'Ticari']), not(cond('evidence', 'isnull'))),
  and(cond('coverage', 'between', [3, 8]), cond('tags', 'any', ['akış', 'yeniden-bağlanma'])),
  and(cond('riskTier', 'eq', 'Yüksek'), or(cond('platform', 'eq', 'React'), cond('maturity', 'in', ['Taslak']))),
  and(cond('composite', 'gt', 999)),
];

describe('çalışma anında üretilen küme akışları', () => {
  it('kullanıcı kuralından üretilen her diyagram üç sürümde geçerli', async () => {
    for (const [i, rule] of RULES.entries()) {
      const w = clusterWorkflow({ id: `ozel-${i}`, name: `Özel "küme" #${i}; <b>`, why: 'Kullanıcı tanımlı koşullu küme; deneme metni.', theme: 'karar', rule }, input);
      for (const [v, parse] of Object.entries(parsers)) expect(await parse(w.mermaid), `${v} kural ${i}`).toBeNull();
      expect(w.steps.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('boş sonuçlu kural da geçerli diyagram üretir', async () => {
    const w = clusterWorkflow({ id: 'bos', name: 'Boş', why: 'Hiçbir şey eşleşmez.', theme: 'risk', rule: and(cond('composite', 'gt', 999)) }, input);
    expect(w.summary).toMatch(/0 üye/);
  });
  it('kullanıcı tanımlı kova şeması üç sürümde geçerli', async () => {
    const w = bucketWorkflow({ id: 'ozel-kova', name: 'Özel: "kova" ;#', why: 'Deneme', restLabel: 'Kalan <diğer>', buckets: RULES.slice(1, 5).map((r, i) => ({ id: `b${i}`, label: `Kova ${i} "x"`, rule: r })) }, input);
    for (const [v, parse] of Object.entries(parsers)) expect(await parse(w.mermaid), v).toBeNull();
  });
});
