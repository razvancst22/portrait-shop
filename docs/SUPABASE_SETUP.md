# Supabase setup (Phase 1)

**Do these steps before using the app (e.g. before Task 6).** Until Supabase is configured, the app cannot use the database or storage.

## 1. Create a Supabase project

1. Go to [Supabase](https://supabase.com) and create a project (or use an existing one).
2. In the project: **Settings** → **API** — note:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; server-only)

Add these to `petportrait/.env.local`.

## 2. Run the migration

1. In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Open `petportrait/supabase/migrations/00001_phase1_schema.sql` and copy its contents.
3. Paste into the SQL Editor and run the script.

This creates:

- **generations** – AI generation jobs (session_id, art_style, prompt, preview/final URLs, status).
- **orders** – Guest orders (order_number, customer_email, total_usd, payment_status, status).
- **order_items** – Line items (order_id, generation_id, product_type, unit_price_usd).
- **order_deliverables** – Bundle files per order (order_id, asset_type, file_path).

No `pricing_strategy` or `artelo_*` tables in Phase 1. Phase 1 uses a **fixed $10** digital bundle (see `lib/constants.ts`).

## 3. Storage buckets

Create two **private** buckets in the Dashboard → **Storage**:

1. **`uploads`** – Customer pet photo uploads and temporary generation assets (e.g. watermarked previews).
2. **`deliverables`** – Final bundle files (4:5, 9:16, 4:4, 3:4) after purchase.

Use the exact names above; the app references them in `lib/constants.ts`. Access is via the service role (server-side) or signed URLs for downloads.

## 4. Authentication (optional)

To use **Log in** / **Sign up** on the site:

1. In Supabase Dashboard → **Authentication** → **Providers**, ensure **Email** is enabled (email/password and optional "Confirm email").
2. If you enable "Confirm email", users must click the link in the confirmation email; the app uses `/auth/callback` as the redirect after confirmation.
3. No extra env vars: the app uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for auth.

---

## Optional: Supabase CLI

If you use the Supabase CLI and have linked the project:

```bash
supabase db push
```

Otherwise run the migration file manually in the SQL Editor as in step 2.
