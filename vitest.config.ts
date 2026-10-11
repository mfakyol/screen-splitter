import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@renderer': resolve('src/renderer/src') } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Default is node; React tests opt into jsdom at the top of the file
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'src/main/**', 'src/renderer/src/**'],
      exclude: ['src/**/*.test.*', 'src/renderer/src/main.tsx', 'src/main/index.ts']
    }
  }
})
