/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['__tests__/testSetup.test.ts'],
    testTimeout: 10000,
  },
})

/*
Idk what is happened but now if i use this i see errors on test: {
and i see the error because different to above here we are using from 'vite'
i copied from main this thing so idk why now it's not working at all
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    setupFiles: ['__tests__/testSetup.test.ts']
  },
})
*/