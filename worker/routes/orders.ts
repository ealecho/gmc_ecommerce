import { Hono } from 'hono';
import { requireUser } from '../lib/auth.js';
import { getSql } from '../lib/db.js';
import { badRequest, toErrorResponse } from '../lib/errors.js';

import { AppEnv } from '../types.js';

// Flat shipping fee in whole IDR rupiah.
const SHIPPING_CENTS = 262500;

const readOrders = async (sql: any, userId: string) => {
  const orders = await sql`
    select *
    from orders
    where user_id = ${userId}
    order by created_at desc
  `;

  if (orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order: any) => order.id);
  const items = await sql`
    select *
    from order_items
    where order_id = any(${orderIds})
    order by created_at asc
  `;

  return orders.map((order: any) => ({
    id: order.id,
    status: order.status,
    email: order.email,
    subtotal: order.subtotal_cents,
    shipping: order.shipping_cents,
    total: order.total_cents,
    shippingDetails: order.shipping_details,
    createdAt: order.created_at,
    items: items
      .filter((item: any) => item.order_id === order.id)
      .map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        price: item.price_cents,
        quantity: item.quantity,
      })),
  }));
};

const validateShipping = (body: any, fallbackEmail: string) => {
  const shippingDetails: any = {
    email: String(body.email || fallbackEmail || '').trim(),
    firstName: String(body.firstName || '').trim(),
    lastName: String(body.lastName || '').trim(),
    address: String(body.address || '').trim(),
    city: String(body.city || '').trim(),
    postalCode: String(body.postalCode || '').trim(),
    newsletter: Boolean(body.newsletter),
  };

  const missing = ['email', 'firstName', 'lastName', 'address', 'city', 'postalCode'].filter(
    (key) => !shippingDetails[key],
  );

  if (missing.length > 0) {
    throw badRequest(`Missing checkout fields: ${missing.join(', ')}`);
  }

  return shippingDetails;
};

const orders = new Hono<AppEnv>();

orders.get('/', async (c) => {
  try {
    const { user } = await requireUser(c);
    const sql = getSql(c.env);
    return c.json({ orders: await readOrders(sql, user.id) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

orders.post('/', async (c) => {
  try {
    const { user } = await requireUser(c);
    const sql = getSql(c.env);
    const shippingDetails = validateShipping(await c.req.json(), user.email);

    const [order] = await sql`
      with cart_snapshot as (
        select ci.product_id, ci.quantity, p.name, p.price_cents, p.slug
        from cart_items ci
        join products p on p.id = ci.product_id
        where ci.user_id = ${user.id}
        order by ci.created_at asc
        for update
      ),
      totals as (
        select
          coalesce(sum(price_cents * quantity), 0)::integer as subtotal_cents,
          -- Charge shipping only when the cart contains at least one
          -- non-test product. A cart of only 'test-product' ships free so
          -- production payment tests can pay the exact item price.
          bool_or(slug <> 'test-product') as has_shippable
        from cart_snapshot
      ),
      created_order as (
        insert into orders (user_id, email, status, subtotal_cents, shipping_cents, total_cents, shipping_details)
        select
          ${user.id},
          ${shippingDetails.email},
          'paid',
          totals.subtotal_cents,
          case when totals.subtotal_cents > 0 and totals.has_shippable then ${SHIPPING_CENTS} else 0 end,
          totals.subtotal_cents + case when totals.subtotal_cents > 0 and totals.has_shippable then ${SHIPPING_CENTS} else 0 end,
          cast(${JSON.stringify(shippingDetails)} as jsonb)
        from totals
        where totals.subtotal_cents > 0
        returning *
      ),
      created_items as (
        insert into order_items (order_id, product_id, product_name, price_cents, quantity)
        select created_order.id, cart_snapshot.product_id, cart_snapshot.name, cart_snapshot.price_cents, cart_snapshot.quantity
        from created_order
        cross join cart_snapshot
        returning id
      ),
      cleared_cart as (
        delete from cart_items
        where user_id = ${user.id}
        and exists (select 1 from created_order)
      )
      select * from created_order
    `;

    if (!order) {
      throw badRequest('Cart is empty');
    }

    return c.json(
      {
        order: {
          id: order.id,
          status: order.status,
          total: order.total_cents,
          createdAt: order.created_at,
        },
      },
      201,
    );
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

export default orders;
