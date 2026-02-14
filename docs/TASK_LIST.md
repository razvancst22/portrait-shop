# Task list – Component structure, Login, Token system, Pricing page

Single checklist for: home component structure, login, inspired token/credit system, and pricing page (reactbits UI). Order is logical; dependencies noted where relevant.

---

## 1. Component structure (home page)

- [x] **1.1** Create `components/home/` folder.
- [x] **1.2** Add `components/home/hero-section.tsx` – headline + subhead; export `HeroSection`.
- [x] **1.3** Add `components/home/category-grid.tsx` – category cards using `CATEGORY_ROUTES` / `SUBJECT_TYPE_IDS`; export `CategoryGrid`.
- [x] **1.4** Add `components/home/trust-line.tsx` – “No credit card for preview…” line; export `TrustLine`.
- [x] **1.5** Add `components/home/rolling-gallery-placeholder.tsx` – minimal section, `data-section="rolling-gallery"`, TODO for reactbits; export `RollingGalleryPlaceholder`.
- [x] **1.6** Refactor `app/page.tsx` – import and compose `HeroSection`, `RollingGalleryPlaceholder`, `CategoryGrid`, `TrustLine`; remove inline JSX; keep metadata.
- [ ] **1.7** (Optional) Move `site-header.tsx` and `site-footer.tsx` into `components/layout/` and update `app/layout.tsx` imports.

---

## 2. Login (auth) – optional, for buying more

- [ ] **2.1** Choose auth provider (e.g. Supabase Auth, NextAuth, or magic link) and add dependencies.
- [ ] **2.2** Implement sign-up flow (email/password or magic link, etc.).
- [ ] **2.3** Implement sign-in flow.
- [ ] **2.4** Session handling – read session in app (e.g. middleware or layout), expose to client where needed.
- [ ] **2.5** Header: show “Log in” / “Sign up” when guest; show “My account” / “My Portraits” + “Log out” when logged in. Login is **optional** – mainly for users who want to buy more credits.
- [ ] **2.6** (If needed) Protected routes – only “My Portraits” / account dashboard require login; **do not** require login to use the create flow (guests get 2 tokens; see section 3).
- [ ] **2.7** Account / “My Portraits” page – list creations, credits remaining; require login.
- [ ] **2.8** After login: show upsell – prompt user to buy credits (e.g. banner “Get more portraits” or redirect to pricing once after first login).

---

## 3. Token system (inspired by OPP / Fable, simplified)

**Principle:** Every visitor can generate **2 portraits without logging in**. Login is optional and used mainly for those who want to **buy more**; after login, prompt to buy.

- [x] **3.1** Define model: 1 token = 1 portrait (one generation); no tokens for retries or edits.
- [x] **3.2** **Guest (no login):** Every user who enters the site has **2 tokens** available immediately. Track guest balance (guest_id cookie + `guest_token_usage` table in Supabase). Grant 2 tokens on first visit; deduct 1 per generation. No sign-in required to use these 2.
- [ ] **3.3** **Logged-in user:** Store credit balance in DB (e.g. `profiles.credits` or `user_credits` table in Supabase). Purchased credits and any “free tier” for account users live here. When guest later logs in, decide policy: merge guest tokens into account or start from account balance only (e.g. “link” guest creations to account on login).
- [x] **3.4** API: GET /api/credits – for **guest** return balance from cookie + `guest_token_usage` (2 − tokens_used); set guest_id cookie if new. (Logged-in: TODO.)
- [x] **3.5** Deduct 1 token when user starts a generation (POST /api/generate). Reject if balance &lt; 1 with 403 and message “You’ve used your 2 free portraits. Sign in to get more, or buy credits.”
- [x] **3.6** UI: show “X free portraits remaining” on styles step in create flow; on 403 show error + “Buy credits” and “Sign in” links.
- [x] **3.7** “Buy credits” links to /pricing (placeholder page added). After login, prompt to buy (section 2.8) – when login exists.

---

## 4. Pricing page with pricing options (reactbits UI)

- [ ] **4.1** Add route for pricing page (e.g. `app/pricing/page.tsx`).
- [ ] **4.2** Install / integrate reactbits; add pricing UI component from reactbits (cards, tiers, CTA buttons).
- [ ] **4.3** Define pricing options (e.g. “5 credits – $X”, “10 credits – $Y”, “Starter pack”, etc.); can be config in code or CMS.
- [ ] **4.4** Pricing page: render reactbits pricing UI with our options; wire “Get X credits” / “Buy pack” CTA to checkout (Stripe) or credits purchase flow.
- [ ] **4.5** After successful payment (Stripe webhook or callback): add purchased credits to user’s balance (same store as 3.2).
- [ ] **4.6** Link to pricing from header (e.g. “Buy credits” when logged in) and/or footer.

---

## 5. Cross-cutting

- [ ] **5.1** Create flow: **no login required** to start. Guest has 2 tokens from first visit; allow “Create my portrait” as long as balance ≥ 1. When guest has 0 tokens left, show message: “You’ve used your 2 free portraits. Sign in to get more, or buy credits.” with links to sign-in and pricing. Logged-in users use their account balance; same “Buy credits” when insufficient.
- [ ] **5.2** After login: show buy prompt (banner or one-time redirect to pricing) so returning users who just signed in are encouraged to buy credits (see 2.8).
- [ ] **5.3** Order lookup and existing checkout: keep working; align with token model (e.g. checkout buys credit packs; single-portrait purchase if still offered).
- [ ] **5.4** Docs: update README or SETUP_CHECKLIST if new env vars (auth, Stripe for credits, guest token store) are required.

---

## Summary table

| Area              | Tasks   | Deps / notes                                                       |
|-------------------|---------|--------------------------------------------------------------------|
| Home components   | 1.1–1.7 | None                                                               |
| Login             | 2.1–2.8 | Auth provider; optional; “My Portraits” + upsell after login       |
| Token system      | 3.1–3.7 | Guest: 2 tokens, no login; backend store for guest + DB for user  |
| Pricing page      | 4.1–4.6 | reactbits UI; Stripe for credit purchases                          |
| Cross-cutting     | 5.1–5.4 | No login required for 2 free portraits; prompt buy when 0 / after login; docs |

---

## Suggested order

1. **Component structure (1.x)** – no dependencies; do first.
2. **Token system (3.x)** – implement guest path first (2 tokens per visitor, session/anon store, deduct on generation). No login required; create flow works for everyone. Then add DB balance for logged-in users and “buy credits.”
3. **Login (2.x)** – optional auth; header state, “My Portraits,” upsell after login.
4. **Pricing page (4.x)** – reactbits UI + Stripe for buying credits; link from header/footer and from “0 tokens” state.
5. **Cross-cutting (5.x)** – guest 0-token message (sign-in + buy), post-login buy prompt, order lookup alignment, docs.
