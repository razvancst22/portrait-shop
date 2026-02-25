# Printful Print Fulfillment Setup

A detailed step-by-step guide to configure physical art print fulfillment via [Printful](https://www.printful.com/).

---

## 1. Overview and Prerequisites

### What Printful Does in This Project

When a customer purchases an **Art Print Pack** (physical museum-quality print), the order is sent to Printful after Stripe payment. Printful prints and ships the portrait directly to the customer.

### Prerequisites

Before starting Printful setup, ensure:

- **Stripe** is configured and checkout works (see `docs/STRIPE_SETUP.md`)
- **Replicate upscale** is configured (`REPLICATE_API_TOKEN` in `.env.local`) — required for print quality; we always send the upscaled image to Printful
- **Supabase** is set up with the `petportrait` database
- **Shipping address collection** — Stripe Checkout collects shipping automatically for art print orders (already implemented)

---

## 2. Account Setup

### Step 1: Create a Printful Account

1. Go to [printful.com](https://www.printful.com/) and sign up
2. Complete account verification if required

### Step 2: Create a Store

1. In [Printful Dashboard](https://www.printful.com/dashboard/store), create a new store
2. Choose **Manual order platform / API** (not Shopify, WooCommerce, etc.)
3. This store will receive orders via the API

### Step 3: Create a Private Token

1. Go to [Printful Developer Portal → Add New Token](https://developers.printful.com/tokens/add-new-token)
2. Create a **Private Token** with at least the `orders` scope
3. Copy the token — you won't see it again

---

## 3. Environment Variables

Add these to `.env.local` (or your deployment environment):

```env
# Required for art print fulfillment with Printful
PRINTFUL_API_TOKEN=your_private_token_here
```

### Warning

If `PRINTFUL_API_TOKEN` is not set, art print orders will:
- Succeed at Stripe (payment goes through)
- Fail at fulfillment (Printful is never called)
- Log an error: "PRINTFUL_API_TOKEN is not configured"

**Restart your dev server** after adding or changing these variables.

---

## 4. Variant ID Lookup (Critical)

Printful uses Catalog variant IDs for products. Our code maps print sizes (8×10", 12×16", etc.) to variant IDs. **Wrong variant ID = Printful rejects the order or ships the wrong product.**

### Our Current Mapping

In `lib/fulfillment/printful.ts`:

| Our Size | Printful Variant ID | Notes |
|----------|---------------------|-------|
| 8×10" | 10760 | Premium Luster Framed Poster (verify) |
| 12×16" | 0 | **Must be set** — see below |
| 18×24" | 0 | **Must be set** — see below |
| 24×36" | 0 | **Must be set** — see below |

### Fetch Variant IDs via Catalog API

1. **List Framed Poster products:**
   ```bash
   curl "https://api.printful.com/products?category_id=56" \
     -H "Authorization: Bearer YOUR_PRINTFUL_API_TOKEN"
   ```

2. **Get product details** (replace `172` with the product ID from step 1):
   ```bash
   curl "https://api.printful.com/products/172" \
     -H "Authorization: Bearer YOUR_PRINTFUL_API_TOKEN"
   ```

3. **Find variant IDs** in the response. Look for variants with sizes like "8″×10″", "12″×16″", "18″×24″", "24″×36″".

4. **Update the mapping** in `lib/fulfillment/printful.ts`:
   ```ts
   export const PRINT_TO_PRINTFUL_VARIANT_ID: Record<string, number> = {
     '8×10"': 10760,
     '12×16"': 12345,  // Replace with actual variant ID
     '18×24"': 12346,
     '24×36"': 12347,
   }
   ```

The keys must match exactly the `dimensions` in `lib/pricing/constants.ts` (`ART_PRINT_OPTIONS`).

---

## 5. Webhook Configuration

Printful sends webhooks when order status changes (e.g. shipped, canceled). Our webhook updates `fulfillment_status` in the database.

### Where to Set the Webhook URL

1. Go to [Printful Dashboard](https://www.printful.com/dashboard/) → Settings → Webhooks
2. Add webhook URL:
   ```
   https://your-domain.com/api/webhooks/printful
   ```

### Events to Subscribe To

- `package_shipped` — order has been shipped
- `order_updated` — order status changed
- `order_canceled` — order was canceled
- `order_failed` — order failed

### Local Testing with ngrok

Printful needs a **public URL**. For local development:

1. Install [ngrok](https://ngrok.com/)
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g. `https://abc123.ngrok.io`)
4. In Printful Dashboard → Webhooks, set URL: `https://abc123.ngrok.io/api/webhooks/printful`

Restart ngrok and update the URL if it changes (free ngrok URLs rotate).

### What Our Webhook Does

- Receives events from Printful
- Finds our order by `external_id` (our order ID)
- Updates `fulfillment_status`: `package_shipped` → `shipped`, `order_canceled`/`order_failed` → `cancelled`

---

## 6. End-to-End Testing

### Step 1: Create a Test Portrait

1. Go to the create flow, upload a pet photo, generate a portrait
2. Wait for generation to complete
3. Go to the preview page

### Step 2: Purchase Art Print

1. Click **Upgrade to Print** (or "Get Art Print Pack")
2. Select a size (e.g. 8×10" — ensure variant ID is configured)
3. Click through to checkout
4. **Verify**: Stripe Checkout asks for shipping address
5. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. Complete payment

### Step 3: Verify Stripe Webhook

- Check Stripe Dashboard → Developers → Webhooks → your endpoint → Recent events
- `checkout.session.completed` should have fired

### Step 4: Verify Our Database

In Supabase, check the `orders` table for the new order:

- `payment_status` = `paid`
- `fulfillment_status` = `processing`

Check `order_items`:

- `product_type` = `art_print`
- `print_dimensions` = e.g. `8×10"`

### Step 5: Verify Printful Dashboard

- Log in to [Printful Dashboard](https://www.printful.com/dashboard/orders)
- Find the order by external ID (our order UUID) or by date
- Confirm the order shows the correct product, size, and image

### Step 6: Printful Webhook (Optional)

When Printful ships the order, it sends `package_shipped`. If you see `fulfillment_status` change to `shipped` in your DB, the webhook is working.

---

## 7. Upscale Requirement

Print fulfillment **always** uses the upscaled image. Low-resolution images would produce poor print quality.

### Requirement

`REPLICATE_API_TOKEN` must be set in `.env.local`. Get it from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).

### What Happens Without It

If Replicate is not configured, art print orders fail with:

```
Print fulfillment requires an upscaled image. Configure REPLICATE_API_TOKEN for upscaling.
```

---

## 8. Going Live

### Step 1: Verify Variant IDs

Ensure all four sizes (8×10", 12×16", 18×24", 24×36") have valid variant IDs in `PRINT_TO_PRINTFUL_VARIANT_ID`.

### Step 2: Update Webhook URL

In Printful Dashboard, set the webhook URL to your production domain:

```
https://your-production-domain.com/api/webhooks/printful
```

### Step 3: Place a Real Test Order

1. Create a real portrait
2. Purchase an art print
3. Use your own address
4. Complete payment
5. Verify the order appears in Printful Dashboard
6. Wait for production and shipping (Printful will notify via webhook when shipped)

---

## 9. Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `PRINTFUL_API_TOKEN is not configured` | Env var missing | Add `PRINTFUL_API_TOKEN` to `.env.local`, restart dev server |
| `Printful variant ID for X not configured` | Variant ID is 0 | Run Catalog API lookup, update `PRINT_TO_PRINTFUL_VARIANT_ID` in `lib/fulfillment/printful.ts` |
| `Print fulfillment requires an upscaled image` | Replicate not set | Add `REPLICATE_API_TOKEN` to `.env.local` |
| `Missing shipping address from Stripe` | Stripe didn't collect address | Ensure you're on the art print flow; `shipping_address_collection` is enabled. Re-test. |
| `State/province required for US` | US/AU/CA address missing state | Stripe must collect state for these countries |
| Printful API 401 | Wrong or expired token | Regenerate token in Developer Portal, update `.env.local` |
| Printful API 4xx | Invalid variant_id or payload | Verify variant IDs via Catalog API; check Printful API docs |
| Webhook not firing | URL not reachable | Ensure webhook URL is public (no localhost); use ngrok for local |

### Check Logs

- **Next.js / Vercel**: Check server logs for `Printful fulfillment failed` or `Printful webhook`
- **Stripe**: Webhooks → your endpoint → event details
- **Printful**: Dashboard may show webhook delivery status

---

## 10. Reference: Full Flow

```mermaid
flowchart LR
    subgraph Customer [Customer]
        A[Create Portrait] --> B[Preview]
        B --> C[Choose Print Size]
    end
    subgraph Checkout [Checkout]
        C --> D[Stripe Checkout]
        D --> E[Pay + Shipping Address]
    end
    subgraph Backend [Backend]
        E --> F[Stripe Webhook]
        F --> G[Prepare Upscaled Image]
        G --> H[Create Printful Order]
        H --> I[Printful Prints]
        I --> J[Printful Webhook]
        J --> K[Update fulfillment_status]
    end
    Customer --> Checkout
    Checkout --> Backend
```

---

## 11. Quick Checklist

Before going live with Printful art prints:

- [ ] Printful account created
- [ ] Manual order / API store created
- [ ] Private Token with `orders` scope
- [ ] `PRINTFUL_API_TOKEN` in `.env.local`
- [ ] `REPLICATE_API_TOKEN` configured
- [ ] Variant IDs verified via Catalog API and `PRINT_TO_PRINTFUL_VARIANT_ID` updated
- [ ] Webhook URL configured in Printful Dashboard
- [ ] End-to-end test (order appears in Printful)
- [ ] One real test order to yourself
