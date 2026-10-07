import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/kommo.js'

// En desarrollo, /api/kommo ejecuta el mismo handler que en Vercel.
const devApi = () => ({
  name: 'dev-api-kommo',
  configureServer(server) {
    server.middlewares.use('/api/kommo', (req, res) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', async () => {
        req.body = body ? JSON.parse(body) : {}
        const shim = {
          setHeader: (k, v) => res.setHeader(k, v),
          status(code) { res.statusCode = code; return this },
          json(obj) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) },
          end: () => res.end(),
        }
        await handler(req, shim)
      })
    })
  },
})

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { plugins: [react(), devApi()] }
})
