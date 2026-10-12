# VAYNOR.ZS — storefront

**VAYNOR** is a single-product e-commerce site for a woven gunmetal bracelet with a magnetic clasp. One storefront for customers, one admin panel for the shop owner. Pure static HTML/CSS/JS — deployable on GitHub Pages, optionally wired to Supabase for real products, orders and accounts.

> This repository was fully overhauled on 2026-10-12: new dark editorial design system, real catalogue, working cart → checkout → order-tracking flow, styled admin panel, generated product photography, mobile responsive CSS, promo codes, reviews, and an honest offline/demo mode so every page works with zero backend.

## Quick start

```bash
# local preview (any static server works)
python3 -m http.server 8000
# → open http://localhost:8000
```

No build step, no dependencies. To publish: push to GitHub → **Settings → Pages → Deploy from a branch → `main` / root**. `404.html` handles GitHub Pages 404s.

## Pages

| Storefront | Purpose |
|---|---|
| `index.html` | Hero, lookbook, story sections, intro splash |
| `shop.html` | Catalogue grid — search + category chips |
| `product.html?id=…` | Gallery, specs, perks, accordion, reviews + write-a-review |
| `cart.html` | Full bag page + slide-out mini-cart everywhere |
| `checkout.html` | Contact/delivery/payment form, promo codes, bKash/Nagad/COD, order confirmation |
| `orders.html` · `order-details.html?id=…` | Order history + status timeline + printable receipt |
| `wishlist.html` | Saved pieces (localStorage) |
| `account.html` · `addresses.html` | Profile, stats, saved addresses |
| `login.html` · `register.html` | Supabase auth (falls back to demo accounts) |
| `about.html` · `contact.html` | Story, FAQ, mailto/WhatsApp contact |
| `404.html` `error.html` `offline.html` | Utility pages |

| Admin (`/admin/`) | |
|---|---|
| `login.html` | Passcode gate — demo code **`VAYNOR-ADMIN`** (set in `js/config.js`) |
| `index.html` | Dashboard: revenue, open orders, catalogue health |
| `products.html` · `product-edit.html` | List, create, edit, hide |
| `orders.html` · `order-details.html` | Fulfilment status pipeline |
| `customers.html` `categories.html` `discounts.html` `payments.html` `reviews.html` `settings.html` | Ops screens — settings override brand tagline, hero headline, currency, shipping thresholds live |

## Architecture

```
css/    style.css (tokens+components) · responsive.css · admin.css
js/     config → data → db → ui → cart/wishlist/auth/shop/product/checkout/orders/admin
assets/ logo + images/ (product photography)
supabase/schema.sql
```

`js/db.js` is the single data layer. It tries Supabase first and **silently falls back** to `js/data.js` seeds + localStorage ("demo mode"), so:

- the storefront is fully browsable/purchasable with no backend,
- promo `VAYNOR10` works at checkout (10% off),
- admin sees every demo order placed from that browser,
- a badge in the admin header shows **Demo mode** vs **Supabase live**.

Product images live in `assets/images/` (AI-generated for the relaunch — replace with real studio shots before launch).

## Going live with Supabase

1. Open the project's **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
2. **Authentication → Providers**: enable Email (confirm-email is fine; the site handles the "check your inbox" state).
3. Upload real photos to a public Storage bucket and update each product's `images` array to the public URLs.
4. Point `js/config.js` at your project URL + publishable key. Publishable keys are safe in the browser — **never** the service_role key.
5. Place one order from the storefront; it lands in `public.orders`, visible to the signed-in buyer and (with the admin policy uncommented) to the shop owner.

Until step 1 happens, everything still works — that's the demo mode above.

## Editing the catalogue without Supabase

`js/data.js` is the seed catalogue (prices, copy, specs, reviews, promo codes). For runtime changes, use `/admin/` — edits persist per-browser as a demo layer.

## Known limits (deliberate)

- Payments are COD/manual bKash/Nagad instructions — plug in a gateway (e.g. SSLCommerz/amarpay) at `js/checkout.js` when ready.
- Admin "persistence" for products/categories/discounts is localStorage until tables are live; RLS keeps the public key read-mostly on purpose.
- Intro splash + animations respect `prefers-reduced-motion`.
