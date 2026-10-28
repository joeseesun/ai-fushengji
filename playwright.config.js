import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 120000, fullyParallel: false, workers: 1,
  use: { baseURL: process.env.TEST_URL || 'http://127.0.0.1:4180', headless: true, channel: process.env.CI ? undefined : 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: process.env.TEST_URL ? undefined : { command: 'npm run build && npm run preview -- --port 4180', url: 'http://127.0.0.1:4180', reuseExistingServer: false },
  reporter: 'list',
});
