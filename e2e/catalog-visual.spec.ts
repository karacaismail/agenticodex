import { expect, test } from '@playwright/test';

test('API araçları, klavye dropdown ve Kaizen süreçleri @catalog', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/araclar');
  const sort = page.getByRole('combobox', { name: 'Sırala' });
  await sort.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeHidden();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(sort).toBeFocused();
  await expect(sort).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(sort).toBeFocused();
  if (process.env.VISUAL_REFERENCES === '1') await expect(page).toHaveScreenshot('api-sort-focus.png');
  else {
    const path = test.info().outputPath('api-sort-focus-candidate.png');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path });
    await test.info().attach('api-sort-focus-candidate', { path, contentType: 'image/png' });
  }
  await page.getByLabel('Araç ara').fill('Hoppscotch');
  const tool = page.getByRole('link', { name: 'Hoppscotch', exact: true });
  await tool.hover();
  await tool.click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hoppscotch');
  await expect(page.getByText('Kaynak incelemesi', { exact: true })).toBeVisible();
  await page.goto('/kumeler/kaizen');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kaizen');
  await expect(page.locator('.mermaid-canvas svg').first()).toBeVisible();
  await expect(page.getByText('Diyagram çizilemedi', { exact: true })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  if (process.env.VISUAL_REFERENCES === '1') await expect(page).toHaveScreenshot('kaizen-cluster.png');
  else {
    const path = test.info().outputPath('kaizen-cluster-candidate.png');
    await page.screenshot({ path });
    await test.info().attach('kaizen-cluster-candidate', { path, contentType: 'image/png' });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/akislar/kaizen-capa');
  await expect(page.locator('.mermaid-canvas svg').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CAPA');
  expect(errors).toEqual([]);
});

test('320 başlangıcı, boyut geçişi, kaynak teslimatı ve diyagram kontrolleri @catalog', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => requests.push(r.url()));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/araclar');
  await page.getByLabel('Araç ara').fill('Bruno');
  await expect(page.getByRole('link', { name: 'Bruno', exact: true })).toBeVisible();
  // The actual build manifest identifies the optional renderer, independent of hashed filenames.
  const { readFileSync } = await import('node:fs');
  const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<string, { name?: string; file: string }>;
  const renderer = Object.entries(manifest).find(([key]) => key.endsWith('/mermaid/dist/mermaid.core.mjs'))?.[1];
  expect(renderer).toBeTruthy();
  expect(requests.some(url => url.endsWith(renderer!.file))).toBe(false);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(e => {
    const r = e as PerformanceResourceTiming;
    return { name: new URL(r.name).pathname, transfer: r.transferSize, decoded: r.decodedBodySize };
  }));
  const { writeFileSync } = await import('node:fs');
  const networkPath = test.info().outputPath('cold-catalog-network.json');
  writeFileSync(networkPath, JSON.stringify({ resources, serviceWorkers: 'blocked', profile: test.info().project.name,
    browser: page.context().browser()?.version(), os: process.platform, viewport: page.viewportSize(),
    measurementWindow: 'cold navigation until Bruno search result visible',
    observedTransferBytes: resources.reduce((sum, r) => sum + r.transfer, 0),
    media: await page.evaluate(() => ({ coarse: matchMedia('(any-pointer: coarse)').matches, hover: matchMedia('(any-hover: hover)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches })),
  }, null, 2));
  await test.info().attach('cold-catalog-network', { path: networkPath, contentType: 'application/json' });
  for (const [width, height] of [[320,480],[360,640],[375,667],[390,844],[568,320],[768,1024],[991,700],[992,700],[993,700],[1280,800]]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByLabel('Araç ara')).toHaveValue('Bruno');
    await expect(page.getByRole('link', { name: 'Bruno', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/akislar/kaizen-capa');
  await expect(page.locator('.mermaid-canvas svg').first()).toBeVisible();
  await expect(page.getByText('Diyagram çizilemedi', { exact: true })).toHaveCount(0);
  expect(requests.some(url => url.endsWith(renderer!.file))).toBe(true);
  for (const name of ['Yakınlaştır','Uzaklaştır','Ortala','Tam ekran','Kodu göster','Mermaid kodunu kopyala','Mermaid dosyası indir','SVG indir']) {
    const control = page.getByRole('button', { name, exact: true });
    const rect = await control.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(320);
    expect(rect!.width).toBeGreaterThanOrEqual(44);
    expect(rect!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button', { name: 'Kodu göster', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Kodu gizle', exact: true })).toBeVisible();
});
