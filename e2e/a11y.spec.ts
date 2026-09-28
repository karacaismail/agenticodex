import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/araclar', '/araclar/a2ui', '/altin-kumeler', '/gruplar/golden', '/kumeler', '/kumeler/ozel', '/akislar', '/akislar/yd-dosya-tek', '/uretici', '/konular/R05', '/kanit', '/sentez', '/mermaid-sagligi'];

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`erişilebilirlik (${scheme})`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`${path} ciddi/kritik ihlal yok`, async ({ page }) => {
        await page.addInitScript((s) => localStorage.setItem('genui-atlas-renk', s), scheme);
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        const res = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .exclude('.mermaid-host svg')
          .exclude('.logoloop')
          .analyze();
        const serious = res.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
        expect(serious).toEqual([]);
      });
    }
  });
}
