# Stripe setup (when you’re ready)

**You don’t need to provide Stripe API keys right now.** The checkout and webhook code is in place; payments will work once you complete this setup.

## Quick start: add your test keys

1. **Create a Stripe account** and turn **Test mode** ON in the [Dashboard](https://dashboard.stripe.com).
2. **Get your keys:** Dashboard → **Developers** → **API keys**. Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
3. **Webhook (for “payment complete” and bundle):**  
   - **Option A – local dev:** Install [Stripe CLI](https://stripe.com/docs/stripe-cli), run `stripe login` then `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copy the `whsec_...` signing secret it prints.  
   - **Option B – deployed:** Dashboard → **Developers** → **Webhooks** → **Add endpoint** → URL `https://your-domain.com/api/webhooks/stripe`, event `checkout.session.completed` → copy the **Signing secret**.
4. **Paste into `.env.local`** (create it from `.env.example` if needed). Replace the Stripe placeholders:

   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # paste your publishable key
   STRIPE_SECRET_KEY=sk_test_...                    # paste your secret key
   STRIPE_WEBHOOK_SECRET=whsec_...                  # paste from Stripe CLI or webhook endpoint
   ```

5. Restart the dev server. Checkout will redirect to Stripe; after payment the webhook will mark the order paid and trigger the bundle.

---

## Keeping Stripe in test mode (for development)

Use **Test mode** for all development and local testing so no real charges are made.

1. **Dashboard:** In [Stripe Dashboard](https://dashboard.stripe.com), ensure the **Test mode** toggle (top-right) is **ON**. The toggle shows “Test mode” when you’re in test mode.
2. **Keys:** Use only keys that start with `pk_test_` and `sk_test_` in `.env.local`. Never put `pk_live_` or `sk_live_` in your dev environment.
3. **Webhook:** When creating a webhook in the dashboard, stay in Test mode so the signing secret is for test events. When using Stripe CLI, `stripe listen` uses test mode by default.
4. **Check before going live:** When you eventually enable live payments, switch the dashboard to **Live mode**, create live keys and a live webhook, and use a separate env (e.g. production) with `pk_live_` / `sk_live_` and the live webhook secret.

**Test card numbers (no real charge):**

| Use case        | Card number            |
|-----------------|------------------------|
| Success         | `4242 4242 4242 4242`  |
| Card declined   | `4000 0000 0000 0002` |
| 3D Secure auth  | `4000 0025 0000 3155` |

Use any future expiry (e.g. 12/34), any 3-digit CVC, and any billing postal code. More: [Stripe test cards](https://docs.stripe.com/testing#cards).

---

## When you want to enable payments

1. **Create a Stripe account**  
   [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)  
   Leave the dashboard in **Test mode** (see above) while developing.

2. **Get your API keys**  
   Dashboard → **Developers** → **API keys**  
   - **Publishable key** (starts with `pk_test_` or `pk_live_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
   - **Secret key** (starts with `sk_test_` or `sk_live_`) → `STRIPE_SECRET_KEY`  
   Add these to `petportrait/.env.local`.

3. **Webhook for payment success**  
   Dashboard → **Developers** → **Webhooks** → **Add endpoint**  
   - **URL:** `https://your-domain.com/api/webhooks/stripe` (in dev you can use Stripe CLI to forward: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)  
   - **Events:** `checkout.session.completed`  
   - Copy the **Signing secret** (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET` in `.env.local`.

4. **Local testing with Stripe CLI**  
   Install [Stripe CLI](https://stripe.com/docs/stripe-cli), then:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Use the webhook signing secret printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## Env vars summary

| Variable | Where to get it |
|---------|------------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard (Test mode) → API keys → Publishable key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (Test mode) → API keys → Secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint (Test mode) → Signing secret (`whsec_...`), or from `stripe listen` in dev |

For local and staging, use only **test** keys and test webhook secrets so no real payments are processed.

## What works without Stripe

- Upload, style selection, generation, and preview (with watermarked image) work without Stripe.
- The **Purchase** button on the preview page goes to checkout; if Stripe is not configured, the checkout API returns an error and the checkout page can show “Stripe not configured yet” (see implementation).

## App behaviour

- **Checkout:** `/checkout?generationId=...` → enter email → redirect to Stripe Checkout ($10).
- **After payment:** Stripe redirects to `/order/success?session_id=...`.
- **Webhook:** `POST /api/webhooks/stripe` receives `checkout.session.completed`, updates the order and generation, and will trigger bundle generation (Task 16).

## References

- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Stripe webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
