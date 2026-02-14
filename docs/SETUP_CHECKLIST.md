# Setup checklist – what you need to configure

Use this as the single place to track what’s set up and what’s left. More UI and feature tasks will be added later; this doc stays the source for **environment and service setup** only.

---

## 1. Supabase (required for app to work)

**Status:** [ ] Done

- Create project, run migration, create Storage buckets `uploads` and `deliverables`.
- **Detail:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Without this: upload, generate, and storage features will not work.

---

## 2. Stripe (required for payments)

**Status:** [ ] Done (optional until you enable payments)

- Create account, get API keys, configure webhook for `checkout.session.completed`.
- **Detail:** [STRIPE_SETUP.md](STRIPE_SETUP.md)
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Without this: checkout returns “Stripe not configured”; upload → generate → preview still works.

---

## 3. App URL and download tokens

**Status:** [ ] Done (optional in dev)

- **`NEXT_PUBLIC_APP_URL`** – e.g. `https://petportrait.shop`. Used in emails and redirects. In dev you can leave unset (fallback to localhost).
- **`DOWNLOAD_TOKEN_SECRET`** – Server-only secret for signing download links. Use a strong random value in production; optional in dev (fallback exists).

---

## 4. Email (Resend) – optional

**Status:** [ ] Done

- **Detail:** Sign up at [Resend](https://resend.com), get API key.
- **Env:** `RESEND_API_KEY`. Optional: `RESEND_FROM_EMAIL` (defaults to Resend onboarding address).

Without this: delivery and “resend download link” emails are skipped (logged only). Rest of the app works.

---

## 5. AI image generation (ImagineAPI) – optional

**Status:** [ ] Done

- **Env:** `IMAGINE_API_KEY`

Without this: generation uses a stub that completes after ~2s with the original image as placeholder. Good for UI and flow testing.

---

## 6. Style example images – manual

**Status:** [ ] Done

- One example image per art style (5 total) so the style selector shows a preview.
- **Where:** `petportrait/public/style-examples/`  
- **Filenames:** `renaissance.jpg`, `baroque.jpg`, `victorian.jpg`, `regal.jpg`, `belle_epoque.jpg`
- **Detail:** [../public/style-examples/README.md](../public/style-examples/README.md)

Slots and API are in place; you add the image files when ready.

---

## Env summary (all in `.env.local`)

| Variable | Required for | Note |
|----------|----------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | From project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | From project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | From project Settings → API (secret) |
| `STRIPE_SECRET_KEY` | Payments | Stripe Dashboard → API keys |
| `STRIPE_WEBHOOK_SECRET` | Payments | Webhook endpoint or `stripe listen` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | Stripe Dashboard → API keys |
| `NEXT_PUBLIC_APP_URL` | Emails / redirects | e.g. `https://petportrait.shop` |
| `DOWNLOAD_TOKEN_SECRET` | Download links | Strong secret in production |
| `RESEND_API_KEY` | Email | Resend dashboard |
| `IMAGINE_API_KEY` | Real AI generation | ImagineAPI (or leave unset for stub) |

Template: copy from `petportrait/.env.example`.

---

## After setup: what works

- **Minimal (Supabase only):** Upload, style selection, generate (stub), preview, create order in DB. No payment, no email, no real AI.
- **+ Stripe:** Full checkout and webhook; bundle generation and order delivered.
- **+ Resend:** Delivery email and order-lookup resend email.
- **+ ImagineAPI:** Real Midjourney-style generation instead of stub.

---

## 7. Health check and production hardening

**Status:** [ ] Done (optional for local dev)

- **GET /api/health** – Returns 200 if required env (Supabase URL + service role key) are set; 503 with `{ ok: false, missing: [...] }` otherwise. Use for deployment or load balancer health checks.
- **Rate limiting** – POST `/api/upload`, `/api/generate`, `/api/checkout`, `/api/order-lookup` are limited per IP (in-memory; see limits in `lib/rate-limit.ts`). For multi-instance production, consider Redis (e.g. Upstash) and document in this checklist.
- **Security headers** – Middleware sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` on all responses.
- **Body size** – JSON APIs (generate, checkout, order-lookup) reject bodies larger than 64KB (413).
- **DOWNLOAD_TOKEN_SECRET** – Required in production (no dev fallback); see §3.

---

## 8. Legal pages (Terms, Privacy, Refunds, Commercial)

**Status:** [x] In place

- **Routes:** `/terms`, `/privacy`, `/refunds`, `/commercial`. Footer links to all four.
- Content is drafted for petportrait.shop (digital portraits, Stripe, Supabase, Resend). Inspired by Fable (fable.surrealium.world); their policy pages could not be fetched for direct import. You may replace any section with Fable’s exact wording if you obtain it.

---

## Later: UI and other tasks

This doc is only for **setup and configuration**. For new UI tasks, feature work, or design changes, use separate specs or the implementation plan; refer back here when you need to confirm what’s configured (Supabase, Stripe, Resend, style examples, env).
