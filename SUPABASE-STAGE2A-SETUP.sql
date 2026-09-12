-- Magic Dragon Pin DEV — Stage 2A Reference Snapshot
-- Run once in Supabase SQL Editor for the DEV project.
-- Operational tables (Sunday reports, deliveries, invoices, payments) are intentionally NOT created here.

create table if not exists public.md_reference_products (
  id text primary key,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.md_reference_aliases (
  alias_key text primary key,
  product_id text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.md_reference_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.md_reference_products enable row level security;
alter table public.md_reference_aliases enable row level security;
alter table public.md_reference_settings enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on table public.md_reference_products to authenticated;
grant select, insert, update on table public.md_reference_aliases to authenticated;
grant select, insert, update on table public.md_reference_settings to authenticated;

do $$ begin
  create policy "md_ref_products_authenticated_select" on public.md_reference_products for select to authenticated using (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "md_ref_products_authenticated_insert" on public.md_reference_products for insert to authenticated with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "md_ref_products_authenticated_update" on public.md_reference_products for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "md_ref_aliases_authenticated_select" on public.md_reference_aliases for select to authenticated using (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "md_ref_aliases_authenticated_insert" on public.md_reference_aliases for insert to authenticated with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "md_ref_aliases_authenticated_update" on public.md_reference_aliases for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "md_ref_settings_authenticated_select" on public.md_reference_settings for select to authenticated using (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "md_ref_settings_authenticated_insert" on public.md_reference_settings for insert to authenticated with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "md_ref_settings_authenticated_update" on public.md_reference_settings for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

-- Optional verification after setup:
select 'Stage 2A ready' as status;
