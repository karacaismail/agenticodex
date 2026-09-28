// @vitest-environment node
import { expect, it } from 'vitest';
import { tools, meta, topics } from '@/data';
import { apiFamily } from './api';
import { SMART_CLUSTERS } from '../presets';
import { filterTools } from '../rules';

it('API süreçleri ilgili araçlara bağlanır ve başarısız test düzeltmeye döner', () => {
  const flows = apiFamily({ tools, meta, topics, claims: [] });
  expect(flows).toHaveLength(8);
  for (const w of flows) {
    expect(w.tools.length).toBeGreaterThan(1);
    expect(w.mermaid).toContain('Hayır');
    expect(w.mermaid).toContain('Yeniden dene');
  }
  expect(flows.find(w => w.id === 'api-ci')?.tools).toContain('hurl');
  expect(flows.find(w => w.id === 'api-ci')?.tools).not.toContain('curl');
});
it('API kümeleri yetenek etiketlerine göre üye seçer', () => {
  const clients = SMART_CLUSTERS.find(c => c.id === 'api-istemcileri')!;
  const ci = SMART_CLUSTERS.find(c => c.id === 'api-ci')!;
  expect(filterTools(tools, clients.rule)).toHaveLength(8);
  expect(filterTools(tools, ci.rule).map(t => t.id)).toEqual(expect.arrayContaining(['bruno','hoppscotch','hurl']));
  expect(filterTools(tools, ci.rule).map(t => t.id)).not.toContain('curl');
  for (const t of filterTools(tools, clients.rule)) {
    expect(t.provenance?.kind).toBe('external');
    expect(t.golden).toBe('G12');
  }
});

it('Kaizen şartname senaryoları çalışan otomasyon diye sunulmaz', async () => {
  const { kaizenFamily } = await import('./kaizen');
  const flows = kaizenFamily({ tools, meta, topics, claims: [] });
  expect(flows).toHaveLength(39);
  expect(flows.filter(w => w.id.startsWith('kaizen-qa-'))).toHaveLength(24);
  expect(flows.find(w => w.id === 'kaizen-qa-001')?.summary).toContain('çalıştırılmış test sonucu değil');
  expect(flows.find(w => w.id === 'kaizen-capa')?.tools).toContain('stryker');
  expect(flows.find(w => w.id === 'kaizen-runner')?.tools).toContain('hurl');
});
