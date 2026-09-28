import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Tam tarama: bütün iş akışı sayfalarında diyagramın gerçekten çizildiğini doğrular (npm run e2e:full).
const { workflows } = JSON.parse(readFileSync(new URL('../src/data/generated/workflows.json', import.meta.url), 'utf8')) as { workflows: { id: string }[] };
const SHARDS = 24;

test.describe('@full bütün iş akışları çizilir', () => {
  for (let s = 0; s < SHARDS; s++) {
    test(`dilim ${s + 1}/${SHARDS}`, async ({ page }) => {
      test.setTimeout(600_000);
      const ids = workflows.filter((_, i) => i % SHARDS === s).map((w) => w.id);
      const failed: string[] = [];
      for (const id of ids) {
        await page.goto(`/akislar/${id}`);
        try {
          await expect(page.locator('.mermaid-host svg').first()).toBeVisible({ timeout: 15_000 });
          if (await page.getByText('Diyagram çizilemedi').count()) failed.push(id);
        } catch {
          failed.push(id);
        }
      }
      expect(failed).toEqual([]);
    });
  }
});
