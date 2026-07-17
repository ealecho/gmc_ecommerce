import { Hono } from 'hono';
import { requireUser } from '../lib/auth.js';
import { toErrorResponse } from '../lib/errors.js';

import { AppEnv } from '../types.js';

const me = new Hono<AppEnv>();

me.get('/', async (c) => {
  try {
    const { user, profile } = await requireUser(c);
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
      },
    });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

export default me;
