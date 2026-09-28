/**
 * Koşul motoru — dinamik (koşullu) kümelerin temeli.
 * Bir kural; alan–işleç–değer koşullarından ve VE/VEYA/DEĞİL gruplarından oluşan bir ağaçtır.
 */
import type { Tool } from '@/data/types';

export type FieldType = 'enum' | 'multi' | 'number' | 'bool' | 'text';
export type Op =
  | 'eq' | 'neq' | 'in' | 'nin'
  | 'any' | 'all' | 'none'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'isnull' | 'notnull'
  | 'text' | 'is' | 'isnot';

export interface FieldDef {
  label: string;
  type: FieldType;
  get: (t: Tool) => unknown;
  unit?: string;
  hint?: string;
}

export const FIELDS = {
  name: { label: 'Ad', type: 'text', get: (t) => `${t.name} ${t.desc}` },
  kind: { label: 'Tür', type: 'enum', get: (t) => t.kind },
  layer: { label: 'Mimari katman', type: 'enum', get: (t) => t.layer },
  golden: { label: 'Altın küme', type: 'enum', get: (t) => t.golden },
  license: { label: 'Lisans', type: 'enum', get: (t) => t.license },
  maturity: { label: 'Olgunluk', type: 'enum', get: (t) => t.maturity },
  platform: { label: 'Platform bağı', type: 'enum', get: (t) => t.platform },
  effort: { label: 'Entegrasyon yükü', type: 'enum', get: (t) => t.effort },
  stance: { label: 'Rapor duruşu', type: 'enum', get: (t) => t.stance },
  ring: { label: 'Radar halkası', type: 'enum', get: (t) => t.ring },
  riskTier: { label: 'Risk düzeyi', type: 'enum', get: (t) => t.riskTier },
  consensus: { label: 'Konsensüs', type: 'enum', get: (t) => t.consensus },
  evidenceTier: { label: 'Kanıt düzeyi', type: 'enum', get: (t) => t.evidenceTier },
  vendor: { label: 'Üretici', type: 'enum', get: (t) => t.vendor },
  community: { label: 'Birlikte anılma topluluğu', type: 'enum', get: (t) => t.community },
  tags: { label: 'Yetenek etiketi', type: 'multi', get: (t) => t.tags },
  rTopics: { label: 'Araştırma konusu', type: 'multi', get: (t) => t.rTopics },
  segments: { label: 'Araştırma segmenti', type: 'multi', get: (t) => t.segments },
  evidence: { label: 'Kanıt puanı', type: 'number', get: (t) => t.evidence, unit: '/100', hint: 'İddiaların desteklenme durumundan türetilir; iddiası olmayan varlıkta boştur.' },
  composite: { label: 'Bileşik puan', type: 'number', get: (t) => t.composite, unit: '/100' },
  riskScore: { label: 'Risk puanı', type: 'number', get: (t) => t.riskScore, unit: '/100' },
  coverage: { label: 'Rapor kapsaması', type: 'number', get: (t) => t.coverage, unit: '/8' },
  mentionTotal: { label: 'Toplam geçiş', type: 'number', get: (t) => t.mentionTotal },
  claimCount: { label: 'İddia sayısı', type: 'number', get: (t) => t.claimCount },
  disputed: { label: 'İtirazlı iddia', type: 'number', get: (t) => t.claimStatus.disputed + t.claimStatus.rejected },
  contested: { label: 'Görüş ayrılıklı iddia', type: 'number', get: (t) => t.contested },
  sourceCount: { label: 'Kaynak sayısı', type: 'number', get: (t) => t.sourceCount },
  visibility: { label: 'Görünürlük', type: 'number', get: (t) => t.visibility, unit: '/100' },
  inSynthesis: { label: 'Sentez raporunda', type: 'bool', get: (t) => t.inSynthesis },
  radarEligible: { label: 'Radar adayı', type: 'bool', get: (t) => t.radarEligible },
} satisfies Record<string, FieldDef>;

export type FieldKey = keyof typeof FIELDS;

export interface Condition {
  kind: 'cond';
  field: FieldKey;
  op: Op;
  value?: unknown;
}
export interface Group {
  kind: 'group';
  combinator: 'and' | 'or';
  not?: boolean;
  children: Rule[];
}
export type Rule = Condition | Group;

export const OPS_BY_TYPE: Record<FieldType, Op[]> = {
  enum: ['eq', 'neq', 'in', 'nin'],
  multi: ['any', 'all', 'none'],
  number: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between', 'isnull', 'notnull'],
  bool: ['is', 'isnot'],
  text: ['text'],
};

export const OP_LABEL: Record<Op, string> = {
  eq: '=', neq: '≠', in: 'şunlardan biri', nin: 'şunların dışında', any: 'herhangi birini içerir', all: 'hepsini içerir',
  none: 'hiçbirini içermez', gt: '>', gte: '≥', lt: '<', lte: '≤', between: 'arasında', isnull: 'boş', notnull: 'dolu',
  text: 'metin içerir', is: 'doğru', isnot: 'yanlış',
};

export const cond = (field: FieldKey, op: Op, value?: unknown): Condition => (value === undefined ? { kind: 'cond', field, op } : { kind: 'cond', field, op, value });
export const and = (...children: Rule[]): Group => ({ kind: 'group', combinator: 'and', children });
export const or = (...children: Rule[]): Group => ({ kind: 'group', combinator: 'or', children });
export const not = (r: Rule): Group => ({ kind: 'group', combinator: 'and', not: true, children: [r] });

