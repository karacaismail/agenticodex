/** WCAG 2.x bağıl parlaklık ve kontrast yardımcıları. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
}
const toHex = (rgb: number[]) => '#' + rgb.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** a'dan oran kadar, geri kalanı b'den. */
export function mix(a: string, b: string, ratio: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return toHex(A.map((x, i) => x * ratio + B[i] * (1 - ratio)));
}

/** Rengi hedef kontrasta ulaşana dek siyaha doğru koyulaştırır. */
export function darkenUntil(fg: string, bg: string, target = 4.5): string {
  let c = fg;
  for (let i = 0; i < 40 && contrast(c, bg) < target; i++) c = mix(c, '#000000', 0.92);
  return c;
}

/** Zemin üzerinde en yüksek kontrastı veren metin rengi (siyah/beyaz). */
export function readableOn(bg: string): string {
  return contrast('#ffffff', bg) >= contrast('#111111', bg) ? '#ffffff' : '#111111';
}
