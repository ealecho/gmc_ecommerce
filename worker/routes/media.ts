import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { badRequest, notFound, toErrorResponse } from '../lib/errors.js';

import { AppEnv, Bindings } from '../types.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Map allowed mime types to file extensions. Keeps uploads to known image
// formats and prevents arbitrary content being stored/served.
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

const getBucket = (env: Bindings) => {
  if (!env.MEDIA) {
    throw new Error('MEDIA R2 bucket binding is not configured.');
  }
  return env.MEDIA;
};

const randomKey = (ext: string) => {
  // crypto.randomUUID is available in the Workers runtime.
  const id = crypto.randomUUID();
  return `products/${id}.${ext}`;
};

// Given a stored image value, return the R2 object key if (and only if) it is a
// media URL we manage (i.e. served via /api/media/products/...). External URLs
// or anything outside the products/ prefix return null so we never delete
// objects we don't own.
export const mediaKeyFromUrl = (value: any) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/\/api\/media\/(products\/[A-Za-z0-9._-]+)$/);
  return match ? match[1] : null;
};

// Best-effort delete of a managed media object. Never throws: image cleanup
// must not block the primary product update/delete operation.
export const deleteMediaByUrl = async (env: Bindings, value: any) => {
  try {
    const key = mediaKeyFromUrl(value);
    if (!key || !env.MEDIA) return;
    await env.MEDIA.delete(key);
  } catch (error) {
    console.error('Failed to delete media object:', error);
  }
};

const media = new Hono<AppEnv>();

// Upload a single image (admin only). Accepts multipart/form-data with a
// `file` field. Returns the public URL the storefront should use.
media.post('/', async (c) => {
  try {
    await requireAdmin(c);
    const bucket = getBucket(c.env);

    const form = await c.req.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      throw badRequest('A file field is required.');
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      throw badRequest('Unsupported file type. Use JPEG, PNG, WebP, AVIF, or GIF.');
    }

    if (file.size > MAX_BYTES) {
      throw badRequest('File is too large. Maximum size is 5 MB.');
    }

    const key = randomKey(ext);
    await bucket.put(key, file.stream() as any, {
      httpMetadata: { contentType: file.type },
    });

    return c.json({ url: `/api/media/${key}`, key }, 201);
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

// Public read endpoint so uploaded images can be served via the Worker.
// Path is everything after /api/media/, e.g. products/<uuid>.jpg
media.get('/*', async (c) => {
  try {
    const bucket = getBucket(c.env);
    const key = c.req.path.replace(/^\/api\/media\//, '');

    if (!key || key.includes('..')) {
      throw badRequest('Invalid media key.');
    }

    const object = await bucket.get(key);
    if (!object) {
      throw notFound('Media not found');
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers as any);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body as any, { headers });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

export default media;
