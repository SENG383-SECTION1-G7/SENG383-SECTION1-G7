import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:5173', headless: true, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run seed --prefix ../server && npm start --prefix ../server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      env: { NODE_ENV: 'development', DB_PATH: 'e2e.sqlite', AI_MODE: 'mock', PORT: '3001', JWT_SECRET: 'synthetic-e2e-only' },
    },
    {
      command: 'npm run dev -- --host localhost --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
    },
  ],
});
