import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@saas-pos/domain': path.resolve(__dirname, '../../packages/domain/src'),
      '@saas-pos/application': path.resolve(__dirname, '../../packages/application/src'),
      '@saas-pos/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  server: {
    port: 3000,
  },
});
