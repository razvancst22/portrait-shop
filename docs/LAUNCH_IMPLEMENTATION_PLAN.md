# Launch Implementation Plan – To-Do List

## CUPRINS

1. [Phase 1: Frontend Photos (First – Before Launch)](#phase-1-frontend-photos-first--before-launch)
   - [Gallery images (different photos per page)](#gallery-images-different-photos-per-page)
   - [Style example images (two states by category)](#style-example-images-two-states-by-category)
   - [Print & framing options (UI)](#print--framing-options-ui)
2. [Phase 1.5: Analytics & Ads (Before Launch)](#phase-15-analytics--ads-before-launch)
   - [Why you need this](#why-you-need-this)
   - [Recommended setup](#recommended-setup)
   - [Implementation](#implementation)
   - [Key metrics to watch (post-launch)](#key-metrics-to-watch-post-launch)
   - [Ads readiness](#ads-readiness)
3. [Phase 2: Stripe + Romanian Company](#phase-2-stripe--romanian-company)
4. [Phase 3: Brevo (Emails)](#phase-3-brevo-emails)
5. [Phase 4: Printful (Physical Prints)](#phase-4-printful-physical-prints)
6. [Phase 5: Romanian e-Factura (Compliance)](#phase-5-romanian-e-factura-compliance)
7. [Phase 6: Launch](#phase-6-launch)
8. [Quick Checklist Before Launch](#quick-checklist-before-launch)
9. [Parallel Work](#parallel-work)

---

Final implementation plan for launching the Pet Portrait business. Work through phases in order; check off items as you complete them.

**References:** [STRIPE_SETUP.md](STRIPE_SETUP.md) | [BREVO_NEXT_STEPS.md](BREVO_NEXT_STEPS.md) | [PRINTFUL_SETUP.md](PRINTFUL_SETUP.md) | [EFACTURA_SETUP.md](EFACTURA_SETUP.md)

**Readiness:** Once all Phase 1–6 items are done and the Quick Checklist is complete, you are ready to launch. Add analytics (Phase 1.5) before launch so you can measure performance from day 1. Ads can be added later; the conversion tracking you set up now will make them effective.

---

## Phase 1: Frontend Photos (First – Before Launch)

Users need to see what they're buying. Without good previews, conversion drops.

### Gallery images (different photos per page)

Each page must show **different photos** matching the category. Update `lib/gallery-images.ts` and add images to `public/gallery-optimized/`.

| Page | Content | Images needed |
|------|---------|---------------|
| home | Pet mix (dogs + cats) | 4+ |
| dog | Dog portraits | 4+ |
| cat | Cat portraits | 4+ |
| family | Family portraits | 4+ |
| children | Children portraits | 4+ |
| couple | Couple portraits | 4+ |
| self | Self portrait | 4+ |

- [ ] Create/curate portrait images per category (dogs, cats, children, family, couples, self)
- [ ] Add to `public/gallery-optimized/` and run `scripts/optimize-images.js` for each image
- [ ] Required formats per image: `{id}-sm.webp`, `{id}.webp`, `{id}-lg.webp`, `{id}-sm.jpg`, `{id}.jpg`, `{id}-lg.jpg`, `{id}-blur.webp`
- [ ] Update `GALLERY_IMAGES` and `GALLERY_IMAGES_BY_PAGE` in `lib/gallery-images.ts` so each page uses its own category-specific images (e.g. dog page → dog images, family page → family images)

### Style example images (two states by category)

When the user selects a style, the example shown must match the **category type**:

- **Pet group** (pet, dog, cat): Show **pet/dog/cat** photos on style cards
- **Human group** (self, couple, children, family): Show **person** photos on style cards

The API (`app/api/styles/route.ts`) already supports this via `?category=` when fetching styles. CreateFlow must pass `category` when calling `/api/styles`.

**Pet group** – 8 images (one per style): `renaissance.jpg`, `baroque.jpg`, `rococo.jpg`, `victorian.jpg`, `regal.jpg`, `belle_epoque.jpg`, `dutch_golden_age.jpg`, `spanish_baroque.jpg` — all must be pet/dog/cat portraits.

**Human group** – 8 images × 4 human categories = 32 images: `family_renaissance.jpg`, `family_baroque.jpg`, … `self_renaissance.jpg`, etc. Or use one shared set per human type: `family_*`, `couple_*`, `children_*`, `self_*` (8 each).

- [ ] Add 8 pet images to `public/style-examples/`: `renaissance.jpg`, `baroque.jpg`, `rococo.jpg`, `victorian.jpg`, `regal.jpg`, `belle_epoque.jpg`, `dutch_golden_age.jpg`, `spanish_baroque.jpg` (all pet portraits)
- [ ] Add human images per category: `family_renaissance.jpg` … `family_spanish_baroque.jpg`, `couple_*`, `children_*`, `self_*` (8 per category = 32 total)
- [ ] Generate via AI pipeline (run prompts from `lib/prompts/artStyles.ts` on sample dog/cat photos for pet, human photos for human)
- [ ] Ensure CreateFlow passes `?category=` when fetching `/api/styles` so the correct style examples load

**Note:** The styles API uses `/{id}.jpg` for pet/dog/cat and `/{subjectType}_{id}.jpg` for human categories. If you prefer one shared human set (8 images: `human_renaissance.jpg`, etc.), the API would need a small change to map family/couple/children/self → `human` when resolving image paths.

### Print & framing options (UI)

Add the framing option in the UI alongside the print size when the user chooses a physical art print.

- [ ] Add framing option in UI (framed vs unframed, frame type/color) alongside print size selection
- [ ] User selects: size + framed/unframed (and optionally frame style) before checkout

*Printful integration (variant mapping for framed vs unframed) is in Phase 4.*

---

## Phase 1.5: Analytics & Ads (Before Launch)

Add analytics **before** launch so you capture data from day 1. Essential for understanding performance and required for ads.

### Why you need this

- **Traffic:** Where visitors come from, which pages they view
- **Funnel:** How many start a portrait vs complete purchase (conversion rate)
- **Ads:** Google Ads and Meta Ads need conversion tracking to optimize and measure ROI

### Recommended setup

| Tool | Purpose | When |
|------|---------|------|
| **Google Analytics 4 (GA4)** | Traffic, sessions, user behavior, conversions | Before launch |
| **Google Tag Manager (GTM)** | Manage GA4 + ad pixels in one place (optional but recommended) | Before launch |
| **Google Ads conversion** | Track purchases from Google Ads | When you run Google Ads |
| **Meta Pixel** | Track purchases from Facebook/Instagram Ads | When you run Meta Ads |

### Implementation

- [ ] Create GA4 property at [analytics.google.com](https://analytics.google.com)
- [ ] Add GA4 script to `app/layout.tsx` (or use GTM container with GA4 tag)
- [ ] Track key events: `page_view`, `generate_start` (user starts generation), `checkout_start`, `purchase` (order completed)
- [ ] Add purchase event with value (order total) for e-commerce reporting
- [ ] Update Privacy Policy to mention GA4 (and any ad pixels)
- [ ] When running ads: add Google Ads conversion tag and/or Meta Pixel via GTM or direct script

### Key metrics to watch (post-launch)

- **Traffic:** Sessions, users, top pages
- **Conversion rate:** Purchases ÷ sessions (or ÷ checkout_starts)
- **Funnel drop-off:** Home → Create → Preview → Checkout → Purchase — where do people leave?
- **Revenue:** Total sales, average order value

### Ads readiness

When you run ads, you'll need:

- Conversion tracking (purchase event) so platforms can optimize for sales
- A landing page (home or category page) with clear CTA
- Optional: Google Ads enhanced conversions, Meta Conversions API (server-side) for better accuracy

---

## Phase 2: Stripe + Romanian Company

You cannot accept payments without Stripe. Romanian company registration is required for live payouts.

- [ ] Register Romanian company in Stripe (Dashboard → Settings → Business settings)
- [ ] Add company details: CUI, address, bank account for payouts
- [ ] Complete Stripe verification (allow 1–3 days for documents)
- [ ] Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to production env
- [ ] Configure webhook: URL `https://your-domain.com/api/webhooks/stripe`, event `checkout.session.completed`
- [ ] Test with test keys first, then switch to live keys when ready

---

## Phase 3: Brevo (Emails)

Order confirmation, delivery, and shipped emails build trust. Domain is already purchased.

- [ ] Create Brevo account at [brevo.com](https://www.brevo.com)
- [ ] Create API key (SMTP & API → API Keys)
- [ ] Add env vars: `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `COMPANY_ADDRESS`
- [ ] Authenticate domain in Brevo (Senders & IP → Authenticate domain: SPF, DKIM)
- [ ] Verify sender email (e.g. `orders@yourdomain.com`) in Brevo
- [ ] (Optional) Configure Supabase Auth SMTP → Brevo for account confirmation / password reset
- [ ] Test: place test order, confirm order confirmation, delivery, and shipped emails

---

## Phase 4: Printful (Physical Prints)

Only needed if selling art prints. Depends on Stripe and Brevo.

**Note:** The framing option UI is in Phase 1. Here we add the **Printful integration** for framed vs unframed: map frame choices to Printful variant IDs.

**Print quality:** Use **Enhanced Matte Paper** (preset, no customer choice). It fits museum-quality classical art (Renaissance/Baroque/Victorian) better than Premium Luster—matte reduces glare and matches traditional oil painting aesthetics. Map variant IDs in `PRINT_TO_PRINTFUL_VARIANT_ID` to Enhanced Matte framed poster variants only.

- [ ] Create Printful account and store (Manual order / API)
- [ ] Create Private Token with `orders` scope (Developer Portal)
- [ ] Add `PRINTFUL_API_TOKEN` to env
- [ ] Look up variant IDs via Catalog API for **Enhanced Matte** framed/unframed posters; update `PRINT_TO_PRINTFUL_VARIANT_ID` in `lib/fulfillment/printful.ts`
- [ ] Map framing option from UI to Printful variant IDs in fulfillment logic
- [ ] Configure webhook: URL `https://your-domain.com/api/webhooks/printful`, events: `package_shipped`, `order_updated`, `order_canceled`, `order_failed`
- [ ] Ensure `REPLICATE_API_TOKEN` is set for upscaling (print quality)

---

## Phase 5: Romanian e-Factura (Compliance)

Mandatory for B2C in Romania from Jan 2025. Can run in parallel with Phase 2–4.

- [ ] Obtain qualified digital signature certificate (for ANAF)
- [ ] Register company in provider (Contazen, Socrate, or Factureaza.ro)
- [ ] Complete OAuth authorization with ANAF in provider dashboard
- [ ] Implement integration: Stripe webhook → call Romanian invoicing API with order data
- [ ] Test with SPV sandbox before production

---

## Phase 6: Launch

- [ ] Point domain DNS to production (Vercel/hosting)
- [ ] Run final end-to-end test: create portrait → checkout → payment → delivery email (and Printful if applicable)
- [ ] Switch Stripe to live mode, update env with live keys
- [ ] Go live

---

## Quick Checklist Before Launch

- [ ] Gallery images in `gallery-optimized/` – different photos per page (dog, cat, family, children, couple, self)
- [ ] Style examples in `style-examples/` – 8 pet + 32 human (or 8 pet + 8 human if using shared human set)
- [ ] GA4 (and optionally GTM) installed – traffic and conversion tracking
- [ ] Romanian company registered in Stripe
- [ ] Stripe live keys + webhook
- [ ] Brevo API key + domain auth + sender verified
- [ ] Printful token + variant IDs + framing option + webhook (if selling physical)
- [ ] Romanian e-Factura provider integrated
- [ ] End-to-end test order

---

## Parallel Work

- **Phase 1** (frontend photos) can run in parallel with account setup.
- **Phase 1.5** (analytics) can run in parallel with Phase 1–5; add GA4 before launch so you have data from day 1.
- **Phase 2** (Stripe) and **Phase 5** (e-Factura) both need the Romanian company – start company registration early.
- **Phase 3** (Brevo) and **Phase 4** (Printful) can run in parallel once Stripe is ready.
