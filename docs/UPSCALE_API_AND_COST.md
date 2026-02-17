# Upscale API Implementation and Cost Guide

This document covers how to implement and use the Replicate Real-ESRGAN upscale API for single image upscaling.

## Overview

**Scope:** Pure upscaling only of the provided/generated photo via Replicate Real-ESRGAN. No face enhancement, no modifications - just upscaling. This is a single step: **one image in → one upscaled image out**.

Your upscale module is [`lib/ai/upscale.ts`](../lib/ai/upscale.ts). It takes an image URL, calls Replicate, and returns the upscaled image buffer with no modifications. Use this as the single place for "upscale this photo" – anywhere that needs an upscaled image should call `upscaleImage(imageUrl)` (when `isUpscaleConfigured()` is true) and use that result.

## How to implement the Replicate upscale API

### 1. Get a Replicate API token

- Go to [Replicate → Account → API tokens](https://replicate.com/account/api-tokens).
- Create a token (starts with `r8_...`).

### 2. Add the token to your project

In `.env.local` (do not commit):

```bash
REPLICATE_API_TOKEN=r8_...
```

Restart the dev server after changing env.

### 3. Install the client (already in your project)

You already have `replicate` in [`package.json`](../package.json). If starting from scratch:

```bash
npm install replicate
```

### 4. Use the upscale module

Your code in [`lib/ai/upscale.ts`](../lib/ai/upscale.ts) already implements the call. Summary:

- **Model:** `nightmareai/real-esrgan` (Real-ESRGAN with optional GFPGAN face enhancement).
- **Input:** 
  - `image` = URL of the image to upscale (must be publicly reachable or a signed URL Replicate can fetch).
  - Optional: `scale` (e.g. 2 or 4; default 2).
  - `face_enhance` = Always set to `false` for pure upscaling with no modifications.
- **Output:** The model returns a URL to the upscaled image; your code fetches it and returns a `Buffer`.

### 5. Verify the model input schema

On the model page, open the **API** tab to see the exact input names and types:

- [nightmareai/real-esrgan](https://replicate.com/nightmareai/real-esrgan/api)

The implementation now uses the correct parameter names for pure upscaling:

```javascript
input: {
  image: "https://...",
  scale: 2,              // Scale factor: 2 or 4
  face_enhance: false    // Always false - pure upscaling only, no modifications
}
```

**Note:** The parameter is `scale` (not `outscale` as in some older examples). Face enhancement is explicitly disabled for pure upscaling.

### 6. Where to call upscale

Call `upscaleImage(...)` only where you need the single upscaled image (e.g. after generation in the status route, or before saving a "final" asset). Do not mix this with bundle/format logic – upscale is one step: one image in, one image out.

## Usage cost (Replicate)

- **Billing model:** Replicate bills most public models **by the time the prediction runs** (price per second of the hardware used). Exact rate is on each model's page.
- **Where to see cost:** On [Replicate Pricing](https://replicate.com/pricing) you see hardware prices (e.g. GPU T4, L40S). On the **model page** ([nightmareai/real-esrgan](https://replicate.com/nightmareai/real-esrgan)) you see the **cost estimate per run** for that model.
- **Real-ESRGAN in practice:** Documented as "fast and cheap". Example runs are ~1.4–5.5 seconds. So cost per upscale is typically a few seconds of GPU time (often well under $0.01 per image; check the model page for the current estimate).
- **Rough guideline:** If the model runs on a low-cost GPU (e.g. T4 at ~$0.000225/sec), a 2–5 second run is a fraction of a cent per image. Always confirm on the model's page before relying on this for pricing.

## Hardware pricing reference (as of 2024)

From [Replicate Pricing](https://replicate.com/pricing):

| Hardware | Price per second | Price per hour | GPU | CPU | GPU RAM | RAM |
|----------|------------------|----------------|-----|-----|---------|-----|
| CPU (Small) | $0.000025 | $0.09 | - | 1x | - | 2GB |
| CPU | $0.000100 | $0.36 | - | 4x | - | 8GB |
| Nvidia T4 GPU | $0.000225 | $0.81 | 1x | 4x | 16GB | 16GB |
| Nvidia L40S GPU | $0.000975 | $3.51 | 1x | 10x | 48GB | 65GB |
| Nvidia A100 (80GB) GPU | $0.001400 | $5.04 | 1x | 10x | 80GB | 144GB |
| Nvidia H100 GPU | $0.001525 | $5.49 | 1x | 13x | 80GB | 72GB |

## Model characteristics

**Real-ESRGAN** in pure upscale mode:
- Increases image resolution by the scale factor (2x or 4x)
- Maintains the original image characteristics
- No modifications, enhancements, or face processing
- Pure mathematical upscaling

**Note:** Face enhancement and artifact removal are explicitly disabled in this implementation to ensure no modifications to the original image.

**Max recommended input image resolution:** 1440p

## Example usage in your codebase

```javascript
import { upscaleImage, isUpscaleConfigured } from '@/lib/ai/upscale'

// Check if upscale is configured
if (isUpscaleConfigured()) {
  // Basic upscale (2x) - pure upscaling only
  const upscaledBuffer = await upscaleImage(imageUrl)
  
  // Custom scale (4x) - still pure upscaling, no modifications
  const upscaled4xBuffer = await upscaleImage(imageUrl, 4)
  
  if (upscaledBuffer) {
    // Use the upscaled image buffer
    console.log('Upscaled image size:', upscaledBuffer.length)
  }
}
```

## Current implementation location

The upscale functionality is currently used in:
- [`app/api/generate/[id]/status/route.ts`](../app/api/generate/[id]/status/route.ts) - After GPT Image generation, stores result in `upscaled_image_url` with pure 2x upscaling (no modifications)

The module itself is at:
- [`lib/ai/upscale.ts`](../lib/ai/upscale.ts) - Main upscale implementation

## Testing the upscale

To test the upscale functionality:

1. Set your `REPLICATE_API_TOKEN` in `.env.local`
2. Generate a portrait through your app (upload → choose style → generate)
3. Check the generation status API response - if `REPLICATE_API_TOKEN` is configured, you should see an `upscaled_image_url` field in the database
4. The upscaled image is automatically stored in your Supabase storage as `{generationId}_upscaled.png`