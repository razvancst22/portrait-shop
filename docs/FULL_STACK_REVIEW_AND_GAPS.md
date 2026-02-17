# Full-Stack Review and Gaps – Best Practices

Review of the petportrait flow and codebase after the GPT Image + preview-protection work. Focus: **what we did**, **end-to-end workflow**, and **gaps / best-practice improvements**.

---

## What We Did (Summary)

1. **Image generation:** Switched from ImagineAPI/Midjourney to **OpenAI GPT Image API** (Images Edit, reference + prompt). When `OPENAI_API_KEY` is set, generation uses `openai-{generationId}`; status poll runs GPT Image once, uploads result, watermarks, marks completed.
2. **Prompts:** `artStyles.ts` – 4:5 and composition in copy only; no crop helper, no hardcoded size in API.
3. **Preview protection:** Watermarked previews are **never** exposed as direct storage URLs. Served via **`GET /api/generate/[id]/preview`** (proxy, session check, `no-store`). Frontend: no right-click, no drag, `draggable={false}`.
4. **Bundle:** `final_image_url` can be a storage path; createBundle resolves path → signed URL when needed.
5. **Bug fix:** Restored `SIGNED_URL_EXPIRY` in status route (used for watermark step).

---

## End-to-End Workflow

```
User → Upload (POST /api/upload) → imageUrl
     → Create generation (POST /api/generate) → generationId, jobId
     → Poll status (GET /api/generate/[id]/status) → completed + previewUrl (/api/.../preview)
     → View preview (GET /api/generate/[id]/preview) → stream image (session check)
     → Checkout (POST /api/checkout) → Stripe Checkout URL
     → Stripe webhook (checkout.session.completed) → order paid, bundle generated, email
     → Download (token in email) or order lookup
```

**Credits:** Guest gets 2 free tokens (cookie + optional `guest_token_usage` in DB). Generate deducts 1 before creating the row. **Rate limiting:** Middleware applies to POST `/api/upload`, `/api/generate`, `/api/checkout`, `/api/order-lookup` (in-memory; per IP).

---

## Unlogged (guest) user: how we remember them, how long we keep data, and limiting token use

### How we remember a non-logged user

- **Cookie:** `guest_id` (HTTP-only, `sameSite: lax`, **max age 1 year**). Value is a UUID. Set on the first request that needs a guest (e.g. first `/api/generate` or first `/api/credits`). If the user has no cookie, we create a new UUID and set the cookie on the response.
- **DB (when Supabase is configured):**
  - **`generations.session_id`** – we store the same `guest_id` here so we can list “my generations” (`/api/my-generations`) and enforce preview access (only the guest who created the generation can load the preview).
  - **`guest_token_usage`** – one row per `guest_id`: `tokens_used` (0, 1, or 2). Used to enforce “2 free generations per guest” across requests. Balance = `2 - tokens_used`.

So the “memory” of the guest is: **cookie for identity**, **DB for token count and generations**. No login; no email until checkout.

### How long we keep their “project”

| Data | Current retention | Notes |
|------|-------------------|--------|
| **Cookie** | 1 year | User can clear it anytime; then they get a new guest_id and, in current logic, 2 new free tokens. |
| **guest_token_usage** | Forever | Rows are never deleted. Once a guest has used 2 tokens, that `guest_id` never gets more free tokens (as long as they keep the cookie). |
| **generations** | Forever | No purge. All generations (and their storage files) stay in DB and Supabase Storage until you add cleanup. |

So today we **do not** delete old guest generations or old `guest_token_usage` rows. That keeps implementation simple but allows DB/storage to grow and, as below, allows token abuse by getting new cookies.

### Why it’s done this way

- **Cookie 1 year:** Balances “returning visitor is still the same guest” with not keeping identity forever. Lets “my portraits” and preview access work without login.
- **Token usage in DB:** So the 2-free limit is enforced even if the client tampers with cookies; one source of truth per guest.
- **No purge of generations:** Simplest behavior; “my portraits” and purchase links keep working. Downside: cost and growth if you have many guests.

