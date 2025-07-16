/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['__tests__/testSetup.test.ts'],
    testTimeout: 10000,
  },
})