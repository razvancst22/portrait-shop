# Brevo Email Integration for E-Commerce

Implementation guide for Brevo as the **single email provider** for portraitz.shop. All emails: custom branded (logo, fonts), personalized, store-compliant. Migration from Resend; integration with Supabase Auth and Stripe.

---

## 1. Design: Custom Branded Emails

**Goal:** Every email has your logo, font styles, and brand colors – consistent with the site.

### Approach

- **Brevo transactional templates** – Create one base template in Brevo Dashboard with:
  - Logo (hosted URL, e.g. `https://portraitz.shop/logo-email.png`)
  - Font family (e.g. same as site – Inter, Georgia, etc.)
  - Brand colors (primary, background, text)
  - Footer: company address, contact, refund policy
- **Dynamic params** – Each email type passes different content (order number, download link, customer name, etc.) into the template.
- **Personalization** – Use `{{params.firstName}}`, `{{params.orderNumber}}`, etc. Brevo supports merge tags. For names: use `customer_name` from order or extract from email; fallback to "there" if unknown.
- **HTML templates** – Or build HTML in code and pass `htmlContent`; use a shared layout function for consistency.

### Assets Needed

- Logo for email (PNG, ~200px wide, transparent or white bg)
- Font stack (web-safe fallbacks: `font-family: 'Inter', -apple-system, sans-serif`)
- Primary color hex, background color

---

## 2. All Email Flows (Complete List)

### A. Auth Emails (Supabase → Brevo SMTP)

| Email | Trigger | Config |
|-------|---------|--------|
| **Account confirmation** | User signs up | Supabase Dashboard → Auth → SMTP. Set Brevo SMTP. Supabase sends; Brevo delivers. |
| **Password reset** | User requests reset | Same – Supabase SMTP. |
| **Magic link / OTP** | If you enable passwordless | Same. |

**Config:** Supabase → Authentication → SMTP Settings. Use Brevo SMTP:
- Host: `smtp-relay.brevo.com`
- Port: 587 (TLS) or 465 (SSL)
- User: your Brevo SMTP login (often your Brevo account email)
- Password: Brevo SMTP key (not API key – get from Brevo → SMTP & API)

**Note:** Supabase auth emails use Supabase's default templates. For fully custom design, you'd need to use Brevo's "Custom SMTP" with custom templates – Supabase sends the email content; you can customize the **sender name**, **subject**, and limited body via Supabase Auth template settings. For full HTML control, consider using Supabase Auth hooks + Brevo API (advanced).

### B. Stripe / Payment Emails

| Email | Who Sends | Action |
|-------|-----------|--------|
| **Stripe receipt** | Stripe | Option A: Disable in Stripe Dashboard (Settings → Customer emails). Send your own via Brevo. Option B: Keep Stripe receipt (official payment record), add our **order confirmation** as a separate branded email. |
| **Order confirmation** | Us (Brevo API) | Send from Stripe webhook. Branded, with order details. |

**Recommendation:** Keep Stripe receipt (links to `receipt_url`). Add our **order confirmation** email – "Thank you for your order ORD-XXX. We're preparing your download." – so the first touch is branded.

### C. Order Lifecycle (Brevo API)

| Email | Trigger | Content |
|-------|---------|---------|
| **Order confirmation** | Stripe `checkout.session.completed` | Thank you, order number, items, total. Digital: "We're preparing your download." Physical: "We'll email when it ships." |
| **Delivery ready** | Bundle generated (digital) | Download link, order number, link expiry, order lookup fallback. |
| **Shipped** (physical) | Printful `package_shipped` | Tracking number, tracking URL. |
| **Order lookup resend** | User requests via order lookup | Same as delivery – download link. |

### D. Optional / Future

- Welcome email (after first signup confirmation)
- Refund confirmation
- Abandoned cart (if you add cart)

### E. Marketing (Opt-In)

- Newsletter, promotions – **unsubscribe required**, GDPR/CAN-SPAM.

---

## 3. Implementation Summary

| Flow | Provider | How |
|------|----------|-----|
| Account confirmation | Supabase → Brevo SMTP | Configure Brevo SMTP in Supabase Auth |
| Password reset | Supabase → Brevo SMTP | Same |
| Stripe receipt | Stripe | Keep (or disable and send via Brevo) |
| Order confirmation | Brevo API | New – Stripe webhook |
| Delivery ready | Brevo API | Migrate from Resend |
| Shipped | Brevo API | New – Printful webhook |
| Order lookup resend | Brevo API | Migrate from Resend |

---

## 4. Store Standards (Legal & Best Practices)

### Legal Requirements

| Requirement | Why |
|-------------|-----|
| **Physical address in footer** | CAN-SPAM (US), many EU laws. Your company address must appear. |
| **Unsubscribe link** | Required for marketing. Transactional can omit if purely order-related. |
| **Clear sender identity** | From: "portraitz.shop <orders@portraitz.shop>" – recognizable. |
| **Subject line accuracy** | No misleading subjects. |

