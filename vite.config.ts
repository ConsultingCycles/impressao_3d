import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- Mantém isso (Essencial para o Electron achar os arquivos)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Aumenta o limite de aviso para não reclamar do tamanho dos arquivos,
    // mas deixa o Vite decidir como dividir os pedaços automaticamente.
    chunkSizeWarningLimit: 2000, 
  }
});