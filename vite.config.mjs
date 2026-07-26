import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import vue from '@vitejs/plugin-vue';

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
      vue()
  ],
  base: '/trivia/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'client/index': resolve(__dirname, 'client/index.html'),
        'monitor/index': resolve(__dirname, 'monitor/index.html')
      }
    }
  }
})

