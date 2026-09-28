import { tools, goldenById, layerById, communityById, topicById, segmentById } from '@/data';
import { FIELDS, type FieldKey } from './rules';

/** Numaralandırılmış alanların etiketli seçenekleri (verideki gerçek değerlerden). */
export function labelFor(field: FieldKey | string, v: string): string {
  switch (field) {
    case 'golden':
      return goldenById.get(v)?.name ?? v;
    case 'layer':
      return layerById.get(v)?.name ?? v;
    case 'community':
      return v === 'C00' ? 'Bağımsız' : communityById.get(v)?.name ?? v;
    case 'rTopics':
      return topicById.get(v) ? `${v} · ${topicById.get(v)!.short}` : v;
    case 'segments':
      return segmentById.get(v) ? `${v} — ${segmentById.get(v)!.title}` : v;
    default:
      return v;
  }
}

const cache = new Map<string, { value: string; label: string }[]>();

export function optionsFor(field: FieldKey): { value: string; label: string }[] {
  if (cache.has(field)) return cache.get(field)!;
  const def = FIELDS[field];
  const vals = new Set<string>();
  for (const t of tools) {
    const v = def.get(t);
    if (Array.isArray(v)) v.forEach((x) => vals.add(String(x)));
    else if (v !== null && v !== undefined && v !== '') vals.add(String(v));
  }
  const out = Array.from(vals)
    .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }))
    .map((v) => ({ value: v, label: labelFor(field, v) }));
  cache.set(field, out);
  return out;
}
