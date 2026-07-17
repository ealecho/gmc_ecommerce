create extension if not exists pgcrypto;

create table if not exists profiles (
  id text primary key,
  email text unique not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  price_cents integer not null check (price_cents >= 0),
  original_price_cents integer check (original_price_cents is null or original_price_cents >= price_cents),
  image_url text not null,
  is_new boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists carts (
  user_id text primary key references profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  user_id text not null references carts(user_id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete restrict,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'cancelled')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_details jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists products_active_idx on products (is_active, created_at desc);
create index if not exists cart_items_user_idx on cart_items (user_id);
create index if not exists orders_user_created_idx on orders (user_id, created_at desc);
create index if not exists order_items_order_idx on order_items (order_id);

insert into products (name, slug, description, price_cents, original_price_cents, image_url, is_new, is_active)
values
  ('SHADOW DRIP', 'shadow-drip', 'A sleek, minimalistic hoodie with dark tones and subtle reflective accents for an effortless street vibe.', 8900, 12000, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', true, true),
  ('URBAN PHANTOM', 'urban-phantom', 'Urban Phantom - A bold, oversized hoodie with edgy graphics and a stealthy aesthetic inspired by city nights.', 8900, 12000, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', true, true),
  ('NEON REBELLION', 'neon-rebellion', 'A statement piece with vibrant neon details and rebellious street art influences for a standout look.', 8900, 12000, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=800&auto=format&fit=crop', true, true),
  ('MIDNIGHT RUNNER', 'midnight-runner', 'Lightweight and breathable jacket designed for late-night city runs and urban exploration.', 9500, 13000, 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop', true, true),
  ('CONCRETE JUNGLE', 'concrete-jungle', 'Heavyweight cotton tee featuring an abstract brutalist architectural print on the back.', 4500, 6500, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop', false, true),
  ('GRAFFITI SOUL', 'graffiti-soul', 'Classic fit hoodie with custom hand-drawn graffiti style lettering and premium embroidery.', 11000, 15000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', true, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  original_price_cents = excluded.original_price_cents,
  image_url = excluded.image_url,
  is_new = excluded.is_new,
  is_active = excluded.is_active,
  updated_at = now();
