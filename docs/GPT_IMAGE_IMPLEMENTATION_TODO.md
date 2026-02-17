# GPT Image Implementation – To-Do List

Switch from ImagineAPI/Midjourney to **OpenAI GPT Image API**. **4:5 and composition come only from the prompts** in `lib/prompts/artStyles.ts`. No crop, no fixed resolution in code. Upscale stays for paid delivery when you add it.

---

## To-Do List

- [x] **Prompts:** 4:5 and composition in `artStyles.ts` (done).
- [x] **GPT Image module:** `lib/ai/gpt-image.ts` – Images Edit with reference image + prompt, quality low; no size param (prompt only).
- [x] **Generate route:** When `OPENAI_API_KEY` is set, use `openai-{generationId}` as job id (no ImagineAPI).
- [x] **Status route:** When job id starts with `openai-`, run GPT Image once, upload result, watermark, mark completed.
- [x] **Bundle:** Resolve `final_image_url` when it’s a storage path (signed URL) for createBundle.
- [ ] **Upscale (later):** Add Replicate (e.g. Real-ESRGAN) for paid delivery when ready.
- [x] **Docs:** API keys and testing guidance below.

---

## API Keys and Testing

### 1. OpenAI (GPT Image)

**Purpose:** Portrait generation (reference image + prompt from `artStyles.ts`).

**Get key:** [OpenAI Platform](https://platform.openai.com/) → [API Keys](https://platform.openai.com/api-keys) → Create secret key. Do [org verification](https://help.openai.com/en/articles/10910291-api-organization-verification) if required for GPT Image.

**In project:** In `.env.local` (do not commit):

```bash
OPENAI_API_KEY=sk-proj-...
```

Restart dev server after changing env.

**Test:** Upload pet photo → pick style → generate → poll until completed → check watermarked preview. If it fails, check server logs and key/model access.

**Pricing:** We use `quality: 'low'`. The often-quoted ~$0.01 is only the base image tier. Images Edit also bills for **input image tokens** (reference photo), **prompt tokens**, and **output image tokens**, so real cost is typically ~$0.08–$0.15+ per portrait. Check [OpenAI Usage](https://platform.openai.com/usage) for your actuals.

---

### 2. Replicate (optional – upscale only)

**Purpose:** Upscale for paid delivery (e.g. Real-ESRGAN). Only when you implement that step.

**Get token:** [Replicate](https://replicate.com/account/api-tokens) → create token (`r8_...`).

**In project:** When you add upscale, add to `.env.local`:

```bash
REPLICATE_API_TOKEN=r8_...
```

---

### 3. Run and test

1. `cd petportrait && npm install`
2. Set `OPENAI_API_KEY` (and Supabase vars) in `.env.local`
3. `npm run dev`
4. In app: upload pet photo → choose style → generate → wait for completed → check preview. Optionally test purchase and delivery.

If generation fails, check logs and that `OPENAI_API_KEY` is set and has GPT Image access.
