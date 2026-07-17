-- Mark stored monetary values as whole Kenyan shillings.
--
-- The integer columns are still named *_cents for compatibility with the app
-- code and earlier schema, but values are treated as whole KES amounts.
-- This migration intentionally does not convert existing seeded values.

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

insert into schema_migrations (id)
values ('003_kes_currency')
on conflict (id) do nothing;
