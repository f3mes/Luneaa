import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://45.43.163.139:25685',
      '/auth': 'http://45.43.163.139:25685',
      '/socket.io': {
        target: 'http://45.43.163.139:25685',
        ws: true 
      }
    }
  }
})