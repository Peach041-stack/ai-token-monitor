import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.PORT || '3001'
  const frontendPort = parseInt(env.VITE_PORT || '5173', 10)

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: frontendPort,
      open: false,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
