# Guest Image Cleanup Cron

A separate cron deletes **guest-only** unpurchased images after 1 day (vs 7 days for logged-in users).

## Details

| Setting | Value |
|---------|-------|
| **Route** | `GET /api/cron/cleanup-guest-unpurchased` |
| **Schedule** | Daily at 4:00 UTC (Vercel cron) |
| **Target** | Generations where `session_id` is not in `auth.users` (guest, not logged-in) |
| **Default retention** | 24 hours |
| **Config** | `CLEANUP_GUEST_UNPURCHASED_HOURS` (env var) |

## Setup

1. Run migration: `supabase db push` or apply `00016_guest_cleanup_function.sql`
2. Ensure `CRON_SECRET` is set (same as `cleanup-unpurchased`)
3. Vercel will invoke the cron automatically per `vercel.json`

## Behavior

- **Guest** = `session_id` does not match any `auth.users.id`
- Only **unpurchased** generations are deleted
- Storage files (preview, final, original, etc.) are removed from the uploads bucket
- Logged-in users are unaffected; they keep the 7-day retention from `cleanup-unpurchased`
