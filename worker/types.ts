import type { R2Bucket } from '@cloudflare/workers-types';

export interface Bindings {
  DATABASE_URL: string;
  NEON_AUTH_ISSUER?: string;
  NEON_AUTH_AUDIENCE?: string;
  MEDIA: R2Bucket;
}

export type AppEnv = {
  Bindings: Bindings;
};
