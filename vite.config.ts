import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@arcium-hq/client',
      '@noble/curves',
      '@noble/hashes',
      'bn.js',
      'buffer',
    ],
  },
  build: {
    outDir:    'dist',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          solana: ['@solana/web3.js'],
          arcium: ['@arcium-hq/client'],
          ui:     ['framer-motion', 'lucide-react', 'recharts'],
        },
      },
    },
  },
})
