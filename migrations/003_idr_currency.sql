-- Migrate stored monetary values from USD cents to whole IDR rupiah.
--
-- Background: columns named *_cents previously held US dollars in cents
-- (e.g. 8900 = $89.00). We now treat these columns as whole Indonesian
-- rupiah (no sub-unit). Conversion: dollars = cents / 100, then
-- rupiah = round(dollars * 17500).
--
-- After this migration every *_cents column holds an integer rupiah amount.
-- This migration is idempotent-guarded: it only runs while the marker row in
-- schema_migrations is absent, so re-running will not double-convert.

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

do $$
declare
  rate numeric := 17500;
begin
  if exists (select 1 from schema_migrations where id = '003_idr_currency') then
    raise notice 'Migration 003_idr_currency already applied; skipping.';
    return;
  end if;

  update products set
    price_cents = round(price_cents / 100.0 * rate),
    original_price_cents = case
      when original_price_cents is null then null
      else round(original_price_cents / 100.0 * rate)
    end;

  update orders set
    subtotal_cents = round(subtotal_cents / 100.0 * rate),
    shipping_cents = round(shipping_cents / 100.0 * rate),
    total_cents = round(total_cents / 100.0 * rate);

  update order_items set
    price_cents = round(price_cents / 100.0 * rate);

  insert into schema_migrations (id) values ('003_idr_currency');
end $$;
