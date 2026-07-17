import { Hono } from 'hono';
import { requireUser } from '../lib/auth.js';
import { getSql, mapCartItem } from '../lib/db.js';
import { badRequest, notFound, toErrorResponse } from '../lib/errors.js';

import { AppEnv } from '../types.js';

const parsePositiveInteger = (value: any, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const readCart = async (sql: any, userId: string) => {
  const items = await sql`
    select
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price_cents,
      p.original_price_cents,
      p.image_url,
      p.is_new,
      p.is_active,
      ci.quantity
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.user_id = ${userId}
    order by ci.created_at asc
  `;

  return items.map(mapCartItem);
};

const ensureCart = async (sql: any, userId: string) => {
  await sql`insert into carts (user_id) values (${userId}) on conflict (user_id) do nothing`;
};

const cart = new Hono<AppEnv>();

cart.get('/', async (c) => {
  try {
    const { user } = await requireUser(c);
    const sql = getSql(c.env);
    await ensureCart(sql, user.id);
    return c.json({ items: await readCart(sql, user.id) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

cart.put('/', async (c) => {
  try {
    const { user } = await requireUser(c);
    const sql = getSql(c.env);
    await ensureCart(sql, user.id);

    const body = await c.req.json();
    const productId = String(body.productId || '');
    const quantity = parsePositiveInteger(body.quantity);

    const [product] = await sql`select id from products where id = ${productId} and is_active = true`;
    if (!product) {
      throw notFound('Product not found');
    }

    await sql`
      insert into cart_items (user_id, product_id, quantity)
      values (${user.id}, ${productId}, ${quantity})
      on conflict (user_id, product_id) do update set
        quantity = excluded.quantity,
        updated_at = now()
    `;
    await sql`update carts set updated_at = now() where user_id = ${user.id}`;

    return c.json({ items: await readCart(sql, user.id) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

cart.patch('/', async (c) => {
  try {
    const { user } = await requireUser(c);
    const sql = getSql(c.env);
    await ensureCart(sql, user.id);

    const body = await c.req.json();
    const productId = String(body.productId || '');
    const delta = Number(body.delta);

    if (!Number.isInteger(delta) || delta === 0) {
      throw badRequest('A non-zero integer delta is required.');
    }

    if (delta > 0) {
      const [product] = await sql`select id from products where id = ${productId} and is_active = true`;
      if (!product) {
        throw notFound('Product not found');
      }

      await sql`
        insert into cart_items (user_id, product_id, quantity)
        values (${user.id}, ${productId}, ${delta})
        on conflict (user_id, product_id) do update set
          quantity = cart_items.quantity + excluded.quantity,
          updated_at = now()
      `;
    } else {
      await sql`
        update cart_items
        set quantity = quantity + ${delta}, updated_at = now()
        where user_id = ${user.id} and product_id = ${productId}
      `;
      await sql`delete from cart_items where user_id = ${user.id} and product_id = ${productId} and quantity <= 0`;
    }

    await sql`update carts set updated_at = now() where user_id = ${user.id}`;
    return c.json({ items: await readCart(sql, user.id) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

cart.delete('/', async (c) => {
  try {
    const { user } = await requireUser(c);
    const sql = getSql(c.env);
    await ensureCart(sql, user.id);

    const productId = c.req.query('productId') ? String(c.req.query('productId')) : null;

    if (productId) {
      await sql`delete from cart_items where user_id = ${user.id} and product_id = ${productId}`;
    } else {
      await sql`delete from cart_items where user_id = ${user.id}`;
    }

    await sql`update carts set updated_at = now() where user_id = ${user.id}`;
    return c.json({ items: await readCart(sql, user.id) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

export default cart;
