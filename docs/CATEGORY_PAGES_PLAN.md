# Category pages plan – Pet, Family, Children, Couple, Self-portrait

Inspired by [Fable (fable.surrealium.world)](https://fable.surrealium.world/), this plan adds **multiple portrait categories** (pet, family, children, couple, self-portrait), each with **working flows** (category-specific presets, inputs, and prompts) and **strong SEO** (metadata, landing content, structured data).

---

## Goals

1. **Multiple category pages** – Dedicated routes and landing pages for each portrait type.
2. **They must really work** – Different presets (art styles), inputs (single vs multiple photos where needed), and prompts per category so the AI output is appropriate.
3. **SEO as a priority** – Each category page is a standalone SEO asset: unique titles/descriptions, rich copy, optional FAQs, JSON-LD, internal linking.

---

## 1. Category definition and routes

| Category        | Route (SEO-friendly)   | Subject type | Reference images | Notes |
|----------------|------------------------|--------------|------------------|--------|
| Pet            | `/pet` or `/pet-portraits`   | pet          | 1                | Current flow; keep as-is or move from `/`. |
| Family         | `/family-portraits`    | family       | 2–6+             | Multiple people in one portrait; multi-image input. |
| Children       | `/children-portraits`  | children     | 1 (or 2–3)       | Child-focused styles and prompts; 1 main photo typical. |
| Couple         | `/couple-portraits`    | couple       | 2                | Two people; two reference photos. |
| Self-portrait  | `/self-portrait`      | self         | 1                | Single person (user); human-focused prompts. |

**Recommendation:** Use **single canonical route per category** (e.g. `/pet-portraits`, `/family-portraits`, `/children-portraits`, `/couple-portraits`, `/self-portrait`). Home (`/`) can either link to all categories or remain the main “pet” flow with a category switcher in the header/nav.

---

## 2. Data model and API changes

### 2.1 Generations table

- **subject_type** – Already exists (VARCHAR). Extend allowed values: `pet`, `pet_dog`, `pet_cat`, `family`, `children`, `couple`, `self`.
- **reference_image_urls** (new, optional) – JSONB or TEXT array for multiple reference images (e.g. couple = 2 URLs, family = N URLs). If your AI API only accepts one image URL, keep `original_image_url` as the “primary” and document that multi-subject prompts may use a single composite or the first image until the API supports multiple refs.

Migration idea:

```sql
-- Optional: add column for multiple reference images (for couple/family later)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS reference_image_urls JSONB;
-- subject_type already supports any VARCHAR; validate in app for family, couple, children, self
```

### 2.2 Styles and presets per category

- **Current:** One global list of art styles from `ART_STYLE_IDS` / `ART_STYLE_PROMPTS`; same for all.
- **Target:** Each category has its own **style set** (subset or full set):
  - **Pet** – Current 5 (Renaissance, Baroque, Victorian, Regal, Belle Époque); optionally add pet-only styles.
  - **Family / Children / Couple / Self** – Same or different style IDs; each has **category-specific prompt templates** (no `petModifier`; use “family in Renaissance style”, “couple in Baroque style”, “child in Victorian style”, “elegant self-portrait in Belle Époque style”, etc.).

Implementation options:

- **A. Single artStyles file, category-aware prompts**  
  Keep one `ART_STYLE_PROMPTS` map. Add a **prompt builder per category**: e.g. `buildPrompt(artStyle, subjectType)` where `subjectType` is `pet | family | children | couple | self`. Each subject type has its own modifier or template (e.g. `familyModifier`, `selfModifier`, or a map `SUBJECT_PROMPTS[subjectType]`).

- **B. Style sets per category**  
  Define `STYLES_BY_CATEGORY: Record<CategoryId, ArtStyleId[]>` so some categories can hide or reorder styles. API: `GET /api/styles?category=family` returns only styles for that category (and shared styles). Frontend calls `/api/styles?category=pet` or `?category=family` depending on the page.

Recommendation: **A + B** – category-aware `buildPrompt` plus optional `STYLES_BY_CATEGORY` so each category page only shows relevant presets.

### 2.3 Generate API

- **Body today:** `imageUrl`, `artStyle`, `subjectType`, `petType` (optional).
- **Body extended:**  
  - `subjectType`: `pet | family | children | couple | self`.  
  - `imageUrl`: required for single-image categories.  
  - `imageUrls`: optional array for couple/family (when supported).  
- **Validation:** Per `subjectType`: require 1 image (pet, children, self) or 2 (couple) or 2–6 (family). If the current AI only accepts one image, use the first image and a prompt that describes “couple” or “family” until multi-image is available.
- **Prompt:** Call `buildPrompt(artStyle, subjectType, options)` so the same art style produces different text for pet vs family vs couple vs self (and children).
- **DB:** Store `subject_type` as the new value; store `reference_image_urls` if you add the column and the client sends multiple URLs.

---

## 3. Prompt and style system (make categories “really work”)

### 3.1 Prompt builder per category

- **Pet** – Keep current logic: `petModifier` + base prompt; optional dog/cat.
- **Self** – New: “elegant self-portrait in [style], single person, period costume, museum-quality portrait”, etc. No pet modifier.
- **Couple** – “Two people together in [style], couple portrait, period attire, romantic and dignified”, etc. (If only 1 image is sent, prompt can say “couple portrait from reference” and rely on the single reference until API supports 2.)
- **Family** – “Family group portrait in [style], multiple figures, period setting, dignified and warm”, etc.
- **Children** – “Child portrait in [style], young subject, period-appropriate attire, soft and refined”, etc.

All of these should still use the same `basePrompt` structure (style, lighting, era) so the output is coherent with your existing art styles.

### 3.2 Example style–category matrix

- Same 5 art styles can be used for all categories, with different modifier text per category.
- Optionally, add 1–2 styles per category (e.g. “Storybook” for children, “Romantic” for couple) and expose them only on that category’s style selector.

### 3.3 Example images per category

- **Current:** `/style-examples/{id}.jpg` – one image per style (e.g. dog/cat).
- **Target:** Per-category example images so the style grid shows relevant subjects:
  - Pet: existing dog/cat examples.
  - Self: human portrait examples.
  - Couple: two people in that style.
  - Family: group in that style.
  - Children: child in that style.

Store in `public/style-examples/` with a convention, e.g. `{category}_{styleId}.jpg`, and have the API return `exampleImageUrl` per style and category (e.g. `GET /api/styles?category=self` → `exampleImageUrl: /style-examples/self_renaissance.jpg`). If a file is missing, fall back to a default or the same style from another category.

---

## 4. Frontend: one flow per category

### 4.1 Shared vs category-specific

- **Shared:** Upload zone (single file), style grid component, preview step, generating step (progress + pet name or “name” field), checkout, download. Reuse as much as possible.
- **Category-specific:**
  - **Pet** – 1 photo; optional “pet’s name”; style grid with pet example images; `subjectType: 'pet'`.
  - **Self** – 1 photo; optional “your name” or skip; style grid with self-portrait examples; `subjectType: 'self'`.
  - **Couple** – 2 photos (two upload slots or two-step upload); optional names; style grid with couple examples; `subjectType: 'couple'`, send `imageUrls: [url1, url2]` when supported.
  - **Family** – Multiple photos (e.g. 2–6); optional “family name” or names; style grid with family examples; `subjectType: 'family'`.
  - **Children** – 1 photo (or 2–3 for siblings); optional “child’s name”; style grid with child examples; `subjectType: 'children'`.

### 4.2 Route structure

- **Option A – One page per category:**  
  `app/(marketing)/pet-portraits/page.tsx`, `family-portraits/page.tsx`, … Each page contains the full create flow (upload → preview → styles → generating → redirect to preview). Pro: clear URLs, easy to assign unique metadata and SEO content. Con: some duplication of flow logic.

- **Option B – Shared create flow with category param:**  
  `app/create/page.tsx` with `?category=pet|family|children|couple|self` (or `/create/pet`, `/create/family`, etc.). One flow component reads the category and adjusts upload (1 vs 2 vs N), style request, and API body. Pro: single flow to maintain. Con: URLs are less “landing-page” friendly unless you use routes like `/pet-portraits/create` or `/family-portraits/create`.

Recommendation: **Option A** – dedicated route per category (e.g. `/pet-portraits`, `/family-portraits`) so each URL is a clear SEO and landing page. The create flow can be a **shared client component** (e.g. `<CreateFlow category="pet" />`) that receives `category` and config (number of photos, label copy, style API param). Each category route then renders:

- **SEO block:** H1, intro, benefits, optional FAQs, internal links.
- **Create flow:** `<CreateFlow category="pet" />` (or family, couple, etc.).

---

## 5. SEO: make each page a powerful tool

### 5.1 Metadata (required)

- **Title** – Unique per category. E.g. “Pet Portraits in Classic Art Styles | petportrait.shop”, “Family Portraits as Classic Paintings | petportrait.shop”, “Couple Portraits – Renaissance & Baroque Style | petportrait.shop”.
- **Description** – 150–160 chars, keyword-rich, different per category. Include main keyword (e.g. “pet portraits”, “family portrait painting”, “couple portrait”, “child portrait”, “self portrait classic”).
- **OG/Twitter** – Same title/description; use a category-specific image if available (e.g. hero or example for that category).
- **Canonical** – Self-referencing canonical URL for each category page.

### 5.2 On-page content (recommended)

- **H1** – One per page, matching intent (e.g. “Classic Pet Portraits”, “Family Portraits in Oil Painting Style”, “Couple Portraits – Timeless Art”).
- **Intro paragraph** – 2–4 sentences explaining what the page offers and why it’s valuable (e.g. “Turn your pet into a Renaissance masterpiece”, “Bring your family together in a Baroque group portrait”).
- **Benefits / features** – Short bullets or sections (e.g. “Multiple art styles”, “Digital delivery”, “High-resolution files”, “No re-generation – what you see is what you get”).
- **Internal links** – To other category pages (“Also try our Family Portraits” / “See Pet Portraits”), Terms, Privacy, Contact.
- **Optional:** Short FAQ section (e.g. “How many photos for a family portrait?”, “Can I use this for commercial use?”) with schema markup (see below).

### 5.3 Structured data (JSON-LD)

- **WebPage** – `name`, `description`, `url` per category.
- **Product** or **Service** – If you treat each category as a product (e.g. “Pet Portrait – Digital Bundle”), one per category with `name`, `description`, `url`.
- **BreadcrumbList** – Home → Category name.
- **FAQPage** (optional) – If you add FAQs per category, add `FAQPage` with questions and answers.

Inject these in the `<head>` or layout for each category route (e.g. via a shared component that takes `category` and outputs the script tag).

### 5.4 Sitemap and internal linking

- Add all category URLs to `sitemap.xml` (or Next.js app sitemap).
- Header or footer: “Portraits” dropdown or list (Pet, Family, Children, Couple, Self-portrait) so every category is one click from any page.

---

## 6. Implementation order (phased)

### Phase 1 – Foundation (categories + prompts, no multi-image yet)

1. **Define categories in code** – Enum or const: `PORTRAIT_CATEGORIES = ['pet', 'family', 'children', 'couple', 'self']` with display names and routes.
2. **Prompt layer** – Extend `lib/prompts/artStyles.ts` (or new file): `buildPrompt(artStyle, subjectType, options)` where `subjectType` is one of the five. For pet, keep current behavior; for self/couple/family/children add new modifier templates. No multi-image yet; couple/family can use a single image + text description in the prompt.
3. **Styles API** – `GET /api/styles?category=pet|family|...` returns styles for that category; optionally filter style IDs per category and return category-specific `exampleImageUrl` (e.g. `style-examples/self_renaissance.jpg`).
4. **Generate API** – Accept `subjectType` in body; validate allowed values; pass to `buildPrompt`; store `subject_type` in `generations`. Keep single `imageUrl` for now.

### Phase 2 – Routes and flows

5. **Category routes** – Add routes: `/pet-portraits`, `/family-portraits`, `/children-portraits`, `/couple-portraits`, `/self-portrait`. Each route renders a shared `<CreateFlow category="…" />` and category-specific SEO content (H1, intro, benefits).
6. **CreateFlow component** – Refactor current home flow into a reusable component that: takes `category`; calls `/api/styles?category=…`; shows 1 upload (or later 2/N for couple/family); sends `subjectType` and `imageUrl` (and later `imageUrls`) to `/api/generate`.
7. **Home page** – Either redirect `/` to `/pet-portraits` or show a category picker (cards linking to each category) plus optional hero for “pet” as the main product.

### Phase 3 – SEO

8. **Metadata** – Per-route `metadata` (or `generateMetadata`) for title, description, openGraph, twitter for each category.
9. **Landing content** – Add intro, benefits, internal links, and optional FAQs to each category page.
10. **JSON-LD** – Add WebPage (and optionally Product/Service, BreadcrumbList, FAQPage) per category.
11. **Sitemap** – Include all category URLs. Add nav/footer links to all categories.

### Phase 4 – Multi-image and polish (optional)

12. **Multi-image support** – If your AI API supports multiple reference images: add `reference_image_urls` to DB; extend upload API to accept multiple files or multiple URLs; send array to generate API; update prompt builder for couple/family to reference “two people” or “family group” from refs. If not supported, keep single-image + descriptive prompts and document the limitation.
13. **Category-specific example images** – Add and wire `style-examples/{category}_{styleId}.jpg` (or similar) so each category’s style grid shows relevant examples.
14. **Optional extra styles per category** – Add 1–2 styles only for e.g. children or couple and expose them only in the right category.

---

## 7. Files to add or touch (summary)

| Area | Files |
|------|--------|
| **Categories + prompts** | `lib/prompts/artStyles.ts` (or `lib/prompts/categories.ts`), `lib/prompts/buildPrompt.ts` (category-aware builder) |
| **Styles API** | `app/api/styles/route.ts` (query `category`, optional filtering, category example URLs) |
| **Generate API** | `app/api/generate/route.ts` (body `subjectType`, validation, pass to prompt builder) |
| **AI layer** | `lib/ai/midjourney.ts` (accept subjectType; use new buildPrompt) |
| **Create flow** | New shared component e.g. `components/create-flow.tsx` (category prop, styles from API, subjectType in request) |
| **Category pages** | `app/pet-portraits/page.tsx`, `app/family-portraits/page.tsx`, `app/children-portraits/page.tsx`, `app/couple-portraits/page.tsx`, `app/self-portrait/page.tsx` (each: metadata, SEO block, `<CreateFlow category="…" />`) |
| **Home** | `app/page.tsx` (category picker or redirect to `/pet-portraits`) |
| **SEO** | JSON-LD component or inline script per category; sitemap update |
| **Nav/footer** | Header and/or footer links to all category pages |
| **DB** | Optional migration: `reference_image_urls`; extend `subject_type` validation in app |

---

## 8. Success criteria

- Each category has a **dedicated URL** and a **working create flow** (upload → style → generate → preview → purchase) with **category-appropriate prompts** and **styles**.
- **Pet** remains fully working; **self, couple, family, children** produce on-style portraits (single image for now; multi-image when API supports it).
- Each category page has **unique title, description, and on-page content** and is **indexable**; **internal links** and **structured data** are in place so the site can gain exposure for queries like “classic pet portrait”, “family portrait painting”, “couple portrait Renaissance”, etc.

This plan keeps the current pet flow intact, extends the system so every category “really works” with different presets and prompts, and makes each category page a strong SEO asset.
