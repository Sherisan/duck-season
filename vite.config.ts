import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // the .NET backend in server/ writes temp files while it builds; watching them crashes the dev server
  server: { port: 5173, open: true, watch: { ignored: ['**/server/**'] } },
});
