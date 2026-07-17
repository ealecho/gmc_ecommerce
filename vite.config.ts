import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// https://vite.dev/config/
// The Cloudflare plugin runs the Worker (worker/index.js) in the Vite dev
// server, so `/api/*` is served by Hono locally just like in production.
// It reads wrangler.toml for config and .dev.vars for secrets.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
})
