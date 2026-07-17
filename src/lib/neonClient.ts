import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL;

export const neonClient = authUrl && dataApiUrl
  ? createClient({
      auth: {
        adapter: BetterAuthReactAdapter(),
        url: authUrl,
      },
      dataApi: {
        url: dataApiUrl,
      },
    })
  : null;

export const authClient = neonClient?.auth ?? null;
