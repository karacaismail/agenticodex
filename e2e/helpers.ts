import { expect, type Page } from '@playwright/test';

/** Sayfa hatalarını ve konsol hatalarını toplar. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Download the React DevTools/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

export async function expectDiagram(page: Page) {
  const host = page.locator('.mermaid-host').first();
  await expect(host.locator('svg').first()).toBeVisible();
  await expect(page.getByText('Diyagram çizilemedi')).toHaveCount(0);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
