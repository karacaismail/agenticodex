/** Kullanıcının kaydettiği özel kümeler (yalnız bu tarayıcıda; kolaylık amaçlı). */
import { validate, type Rule } from './rules';

export const STORAGE_KEY = 'genui-atlas-ozel-kumeler';

export interface SavedCluster {
  id: string;
  name: string;
  rule: Rule;
  createdAt: number;
}

function read(): SavedCluster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedCluster[];
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.name === 'string' && x.rule && validate(x.rule).length === 0) : [];
  } catch {
    return [];
  }
}

function write(list: SavedCluster[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* depolama kapalı veya dolu: sessizce geç */
  }
}

export function listSaved(): SavedCluster[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

let seq = 0;
export function saveCluster(name: string, rule: Rule): SavedCluster {
  const item: SavedCluster = { id: `k${Date.now().toString(36)}${(seq++).toString(36)}`, name: name.trim() || 'Adsız küme', rule, createdAt: Date.now() + seq };
  write([item, ...read()]);
  return item;
}

export function removeSaved(id: string): void {
  write(read().filter((x) => x.id !== id));
}
