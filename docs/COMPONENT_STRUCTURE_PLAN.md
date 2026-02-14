# Component structure plan – Header, Footer, home sections, rolling gallery placeholder

**Scope:** Separate every major UI block into its own component; home page only imports and composes them. No "How it works" section for now. Rolling gallery: placeholder only (reactbits import later). Best practices throughout.

---

## 1. Current state

- **Layout** ([app/layout.tsx](app/layout.tsx)): Renders `SiteHeader`, `<main>{children}</main>`, `SiteFooter` app-wide.
- **Header** ([components/site-header.tsx](components/site-header.tsx)): Sticky header, nav, mobile drawer. Already a separate component.
- **Footer** ([components/site-footer.tsx](components/site-footer.tsx)): Links, separator, copyright. Already a separate component.
- **Home** ([app/page.tsx](app/page.tsx)): Inline hero (h1 + p), category grid, disclaimer line. No section components.

---

## 2. Target structure (best practices)

- **One component per file**, named exports.
- **Layout components** (header, footer): stay at app level in root layout; optional move to `components/layout/` for clarity.
- **Page-specific sections**: live under a dedicated folder (e.g. `components/home/`) so the home page is a thin composition.
- **Containers**: Each section is a self-contained block (e.g. `<section>` or `<div>` with consistent wrapper classes: container, max-width, padding). No layout logic in `page.tsx` beyond composition order.
- **Rolling gallery**: One placeholder component; later swap for reactbits import.

---

## 3. Folder structure

```
components/
  layout/                    # optional: group header/footer
    site-header.tsx          # move from components/site-header.tsx
    site-footer.tsx          # move from components/site-footer.tsx
  home/                      # sections used only on home page
    hero-section.tsx
    category-grid.tsx
    trust-line.tsx
    rolling-gallery-placeholder.tsx
  primitives/                # existing (button, card, etc.)
  ... (create-flow, category-seo-block, etc. stay as-is)
```

Alternative (minimal change): keep `site-header.tsx` and `site-footer.tsx` at `components/` root, add only `components/home/` for the new sections. Layout keeps importing from `@/components/site-header` and `@/components/site-footer`.

**Recommendation:** Add `components/home/` and keep header/footer at top level (no move) to avoid touching layout imports. If you prefer a single `layout/` folder, move header/footer there and update layout imports once.

---

## 4. Components to add (home page)

### 4.1 `components/home/hero-section.tsx`

- **Props:** None, or `{ title, description }` if you want config later.
- **Content:** Same as current: main heading "Classic portraits, your way", subhead paragraph.
- **Container:** Wrapper with same padding/width as current (e.g. `max-w-3xl`, `text-center`, `px-4`, `py-16 md:py-24` or delegated to parent).
- **Export:** `export function HeroSection() { ... }`

### 4.2 `components/home/category-grid.tsx`

- **Props:** None (uses `CATEGORY_ROUTES`, `SUBJECT_TYPE_IDS` from `@/lib/prompts/artStyles`; icons map can live in the component or a small `home/constants`).
- **Content:** Grid of category cards (current markup: Link, icon, title, subtitle).
- **Container:** Section wrapper + `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` and consistent spacing.
- **Export:** `export function CategoryGrid() { ... }`

### 4.3 `components/home/trust-line.tsx`

- **Props:** Optional `className` for spacing.
- **Content:** Single line: "No credit card for preview. Same image in high resolution when you purchase—no re-generation, no surprises."
- **Export:** `export function TrustLine() { ... }`

### 4.4 `components/home/upload-section.tsx`

- **Purpose:** Upload option on the main page. **Must remain on the home page** – do not remove.
- **Content:** Prominent CTA card linking to `/pet-portraits` (create flow): “Upload your photo” + short line about 2 free portraits.
- **Export:** `export function UploadSection() { ... }`

### 4.5 `components/home/rolling-gallery-placeholder.tsx`

- **Purpose:** Reserve the spot for the rolling gallery; replace with reactbits later.
- **Content:** Minimal: a `<section>` with a stable id or data-attribute (e.g. `data-section="rolling-gallery"`), optional placeholder text like "Gallery" or empty. No complex logic, no real gallery implementation.
- **Export:** `export function RollingGalleryPlaceholder() { ... }`
- **Comment in file:** "TODO: Replace with rolling gallery from reactbits."

---

## 5. Home page composition ([app/page.tsx](app/page.tsx))

- **Metadata:** Keep in `page.tsx` (export `metadata`).
- **Body:** Compose sections in order. Example:

```tsx
import { HeroSection } from '@/components/home/hero-section'
import { CategoryGrid } from '@/components/home/category-grid'
import { TrustLine } from '@/components/home/trust-line'
import { RollingGalleryPlaceholder } from '@/components/home/rolling-gallery-placeholder'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:py-24">
      <HeroSection />
      <RollingGalleryPlaceholder />
      <main className="max-w-3xl w-full text-center">
        <CategoryGrid />
        <TrustLine />
      </main>
    </div>
  )
}
```

Adjust wrapper vs inner `main` so spacing and max-width match current design (e.g. Hero and CategoryGrid may share the same `max-w-3xl` container; decide in implementation).

---

## 6. Header and Footer

- **No change to behavior:** Already separate components used in root layout.
- **Optional:** Move files to `components/layout/site-header.tsx` and `components/layout/site-footer.tsx`, then in [app/layout.tsx](app/layout.tsx) update imports to `@/components/layout/site-header` and `@/components/layout/site-footer`. Not required for "separate container" goal.

---

## 7. Best practices checklist

- [ ] One component per file; named exports.
- [ ] Sections get a semantic wrapper (`<section>` where appropriate) and consistent container classes.
- [ ] Home page has no layout or styling logic beyond composing sections and one outer wrapper.
- [ ] Category data and copy stay in `lib/` or `home/constants`; components stay presentational.
- [ ] Rolling gallery: only placeholder; no custom gallery implementation (reactbits later).
- [ ] No "How it works" block in this phase.

---

## 8. Implementation order

1. Add `components/home/` and create the four components (hero, category-grid, trust-line, rolling-gallery-placeholder).
2. Refactor [app/page.tsx](app/page.tsx) to import and compose them; remove inline JSX.
3. (Optional) Move `site-header.tsx` and `site-footer.tsx` into `components/layout/` and update layout imports.
4. Verify home page visually and that rolling gallery placeholder is where you want it for the future reactbits swap.

---

## 9. Rolling gallery (later)

- When integrating reactbits: replace `RollingGalleryPlaceholder` usage in `page.tsx` with the reactbits rolling gallery component (or a thin wrapper that imports it). Remove or repurpose `rolling-gallery-placeholder.tsx` as needed.