### E-Commerce Best Practices

- **Order number** in subject and body
- **Clear CTA** – "Download your portrait" button, not buried text
- **Link expiry** – state when the download link expires
- **Fallback** – "Lost your link? Use order lookup at [URL]"
- **Mobile-friendly** – responsive HTML
- **Branding** – logo, colors, consistent with site

### Deliverability (SPF, DKIM, DMARC)

- **SPF** – Add Brevo's sending IPs to your domain DNS
- **DKIM** – Sign emails; Brevo provides a CNAME to add
- **DMARC** – Policy record (e.g. `p=none` initially, then `p=quarantine`)

Configure in Brevo Dashboard → Senders & IP → Authenticate your domain.

---

## 5. Brevo API Integration

### Environment Variables

```env
# Required for Brevo emails
BREVO_API_KEY=your_api_key_here

# Optional – defaults shown
BREVO_FROM_EMAIL=orders@portraitz.shop
BREVO_FROM_NAME=portraitz.shop

# Footer – your company legal address (used in all emails)
COMPANY_ADDRESS=Your Company SRL
Str. Example 123, Bucharest, 012345, Romania
```

### API Endpoint

```
POST https://api.brevo.com/v3/smtp/email
Headers: api-key: YOUR_BREVO_API_KEY
```

### Request Body (Transactional)

```json
{
  "sender": { "name": "portraitz.shop", "email": "orders@portraitz.shop" },
  "to": [{ "email": "customer@example.com", "name": "Customer" }],
  "subject": "Your portrait is ready – Order ORD-XXX",
  "htmlContent": "<p>...</p>",
  "tags": ["order", "delivery"]
}
```

### Template Support

Brevo supports **transactional templates** – create in Dashboard, then send by `templateId` + `params`. Recommended for consistent layout and footer (address, unsubscribe for marketing).

---

## 6. Migration from Resend

### Current Flow (Resend)

- `lib/email/delivery.ts` – `sendDeliveryEmail(orderId)` uses Resend
- Called from: Stripe webhook (bundle ready), order-lookup API
- Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### Migration Steps

1. Create Brevo account, get API key, authenticate domain (SPF/DKIM).
2. Add `lib/email/brevo.ts` – Brevo send function.
3. Update `sendDeliveryEmail` to use Brevo instead of Resend (or add `BREVO_API_KEY` check, fallback to Resend during transition).
4. Add **order confirmation** email – send from Stripe webhook immediately after payment (before bundle is ready). Currently you only send when bundle is ready.
5. Add **shipped** email – when Printful webhook fires with tracking.
6. Update env: `BREVO_API_KEY`, `BREVO_FROM_EMAIL`. Remove or keep `RESEND_*` for rollback.
7. Add footer to all emails: company address, link to contact/refunds.

---

## 7. Email Types – Implementation Checklist

| Email | When | Status |
|-------|------|--------|
| Order confirmation | Stripe webhook (payment success) | To add |
| Delivery ready | After bundle generated | Exists (Resend) → migrate to Brevo |
| Shipped | Printful webhook | To add |
| Order lookup resend | Order lookup API | Exists → migrate to Brevo |
| Account confirmation | Supabase signUp | Supabase SMTP → Brevo |
| Password reset | Supabase reset | Supabase SMTP → Brevo |

---

## 8. Footer Template (Store Standard)

Every email should include:

```
—
portraitz.shop
[Your company legal name]
[Full address – street, city, postal code, country]

Contact: support@portraitz.shop
Refund policy: https://portraitz.shop/refunds
```

For **marketing** emails only: add "Unsubscribe" link.

---

## 9. Template Structure (Custom Branded)

Every transactional email should share:

```
[Logo – linked to portraitz.shop]
[Greeting – Hi {firstName} or "Hello"]
[Main content – dynamic per email type]
[CTA button – e.g. Download, Track order]
[Footer]
  — portraitz.shop
  [Company legal name]
  [Full address]
  Contact: support@portraitz.shop
  Refund policy: https://portraitz.shop/refunds
```

Use inline CSS for email clients. Logo: `<img src="https://portraitz.shop/logo-email.png" width="160" alt="portraitz.shop" />`.

---

## 10. Next Steps

1. **Brevo account** – Sign up, create API key, authenticate domain (SPF, DKIM).
2. **Supabase Auth** – Configure Brevo SMTP in Supabase Dashboard for account confirmation and password reset.
3. **Stripe** – Decide: keep receipt or disable and send via Brevo. Add order confirmation from webhook.
4. **Base template** – Create HTML template with logo, fonts, footer. Use in all Brevo sends.
5. **Implement** – `lib/email/brevo.ts`, migrate `sendDeliveryEmail`, add order confirmation, add shipped email.
6. **Assets** – Add `public/logo-email.png` (or similar) for email logo.
