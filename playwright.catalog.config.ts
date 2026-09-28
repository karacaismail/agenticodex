import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  snapshotPathTemplate: process.env.VISUAL_CANDIDATE_DIFF === '1' ? '{testDir}/../quality/evidence/visual-candidates/before/{arg}-{projectName}-{platform}{ext}' : undefined,
  testDir: 'e2e', testMatch: 'catalog-visual.spec.ts', timeout: 60_000,
  expect: { timeout: 15_000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 } },
  workers: 3,
  use: { baseURL: 'http://localhost:4391', reducedMotion: 'reduce', colorScheme: 'dark', locale: 'tr-TR', trace: 'retain-on-failure', serviceWorkers: 'block', timezoneId: 'Europe/Istanbul' },
  webServer: { command: 'npx vite preview --port 4391 --strictPort', url: 'http://localhost:4391', reuseExistingServer: true },
  projects: [
    { name: 'catalog-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'catalog-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'catalog-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'catalog-mobile-chromium', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 800 } } },
    { name: 'catalog-mobile-webkit', use: { ...devices['iPhone SE'], viewport: { width: 320, height: 800 } } },
  ],
});
