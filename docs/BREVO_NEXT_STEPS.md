# Brevo: What to Do Next

The Brevo integration is implemented. These are the remaining steps to finish setup.

---

## 1. Brevo Account and API Key

1. Sign up at [brevo.com](https://www.brevo.com) (or log in).
2. Go to **SMTP & API** → **API Keys**.
3. Create an API key (e.g. "portraitz.shop production").
4. Add to your environment:

   ```env
   BREVO_API_KEY=your_api_key_here
   ```

---

## 2. Environment Variables

Add these to `.env.local` (or your deployment env):

```env
# Required
BREVO_API_KEY=your_api_key_here

# Optional – defaults shown
BREVO_FROM_EMAIL=orders@portraitz.shop
BREVO_FROM_NAME=portraitz.shop

# Footer – your company legal address (required for CAN-SPAM / EU)
COMPANY_ADDRESS=Your Company SRL
Str. Example 123, Bucharest, 012345, Romania
```

Use your real company name and address for `COMPANY_ADDRESS`. It appears in the footer of every email.

---

## 3. Logo for Emails

The templates use a logo at:

```
public/Portraitz_white.png
```

- Ensure this file exists in `petportrait/public/`.
- Recommended: PNG, ~200–300px wide, transparent or dark background (emails use dark theme).
- If you use a different path, update `getLogoUrl()` in `lib/email/templates.ts`.

---

## 4. Domain Authentication (SPF, DKIM)

For good deliverability and to avoid spam filters:

1. In Brevo: **Senders & IP** → **Authenticate your domain**.
2. Add the DNS records Brevo provides (SPF, DKIM CNAME).
3. Optionally add DMARC (start with `p=none`).

Without this, emails may land in spam or be rejected.

---

## 5. Supabase Auth (Account Confirmation, Password Reset)

Supabase sends its own auth emails. To send them via Brevo:

1. In Brevo: **SMTP & API** → get your **SMTP login** and **SMTP key** (not the API key).
2. In Supabase: **Authentication** → **SMTP Settings**.
3. Enable custom SMTP and set:
   - Host: `smtp-relay.brevo.com`
   - Port: `587` (TLS) or `465` (SSL)
   - User: your Brevo SMTP login
   - Password: your Brevo SMTP key
   - Sender email: `orders@portraitz.shop` (or your verified sender)
   - Sender name: `portraitz.shop`

Supabase will use its default templates; the sender and branding will come from Brevo.

---

## 6. Verify Sender in Brevo

1. In Brevo: **Senders & IP** → **Senders**.
2. Add and verify `orders@portraitz.shop` (or your chosen `BREVO_FROM_EMAIL`).
3. Complete the verification steps (usually a DNS TXT record or email link).

---

## 7. Test the Emails

1. Place a test order (Stripe test mode).
2. Confirm you receive:
   - **Order confirmation** – right after payment.
   - **Delivery ready** – when the digital bundle is ready (with download link).
   - **Shipped** – when a physical order ships (Printful webhook).

Check spam folder if you don’t see them.

---

## 8. Optional: Remove Resend

Once Brevo is working:

- Remove `resend` from `package.json` if it’s no longer used.
- Remove any `RESEND_*` env vars.

---

## Quick Checklist

- [ ] Brevo API key in env
- [ ] `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `COMPANY_ADDRESS` in env
- [ ] `public/Portraitz_white.png` exists
- [ ] Domain authenticated (SPF/DKIM) in Brevo
- [ ] Sender email verified in Brevo
- [ ] Supabase Auth SMTP configured (optional)
- [ ] Test order confirmation, delivery, and shipped emails
