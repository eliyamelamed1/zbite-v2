import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './client/src/e2e/global-cleanup.ts',
  globalTeardown: './client/src/e2e/global-cleanup.ts',
  testDir: './client/src',
  testMatch: '**/e2e/**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'npm run server',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run client',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
