import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    // The engine (Part 2) tests are TypeScript/TSX. The Part 1 Prompt OS tests
    // are node:test `.mjs` files run by `pnpm test:prompts`; Vitest never runs
    // them, so the two suites coexist by file extension.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/*.test.mjs', 'out/**'],
    testTimeout: 30_000,
  },
});
