# Frontend plan – No shadcn, React Bits–style UI

This plan replaces **shadcn/ui** with a **Tailwind-first** design system and **React Bits** (or equivalent) for animated, standout UI. It is the single reference for the new frontend direction.

**Design direction:** Keep the existing atelier look (tokens in `globals.css`, Playfair + DM Sans). Use React Bits for hero text, backgrounds, and scroll/entrance effects; use simple Tailwind primitives for forms, buttons, and layout. **Do not use shadcn or shadcncdn.**

---

## Principles

- **No shadcn:** Remove all `@/components/ui` shadcn imports. Replace with in-repo primitives and React Bits where it adds impact.
- **React Bits:** [reactbits.dev](https://reactbits.dev/get-started/introduction) – copy-paste or CLI per component; modular (no library dependency). Use for:
  - **Text animations** (e.g. hero headline)
  - **Backgrounds** (e.g. subtle hero/section background)
  - **Animations** (e.g. fade-in on scroll, entrance)
- **Less is more:** React Bits recommends 2–3 components per page; prefer static or light motion on mobile.
- **Forms and controls:** Native `<button>`, `<input>`, `<label>` with Tailwind and design tokens only.

---

## React Bits – How we use it

- **Install:** Per [Installation](https://reactbits.dev/get-started/installation): pick a component from the docs → install any deps (e.g. `gsap`) → copy the code (Code tab; choose TypeScript + Tailwind) → use in the app.
- **Optional:** Add React Bits registry to `components.json` and use shadcn CLI only for **browsing/adding React Bits** (e.g. `npx shadcn@latest add https://reactbits.dev/r/...`) if the project still has a `components.json`; otherwise copy-paste only.
- **Categories (from [Index](https://reactbits.dev/get-started/index)):** Animations, Backgrounds, Components, Text Animations. We use these where they improve hero, upload, or key moments (e.g. generating screen).

---

## Component mapping (shadcn → replacement)

| Current (shadcn) | Replacement |
|------------------|-------------|
| **Button** | Tailwind primitive: `components/primitives/button.tsx` (or inline `className` with tokens: `bg-primary text-primary-foreground rounded-md px-4 py-2 ...`). |
| **Card / CardContent** | Tailwind primitive: `div` with `rounded-xl border border-border bg-card p-6` (or a small `primitives/card.tsx`). |
| **Input** | Native `<input>` with Tailwind: `rounded-md border border-input bg-background px-3 py-2 text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`. |
| **Label** | Native `<label>` with `text-sm font-medium text-foreground` and `htmlFor` wiring. |
| **Separator** | `<hr className="border-border" />` or `div` with `border-t border-border`. |
| **Skeleton** | Tailwind only: `div className="animate-pulse rounded-md bg-muted"` (optionally in `primitives/skeleton.tsx`). |
| **Sheet** (mobile nav) | Custom drawer: overlay + panel with Tailwind + `open` state; or a React Bits “drawer”/“panel” component if one exists and fits. |

---

## Per-screen / per-area plan

### Home (create flow – `app/page.tsx`)

- **Hero headline:** Optional React Bits **text animation** (e.g. SplitText or similar) for “Turn your pet into a classic portrait”. If none is used, keep current `font-heading` styled `h1`.
- **Subtext:** Plain `<p>` with `text-muted-foreground`.
- **Upload zone:** Keep current drop zone (no shadcn). Optional: wrap in a React Bits **fade-in** or **reveal** so the upload area appears with a short animation.
- **No “How it works” section** – removed for now.
- **Preview step:** Photo + “Choose style” – use primitive **Button** and existing layout.
- **Style grid:** Use **Card** primitive (Tailwind card) for each style tile; no shadcn.
- **Generating step:** Progress bar (existing) + pet name **Input**/Label (primitives). Optional: React Bits **animation** for the progress or a subtle background to make the wait feel nicer.
- **Buttons (Change photo, Choose style, etc.):** All primitive Button.

### Preview (`app/preview/[generationId]/page.tsx`)

- **Layout:** **Card** primitive for the portrait + CTA; **Button** primitives for “Buy bundle” / “Order lookup”.

### Checkout (`app/checkout/page.tsx`)

- **Form:** **Input** + **Label** primitives; **Button** for submit. No shadcn.

### Download, Order lookup, Legal (terms, privacy, refunds, contact)

- **Buttons and links:** Primitive Button; **Separator** → `hr` or bordered `div`.
- **Order lookup form:** Input + Label + Button primitives.

### Site header (`components/site-header.tsx`)

- **Nav links and CTA:** Primitive Button.
- **Mobile:** Replace **Sheet** with a **custom drawer** (Tailwind overlay + slide-in panel, `aria-expanded` and focus trap for a11y).

### Site footer (`components/site-footer.tsx`)

- **Separator** → `hr` or `div` with border. Links stay as-is.

### Error and loading

- **404 (`app/not-found.tsx`), Error boundary (`app/error.tsx`):** Primitive **Button** for “Back to home” / “Try again”.
- **Route loading (`loading.tsx`):** **Skeleton** primitive (Tailwind `animate-pulse` blocks) for layout placeholders.

---

## Implementation order

1. **Add primitives** – Create `components/primitives/` with:
   - `button.tsx` – variants: default, secondary, outline, ghost (Tailwind + tokens).
   - `card.tsx` – wrapper + optional CardContent.
   - `input.tsx` – styled native input.
   - `label.tsx` – styled native label.
   - `skeleton.tsx` – pulse placeholder.
   - (Optional) `separator.tsx` – thin horizontal rule.

2. **Remove “How it works”** – Delete the “How it works” section from the home page (upload step).

3. **Replace shadcn usage** – In every file that imports from `@/components/ui`:
   - Swap to `@/components/primitives/...` (or inline Tailwind where it’s a one-off).
   - Replace Sheet with custom mobile drawer in `site-header.tsx`.

4. **Remove shadcn** – Delete `components/ui/*` (button, card, input, label, separator, skeleton, sheet). Remove shadcn-related deps from `package.json` if nothing else uses them (e.g. `class-variance-authority`, `clsx`, `tailwind-merge` can stay for primitives).

5. **Add React Bits where desired** – Per [reactbits.dev](https://reactbits.dev/get-started/introduction):
   - Pick 1–2 components for home (e.g. one text animation for hero, one subtle background or fade-in).
   - Install deps (e.g. `gsap`) and copy component code into the repo (e.g. `components/react-bits/...`).
   - Use on home hero and optionally on generating step; avoid overloading the page.

6. **Optional: React Bits registry** – If you keep a `components.json` for tooling, add `"@react-bits": "https://reactbits.dev/r/{name}.json"` to browse/add components via CLI; otherwise rely on copy-paste from the docs.

---

## Files to touch (summary)

- **New:** `components/primitives/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `skeleton.tsx` (and optionally `separator.tsx`).
- **Replace imports / implementation:** `app/page.tsx`, `app/checkout/page.tsx`, `app/preview/[generationId]/page.tsx`, `app/download/page.tsx`, `app/order-lookup/page.tsx`, `app/contact/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/refunds/page.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`, `app/create/loading.tsx`, `app/checkout/loading.tsx`, `app/download/loading.tsx`, `app/order-lookup/loading.tsx`, `components/site-header.tsx`, `components/site-footer.tsx`.
- **Remove:** Entire `components/ui/` directory (after primitives are in place and all imports updated).
- **Remove from home:** “How it works” block in `app/page.tsx` (upload step).

---

## References

- [React Bits – Introduction](https://reactbits.dev/get-started/introduction)
- [React Bits – Installation](https://reactbits.dev/get-started/installation)
- [React Bits – Index (Animations, Backgrounds, Components, Text Animations)](https://reactbits.dev/get-started/index)
- Existing design tokens: `petportrait/app/globals.css`
- Create flow UX: `docs/CREATE_FLOW_UX_PLAN.md`
