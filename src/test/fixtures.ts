import type { Tool } from '@/data/types';

export function mkTool(p: Partial<Tool> & { id: string }): Tool {
  return {
    name: p.id.toUpperCase(), kind: 'Kütüphane', layer: 'L03', golden: 'G01', tags: [], desc: '',
    license: 'MIT', maturity: 'Kararlı', vendor: 'X', platform: 'React', effort: 'Orta', stance: 'Seçimli',
    rTopics: [], url: '', version: '', mentionTotal: 10, coverage: 4,
    partialCoverage: 2, inSynthesis: true, claimCount: 0,
    claimStatus: { supported: 0, unverified: 0, disputed: 0, rejected: 0 }, evidence: null, contested: 0,
    sourceCount: 0, paragraphs: 1, community: 'C01', composite: 50,
    ring: 'Dene', radarEligible: true, riskScore: 10, riskTier: 'Düşük', consensus: 'Çoğunluk (4–6)',
    evidenceTier: 'Kanıt yok', visibility: 50, segments: [],
    ...p,
  };
}
