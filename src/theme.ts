import { createTheme, DEFAULT_THEME, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core';
import { contrast, darkenUntil } from '@/lib/color';

const aurora: MantineColorsTuple = ['#f3efff', '#e2dbff', '#c2b3ff', '#a088fe', '#8363fd', '#7050fd', '#6644fe', '#5536e3', '#4b2fcb', '#3f26b3'];

export const theme = createTheme({
  primaryColor: 'aurora',
  // İki temada aynı gölge: Mantine autoContrast hesabı ile gerçek dolgu rengi tutarlı kalır.
  primaryShade: { light: 6, dark: 6 },
  colors: { aurora },
  autoContrast: true,
  // Beyaz ve siyah metnin kontrastının eşitlendiği bağıl parlaklık ≈ 0.18
  luminanceThreshold: 0.18,
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: {
    fontFamily: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  defaultGradient: { from: 'aurora.6', to: 'teal.7', deg: 135 },
  components: {
    Card: { defaultProps: { radius: 'lg', withBorder: true } },
    Paper: { defaultProps: { radius: 'lg' } },
    Badge: { defaultProps: { radius: 'sm', variant: 'light' } },
    Tooltip: { defaultProps: { withArrow: true, openDelay: 250 } },
    Button: { defaultProps: { radius: 'md' } },
  },
});

const COLOR_NAMES = [...Object.keys(DEFAULT_THEME.colors), 'aurora'];
const allColors = { ...DEFAULT_THEME.colors, aurora } as Record<string, readonly string[]>;

/**
 * Erişilebilir renk değişkenleri: açık temada “light” ve “outline” varyant metinleri
 * zemine karşı en az 4.6:1 olacak şekilde hesaplanır; “dimmed” iki temada da AA’yı karşılar.
 */
export const cssResolver: CSSVariablesResolver = () => {
  const light: Record<string, string> = { '--mantine-color-dimmed': '#545b68' };
  for (const c of COLOR_NAMES) {
    const shades = allColors[c];
    if (!shades) continue;
    const lightBg = shades[0];
    light[`--mantine-color-${c}-light`] = lightBg;
    light[`--mantine-color-${c}-light-color`] = darkenUntil(shades[9], lightBg, 4.6);
    light[`--mantine-color-${c}-outline`] = darkenUntil(shades[7], '#f5f6f8', 4.8);
  }
  return { variables: {}, light, dark: { '--mantine-color-dimmed': '#a9a7c6' } };
};

export const AA_OK = (fg: string, bg: string) => contrast(fg, bg) >= 4.5;
