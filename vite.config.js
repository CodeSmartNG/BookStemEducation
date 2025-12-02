import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: './',
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    },
    server: {
      port: 3000,
      open: true
    },
    // Explicitly define global constants
    define: {
      'process.env.VITE_PAYSTACK_PUBLIC_KEY': JSON.stringify(env.VITE_PAYSTACK_PUBLIC_KEY)
    }
  }
})