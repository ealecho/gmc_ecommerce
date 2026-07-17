-- Adds manual ordering for products on the storefront.
-- Lower sort_order shows first; ties fall back to created_at desc.

alter table products
  add column if not exists sort_order integer not null default 0;

-- Seed existing rows with a stable initial order based on current display order
-- (newest first), so admins start from a predictable baseline.
with ordered as (
  select id, row_number() over (order by created_at desc) as rn
  from products
)
update products p
set sort_order = ordered.rn
from ordered
where p.id = ordered.id
  and p.sort_order = 0;

drop index if exists products_active_idx;
create index if not exists products_active_sort_idx
  on products (is_active, sort_order asc, created_at desc);
