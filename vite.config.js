import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { resolve } from 'path'

export default defineConfig({
  plugins: [createVuePlugin()],
  server: {
    port: 5175
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
