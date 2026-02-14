# Create flow – UX & UI implementation plan

Follow this plan task-by-task to redesign the create flow: **upload first**, then **choose style**, then **generation with loading progress** and **pet name** collection for email marketing.

**Design direction:** First screen invites upload (no “Create your portrait” button). After upload, “Choose style” reveals presets. After style selection, generation starts and a loading screen shows API progress plus a pet name field.

---

## To-do list (tracking)

### Phase 1: Upload-first entry

- [x] **Task 1.1** – Replace main CTA with upload placeholder on the first screen (home or create)
- [x] **Task 1.2** – After upload: show photo preview + “Choose style” button (no style grid yet)
- [x] **Task 1.3** – On “Choose style” press: show style preset grid (existing style examples)

### Phase 2: Style selection and generation

- [x] **Task 2.1** – On style select: start generation (upload file → POST /api/generate), then switch to loading screen
- [x] **Task 2.2** – Loading screen: full-screen UI with progress bar driven by generation API status
- [x] **Task 2.3** – While loading: show label + input for pet name; persist pet name (backend)

### Phase 3: Backend and data

- [x] **Task 3.1** – Add `pet_name` to generations (migration + API) and store when provided
- [x] **Task 3.2** – Ensure status API returns `progress` (0–100) for progress bar; use existing GET /api/generate/[id]/status

### Phase 4: Polish and edge cases

- [x] **Task 4.1** – Allow “Change photo” / “Change style” from loading (optional: cancel and go back)
- [x] **Task 4.2** – On generation complete: redirect to preview page (existing behavior)
- [x] **Task 4.3** – Error state on loading screen (retry / back) and empty/error states for styles

---

## Flow summary (target)

1. **First screen:** Image upload placeholder (drag-and-drop or click). No “Create your portrait” button here.
2. **After upload:** User sees their photo + one primary button: **“Choose style”**.
3. **After “Choose style”:** Style preset grid appears (Renaissance, Baroque, Victorian, etc.).
4. **After user picks a style:**  
   - Upload photo (POST /api/upload) → POST /api/generate with imageUrl + artStyle + petType.  
   - App shows **full-screen loading** with:  
     - Progress bar (poll GET /api/generate/[id]/status for `progress` 0–100).  
     - Label + input: **“What’s your pet’s name?”** – store for email marketing.
5. **When generation completes:** Redirect to `/preview/[generationId]` (unchanged).

---

## Task 1.1: Upload placeholder as first screen

**Goal:** The first thing the user sees is an upload area, not a “Create your portrait” button.

**Options (pick one or combine):**

- **A – Create page only:** Make the create page’s initial state a single upload zone (hero-style). No style selector, no pet type, until after upload. Back link to home.
- **B – Home page:** Replace the “Create your portrait” button on the home hero with an upload placeholder. On file select: either navigate to create with the file (e.g. via state/sessionStorage or temporary upload) or show “Choose style” on the same page.

**Implementation notes:**

- Use a large, dashed-border drop zone with copy like “Upload your pet’s photo” or “Drop your photo here”. Accept image/jpeg, image/png, image/webp; max 10MB.
- Reuse existing upload validation (file type, size). On success: store `file` and `previewUrl` (object URL), then show Task 1.2 UI.

**Deliverable:** First screen shows only upload placeholder (and optional back link). No style step visible yet.

---

## Task 1.2: After upload – preview + “Choose style” button

**Goal:** Once a photo is uploaded, show a preview of the photo and a single primary button: **“Choose style”**.

**Implementation notes:**

- Reuse existing preview (thumbnail or cropped 4:5 area) so the user sees their image.
- One prominent button: “Choose style”. Optional: “Change photo” (clear file and return to Task 1.1).
- Do not show the style grid yet; that appears only after the user clicks “Choose style” (Task 1.3).

**Deliverable:** After upload, user sees their photo + “Choose style” (and optionally “Change photo”).

---

## Task 1.3: Show style presets on “Choose style”

**Goal:** When the user presses “Choose style”, show the grid of style presets (existing style examples from `/api/styles`).

**Implementation notes:**

- Reuse current style cards (image + name + short description). Same API: GET /api/styles.
- User must select one style (visual state: selected = ring/border). No “Generate” yet – as soon as they select a style, you can auto-advance or show “Generate my portrait” (see Task 2.1). Plan says “after user selected one of the presets, the image generation begins”, so selection can trigger generation start.
- Pet type (dog/cat): either keep as a small selector on this step or default to dog and skip for now; document the choice.

**Deliverable:** Clicking “Choose style” reveals the style grid. Selecting a style leads to starting generation (Task 2.1).

---

## Task 2.1: Start generation and switch to loading screen

**Goal:** When the user has selected a style (and optionally pet type), start the generation and show the loading screen.

**Implementation notes:**

1. POST /api/upload with the selected file → get `imageUrl`.
2. POST /api/generate with `{ imageUrl, artStyle: selectedStyle, subjectType: 'pet', petType }` → get `generationId`.
3. Immediately switch the UI to the **loading screen** (Task 2.2). Store `generationId` for polling.

**Deliverable:** After style selection, upload + generate are called and the app shows the loading screen with the progress bar and pet name field.

---

## Task 2.2: Loading screen with progress bar

**Goal:** Full-screen loading UI with a progress bar that reflects the image generation API progress.

