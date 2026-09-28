// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { loadParsers } from '../../../scripts/lib/mermaid-multi.mjs';
import { tools, meta, topics } from '@/data';
import claims from '@/data/generated/claims.json';
import type { Claim, Workflow } from '@/data/types';
import { generateAll, FAMILY_DEFS } from './index';
import { adoptionWorkflow } from './adoption';
import { mkTool } from '@/test/fixtures';

const input = { tools, meta, topics, claims: claims as unknown as Claim[] };
let out: ReturnType<typeof generateAll>;
let parsers: Record<string, (c: string) => Promise<string | null>>;

beforeAll(async () => {
  out = generateAll(input);
  parsers = await loadParsers();
}, 180000);

const text = (w: Workflow) => w.mermaid + ' ' + w.steps.map((s) => s.title + ' ' + (s.detail ?? '')).join(' ');

describe('iş akışı kümesi', () => {
  it('en az 550 iş akışı ve en az 14 aile', () => {
    expect(out.workflows.length).toBeGreaterThanOrEqual(550);
    expect(out.families.length).toBeGreaterThanOrEqual(14);
  });
  it('kimlikler benzersiz ve URL güvenli', () => {
    const ids = out.workflows.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((i) => expect(i).toMatch(/^[a-z0-9-]+$/));
  });
  it('aile sayıları tanımla tutarlı', () => {
    for (const f of out.families) {
      expect(out.workflows.filter((w) => w.family === f.id).length, f.id).toBe(f.count);
      expect(f.count, f.id).toBeGreaterThan(0);
      expect(FAMILY_DEFS.find((d) => d.id === f.id)).toBeTruthy();
    }
  });
  it('referans bütünlüğü: araç, konu, altın küme ve katman kimlikleri geçerli', () => {
    const tIds = new Set(tools.map((t) => t.id));
    const rIds = new Set(topics.map((t) => t.id));
    const gIds = new Set(meta.golden.map((g) => g.id));
    const lIds = new Set(meta.layers.map((l) => l.id));
    for (const w of out.workflows) {
      w.tools.forEach((x) => expect(tIds.has(x), `${w.id} araç ${x}`).toBe(true));
      w.topics.forEach((x) => expect(rIds.has(x), `${w.id} konu ${x}`).toBe(true));
      w.golden.forEach((x) => expect(gIds.has(x), `${w.id} küme ${x}`).toBe(true));
      w.layers.forEach((x) => expect(lIds.has(x), `${w.id} katman ${x}`).toBe(true));
    }
  });
  it('her akışın başlığı, özeti, adımları ve 1–5 karmaşıklığı var', () => {
    for (const w of out.workflows) {
      expect(w.title.length, w.id).toBeGreaterThan(5);
      expect(w.summary.length, w.id).toBeGreaterThan(20);
      expect(w.steps.length, w.id).toBeGreaterThanOrEqual(3);
      expect(w.complexity, w.id).toBeGreaterThanOrEqual(1);
      expect(w.complexity, w.id).toBeLessThanOrEqual(5);
    }
  });
  it('belirlenimci: iki üretim birebir aynı', () => {
    expect(JSON.stringify(generateAll(input))).toBe(JSON.stringify(out));
  });
  it('dört diyagram türü de kullanılıyor', () => {
    expect(new Set(out.workflows.map((w) => w.diagram))).toEqual(new Set(['flowchart', 'sequence', 'state', 'gantt']));
  });
});

describe('sürüm uyumluluğu', () => {
  it('BÜTÜN diyagramlar Mermaid 10.9, 11.17 ve 12.0 ile ayrıştırılır', async () => {
    const failures: string[] = [];
    for (const w of out.workflows) {
      for (const [v, parse] of Object.entries(parsers)) {
        const err = await parse(w.mermaid);
        if (err) failures.push(`${w.id} @${v}: ${err}`);
      }
    }
    expect(failures.slice(0, 10), `${failures.length} hata`).toEqual([]);
  }, 300000);
});

describe('koşullu dallar (benimseme akışı)', () => {
  const base = { kind: 'Kütüphane', layer: 'L03', license: 'MIT', maturity: 'Kararlı', effort: 'Düşük' } as const;
  it('ticari lisans → lisans incelemesi adımı', () => {
    const w = adoptionWorkflow(mkTool({ id: 'x', ...base, license: 'Ticari' }), input);
    expect(text(w)).toMatch(/Lisans/);
    expect(w.conditions.join(' ')).toMatch(/lisans/i);
  });
  it('MIT + kararlı + itirazsız → lisans ve sürüm dalı yok', () => {
    const w = adoptionWorkflow(mkTool({ id: 'y', ...base }), input);
    expect(text(w)).not.toMatch(/Lisans incelemesi/);
    expect(text(w)).not.toMatch(/Sürümü sabitle/);
  });
  it('taslak olgunluk → sürüm sabitleme ve adaptör', () => {
    const w = adoptionWorkflow(mkTool({ id: 'z', ...base, maturity: 'Taslak' }), input);
    expect(text(w)).toMatch(/Sürümü sabitle/);
    expect(text(w)).toMatch(/adaptör/i);
  });
  it('itirazlı iddia → doğrulama spike’ı', () => {
    const w = adoptionWorkflow(mkTool({ id: 'd', ...base, claimStatus: { supported: 1, unverified: 0, disputed: 2, rejected: 0 }, claimCount: 3 }), input);
    expect(text(w)).toMatch(/Doğrulama spike/);
  });
  it('katmana özgü test: hareket → azaltılmış hareket, dosya → kesinti', () => {
    expect(text(adoptionWorkflow(mkTool({ id: 'm', ...base, layer: 'L04' }), input))).toMatch(/azaltılmış hareket/i);
    expect(text(adoptionWorkflow(mkTool({ id: 'u', ...base, layer: 'L09' }), input))).toMatch(/kesinti/i);
    expect(text(adoptionWorkflow(mkTool({ id: 's', ...base, layer: 'L08' }), input))).toMatch(/yeniden bağlan/i);
  });
  it('React’a bağlı araç → framework bağımlılığı notu', () => {
    const w = adoptionWorkflow(mkTool({ id: 'r', ...base, platform: 'React' }), input);
    expect(text(w)).toMatch(/React/);
  });
  it('araştırma türü → kanıt okuma akışına döner', () => {
    const w = adoptionWorkflow(mkTool({ id: 'p', kind: 'Araştırma', layer: 'L01' }), input);
    expect(w.title).toMatch(/Kanıt/);
  });
});
