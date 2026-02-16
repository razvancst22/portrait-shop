# API routes and Supabase

Which routes require Supabase and how they behave when it is not configured.

## Routes using `createClient()` (required)

These routes call `createClient()` and will throw (or 500) if Supabase env is missing:

| Route | Purpose |
|-------|--------|
| `GET /api/generate/[id]/status` | Poll generation status |
| `GET /api/generate/[id]/preview` | Stream watermarked preview image |
| `PATCH /api/generate/[id]` | Update generation (e.g. pet name) |
| `POST /api/checkout` | Create order and Stripe Checkout session |
| `POST /api/webhooks/stripe` | Handle payment completion, bundle, email |
| `GET /api/order-lookup` | Look up order by email and number |

Ensure `NEXT_PUBLIC_SUPABASE_URL` and Supabase service keys are set in any environment where these routes run.

## Routes using `createClientIfConfigured()` (optional)

These routes use `createClientIfConfigured()` and degrade when Supabase is not set:

| Route | Behaviour without Supabase |
|-------|----------------------------|
| `POST /api/upload` | 503, uploads disabled |
| `POST /api/generate` | 503, no token deducted |
| `GET /api/credits` | Falls back to cookie-based balance |
| `GET /api/my-generations` | Empty list or fallback |

## Optional: readiness check

You can add an endpoint (e.g. `/api/ready`) that verifies Supabase, Stripe, and (if used) OpenAI before accepting traffic.
