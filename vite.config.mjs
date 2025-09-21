import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    testTimeout: 100000,
    globals: true,
    include: ['./src/**/*.test.ts', './test/**/*.test.[tj]s'],
  },
})
