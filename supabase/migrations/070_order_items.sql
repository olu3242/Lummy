-- Migration 070: Create order_items table and add missing customer columns
-- order_items links orders to products for product name tracking in the dashboard

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  product_name   text,
  quantity       integer not null default 1,
  price_at_time  numeric(12, 2) not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_order_items_order_id
  on public.order_items(order_id);

create index if not exists idx_order_items_product_id
  on public.order_items(product_id)
  where product_id is not null;

alter table public.order_items enable row level security;

create policy "order_items_org_access" on public.order_items
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.organization_id in (
          select organization_id from public.organization_members
          where user_id = auth.uid()
        )
    )
  );
