import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';
import svgr from 'vite-plugin-svgr';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr(), basicSsl()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
    css: true,
  },
  server: {
    port: 8080,
    https: false, // Ensure this is set to false or remove it
    host: true, // This allows the server to be accessible externally
    watch: {
      usePolling: true,
    },
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, './key.pem')),
    //   cert: fs.readFileSync(path.resolve(__dirname, './cert.pem')),
    // },
  },
});
