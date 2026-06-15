// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
      '@': '/src',
        '@components': '/src/components',
        '@styles': '/src/styles',
        '@assets': '/src/assets',
      },
    },
  },
});
