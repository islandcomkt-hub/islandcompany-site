import { build } from 'vite';
import react from '@vitejs/plugin-react';

await build({
  configFile: false,
  publicDir: false,
  plugins: [react()],
  base: '/effects/',
  build: {
    outDir: 'public/effects',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: { main: 'effects/main.ts', journey: 'effects/journey.ts' },
      output: { entryFileNames: '[name].js', chunkFileNames: '[name]-[hash].js', assetFileNames: '[name]-[hash][extname]' }
    }
  }
});
