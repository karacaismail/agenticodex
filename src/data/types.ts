export type ClaimStatus = 'supported' | 'unverified' | 'disputed' | 'rejected';
export type Ring = 'Benimse' | 'Dene' | 'Değerlendir' | 'Beklet';

export interface Fact {
  text: string;
  report: string;
}

export interface Tool {
  id: string;
  name: string;
  kind: string;
  layer: string;
  golden: string;
  tags: string[];
  desc: string;
  license: string;
  maturity: string;
  vendor: string;
  platform: string;
  effort: string;
  stance: string;
  rTopics: string[];
  url: string;
  version: string;
  provenance?: { kind: "external"; url: string; checkedAt: string };
  mentionTotal: number;
  coverage: number;
  partialCoverage: number;
  inSynthesis: boolean;
  claimCount: number;
  claimStatus: Record<ClaimStatus, number>;
  evidence: number | null;
  contested: number;
  sourceCount: number;
  paragraphs: number;
  community: string;
  composite: number;
  ring: Ring;
  radarEligible: boolean;
  riskScore: number;
  riskTier: 'Düşük' | 'Orta' | 'Yüksek';
  consensus: string;
  evidenceTier: string;
  visibility: number;
  segments: string[];
}

/** Yalnız araç detayında gereken ağır alanlar (tembel yüklenir). */
export interface ToolDetail {
  summary: string;
  facts: Fact[];
  risks: string[];
  excerpts: Fact[];
  mentions: Record<string, number>;
  neighbors: { id: string; w: number; c: number }[];
}

export interface Assessment {
  stage: string;
  status: ClaimStatus;
  reason: string;
  counter: string;
  limits: string;
  counterSources: string[];
}

export interface Claim {
  id: string;
  slug: string;
  statement: string;
  stage: string;
  status: ClaimStatus;
  statuses: ClaimStatus[];
  contested: boolean;
  assessments: Assessment[];
  sources: string[];
  tools: string[];
  topics: string[];
}

export interface Source {
  id: string;
  url: string;
  domain: string;
  reports: string[];
  tools: string[];
  placeholder: boolean;
  claims: string[];
}

export interface Topic {
  id: string;
  title: string;
  segment: string;
  question: string;
  subQuestions: string[];
  expected: string;
  short: string;
  clusters: number[];
  openCheck: string;
  tools: string[];
  claimCount: number;
  claimStatus: Partial<Record<ClaimStatus, number>>;
  tracks: string[];
}

export interface Golden {
  id: string;
  name: string;
  ring: 'core' | 'support';
  job: string;
  color: string;
  members: string[];
}

export interface Layer {
  id: string;
  name: string;
  desc: string;
  members: string[];
}

export interface Segment {
  id: string;
  title: string;
  topics: string[];
}

export interface Community {
  id: string;
  name: string;
  members: string[];
  dominantGolden: string;
  dominantLayer: string;
  density: number;
  cohesion: number;
}

export interface Meta {
  generatedAt: string;
  researchAsOf: string;
  reports: { id: string; label: string; bytes: number }[];
  reportLabels: Record<string, string>;
  partialCount: number;
  counts: Record<string, number>;
  claimStatus: Partial<Record<ClaimStatus, number>>;
  golden: Golden[];
  layers: Layer[];
  segments: Segment[];
  tracks: { name: string; input: string; output: string; topics: string[] }[];
  synthesis: {
    sections: { n: number; title: string; topics: string[] }[];
    gates: { id: string; name: string; output: string; exit: string }[];
    decisions: { topic: string; decision: string; limit: string }[];
    risks: { title: string; text: string }[];
  };
  communities: Community[];
}

export interface Edge {
  a: string;
  b: string;
  c: number;
  w: number;
}

export type DiagramType = 'flowchart' | 'sequence' | 'state' | 'gantt';

export interface WorkflowStep {
  title: string;
  detail?: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  title: string;
  family: string;
  diagram: DiagramType;
  summary: string;
  mermaid: string;
  steps: WorkflowStep[];
  conditions: string[];
  tools: string[];
  topics: string[];
  golden: string[];
  layers: string[];
  complexity: number;
  tags: string[];
}

export interface WorkflowFamily {
  id: string;
  name: string;
  desc: string;
  diagram: DiagramType | 'karma';
  count: number;
}