### Best practices so we don’t “consume tons of tokens”

You care about two things: **(1) abuse of free tokens** and **(2) storage/DB growth.**

**1. Abuse: “unlimited” free tokens by getting new guest_ids**

Right now, a new cookie (incognito, new device, or clearing cookies) = new `guest_id` = 2 more free generations. So one person could get many free generations by repeatedly getting a new guest.

- **Rate limit (you have it):** POST `/api/generate` is already rate-limited per IP (e.g. 10/min). That caps how many generations per minute from one IP but does **not** cap how many different guest_ids that IP can use over time.
- **Cap free tokens per IP (or per fingerprint) over a longer window:** e.g. in DB or Redis: “IP X has used at most N free tokens in the last 30 days”. When a guest (even with a new cookie) triggers a generation, check that count; if already ≥ N (e.g. 2 or 4), return 403 “no more free generations from this device/IP for now”. So even with new cookies, abuse is bounded per IP (or per fingerprint). Implementation: before deducting a token, look up “this IP’s free generations in last 30 days”; if already ≥ 2 (or your chosen cap), reject. Increment that count when you deduct a guest token. Optionally use a hash of IP + User-Agent instead of raw IP for a bit of device stability.
- **Softer option – require email for the 2nd free:** e.g. first generation is fully anonymous; for the second, “enter your email to unlock”. Then you can cap per email (and optionally later tie that email to a real account). Reduces anonymous abuse without blocking normal users.

**2. Storage and DB growth**

- **Retention policy for unpurchased generations:** e.g. “delete generations where `is_purchased = false` and `created_at` is older than 90 days”. Run a cron (or Supabase Edge Function / scheduled job) that deletes those rows and the corresponding files in storage (preview + final). Keeps “my portraits” and purchase links working for 90 days; after that, only purchased ones remain. You can tune the window (30, 60, 90 days).
- **Optional: purge old guest_token_usage:** If you want to reclaim rows for guest_ids that haven’t been seen in a year, you could delete `guest_token_usage` where `updated_at` (or `created_at`) is older than 1 year. Then if that guest returns with the same cookie, they’d get 2 tokens again. Usually less important than purging generations.

**Summary**

- **Remember:** Cookie `guest_id` (1 year) + DB (`session_id` on generations, `guest_token_usage`).
- **Keep project:** Currently forever; no automatic purge.
- **Why:** Simple behavior, one source of truth for tokens, “my portraits” and purchase links stay valid.
- **Implemented:** **30-day cap per IP and per device.** We store hashed IP and hashed device (User-Agent + Accept-Language) in `free_generation_usage`. Before allowing a free generation we check: free uses from this IP in last 30 days < 2 **and** free uses from this device in last 30 days < 2. If either cap is hit, we return 403 with code `FREE_CAP_30_DAYS`. Requires migration `00004_free_generation_usage.sql` and optional env `ABUSE_PREVENTION_SECRET` (else we use Supabase service key for hashing).
- **Still recommended:** (b) optionally require email for 2nd free; (c) add a retention job to delete old **unpurchased** generations (and their files) after N days; (d) optional cron to delete `free_generation_usage` rows older than 30 days to keep the table small.

---

### Where else we might need similar preventions

| Area | Current | Suggestion |
|------|--------|------------|
| **Generate** | Rate limit 10/min; 30-day cap per IP + device (above). | Done. |
| **Checkout / payment** | Rate limit 5/min. | Optional: flag or block if same IP has many failed payments or many new orders in a short window (fraud). |
| **Upload** | Rate limit 15/min. | Optional: per-IP daily upload cap (e.g. 50/day) to limit storage abuse. |
| **Preview** | No rate limit. | Add a low rate limit per IP (e.g. 60/min) so preview endpoint isn’t hammered (see point 8). |
| **Order lookup** | Rate limit 5/min. | Optional: cap lookups per email or per IP per day to reduce enumeration. |
| **Login / auth** (if added) | — | Rate limit attempts per IP and per email; consider lockout after N failures. |
| **Contact / support form** | — | Rate limit per IP (e.g. 5/hour) to prevent spam. |