**Implementation notes:**

- Poll **GET /api/generate/[id]/status** on an interval (e.g. every 2s). Response includes `progress` (0–100) and `status` (`generating` | `completed` | `failed`).
- **Progress bar:** Use the `progress` value from the status API (existing). If the API does not return a real progress, use a deterministic or step-based value (e.g. 0 → 50 while `generating`, 100 when `completed`).
- Show a short message: “Creating your portrait…” and the progress bar. When `status === 'completed'`, redirect to `/preview/[generationId]`. When `status === 'failed'`, show error and retry/back (Task 4.3).

**Deliverable:** Loading screen visible until generation completes; progress bar updates from API; on success, redirect to preview.

---

## Task 2.3: Pet name during loading

**Goal:** While the loading screen is shown, ask for the pet’s name and store it for email marketing.

**Implementation notes:**

- On the loading screen, add a label (e.g. “What’s your pet’s name?”) and an input. Optional: “We’ll use this to personalize your experience.”
- **When to save:** On blur/submit or when redirecting to preview: send pet name to the backend (Task 3.1). If the user doesn’t fill it, still allow completion (optional field).
- Backend will persist `pet_name` on the generation row (or pass to order later). Task 3.1 adds the field and API.

**Deliverable:** Loading screen includes pet name field; value is sent to the API and stored (after Task 3.1).

---

## Task 3.1: Store pet name (backend)

**Goal:** Persist pet name for later use in email marketing.

**Implementation notes:**

- **Migration:** Add column `pet_name VARCHAR(255)` (or TEXT) to `generations`. Run in `supabase/migrations/`.
- **API:** Either:
  - **Option A:** PATCH /api/generate/[id] with body `{ petName }` to update the generation row, or
  - **Option B:** Include `petName` in POST /api/generate (if you collect it before starting – not the case here; we collect during loading). So prefer **PATCH /api/generate/[id]** or a dedicated **PATCH /api/generate/[id]/pet-name** that updates `generations.pet_name`.
- Frontend: when the user enters a name (or on redirect to preview), call the PATCH with the current value. If generation is already completed, PATCH still works.

**Deliverable:** `generations.pet_name` exists; PATCH endpoint updates it; create flow sends pet name when provided.

---

## Task 3.2: Progress from status API

**Goal:** Progress bar uses real or sensible progress from the generation API.

**Implementation notes:**

- **GET /api/generate/[id]/status** already returns `progress` (number 0–100). Stub: 10 → 50 → 100. Real ImagineAPI: use whatever the API returns; if it doesn’t return progress, keep using a step-based value (e.g. 25 / 50 / 100) in the status route.
- No change needed if the status route already returns `progress`. Verify in the client that the progress bar binds to `data.progress`.

**Deliverable:** Progress bar reflects `progress` from GET /api/generate/[id]/status.

---

## Task 4.1: Change photo / change style (optional)

**Goal:** From the loading screen, optionally allow “Change photo” or “Cancel” to go back and re-upload or re-pick style.

**Implementation notes:**

- “Cancel” or “Start over” could clear state and return to Task 1.1. If generation is already in progress, you may still allow going back (generation continues in background; user can land on preview later via link if needed, or ignore).
- Optional; can be deferred.

**Deliverable:** (Optional) Cancel / change photo from loading.

---

## Task 4.2: Redirect on completion

**Goal:** When generation completes, redirect to the preview page.

**Implementation notes:**

- Already in scope of Task 2.2: when polling returns `status === 'completed'`, `router.push(/preview/${generationId})`. Ensure pet name is sent before redirect if not already saved.

**Deliverable:** Completion triggers redirect to `/preview/[generationId]`.

---

## Task 4.3: Error and edge states

**Goal:** Loading screen handles failure and missing styles; first screen handles load errors.

**Implementation notes:**

- **Loading screen:** If `status === 'failed'`, show error message and “Try again” / “Back” (retry = back to style step or upload step).
- **Styles:** If styles fail to load when user clicks “Choose style”, show retry/empty state (reuse existing Create page error/empty UI).
- **Upload/validation:** Keep existing file type and size validation; show clear errors.

**Deliverable:** Error and empty states are handled with clear actions.

---

## Reference: current vs target flow

| Step | Current (Create page) | Target |
|------|------------------------|--------|
| 1 | Style grid + pet type + upload + “Generate preview” | Upload only (placeholder) |
| 2 | – | After upload: preview + “Choose style” |
| 3 | – | After “Choose style”: style grid |
| 4 | Submit → redirect to preview when done | Select style → start generation → loading screen with progress bar + pet name |
| 5 | – | On complete → redirect to preview |

---

## File and API reference

- **Create page:** `app/create/page.tsx` – refactor to upload-first, then style, then loading.
- **Status API:** `app/api/generate/[id]/status/route.ts` – returns `{ status, previewUrl?, progress?, errorMessage? }`.
- **Generate API:** `app/api/generate/route.ts` – POST with `imageUrl, artStyle, subjectType, petType`.
- **Upload API:** `app/api/upload/route.ts` – POST multipart file.
- **Styles API:** `app/api/styles/route.ts` – GET returns style list.
- **Schema:** `supabase/migrations/00001_phase1_schema.sql` – add `pet_name` in a new migration.

Work through tasks in order (1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 4.x). Mark checkboxes in this doc as you complete each task.
