import type { ClaimStatus, DiagramType } from '@/data/types';

export const STATUS_LABEL: Record<ClaimStatus, string> = { supported: 'Destekli', unverified: 'Doğrulanmamış', disputed: 'İtirazlı', rejected: 'Reddedilmiş' };
export const STATUS_COLOR: Record<ClaimStatus, string> = { supported: 'teal', unverified: 'gray', disputed: 'orange', rejected: 'red' };
export const STATUS_ORDER: ClaimStatus[] = ['supported', 'unverified', 'disputed', 'rejected'];

export const DIAGRAM_LABEL: Record<DiagramType, string> = { flowchart: 'Akış şeması', sequence: 'Sıralı etkileşim', state: 'Durum makinesi', gantt: 'Gantt' };
export const DIAGRAM_COLOR: Record<DiagramType, string> = { flowchart: 'aurora', sequence: 'cyan', state: 'grape', gantt: 'orange' };

export const RING_COLOR: Record<string, string> = { Benimse: 'teal', Dene: 'blue', Değerlendir: 'yellow', Beklet: 'gray' };
export const RISK_COLOR: Record<string, string> = { Düşük: 'teal', Orta: 'yellow', Yüksek: 'red' };

export const MANTINE_HEX: Record<string, string> = {
  indigo: '#4c6ef5', violet: '#7950f2', grape: '#be4bdb', cyan: '#15aabf', teal: '#12b886', green: '#40c057', pink: '#e64980',
  orange: '#fd7e14', yellow: '#fab005', red: '#fa5252', lime: '#82c91e', blue: '#228be6', gray: '#868e96', dark: '#5c5f66', aurora: '#7050fd',
};

export const hexOf = (c?: string) => MANTINE_HEX[c ?? 'gray'] ?? '#868e96';

export function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 100) : 0;
}

export const nf = new Intl.NumberFormat('tr-TR');

export function reportLabel(id: string, labels: Record<string, string>): string {
  return labels[id] ?? id.replace(/_/g, ' ');
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function pathOf(url: string, max = 60): string {
  try {
    const u = new URL(url);
    const p = (u.pathname + u.search).slice(0, max);
    return p === '/' ? '' : p;
  } catch {
    return '';
  }
}
