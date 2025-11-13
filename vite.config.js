import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import basicSsl from '@vitejs/plugin-basic-ssl'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: '.',
  plugins: [basicSsl()],
  server: {
    host: true, // Allow access from local network
    port: 9000,
    https: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        boyModel: resolve(__dirname, 'example/boy-model.html'),
        boyModelTest: resolve(__dirname, 'example/boy-model-test.html')
      }
    }
  }
})
