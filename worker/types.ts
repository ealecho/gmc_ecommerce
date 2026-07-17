import type { R2Bucket } from '@cloudflare/workers-types';

export interface Bindings {
  DATABASE_URL: string;
  NEON_AUTH_ISSUER?: string;
  NEON_AUTH_AUDIENCE?: string;
  MEDIA: R2Bucket;
  // Mayar payment gateway.
  MAYAR_API_KEY?: string;
  // 'production' uses api.mayar.id; anything else (default) uses sandbox api.mayar.club.
  MAYAR_ENV?: string;
  // Optional explicit base URL override; wins over MAYAR_ENV.
  MAYAR_API_URL?: string;
  // Shared secret token appended to the webhook URL to authenticate callbacks.
  MAYAR_WEBHOOK_TOKEN?: string;
  // Absolute origin of the deployed site, used to build redirect/return URLs.
  PUBLIC_BASE_URL?: string;
}

export type AppEnv = {
  Bindings: Bindings;
};
