# Store shell and design – implementation plan

Follow this plan task-by-task to add the UI framework, design system, store shell (nav + footer), error/loading UX, legal pages, SEO, and production hardening. Reference: the **Online store audit and hardening** plan (Cursor plan).

**Design direction:** Digital atelier – typography-led, warm palette, one strong accent, purposeful motion. Framework: **shadcn/ui** (Radix + Tailwind, components in repo).

---

## To-do list (tracking)

### Phase 0: UI framework and design foundation

- [x] **Task 0.1** – Install and init shadcn/ui in petportrait (Tailwind v4–compatible)
- [x] **Task 0.2** – Define design tokens in globals.css (atelier: warm neutrals, accent, radius, motion)
- [x] **Task 0.3** – Add core shadcn components: button, card, input, label, separator, skeleton
- [x] **Task 0.4** – Add sheet (for mobile nav) and customize components to use tokens
- [x] **Task 0.5** – Add display + body fonts (e.g. Playfair Display + DM Sans) and wire into theme

### Phase A: Store shell (nav + footer) and key pages

- [x] **Task A.1** – Shared layout with Header (logo, Create portrait, Order lookup) and Footer (Order lookup, Terms, Privacy, Contact)
- [x] **Task A.2** – Mobile: collapse nav into sheet/drawer
- [x] **Task A.3** – Home page refresh: hero + optional “How it works” using new design
- [x] **Task A.4** – Apply design system to Create, Preview, Checkout, Download, Order lookup pages

### Phase B: Error and loading UX

- [x] **Task B.1** – app/not-found.tsx (custom 404, on-brand)
- [x] **Task B.2** – app/error.tsx (error boundary, Try again / Back to home)
- [x] **Task B.3** – loading.tsx (global + key routes: create, checkout, download)
- [x] **Task B.4** – Create page: Retry on styles load failure; empty state if no styles

### Phase C: Legal and trust pages

- [x] **Task C.1** – /terms (Terms of Service placeholder)
- [x] **Task C.2** – /privacy (Privacy Policy placeholder)
- [x] **Task C.3** – /refunds (Refund policy for digital goods)
- [x] **Task C.4** – /contact (form or mailto) and footer link

### Phase D: SEO and metadata

- [x] **Task D.1** – Per-route metadata (title, description) for all main routes
- [x] **Task D.2** – Optional: “How it works” block on home (if not done in A.3)

### Phase E: Production hardening

- [x] **Task E.1** – Rate limiting for POST /api/upload, generate, checkout, order-lookup
- [x] **Task E.2** – Request body size limits for JSON APIs
- [x] **Task E.3** – GET /api/health (env checks) and document in SETUP_CHECKLIST
- [x] **Task E.4** – Require DOWNLOAD_TOKEN_SECRET in production; security headers middleware

---

## Task 0.1: Install and init shadcn/ui

- In `petportrait`, run: `npx shadcn@latest init`
- Choose options: style (New York), base color (e.g. Neutral or Stone for atelier), CSS variables yes, Tailwind v4 if prompted. Confirm `components.json` is created and that `globals.css` is updated with theme variables.
- Resolve any Tailwind v4 vs shadcn defaults (e.g. `@import "tailwindcss"` and theme may be merged).

**Deliverable:** shadcn inited; `components.json` present; app still runs.

---

## Task 0.2: Define design tokens (atelier)

- In `globals.css` (or where shadcn put variables), define:
  - **Colors:** background (warm off-white), surface (card/panel), primary/accent (e.g. burgundy or ink), muted text, border. No purple gradients.
  - **Typography:** font-family for heading vs body (can be placeholders until 0.5).
  - **Radius:** consistent (e.g. 0.5rem for cards, 9999 for pill buttons).
  - **Motion:** e.g. transition duration 150–200ms for hover/focus.
- Ensure shadcn components use these variables so one change updates the whole app.

**Deliverable:** Tokens in CSS; atelier palette and motion applied.

---

## Task 0.3: Add core shadcn components

- Run: `npx shadcn@latest add button card input label separator skeleton`
- Verify each component is in `components/ui/` and uses the theme variables. Fix any path or import issues.

**Deliverable:** Button, Card, Input, Label, Separator, Skeleton available and themed.

---

## Task 0.4: Add sheet and customize

- Run: `npx shadcn@latest add sheet`
- Optionally tweak Button (e.g. primary variant with accent color), Card (border or shadow to match “frame” look). Keep changes minimal so Phase A can iterate.

**Deliverable:** Sheet available for mobile nav; components feel on-brand.

---

## Task 0.5: Fonts and typography

- Add 1–2 Google (or local) fonts: e.g. Playfair Display for headings, DM Sans for body. Use `next/font` in layout.
- Set CSS variables for `--font-heading` and `--font-body`; use in theme and in layout/headings.

