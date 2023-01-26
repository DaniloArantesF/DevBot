import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    deps: {
      registerNodeLoader: true,
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@commands': path.resolve(__dirname, './src/commands'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@api': path.resolve(__dirname, './src/api'),
      '@models': path.resolve(__dirname, './src/models'),
      '@events': path.resolve(__dirname, './src/events'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@config': path.resolve(__dirname, './src/utils/config'),
    },
  },
});
