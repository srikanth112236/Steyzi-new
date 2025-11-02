import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'a2abd294ffa2.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io'
    ],
    proxy: {
      '/api': {
        target: 'https://api.steyzi.com',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://api.steyzi.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'redux-persist',
      'react-router-dom',
      'axios',
      'socket.io-client',
      'framer-motion',
      'react-hook-form',
      'react-hot-toast',
      'chart.js',
      'react-chartjs-2',
      'date-fns',
      'lodash',
    ],
    force: true,
  },
  clearScreen: false,
  logLevel: 'info',
}) 