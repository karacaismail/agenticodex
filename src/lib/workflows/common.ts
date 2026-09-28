import type { Claim, DiagramType, Meta, Tool, Topic, Workflow, WorkflowStep } from '@/data/types';
import { Flow } from '../mermaid/builder';

export interface GenInput {
  tools: Tool[];
  meta: Meta;
  topics: Topic[];
  claims: Claim[];
}

/** Açık ve koyu temada okunabilir sınıf renkleri (yalnız eski sürümlerde de desteklenen classDef). */
export const CLASSES: Record<string, Record<string, string>> = {
  start: { fill: '#4c6ef5', stroke: '#364fc7', color: '#ffffff' },
  end: { fill: '#0ca678', stroke: '#087f5b', color: '#ffffff' },
  decide: { fill: '#fcc419', stroke: '#e67700', color: '#1a1b1e' },
  risk: { fill: '#f03e3e', stroke: '#c92a2a', color: '#ffffff' },
  warn: { fill: '#ff922b', stroke: '#d9480f', color: '#1a1b1e' },
  ai: { fill: '#ae3ec9', stroke: '#862e9c', color: '#ffffff' },
  data: { fill: '#1098ad', stroke: '#0b7285', color: '#ffffff' },
  user: { fill: '#f76707', stroke: '#d9480f', color: '#ffffff' },
  gate: { fill: '#7048e8', stroke: '#5f3dc4', color: '#ffffff' },
  tool: { fill: '#e7f5ff', stroke: '#1c7ed6', color: '#1a1b1e' },
  muted: { fill: '#dee2e6', stroke: '#868e96', color: '#1a1b1e' },
};

export function styled(f: Flow, used?: string[]): Flow {
  const names = used ?? Object.keys(CLASSES);
  names.forEach((n) => f.classDef(n, CLASSES[n]));
  return f;
}

export function slug(s: string): string {
  const tr: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
  return s
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => tr[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const uniq = <T,>(a: T[]): T[] => Array.from(new Set(a));

export function complexityOf(mermaid: string): number {
  const n = mermaid.split('\n').length;
  return n < 14 ? 1 : n < 22 ? 2 : n < 32 ? 3 : n < 46 ? 4 : 5;
}

export interface WfInit {
  id: string;
  title: string;
  family: string;
  diagram: DiagramType;
  summary: string;
  mermaid: string;
  steps: WorkflowStep[];
  conditions?: string[];
  tools?: string[];
  topics?: string[];
  golden?: string[];
  layers?: string[];
  tags?: string[];
}

export function wf(p: WfInit, input: GenInput): Workflow {
  const known = new Set(input.tools.map((t) => t.id));
  const toolsU = uniq((p.tools ?? []).filter((t) => known.has(t)));
  const byId = new Map(input.tools.map((t) => [t.id, t]));
  const golden = uniq([...(p.golden ?? []), ...toolsU.map((t) => byId.get(t)!.golden)]);
  const layers = uniq([...(p.layers ?? []), ...toolsU.map((t) => byId.get(t)!.layer)]);
  const topicIds = new Set(input.topics.map((t) => t.id));
  return {
    id: p.id,
    title: p.title,
    family: p.family,
    diagram: p.diagram,
    summary: p.summary,
    mermaid: p.mermaid,
    steps: p.steps,
    conditions: p.conditions ?? [],
    tools: toolsU,
    topics: uniq((p.topics ?? []).filter((t) => topicIds.has(t))).sort(),
    golden: golden.sort(),
    layers: layers.sort(),
    complexity: complexityOf(p.mermaid),
    tags: uniq(p.tags ?? []),
  };
}

/** Akış düğümleri ile adım listesini aynı anda kuran küçük yardımcı. */
export class Recorder {
  steps: WorkflowStep[] = [];
  add(title: string, detail?: string, condition?: string): void {
    this.steps.push(condition ? { title, detail, condition } : detail ? { title, detail } : { title });
  }
}

export const toolName = (input: GenInput, id: string) => input.tools.find((t) => t.id === id)?.name ?? id;
export const goldenName = (input: GenInput, id: string) => input.meta.golden.find((g) => g.id === id)?.name ?? id;
export const layerName = (input: GenInput, id: string) => input.meta.layers.find((l) => l.id === id)?.name ?? id;