No need to add all of these at once; add when you see abuse or before launching a new surface (e.g. contact form).

---

## Gaps and Best-Practice Recommendations

### 1. **Validate before deducting token (generate route)**

**Issue:** Today we deduct a guest token, then parse and validate `imageUrl` / `artStyle`. If validation fails (e.g. invalid artStyle), we return 400 but the token is already deducted.

**Recommendation:** Validate body (and optionally check balance) first; only call `deductGuestToken` after validation passes. If insert or start generation fails, consider refunding the token (or document that “submit” consumes the token even on validation/backend errors).

---

### 2. **Checkout: optional ownership check**

**Issue:** Anyone who knows `generationId` can call checkout and pay for that generation. For a guest flow this is often acceptable (preview link is “their” link), but if you want to tighten: ensure the generation’s `session_id` matches the current guest cookie (or that the generation is not already purchased).

**Recommendation:** If you need “only the creator can buy this”, add a check in checkout: load generation, compare `gen.session_id` with `GUEST_ID_COOKIE`; reject 403 if mismatch. Otherwise document that “possession of the preview link is enough to purchase”.

---

### 3. **API request validation (Zod or similar)**

**Issue:** Request bodies are cast and validated with ad-hoc checks (`isAllowedArtStyle`, `typeof imageUrl === 'string'`). This works but is easy to drift and doesn’t document the contract.

**Recommendation:** Use **Zod** (already in the project) to define schemas for `POST /api/generate`, `POST /api/checkout`, `POST /api/upload` (metadata), and return 400 with a consistent shape (`{ error, code?, details? }`) on validation failure. Helps type safety and OpenAPI/docs later.

---

### 4. **Idempotency for generate (optional)**

**Issue:** Double submit (e.g. user double-clicks “Create”) can create two generations and deduct two tokens.

**Recommendation:** Optional: add a client-generated idempotency key (header or body), store it on the generation or in a small table, and reject duplicates with 409 and return the existing `generationId`. Or handle only on the client (disable button after submit, or dedupe by `imageUrl + artStyle + timestamp` in a short window).

---

### 5. **Stripe webhook idempotency**

**Current:** `generateAndStoreBundle` skips if deliverables already exist for the order, so retries are safe.

**Recommendation:** Keep that. Optionally store `stripe_event_id` (or event id) and ignore duplicate events for the same order to avoid redundant DB updates and logs.

---

### 6. **Error handling and logging**

**Issue:** Some routes return `e.message` in 500 responses, which can leak internal details. Logging is mostly `console.error`.

**Recommendation:** In production, return a generic message for 500 (“Something went wrong” / “Generation failed”) and log the real error (and request id) server-side. Use a structured logger (e.g. Pino) and/or error reporting (e.g. Sentry) for production.

---

### 7. **Env and provider selection**

**Current:** If `OPENAI_API_KEY` is set we use GPT Image; else we use ImagineAPI (or stub). There’s no explicit “provider” env; it’s implicit.

**Recommendation:** Optional: add `IMAGE_PROVIDER=openai|imagine|stub` and derive behavior from that so production config is explicit. Keep validating that the right keys exist for the chosen provider.

---

### 8. **Preview proxy: rate limiting and caching**

**Issue:** Preview is streamed through our API. No rate limit on `GET /api/generate/[id]/preview`; heavy refresh could stress storage and server.

**Recommendation:** Consider a low rate limit per IP (or per generation id) for the preview endpoint (e.g. 60/min per IP). Already using `no-store`; no change needed for caching.

**Why it matters:**  
`GET /api/generate/[id]/preview` does the following on every request: (1) load the generation row from the DB, (2) check the session cookie, (3) download the watermarked image from Supabase Storage, (4) stream the full image body back. There is no rate limit on this route today. So:

- **Abuse:** A script or a single user could hit the same (or many) preview URLs in a loop. Each request costs a DB read, a storage download, and bandwidth. That can increase load and Supabase/storage usage, and in the worst case help someone scrape many previews by guessing UUIDs (though 403 blocks other users’ previews).
- **Accidental:** A buggy or eager frontend (e.g. polling the preview URL, or re-renders that refetch the image often) could generate a lot of traffic even without bad intent.

**What “rate limit” would do:**  
Cap how many times a given client (e.g. per IP) can call the preview endpoint in a time window (e.g. 60 requests per minute). Beyond that, return `429 Too Many Requests` with `Retry-After`. You already have `lib/rate-limit.ts` and middleware for POST routes; the same pattern can be applied to `GET /api/generate/:id/preview` (either in middleware by adding this path to the rate-limited list with a higher limit, or inside the route by calling `checkRateLimit(ip, pathname)` and returning 429). A limit like 60/min per IP is usually enough for normal viewing (multiple refreshes, a few generations) while curbing loops.

**Caching:**  
The response already sends `Cache-Control: no-store, no-cache, must-revalidate`, so browsers and CDNs should not cache the preview. That’s correct so that: (1) we always enforce the session check on the next view, and (2) we don’t want watermarked images to be served from cache indefinitely. No change needed for caching.

---

### 9. **Reference image type (GPT Image)**

**Current:** We always send the reference image as `image/png` via `toFile(..., 'reference.png', { type: 'image/png' })`. Upload might be JPEG/WebP.

**Recommendation:** Either keep PNG (OpenAI accepts it) or derive type from `Content-Type` of the fetch to the reference URL (or from upload response) and pass the correct MIME type. Low priority.

---

### 10. **Tests and health**

**Issue:** No automated tests visible in the repo. Health check exists (`/api/health`).

**Recommendation:** Add a few critical-path tests: e.g. generate route returns 400 for invalid body and 403 when no tokens; status returns 404 for bad id; preview returns 403 when session doesn’t match. E2E (Playwright) for: upload → generate → poll → preview → checkout (with Stripe test mode) would catch regressions.

---

### 11. **Upload URL expiry vs. slow users**

**Current:** Upload returns a signed URL with 2h expiry (`UPLOAD_SIGNED_URL_EXPIRY_SECONDS` in the upload route). If the user leaves the tab open and submits generate after 1h, the GPT Image (or Imagine) step may fail to fetch the reference image.

**Recommendation:** Document “use the uploaded photo within 1 hour” or extend expiry for the upload signed URL. Alternatively, store the file in storage and pass an internal path or a short-lived server-side signed URL at generate time.

---

### 12. **Create client usage (Supabase)**

**Current:** Status and preview use `createClient()` (throws if env missing). Generate and upload use `createClientIfConfigured()` (null if not set). Checkout uses `createClient()`. See [docs/API_ROUTES_AND_SUPABASE.md](API_ROUTES_AND_SUPABASE.md) for which routes require Supabase and how they behave when it is not configured.

**Recommendation:** Keep as is; ensure all routes that need Supabase run in an environment where it’s configured, or document which routes require it. Optional: a small “readiness” check that verifies Supabase, Stripe, and (if used) OpenAI before accepting traffic.

---

## Quick Wins (Priority)

| Priority | Item | Effort |
|----------|------|--------|
| High | Validate generate body before deducting token | Low |
| High | Return generic 500 message to client; log real error | Low |
| Medium | Optional: session check in checkout | Low |
| Medium | Zod schemas for generate/checkout/upload bodies | Medium |
| Low | Rate limit preview endpoint | Low |
| Low | Idempotency key for generate (optional) | Medium |

---

## Summary

The flow is coherent: upload → generate (token, DB row, OpenAI or Imagine) → status poll (GPT Image on first poll when `openai-*`) → preview via proxy (no direct storage URL, session check) → checkout → webhook → bundle + email. The main gaps are: **token deducted before validation**, **no formal API validation (Zod)**, **optional checkout ownership and idempotency**, and **hardening 500 responses and logging**. Addressing the “validate before deduct” and generic 500s gives the biggest benefit for minimal change.
