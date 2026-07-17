import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { getSql, mapProduct } from '../lib/db.js';
import { badRequest, notFound, toErrorResponse } from '../lib/errors.js';
import { deleteMediaByUrl } from './media.js';
import { AppEnv } from '../types.js';

const createSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const productFromBody = (body: any) => {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const image = String(body.image || '').trim();
  const price = Number(body.price);
  const originalPrice = body.originalPrice === '' || body.originalPrice == null ? null : Number(body.originalPrice);

  if (!name || !description || !image || !Number.isFinite(price) || price < 0) {
    throw badRequest('Product name, description, image, and valid price are required.');
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price)) {
    throw badRequest('Original price must be greater than or equal to price.');
  }

  return {
    name,
    slug: body.slug ? createSlug(String(body.slug)) : createSlug(name),
    description,
    priceCents: Math.round(price),
    originalPriceCents: originalPrice === null ? null : Math.round(originalPrice),
    image,
    isNew: Boolean(body.isNew),
    isActive: body.isActive !== false,
  };
};

const products = new Hono<AppEnv>();

products.get('/', async (c) => {
  try {
    const sql = getSql(c.env);
    const includeInactive = c.req.query('includeInactive') === 'true';

    if (includeInactive) {
      await requireAdmin(c);
    }

    const rows = includeInactive
      ? await sql`select * from products order by sort_order asc, created_at desc`
      : await sql`select * from products where is_active = true order by sort_order asc, created_at desc`;

    return c.json({ products: rows.map(mapProduct) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

products.post('/', async (c) => {
  try {
    await requireAdmin(c);
    const sql = getSql(c.env);
    const product = productFromBody(await c.req.json());

    // New products append to the end of the manual order.
    const [{ next_order: nextOrder }] = await sql`
      select coalesce(max(sort_order), 0) + 1 as next_order from products
    `;

    const [created] = await sql`
      insert into products (name, slug, description, price_cents, original_price_cents, image_url, is_new, is_active, sort_order)
      values (
        ${product.name},
        ${product.slug},
        ${product.description},
        ${product.priceCents},
        ${product.originalPriceCents},
        ${product.image},
        ${product.isNew},
        ${product.isActive},
        ${nextOrder}
      )
      returning *
    `;

    return c.json({ product: mapProduct(created) }, 201);
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

// Persist a manual ordering of products. Body: { ids: [id, id, ...] } in the
// desired display order. sort_order is reassigned 1..N to match the array.
products.patch('/reorder', async (c) => {
  try {
    await requireAdmin(c);
    const sql = getSql(c.env);
    const body = await c.req.json();
    const ids = Array.isArray(body.ids) ? body.ids : null;

    if (!ids || ids.length === 0) {
      throw badRequest('An ordered array of product ids is required.');
    }

    if (ids.some((id: any) => typeof id !== 'string' || !id)) {
      throw badRequest('Product ids must be non-empty strings.');
    }

    // Build a parameterized VALUES list mapping id -> position, then update in
    // a single round-trip. Placeholders are numbered ($1, $2, ...) so values
    // are always sent safely as bind parameters (no string interpolation).
    const tuples = ids.map((_: any, index: number) => `($${index * 2 + 1}::uuid, $${index * 2 + 2}::int)`);
    const params = ids.flatMap((id: string, index: number) => [id, index + 1]);

    const updateSql = `
      update products as p
      set sort_order = v.position, updated_at = now()
      from (values ${tuples.join(', ')}) as v(id, position)
      where p.id = v.id
    `;

    await sql.query(updateSql, params);

    const rows = await sql`select * from products order by sort_order asc, created_at desc`;
    return c.json({ products: rows.map(mapProduct) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

const updateProductFromBody = (body: any) => {
  const name = String(body.name || '').trim();
  const slug = String(body.slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const description = String(body.description || '').trim();
  const image = String(body.image || '').trim();
  const price = Number(body.price);
  const originalPrice = body.originalPrice === '' || body.originalPrice == null ? null : Number(body.originalPrice);

  if (!name || !slug || !description || !image || !Number.isFinite(price) || price < 0) {
    throw badRequest('Product name, slug, description, image, and valid price are required.');
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price)) {
    throw badRequest('Original price must be greater than or equal to price.');
  }

  return {
    name,
    slug,
    description,
    priceCents: Math.round(price),
    originalPriceCents: originalPrice === null ? null : Math.round(originalPrice),
    image,
    isNew: Boolean(body.isNew),
    isActive: body.isActive !== false,
  };
};

products.delete('/:id', async (c) => {
  try {
    await requireAdmin(c);
    const sql = getSql(c.env);
    const id = c.req.param('id');

    const [deleted] = await sql`delete from products where id = ${id} returning *`;
    if (!deleted) {
      throw notFound('Product not found');
    }

    // Remove the associated R2 image (no-op for external URLs).
    await deleteMediaByUrl(c.env, deleted.image_url);

    return c.json({ product: mapProduct(deleted) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

products.patch('/:id', async (c) => {
  try {
    await requireAdmin(c);
    const sql = getSql(c.env);
    const id = c.req.param('id');
    const product = updateProductFromBody(await c.req.json());

    // Capture the existing image so we can clean up R2 if it gets replaced.
    const [existing] = await sql`select image_url from products where id = ${id}`;
    if (!existing) {
      throw notFound('Product not found');
    }

    const [updated] = await sql`
      update products set
        name = ${product.name},
        slug = ${product.slug},
        description = ${product.description},
        price_cents = ${product.priceCents},
        original_price_cents = ${product.originalPriceCents},
        image_url = ${product.image},
        is_new = ${product.isNew},
        is_active = ${product.isActive},
        updated_at = now()
      where id = ${id}
      returning *
    `;

    if (!updated) {
      throw notFound('Product not found');
    }

    // If the image changed, delete the old managed R2 object (no-op otherwise).
    if (existing.image_url !== updated.image_url) {
      await deleteMediaByUrl(c.env, existing.image_url);
    }

    return c.json({ product: mapProduct(updated) });
  } catch (error) {
    return toErrorResponse(c, error);
  }
});

export default products;
