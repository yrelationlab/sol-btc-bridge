import { defineConfig } from 'vitest/config'

export default (
  defineConfig({
    test: {
      testTimeout: 200000, // 将超时时间设置为 200 秒
      include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
      exclude: ['**/node_modules/**']
    },
  })
)