-- ============================================================
-- VAYNOR × Supabase — schema for the storefront
-- Run this in Supabase Studio → SQL Editor of project
-- hddphtxjtcjqqeouxqmh (or a fresh project — then update
-- js/config.js with the new URL + publishable key).
--
-- Until these tables have data, the site runs in demo mode
-- (seed catalogue + localStorage) — no error states, no blanks.
-- ============================================================

-- ---------- products ----------
create table if not exists public.products (
  id            text primary key,
  name          text not null,
  category      text default 'Bracelets',
  price         numeric not null default 0 check (price >= 0),
  compare_at_price numeric,
  stock         integer not null default 0,
  badge         text,
  image_url     text,
  images        text[] default '{}',
  short_description text,
  description   text,
  features      text[] default '{}',
  specs         jsonb default '{}'::jsonb,
  rating        numeric default 0,
  review_count  integer default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.products enable row level security;
create policy "products: public read"  on public.products for select using (true);
-- writes stay service-role only (the browser key must never write).

-- ---------- orders (one row per order, items as JSONB) ----------
create table if not exists public.orders (
  id          text primary key,            -- e.g. VY12345678
  created_at  timestamptz not null default now(),
  user_email  text,
  customer    jsonb not null,              -- {name,phone,email,address,city,area,notes}
  items       jsonb not null,              -- [{id,name,price,qty,img}]
  subtotal    numeric not null,
  discount    numeric not null default 0,
  promo       text,
  shipping    numeric not null default 0,
  total       numeric not null,
  payment     text not null default 'Cash on delivery',
  status      text not null default 'Received'
      check (status in ('Received','Packed','Shipped','Delivered','Cancelled'))
);

alter table public.orders enable row level security;
create policy "orders: guests can place"     on public.orders for insert  to anon, authenticated with check (true);
create policy "orders: buyers see their own" on public.orders for select to authenticated
  using (user_email = (select auth.jwt() ->> 'email'));
-- Admin read-all access: either use the service-role key server-side,
-- or add a policy for your admin account's email:
-- create policy "orders: admin reads" on public.orders for select to authenticated
--   using ((select auth.jwt() ->> 'email') = 'you@vaynor.shop');

-- ---------- reviews ----------
create table if not exists public.reviews (
  id         bigint generated always as identity primary key,
  product    text references public.products(id) on delete cascade,
  author     text not null,
  rating     integer not null check (rating between 1 and 5),
  text       text not null,
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
create policy "reviews: public read approved" on public.reviews for select using (approved = true);
create policy "reviews: anyone can submit"    on public.reviews for insert  to anon, authenticated with check (true);

-- ---------- seed the hero product ----------
insert into public.products (id, name, category, price, stock, badge, images, short_description, description, features, specs, is_active)
values (
  'vaynor-bracelet',
  'VAYNOR Bracelet',
  'Bracelets',
  2490, 42, 'Signature',
  -- Upload these to a public Supabase Storage bucket named `vaynor`
  -- and replace with the public URLs, or keep relative paths served by the site:
  array['assets/images/bracelet-main.jpg','assets/images/bracelet-clasp.jpg','assets/images/bracelet-detail.jpg','assets/images/bracelet-box.jpg'],
  'A dark, understated woven bracelet with a neodymium magnetic clasp.',
  'The VAYNOR Bracelet is our first and only piece — woven 316L stainless steel with a gunmetal PVD finish and a flush magnetic closure.',
  array['Neodymium magnetic clasp','Woven 316L stainless steel','Tapered 6 mm profile','Splash-proof core','Matte presentation box'],
  '{"Material":"316L stainless steel, gunmetal PVD","Length":"19 cm","Weight":"24 g","Clasp":"Neodymium magnetic"}'::jsonb,
  true
)
on conflict (id) do nothing;
