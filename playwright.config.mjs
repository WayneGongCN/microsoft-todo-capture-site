import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4178', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' },
  webServer: { command: 'npm run build && npm run dev', url: 'http://127.0.0.1:4178', reuseExistingServer: true, timeout: 30_000 },
  reporter: 'list',
});
