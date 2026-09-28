/**
 * Sürüm-güvenli Mermaid oluşturucu.
 *
 * Kural: yalnız Mermaid 10.9 → 12.0 arasında değişmeden desteklenen sözdizimi üretilir.
 * - Yeni şekil sözdizimi (`@{ shape: … }`), frontmatter, `direction` ve markdown dizgeleri kullanılmaz.
 * - Bütün düğüm etiketleri tırnak içindedir; tırnak, diyez, açılı ayraç, ters tırnak ve & kaçışlanır.
 * - Kenar, mesaj ve geçiş metinleri güvenli karakter kümesine indirgenir.
 * Her üretilen diyagram derleme sırasında üç ana sürümde ayrıştırılarak doğrulanır.
 */

export const MERMAID_RUNTIME = '11.17.2';
export const MERMAID_COMPAT = ['10.9', '11.17', '12.0'] as const;

const RESERVED = new Set([
  'end', 'graph', 'flowchart', 'subgraph', 'style', 'class', 'classdef', 'click', 'linkstyle', 'direction',
  'participant', 'actor', 'note', 'loop', 'alt', 'else', 'opt', 'par', 'and', 'rect', 'activate', 'deactivate',
  'state', 'default', 'section', 'title', 'call', 'href', 'critical', 'break', 'box', 'autonumber',
]);

function clip(s: string, max: number): string {
  const arr = Array.from(s);
  return arr.length > max ? arr.slice(0, max - 1).join('').trimEnd() + '…' : s;
}

