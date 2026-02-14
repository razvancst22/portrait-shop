# Stripe setup (when you’re ready)

**You don’t need to provide Stripe API keys right now.** The checkout and webhook code is in place; payments will work once you complete this setup.

## When you want to enable payments

1. **Create a Stripe account**  
   [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)  
   Use **Test mode** (toggle in the dashboard) while developing.

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
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API keys → Publishable key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint → Signing secret, or from `stripe listen` in dev |

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