const lower = (s: unknown) => String(s ?? '').toLocaleLowerCase('tr');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

function evalCond(c: Condition, t: Tool): boolean {
  const def = (FIELDS as Record<string, FieldDef>)[c.field];
  if (!def) return false;
  const raw = def.get(t);
  const v = c.value;
  switch (c.op) {
    case 'isnull':
      return raw === null || raw === undefined;
    case 'notnull':
      return raw !== null && raw !== undefined;
    case 'eq':
      return raw !== null && raw === v;
    case 'neq':
      return raw !== null && raw !== v;
    case 'in':
      return arr(v).includes(raw);
    case 'nin':
      return !arr(v).includes(raw);
    case 'any': {
      const have = arr(raw);
      return arr(v).some((x) => have.includes(x));
    }
    case 'all': {
      const have = arr(raw);
      const want = arr(v);
      return want.length > 0 && want.every((x) => have.includes(x));
    }
    case 'none': {
      const have = arr(raw);
      return !arr(v).some((x) => have.includes(x));
    }
    case 'gt':
      return typeof raw === 'number' && raw > Number(v);
    case 'gte':
      return typeof raw === 'number' && raw >= Number(v);
    case 'lt':
      return typeof raw === 'number' && raw < Number(v);
    case 'lte':
      return typeof raw === 'number' && raw <= Number(v);
    case 'between': {
      const [lo, hi] = arr(v).map(Number);
      return typeof raw === 'number' && raw >= lo && raw <= hi;
    }
    case 'text':
      return lower(raw).includes(lower(v).trim());
    case 'is':
      return raw === true;
    case 'isnot':
      return raw !== true;
    default:
      return false;
  }
}

export function evaluate(rule: Rule, t: Tool): boolean {
  if (rule.kind === 'cond') return evalCond(rule, t);
  const res = rule.combinator === 'and' ? rule.children.every((c) => evaluate(c, t)) : rule.children.some((c) => evaluate(c, t));
  return rule.not ? !res : res;
}

export function filterTools(tools: Tool[], rule: Rule): Tool[] {
  return tools.filter((t) => evaluate(rule, t));
}

export function validate(rule: Rule, path = 'kök'): string[] {
  if (!rule || typeof rule !== 'object') return [`${path}: kural nesnesi değil`];
  if (rule.kind !== 'group' && rule.kind !== 'cond') return [`${path}: bilinmeyen kural türü`];
  if (rule.kind === 'group') {
    if (rule.combinator !== 'and' && rule.combinator !== 'or') return [`${path}: bilinmeyen birleştirici`];
    if (!Array.isArray(rule.children)) return [`${path}: alt kurallar dizi değil`];
    return rule.children.flatMap((c, i) => validate(c, `${path}.${i + 1}`));
  }
  const def = (FIELDS as Record<string, FieldDef>)[rule.field];
  if (!def) return [`${path}: bilinmeyen alan “${String(rule.field)}”`];
  if (!OPS_BY_TYPE[def.type].includes(rule.op)) return [`${path}: “${def.label}” alanı için geçersiz işleç “${rule.op}”`];
  return [];
}

function fmtVal(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(', ');
  return String(v ?? '');
}

export function describeRule(rule: Rule, labelFor?: (field: FieldKey, v: string) => string): string {
  if (rule.kind === 'cond') {
    const def = (FIELDS as Record<string, FieldDef>)[rule.field];
    const name = def?.label ?? String(rule.field);
    const val = (x: unknown) => (labelFor ? arr(x).map((y) => labelFor(rule.field, String(y))).join(', ') : fmtVal(x));
    switch (rule.op) {
      case 'isnull':
      case 'notnull':
      case 'is':
      case 'isnot':
        return `${name} ${OP_LABEL[rule.op]}`;
      case 'between': {
        const [a, b] = arr(rule.value);
        return `${name} ${a}–${b} arasında`;
      }
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
      case 'eq':
      case 'neq':
        return `${name} ${OP_LABEL[rule.op]} ${val(rule.value)}`;
      default:
        return `${name} ${OP_LABEL[rule.op]}: ${val(rule.value)}`;
    }
  }
  if (!rule.children.length) return rule.combinator === 'and' ? 'Tümü' : 'Hiçbiri';
  const joiner = rule.combinator === 'and' ? ' VE ' : ' VEYA ';
  const inner = rule.children.map((c) => (c.kind === 'group' && c.children.length > 1 ? `(${describeRule(c, labelFor)})` : describeRule(c, labelFor))).join(joiner);
  return rule.not ? `DEĞİL (${inner})` : inner;
}

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Genel amaçlı URL güvenli JSON kodlama (kova şemaları vb.). */
export function encodeJSON(v: unknown): string {
  return toB64Url(JSON.stringify(v));
}
export function decodeJSON<T>(s: string): T | null {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
    return JSON.parse(fromB64Url(s)) as T;
  } catch {
    return null;
  }
}

export function encodeRule(rule: Rule): string {
  return toB64Url(JSON.stringify(rule));
}

export function decodeRule(s: string): Rule | null {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
    const r = JSON.parse(fromB64Url(s)) as Rule;
    if (!r || (r.kind !== 'cond' && r.kind !== 'group')) return null;
    return validate(r).length ? null : r;
  } catch {
    return null;
  }
}

export function countConditions(rule: Rule): number {
  return rule.kind === 'cond' ? 1 : rule.children.reduce((s, c) => s + countConditions(c), 0);
}
