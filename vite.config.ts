import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    // Polyfills Node.js built-ins (crypto, buffer, stream, fs, etc.)
    // Required for @arcium-hq/client which imports Node's crypto and fs
    nodePolyfills({
      include: ['crypto', 'buffer', 'stream', 'util', 'events'],
      globals: {
        Buffer:  true,
        global:  true,
        process: true,
      },
    }),
    react(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': '{}',
  },
  optimizeDeps: {
    include: [
      '@arcium-hq/client',
      '@noble/curves',
      '@noble/hashes',
      'bn.js',
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
