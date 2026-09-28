import Fuse from 'fuse.js';
import type { Tool } from '@/data/types';
import { tools as ALL } from '@/data';

let fuse: Fuse<Tool> | null = null;

/** Dizin her zaman bütün araçlardan kurulur; sonuç verilen alt kümeyle kesiştirilir. */
export function searchTools(subset: Tool[], q: string): Tool[] {
  const query = q.trim();
  if (!query) return subset;
  fuse ??= new Fuse(ALL, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'id', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'vendor', weight: 1 },
      { name: 'desc', weight: 1 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
  });
  const allowed = new Set(subset.map((t) => t.id));
  return fuse.search(query).map((r) => r.item).filter((t) => allowed.has(t.id));
}

interface RankableAction {
  id?: string;
  label?: string;
  description?: string;
  keywords?: string | string[];
  group?: string;
}

const GROUP_WEIGHT: Record<string, number> = { Araçlar: 0.3, Kümeler: 0.2, Konular: 0.15, Gruplama: 0.1, Sayfalar: 0.1, 'İş akışları': 0 };
const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFC');

/** Spotlight için alaka sıralamalı filtre: tam > başlangıç > sözcük başı > içerme > açıklama/anahtar kelime. */
export function rankActions<T extends RankableAction>(query: string, actions: T[]): T[] {
  const q = norm(query.trim());
  if (!q) return actions;
  const words = q.split(/\s+/);
  const scored: { a: T; s: number; i: number }[] = [];
  actions.forEach((a, i) => {
    const label = norm(a.label ?? '');
    const rest = norm(`${a.description ?? ''} ${Array.isArray(a.keywords) ? a.keywords.join(' ') : a.keywords ?? ''}`);
    let s = 0;
    if (label === q) s = 100;
    else if (label.startsWith(q)) s = 80;
    else if (label.split(/[\s·/,(]+/).some((w) => w.startsWith(q))) s = 65;
    else if (label.includes(q)) s = 50;
    else if (words.every((w) => label.includes(w) || rest.includes(w))) s = 20;
    if (!s) return;
    scored.push({ a, s: s + (GROUP_WEIGHT[a.group ?? ''] ?? 0), i });
  });
  return scored.sort((x, y) => y.s - x.s || x.i - y.i).map((x) => x.a);
}