function baseClean(s: string): string {
  return String(s ?? '')
    .replace(/\r/g, '')
    .replace(/%%/g, '%')
    .replace(/`/g, "'")
    .replace(/[<]/g, '‹')
    .replace(/[>]/g, '›')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');
}

/** Tırnaklı düğüm etiketi içeriği (tırnaklar hariç). */
export function safeLabel(input: string, max = 90): string {
  let s = baseClean(input).replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '—';
  s = clip(s, max);
  return s
    .replace(/#/g, '#35;')
    .replace(/&/g, '#38;')
    .replace(/"/g, '#quot;')
    .replace(/;/g, '#59;');
}

/** Satır kırmalı çok satırlı etiket (\n → <br/>). */
export function safeMultiline(input: string, max = 120): string {
  return String(input ?? '')
    .split('\n')
    .map((line) => safeLabel(line, max))
    .filter((x) => x !== '—')
    .join('<br/>') || '—';
}

/** Kenar etiketi: yalnız harf, rakam, boşluk ve . , ' / % + - bırakılır. */
export function safeEdgeLabel(input: string, max = 36): string {
  const s = baseClean(input)
    .replace(/[:;|]/g, ' ')
    .replace(/[^\p{L}\p{N} .,'/%+\-]/gu, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return clip(s, max).replace(/…$/, '').trim();
}

/** Sıralı diyagram mesajı, not ve geçiş metni. */
export function safeText(input: string, max = 110): string {
  const s = baseClean(input)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/[;#]/g, ',')
    .replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'))
    .replace(/:/g, ' -')
    .replace(/&/g, ' ve ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return clip(s || '—', max);
}

const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U' };

/** Mermaid kimliği: harfle başlar, yalnız [A-Za-z0-9_], ayrılmış sözcük değildir. */
export function safeId(input: string): string {
  let s = String(input ?? '').replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR_MAP[c] ?? c).replace(/[^A-Za-z0-9_]/g, '_');
  s = s.replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (!s || !/^[A-Za-z]/.test(s)) s = 'x' + s;
  if (RESERVED.has(s.toLowerCase())) s = s + '_n';
  return s;
}

/* ------------------------------------------------------------------ flowchart */

export type Shape = 'rect' | 'round' | 'stadium' | 'decision' | 'db' | 'sub' | 'circle' | 'hex' | 'flag' | 'para';
export type EdgeStyle = 'solid' | 'dotted' | 'thick';

const SHAPES: Record<Shape, [string, string]> = {
  rect: ['["', '"]'],
  round: ['("', '")'],
  stadium: ['(["', '"])'],
  decision: ['{"', '"}'],
  db: ['[("', '")]'],
  sub: ['[["', '"]]'],
  circle: ['(("', '"))'],
  hex: ['{{"', '"}}'],
  flag: ['>"', '"]'],
  para: ['[/"', '"/]'],
};

interface Ctx {
  counter: { n: number };
}

export class Flow {
  private lines: string[] = [];
  private classDefs: string[] = [];
  private classes = new Map<string, string[]>();
  private ctx: Ctx;
  private indent: string;

  constructor(private dir: 'TD' | 'LR' | 'BT' | 'RL' = 'TD', ctx?: Ctx, indent = '  ') {
    this.ctx = ctx ?? { counter: { n: 0 } };
    this.indent = indent;
  }

  /** Düğüm ekler ve kimliğini döndürür. */
  node(label: string, shape: Shape = 'rect', cls?: string): string {
    const id = `n${++this.ctx.counter.n}`;
    const [o, c] = SHAPES[shape];
    const lbl = label.includes('\n') ? safeMultiline(label) : safeLabel(label);
    this.lines.push(`${this.indent}${id}${o}${lbl}${c}`);
    if (cls) this.addClass(id, cls);
    return id;
  }

  edge(a: string, b: string, label?: string, style: EdgeStyle = 'solid'): this {
    const arrow = style === 'dotted' ? '-.->' : style === 'thick' ? '==>' : '-->';
    const l = label ? safeEdgeLabel(label) : '';
    this.lines.push(`${this.indent}${a} ${arrow}${l ? `|${l}|` : ''} ${b}`);
    return this;
  }

  /** Alt grafik; içindeki düğümler aynı sayaçla kimlik alır. */
  subgraph(title: string, fn: (g: Flow) => void): string {
    const id = `sg${++this.ctx.counter.n}`;
    const inner = new Flow(this.dir, this.ctx, this.indent + '  ');
    fn(inner);
    this.lines.push(`${this.indent}subgraph ${id} ["${safeLabel(title, 70)}"]`);
    this.lines.push(...inner.lines);
    this.lines.push(`${this.indent}end`);
    inner.classes.forEach((ids, cls) => ids.forEach((i) => this.addClass(i, cls)));
    return id;
  }

  addClass(id: string, cls: string): this {
    const c = safeId(cls);
    this.classes.set(c, [...(this.classes.get(c) ?? []), id]);
    return this;
  }

  classDef(name: string, style: Record<string, string>): this {
    const body = Object.entries(style)
      .map(([k, v]) => `${k.replace(/[^a-z-]/gi, '')}:${String(v).replace(/[;,\s]/g, '')}`)
      .join(',');
    this.classDefs.push(`  classDef ${safeId(name)} ${body}`);
    return this;
  }

  toString(): string {
    const cls: string[] = [];
    this.classes.forEach((ids, c) => {
      for (let i = 0; i < ids.length; i += 40) cls.push(`  class ${ids.slice(i, i + 40).join(',')} ${c}`);
    });
    return [`flowchart ${this.dir}`, ...this.lines, ...this.classDefs, ...cls].join('\n');
  }
}

/* ------------------------------------------------------------------ sequence */

export type MsgKind = 'sync' | 'reply' | 'async' | 'lost';
const ARROWS: Record<MsgKind, string> = { sync: '->>', reply: '-->>', async: '-)', lost: '-x' };

export class Seq {
  private lines: string[] = [];
  private head: string[] = [];
  private pCount: { n: number };

  constructor(private autonumber = true, pCount?: { n: number }, private indent = '  ') {
    this.pCount = pCount ?? { n: 0 };
  }

  participant(label: string, actor = false): string {
    const id = `P${++this.pCount.n}`;
    this.head.push(`  ${actor ? 'actor' : 'participant'} ${id} as ${safeText(label, 40)}`);
    return id;
  }

  msg(a: string, b: string, text: string, kind: MsgKind = 'sync'): this {
    this.lines.push(`${this.indent}${a}${ARROWS[kind]}${b}: ${safeText(text)}`);
    return this;
  }

  note(over: string[], text: string): this {
    const who = over.slice(0, 2).join(',');
    this.lines.push(`${this.indent}Note over ${who}: ${safeText(text)}`);
    return this;
  }

  private block(kw: string, branches: { label: string; body: (s: Seq) => void }[], sep: string): this {
    branches.forEach((br, i) => {
      this.lines.push(`${this.indent}${i === 0 ? kw : sep} ${safeText(br.label, 60)}`);
      const inner = new Seq(false, this.pCount, this.indent + '  ');
      br.body(inner);
      if (!inner.lines.length) inner.lines.push(`${this.indent}  Note over ${'P1'}: —`);
      this.lines.push(...inner.lines);
      this.head.push(...inner.head);
    });
    this.lines.push(`${this.indent}end`);
    return this;
  }

  alt(branches: { label: string; body: (s: Seq) => void }[]): this {
    return this.block('alt', branches, 'else');
  }
  par(branches: { label: string; body: (s: Seq) => void }[]): this {
    return this.block('par', branches, 'and');
  }
  opt(label: string, body: (s: Seq) => void): this {
    return this.block('opt', [{ label, body }], 'else');
  }
  loop(label: string, body: (s: Seq) => void): this {
    return this.block('loop', [{ label, body }], 'else');
  }

  toString(): string {
    return ['sequenceDiagram', ...(this.autonumber ? ['  autonumber'] : []), ...this.head, ...this.lines].join('\n');
  }
}

/* ------------------------------------------------------------------ state */

export class StateD {
  private lines: string[] = [];
  private counter: { n: number };

  constructor(counter?: { n: number }, private indent = '  ') {
    this.counter = counter ?? { n: 0 };
  }

  state(label: string): string {
    const id = `s${++this.counter.n}`;
    this.lines.push(`${this.indent}state "${safeText(label, 60)}" as ${id}`);
    return id;
  }

  choice(): string {
    const id = `c${++this.counter.n}`;
    this.lines.push(`${this.indent}state ${id} <<choice>>`);
    return id;
  }

  start(id: string): this {
    this.lines.push(`${this.indent}[*] --> ${id}`);
    return this;
  }
  end(id: string): this {
    this.lines.push(`${this.indent}${id} --> [*]`);
    return this;
  }
  trans(a: string, b: string, label?: string): this {
    this.lines.push(`${this.indent}${a} --> ${b}${label ? ` : ${safeText(label, 50)}` : ''}`);
    return this;
  }
  note(id: string, text: string, side: 'left' | 'right' = 'right'): this {
    this.lines.push(`${this.indent}note ${side} of ${id} : ${safeText(text, 80)}`);
    return this;
  }
  composite(label: string, fn: (s: StateD) => void): string {
    const id = `k${++this.counter.n}`;
    const inner = new StateD(this.counter, this.indent + '  ');
    fn(inner);
    this.lines.push(`${this.indent}state "${safeText(label, 60)}" as ${id}`);
    this.lines.push(`${this.indent}state ${id} {`);
    this.lines.push(...inner.lines);
    this.lines.push(`${this.indent}}`);
    return id;
  }

  toString(): string {
    return ['stateDiagram-v2', ...this.lines].join('\n');
  }
}

/* ------------------------------------------------------------------ gantt */

function ganttName(s: string, max = 60): string {
  return clip(baseClean(s).replace(/[:;#]/g, ' ').replace(/\s+/g, ' ').trim() || '—', max);
}

export class Gantt {
  private lines: string[] = [];
  private n = 0;
  constructor(private title: string, private startDate = '2026-10-05') {}

  section(name: string): this {
    this.lines.push(`  section ${ganttName(name, 50)}`);
    return this;
  }

  task(name: string, days: number, opt: { after?: string; status?: 'done' | 'active' | 'crit' } = {}): string {
    const id = `t${++this.n}`;
    const start = opt.after ? `after ${opt.after}` : this.startDate;
    const st = opt.status ? `${opt.status}, ` : '';
    this.lines.push(`  ${ganttName(name)} :${st}${id}, ${start}, ${Math.max(1, Math.round(days))}d`);
    return id;
  }

  milestone(name: string, opt: { after?: string } = {}): string {
    const id = `m${++this.n}`;
    const start = opt.after ? `after ${opt.after}` : this.startDate;
    this.lines.push(`  ${ganttName(name)} :milestone, ${id}, ${start}, 0d`);
    return id;
  }

  toString(): string {
    return ['gantt', `  title ${ganttName(this.title, 70)}`, '  dateFormat YYYY-MM-DD', '  axisFormat %d.%m', ...this.lines].join('\n');
  }
}
