import { Hono } from 'hono';
import products from './routes/products.js';
import cart from './routes/cart.js';
import orders from './routes/orders.js';
import payments from './routes/payments.js';
import me from './routes/me.js';
import media from './routes/media.js';
import { AppEnv } from './types.js';

// The Worker only handles `/api/*` requests (see `run_worker_first` in
// wrangler.toml). Static assets and the SPA fallback are served by the
// Cloudflare Assets platform, not this code.
const app = new Hono<AppEnv>();

const api = new Hono<AppEnv>();
api.route('/products', products);
api.route('/cart', cart);
api.route('/orders', orders);
api.route('/payments', payments);
api.route('/me', me);
api.route('/media', media);

app.route('/api', api);

// Any unmatched /api path -> JSON 404 (instead of falling through to the SPA).
app.all('/api/*', (c) => c.json({ error: 'API route not found' }, 404));

export default app;
