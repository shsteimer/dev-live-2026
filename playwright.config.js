import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL: any target — local `aem up` (default), a branch preview, or live.
// E2E_AUTH_HEADER: full Authorization header value for auth-gated targets.
export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.spec.js',
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    ...(process.env.E2E_AUTH_HEADER && {
      extraHTTPHeaders: { Authorization: process.env.E2E_AUTH_HEADER },
    }),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