**Deliverable:** Distinctive typography on home and create; tokens wired.

---

## Task A.1: Shared layout (Header + Footer)

- Create a shared layout component or update root layout to include:
  - **Header:** Logo/site name (link to `/`), primary CTA “Create portrait” (`/create`), secondary “Order lookup” (`/order-lookup`). Use shadcn Button and spacing.
  - **Footer:** Links to Order lookup, Terms, Privacy, Contact; optional copyright. Use Separator and tokens.
- Wrap `children` in root layout so every page gets header + footer.

**Deliverable:** Every page shows nav and footer; links work.

---

## Task A.2: Mobile nav (sheet)

- In header, on small screens show a menu button (or hamburger) that opens a Sheet with the same links (Create portrait, Order lookup, then footer links or key ones). Use shadcn Sheet.

**Deliverable:** On mobile, nav collapses into drawer; no horizontal overflow.

---

## Task A.3: Home page refresh

- Replace or refine home content: one clear hero (headline + subtext + primary CTA) with new typography and palette. Optional: “How it works” in 3 steps (Choose style → Upload photo → Get your portrait) with icons or numbers.

**Deliverable:** Home feels like the atelier; CTA prominent.

---

## Task A.4: Apply design system to key pages

- **Create:** Style cards (Card), form (Input, Label), submit (Button). Skeleton or loading state if needed.
- **Preview:** Card for image, Button for Purchase.
- **Checkout:** Input (email), Button (Continue to payment).
- **Download:** List of download links styled with Card or list + Button.
- **Order lookup:** Form (Input, Label), Button; success message styled.
- **Order success:** Message + links using design system.

**Deliverable:** Full flow uses the same components and tokens; no raw zinc-only pages.

---

## Task B.1: Custom 404

- Add `app/not-found.tsx` with short copy and links to home and Create portrait. Use design tokens and Button.

**Deliverable:** Visiting unknown route shows on-brand 404.

---

## Task B.2: Error boundary

- Add `app/error.tsx` with message, “Try again” (reset), “Back to home”. Use design tokens and Button.

**Deliverable:** Uncaught errors show on-brand error UI.

---

## Task B.3: Loading UI

- Add `app/loading.tsx` (global). Optionally `app/create/loading.tsx`, `app/checkout/loading.tsx`, `app/download/loading.tsx`. Use Skeleton or minimal spinner with tokens.

**Deliverable:** Navigations show loading state instead of blank.

---

## Task B.4: Create page – Retry and empty state

- When styles fail to load: show error message + Retry button.
- When `styles.length === 0`: show short empty state (“No styles available right now. Please try again later.”).

**Deliverable:** Create page handles failure and empty gracefully.

---

## Task C.1–C.4: Legal and contact

- **C.1** – `app/terms/page.tsx`: Terms of Service placeholder; link from footer.
- **C.2** – `app/privacy/page.tsx`: Privacy Policy placeholder (data collected, processors); link from footer.
- **C.3** – `app/refunds/page.tsx` (or section in Terms): Refund policy for digital goods; link from footer.
- **C.4** – `app/contact/page.tsx`: Form (Resend or mailto) or visible email; link in footer. Document in SETUP_CHECKLIST if using Resend.

**Deliverable:** Terms, Privacy, Refunds, Contact exist and are linked.

---

## Task D.1: Per-route metadata

- Add `metadata` or `generateMetadata` to: `/`, `/create`, `/checkout`, `/download`, `/order-lookup`, `/order/success`, `/terms`, `/privacy`, `/contact`, `/refunds`. Sensible title and short description per route.

**Deliverable:** Each route has its own tab title and description for SEO.

---

## Task D.2: How it works (optional)

- If not already in A.3, add a “How it works” block on home (3 steps). Optional.

---

## Task E.1–E.4: Production hardening

- **E.1** – Rate limit POST /api/upload, /api/generate, /api/checkout, /api/order-lookup (e.g. per IP, N/min). Return 429 + Retry-After. Document in README or SETUP_CHECKLIST.
- **E.2** – Enforce max body size for JSON APIs (e.g. 64KB for checkout/order-lookup). Next config or middleware.
- **E.3** – GET /api/health: check required env (Supabase URL, etc.); return 503 if missing. Document in SETUP_CHECKLIST.
- **E.4** – In production, require DOWNLOAD_TOKEN_SECRET (no dev fallback). Middleware: X-Frame-Options, X-Content-Type-Options, optional CSP.

**Deliverable:** APIs protected; health check and security headers in place.

---

## Process

- Work **one task at a time** in order (0.1 → 0.5 → A.1 → … → E.4).
- After each task, mark the checkbox in the To-do list above and optionally confirm before starting the next.
- If a task depends on a design decision (e.g. exact accent color), pick a sensible default and note it in the doc; you can refine later.
