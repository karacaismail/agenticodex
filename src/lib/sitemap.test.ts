import { describe, expect, it } from 'vitest';
import { tools, meta, topics } from '@/data';
import claims from '@/data/generated/claims.json';
import sources from '@/data/generated/sources.json';
import wf from '@/data/generated/workflows.json';
import { buildSitemap } from './sitemap';
import { routes } from '@/router';

const data = { tools, meta, topics, claims: claims as { slug: string; id: string }[], sources: sources as { id: string; domain: string }[], workflows: (wf as { workflows: { id: string; title: string }[] }).workflows };

describe('site haritası', () => {
  const sm = buildSitemap(data);
  it('bin sayfadan fazla dinamik sayfa listeler', () => {
    expect(sm.reduce((n, s) => n + s.pages.length, 0)).toBeGreaterThan(1000);
  });
  it('her yol benzersiz ve yönlendiricide tanımlı bir desene uyar', () => {
    const all = sm.flatMap((s) => s.pages.map((p) => p.to));
    expect(new Set(all).size).toBe(all.length);
    const patterns = (routes[0].children ?? []).map((r) => r.path).filter((p): p is string => !!p && p !== '*');
    const toRegex = (p: string) => new RegExp('^/' + p.replace(/:[a-z]+/g, '[^/]+') + '$');
    for (const to of all) {
      const path = to.split('?')[0];
      expect(patterns.some((p) => toRegex(p).test(path)), to).toBe(true);
    }
  });
  it('aile sayıları veriyle tutarlı', () => {
    const by = Object.fromEntries(sm.map((s) => [s.id, s.pages.length]));
    expect(by.araclar).toBe(tools.length);
    expect(by.akislar).toBe(data.workflows.length);
    expect(by.iddialar).toBe(889);
    expect(by.konular).toBe(28);
  });
});
