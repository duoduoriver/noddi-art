import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Compile the bundled codec binaries exactly as Workers receives modules. */
function wasmModulePlugin(): Plugin {
  return {
    name: 'test-wasm-modules',
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith('.wasm')) return;
      const bytes = await readFile(id);
      return `export default new WebAssembly.Module(Buffer.from(${JSON.stringify(bytes.toString('base64'))}, 'base64'));`;
    },
  };
}

export default defineConfig({
  plugins: [wasmModulePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    mockReset: true,
    restoreMocks: true,
  },
});
