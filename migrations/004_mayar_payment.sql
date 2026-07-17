-- Add Mayar payment fields to orders so we can track the hosted payment
-- request created for each order and reconcile it via webhook.
--
-- payment_provider   : which gateway created the payment (currently 'mayar')
-- payment_id         : Mayar request-payment id (data.id from create response)
-- payment_transaction_id : Mayar transactionId (data.transactionId)
-- payment_link       : hosted checkout URL the customer is redirected to
-- paid_at            : timestamp the payment.received webhook marked it paid
--
-- Guarded by schema_migrations so it is safe to re-run.

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from schema_migrations where id = '004_mayar_payment') then
    raise notice 'Migration 004_mayar_payment already applied; skipping.';
    return;
  end if;

  alter table orders
    add column if not exists payment_provider text,
    add column if not exists payment_id text,
    add column if not exists payment_transaction_id text,
    add column if not exists payment_link text,
    add column if not exists paid_at timestamptz;

  create index if not exists orders_payment_transaction_idx
    on orders (payment_transaction_id);

  insert into schema_migrations (id) values ('004_mayar_payment');
end $$;
