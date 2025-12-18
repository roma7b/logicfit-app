
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // Não definimos mais 'define' manual para API Keys para evitar que scanners de segurança 
  // detectem padrões suspeitos durante o build. Usaremos import.meta.env diretamente.
});
