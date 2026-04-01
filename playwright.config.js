// playwright.config.js
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  workers: 1, // sequential - important for DB state consistency

  reporter: [
    ['list'],
    ['github'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'API Tests',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Web UI Tests',
      testDir: './tests/web',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'DB Tests',
      testDir: './tests/db',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Integration Tests',
      testDir: './tests/integration',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
