import { describe, expect, it } from 'vitest';
import { contrast, darkenUntil, mix, readableOn } from './color';

describe('renk yardımcıları (WCAG)', () => {
  it('kontrast oranı bilinen değerleri verir', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#868e96', '#ffffff')).toBeCloseTo(3.32, 1);
  });
  it('darkenUntil hedef orana ulaşır', () => {
    for (const c of ['#e67700', '#fab005', '#82c91e', '#15aabf', '#087f5b']) {
      const d = darkenUntil(c, '#fff9db', 4.6);
      expect(contrast(d, '#fff9db')).toBeGreaterThanOrEqual(4.6);
    }
  });
  it('mix iki rengi oranla karıştırır', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#ff0000', '#0000ff', 1)).toBe('#ff0000');
  });
  it('readableOn her zeminde ≥ 4.5 veren siyah ya da beyazı seçer', () => {
    for (const bg of ['#15aabf', '#fab005', '#7050fd', '#868e96', '#12b886', '#1a1b2e', '#f8f9fa']) {
      expect(contrast(readableOn(bg), bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
