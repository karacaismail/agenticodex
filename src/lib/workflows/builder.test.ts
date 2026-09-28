// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { loadParsers } from '../../../scripts/lib/mermaid-multi.mjs';
import { tools, meta, topics } from '@/data';
import { buildCustomWorkflow, BUILDER_OPTIONS, type BuilderChoice } from './builder';

const input = { tools, meta, topics, claims: [] };
let parsers: Record<string, (c: string) => Promise<string | null>>;
beforeAll(async () => {
  parsers = await loadParsers();
}, 120000);

const base: BuilderChoice = { profile: 'kucuk-ekip', ui: 'mantine', renderer: 'json-render', transport: 'fetch-event-source', level: 'kontrollu', needs: [] };
const text = (c: BuilderChoice) => {
  const r = buildCustomWorkflow(c, input);
  return r.workflow.mermaid + ' ' + r.workflow.steps.map((s) => `${s.title} ${s.detail ?? ''}`).join(' ') + ' ' + r.workflow.conditions.join(' ');
};

describe('akış üretici', () => {
  it('BÜTÜN temel birleşimler (profil × UI × renderer × taşıma × düzey) üç sürümde geçerli', async () => {
    const fails: string[] = [];
    let n = 0;
    for (const profile of BUILDER_OPTIONS.profile) for (const ui of BUILDER_OPTIONS.ui) for (const renderer of BUILDER_OPTIONS.renderer)
      for (const transport of BUILDER_OPTIONS.transport) for (const level of BUILDER_OPTIONS.level) {
        const needs = n % 2 ? BUILDER_OPTIONS.needs.map((x) => x.value) : [];
        const { workflow } = buildCustomWorkflow({ profile: profile.value, ui: ui.value, renderer: renderer.value, transport: transport.value, level: level.value, needs }, input);
        n++;
        for (const [v, parse] of Object.entries(parsers)) {
          const e = await parse(workflow.mermaid);
          if (e) fails.push(`${profile.value}/${ui.value}/${renderer.value}/${transport.value}/${level.value} @${v}: ${e}`);
        }
      }
    expect(n).toBeGreaterThanOrEqual(864);
    expect(fails.slice(0, 5), `${fails.length} hata`).toEqual([]);
  }, 600000);

  it('sabit düzeyde renderer adımı yerine sabit ekran temel çizgisi kullanılır', () => {
    expect(text({ ...base, level: 'sabit' })).toMatch(/Sabit panel/);
    expect(text({ ...base, level: 'sabit' })).not.toMatch(/Katalog alt kümesi/);
  });
  it('bildirimsel düzey kullanıcı durumunu koruma adımını ekler', () => {
    expect(text({ ...base, level: 'bildirimsel' })).toMatch(/odak/i);
  });
  it('EventSource + başlatma POST gerektiren renderer → köprü koşulu', () => {
    expect(text({ ...base, transport: 'eventsource', renderer: 'copilotkit' })).toMatch(/köprü/i);
  });
  it('dosya ihtiyacı → yükleme hattı; kurumsal profil → güvenlik ve erişilebilirlik testi', () => {
    expect(text({ ...base, needs: ['dosya'] })).toMatch(/Tus|yükleyici/);
    const k = text({ ...base, profile: 'kurumsal' });
    expect(k).toMatch(/OWASP|tehdit/i);
    expect(k).toMatch(/axe|erişilebilirlik/i);
  });
  it('onay ihtiyacı → sunucu yetkisi ve idempotency', () => {
    expect(text({ ...base, needs: ['onay'] })).toMatch(/Idempotency/i);
  });
  it('önerilen araç kimlikleri gerçek ve benzersiz; ilgili hazır akışlar gerçek kimlik biçiminde', () => {
    const r = buildCustomWorkflow({ ...base, needs: ['dosya', 'grafik', 'onay'] }, input);
    const ids = new Set(tools.map((t) => t.id));
    r.recommended.forEach((t) => expect(ids.has(t), t).toBe(true));
    expect(new Set(r.recommended).size).toBe(r.recommended.length);
    expect(r.related).toContain('yigin-mantine-json-render-fetch-event-source');
  });
});
