/**
 * Gruplama motoru — tekil/çok değerli boyutlar, iki düzeyli gruplama ve koşullu kovalar.
 */
import type { Tool } from '@/data/types';
import { evaluate, type Rule } from './rules';

export interface Dimension {
  key: string;
  label: string;
  /** "Neye göre?" sorusunun kısa cevabı. */
  question: string;
  /** Bu gruplamanın hangi karara yardım ettiği. */
  rationale: string;
  type: 'single' | 'multi';
  get: (t: Tool) => string | string[];
  order?: string[];
  labelFor?: (key: string) => string;
  colorFor?: (key: string) => string;
  descFor?: (key: string) => string;
}

export interface GroupNode {
  key: string;
  label: string;
  items: Tool[];
  children?: GroupNode[];
  color?: string;
  desc?: string;
}

export const EMPTY_KEY = '—';

export function groupBy(items: Tool[], dim: Dimension): GroupNode[] {
  const map = new Map<string, Tool[]>();
  for (const t of items) {
    const raw = dim.get(t);
    const keys = Array.isArray(raw) ? (raw.length ? Array.from(new Set(raw)) : [EMPTY_KEY]) : [raw || EMPTY_KEY];
    for (const k of keys) {
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
  }
  let keys = Array.from(map.keys());
  if (dim.order) {
    const idx = (k: string) => {
      const i = dim.order!.indexOf(k);
      return i === -1 ? dim.order!.length + (k === EMPTY_KEY ? 1 : 0) : i;
    };
    keys.sort((a, b) => idx(a) - idx(b) || a.localeCompare(b, 'tr'));
  } else {
    keys.sort((a, b) => {
      if (a === EMPTY_KEY) return 1;
      if (b === EMPTY_KEY) return -1;
      return map.get(b)!.length - map.get(a)!.length || a.localeCompare(b, 'tr');
    });
  }
  keys = keys.filter((k) => map.get(k)!.length > 0);
  return keys.map((k) => ({
    key: k,
    label: dim.labelFor ? dim.labelFor(k) : k,
    items: map.get(k)!,
    color: dim.colorFor?.(k),
    desc: dim.descFor?.(k),
  }));
}

export function nestedGroupBy(items: Tool[], a: Dimension, b: Dimension): GroupNode[] {
  return groupBy(items, a).map((g) => ({ ...g, children: groupBy(g.items, b) }));
}

export interface Bucket {
  id: string;
  label: string;
  rule: Rule;
  color?: string;
  desc?: string;
}

/** CASE WHEN mantığı: her öğe ilk eşleşen kovaya düşer; eşleşmeyenler yedek kovaya. */
export function bucketize(items: Tool[], buckets: Bucket[], restLabel = 'Diğer'): GroupNode[] {
  const out: GroupNode[] = buckets.map((b) => ({ key: b.id, label: b.label, items: [], color: b.color, desc: b.desc }));
  const rest: Tool[] = [];
  for (const t of items) {
    const i = buckets.findIndex((b) => evaluate(b.rule, t));
    if (i === -1) rest.push(t);
    else out[i].items.push(t);
  }
  if (rest.length) out.push({ key: '__rest', label: restLabel, items: rest, color: 'gray' });
  return out;
}
