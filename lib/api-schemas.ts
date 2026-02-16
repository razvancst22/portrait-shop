import { z } from 'zod'

const ART_STYLE_IDS = [
  'renaissance',
  'baroque',
  'victorian',
  'regal',
  'belle_epoque',
] as const

const SUBJECT_TYPE_IDS = ['pet', 'family', 'children', 'couple', 'self'] as const
const PET_TYPE_IDS = ['dog', 'cat'] as const

export const generateBodySchema = z.object({
  imageUrl: z.string().min(1, 'Missing or invalid imageUrl'),
  idempotencyKey: z.string().min(1).max(255).optional(),
  artStyle: z.enum(ART_STYLE_IDS, {
    message: 'Invalid artStyle. Allowed: renaissance, baroque, victorian, regal, belle_epoque',
  }),
  subjectType: z.enum(SUBJECT_TYPE_IDS).optional().default('pet'),
  petType: z.enum(PET_TYPE_IDS).optional(),
})

export type GenerateBody = z.infer<typeof generateBodySchema>

export const checkoutBodySchema = z.object({
  generationId: z.string().uuid('Invalid generationId'),
  /** Optional: if omitted, Stripe Checkout collects email; we set it from the webhook. */
  email: z.string().transform((s) => s?.trim() || '').optional().default(''),
})

export type CheckoutBody = z.infer<typeof checkoutBodySchema>

/** Consistent 400 shape for validation failures */
export function validationErrorResponse(
  error: z.ZodError,
  message = 'Validation failed'
): { error: string; code: string; details?: z.ZodIssue[] } {
  const first = error.issues[0]
  return {
    error: first?.message ?? message,
    code: 'VALIDATION_ERROR',
    details: error.issues.length > 1 ? error.issues : undefined,
  }
}
