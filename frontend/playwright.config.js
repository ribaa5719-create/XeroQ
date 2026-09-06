import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
    permissions: ['geolocation'],
    geolocation: { latitude: 12.98, longitude: 77.6 },
    trace: 'retain-on-failure',
  },
})