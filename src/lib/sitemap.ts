/** Bütün dinamik sayfaların ailelere göre listesi (site haritası). */
import type { Meta, Tool, Topic } from '@/data/types';
import { DIMENSIONS } from './dimensions';
import { groupBy } from './grouping';
import { BUCKET_SCHEMES, SMART_CLUSTERS } from './presets';

export interface SitePage {
  to: string;
  label: string;
}
export interface SiteFamily {
  id: string;
  name: string;
  desc: string;
  pages: SitePage[];
}

export interface SitemapInput {
  tools: Tool[];
  meta: Meta;
  topics: Topic[];
  claims: { slug: string; id: string }[];
  sources: { id: string; domain: string }[];
  workflows: { id: string; title: string }[];
}

export function buildSitemap(d: SitemapInput): SiteFamily[] {
  const groupPages = DIMENSIONS.flatMap((dim) => [
    { to: `/gruplar/${dim.key}`, label: `Grupla: ${dim.label}` },
    ...groupBy(d.tools, dim).filter((g) => g.key !== '—').map((g) => ({ to: `/gruplar/${dim.key}/${encodeURIComponent(g.key)}`, label: `${dim.label} → ${g.label}` })),
  ]);
  return [
    { id: 'araclar', name: 'Araç sayfaları', desc: 'Her varlık için puanlar, kanıt, akışlar ve ilişkiler.', pages: d.tools.map((t) => ({ to: `/araclar/${t.id}`, label: t.name })) },
    { id: 'akislar', name: 'İş akışı sayfaları', desc: 'Sürüm-güvenli Mermaid diyagramı, adımlar ve koşullar.', pages: d.workflows.map((w) => ({ to: `/akislar/${w.id}`, label: w.title })) },
    { id: 'gruplar', name: 'Gruplama sayfaları', desc: 'Her boyut ve her grup değeri için dinamik sayfa.', pages: groupPages },
    { id: 'altin', name: 'Altın küme sayfaları', desc: '12 çekirdek küme ve 3 destek halkası.', pages: d.meta.golden.map((g) => ({ to: `/altin-kumeler/${g.id}`, label: g.name })) },
    {
      id: 'kumeler', name: 'Dinamik küme sayfaları', desc: 'Akıllı kümeler, topluluklar ve koşullu kova şemaları.',
      pages: [
        ...SMART_CLUSTERS.map((c) => ({ to: `/kumeler/${c.id}`, label: c.name })),
        ...d.meta.communities.map((c) => ({ to: `/kumeler/topluluk/${c.id}`, label: `${c.id} · ${c.name}` })),
        ...BUCKET_SCHEMES.map((b) => ({ to: `/kumeler/kova/${b.id}`, label: b.name })),
      ],
    },
    { id: 'konular', name: 'Araştırma konuları', desc: 'R01–R28.', pages: d.topics.map((t) => ({ to: `/konular/${t.id}`, label: `${t.id} · ${t.title}` })) },
    { id: 'segmentler', name: 'Segmentler', desc: 'A–G.', pages: d.meta.segments.map((s) => ({ to: `/segmentler/${s.id}`, label: `${s.id} · ${s.title}` })) },
    { id: 'aileler', name: 'İş akışı aileleri', desc: 'Aile filtreli katalog.', pages: familyPages(d.workflows) },
    { id: 'iddialar', name: 'İddia sayfaları', desc: 'Kanıt sicilinin her iddiası.', pages: d.claims.map((c) => ({ to: `/kanit/${c.slug}`, label: c.id })) },
    { id: 'kaynaklar', name: 'Kaynak sayfaları', desc: 'Kaynak sicilinin her URL’si.', pages: d.sources.map((s) => ({ to: `/kaynaklar/${s.id}`, label: `${s.domain} · ${s.id}` })) },
  ];
}

const FAMILY_OF: [RegExp, string][] = [
  [/^benimseme-/, 'benimseme'], [/^konu-/, 'konu-karar'], [/^altin-/, 'altin-hat'], [/^yd-/, 'yasam-dongusu'], [/^sr-/, 'protokol-sirasi'],
  [/^karar-/, 'karar-agaci'], [/^senaryo-/, 'senaryo'], [/^ariza-/, 'ariza'], [/^tehdit-/, 'tehdit'], [/^yigin-/, 'yigin'], [/^yol-/, 'yol-haritasi'],
  [/^iddia-/, 'iddia-dogrulama'], [/^topluluk-/, 'topluluk'], [/^kume-/, 'kume-eylem'], [/^kova-/, 'kova'], [/^kapi-/, 'kapi'],
];

function familyPages(workflows: { id: string }[]): SitePage[] {
  const fams = new Set<string>();
  workflows.forEach((w) => {
    const f = FAMILY_OF.find(([rx]) => rx.test(w.id));
    if (f) fams.add(f[1]);
  });
  return Array.from(fams).map((f) => ({ to: `/akislar/aile/${f}`, label: f }));
}
