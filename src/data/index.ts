/**
 * Veri erişim katmanı. Küçük ve her sayfada gereken veri (araçlar, meta, konular) doğrudan;
 * büyük veri (iddialar, kaynaklar, kenarlar, iş akışları) ihtiyaç anında yüklenir.
 */
import toolsJson from './generated/tools-core.json';
import metaJson from './generated/meta.json';
import topicsJson from './generated/topics.json';
import type { Claim, Edge, Meta, Source, Tool, ToolDetail, Topic, Workflow, WorkflowFamily } from './types';

export const tools = toolsJson as unknown as Tool[];
export const meta = metaJson as unknown as Meta;
export const topics = topicsJson as unknown as Topic[];

export const toolById = new Map(tools.map((t) => [t.id, t]));
export const topicById = new Map(topics.map((t) => [t.id, t]));
export const goldenById = new Map(meta.golden.map((g) => [g.id, g]));
export const layerById = new Map(meta.layers.map((l) => [l.id, l]));
export const segmentById = new Map(meta.segments.map((s) => [s.id, s]));
export const communityById = new Map(meta.communities.map((c) => [c.id, c]));

let detailP: Promise<Record<string, ToolDetail>> | null = null;
let claimsP: Promise<Claim[]> | null = null;
let sourcesP: Promise<Source[]> | null = null;
let edgesP: Promise<Edge[]> | null = null;
let wfP: Promise<{ families: WorkflowFamily[]; workflows: Workflow[] }> | null = null;

export const loadToolDetails = () => (detailP ??= import('./generated/tools-detail.json').then((m) => m.default as unknown as Record<string, ToolDetail>));
export const loadClaims = () => (claimsP ??= import('./generated/claims.json').then((m) => m.default as unknown as Claim[]));
export const loadSources = () => (sourcesP ??= import('./generated/sources.json').then((m) => m.default as unknown as Source[]));
export const loadEdges = () => (edgesP ??= import('./generated/edges.json').then((m) => m.default as unknown as Edge[]));
export const loadWorkflows = () =>
  (wfP ??= import('./generated/workflows.json').then((m) => m.default as unknown as { families: WorkflowFamily[]; workflows: Workflow[] }));
