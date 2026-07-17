import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Bindings } from '../types';

export const getSql = (env: Bindings): NeonQueryFunction<false, false> => {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Neon database access.');
  }
  return neon(databaseUrl);
};

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  original_price_cents: number | null;
  image_url: string;
  is_new: boolean;
  is_active: boolean;
  sort_order: number;
}

export const mapProduct = (product: ProductRow | any) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: product.price_cents,
  originalPrice: product.original_price_cents ? product.original_price_cents : null,
  image: product.image_url,
  isNew: product.is_new,
  isActive: product.is_active,
  sortOrder: product.sort_order,
});

export const mapCartItem = (item: any) => ({
  ...mapProduct(item),
  quantity: item.quantity,
});
