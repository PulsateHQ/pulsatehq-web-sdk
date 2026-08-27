import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: '.',
  snapshotDir: './snapshots',
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 50,
      animations: 'disabled',
    },
  },
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npx serve -l 4173 --no-clipboard',
    port: 4173,
    cwd: path.resolve(__dirname, '../..'),
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
