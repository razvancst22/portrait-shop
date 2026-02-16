import type { SubjectTypeId } from '@/lib/prompts/artStyles'

export type CreateFlowCopy = {
  headline: string
  subhead: string
  uploadLabel: string
  uploadDropLabel: string
  previewTitle: string
  previewSubhead: string
  previewAlt: string
  nameLabel: string
  namePlaceholder: string
  nameHint: string
  generatingTitle: string
  ctaButton: string
}

export const CREATE_FLOW_COPY: Record<SubjectTypeId, CreateFlowCopy> = {
  pet: {
    headline: 'Turn your pet into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: "Upload your pet's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Nice photo!',
    previewSubhead: 'Now choose an art style for your portrait.',
    previewAlt: 'Your pet',
    nameLabel: "What's your pet's name?",
    namePlaceholder: 'e.g. Max, Luna',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
  dog: {
    headline: 'Turn your dog into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: "Upload your dog's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Nice photo!',
    previewSubhead: 'Now choose an art style for your portrait.',
    previewAlt: 'Your dog',
    nameLabel: "What's your dog's name?",
    namePlaceholder: 'e.g. Max, Buddy',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
  cat: {
    headline: 'Turn your cat into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: "Upload your cat's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Nice photo!',
    previewSubhead: 'Now choose an art style for your portrait.',
    previewAlt: 'Your cat',
    nameLabel: "What's your cat's name?",
    namePlaceholder: 'e.g. Luna, Whiskers',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
  self: {
    headline: 'Turn yourself into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: 'Upload your photo',
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Great photo!',
    previewSubhead: 'Now choose an art style for your portrait.',
    previewAlt: 'Your photo',
    nameLabel: "What's your name?",
    namePlaceholder: 'e.g. Alex',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
  couple: {
    headline: 'Turn your couple into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: 'Upload your photo (we’ll create a couple portrait)',
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Nice photo!',
    previewSubhead: 'Now choose an art style for your couple portrait.',
    previewAlt: 'Your photo',
    nameLabel: 'Names (optional)',
    namePlaceholder: 'e.g. Alex & Sam',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
  family: {
    headline: 'Turn your family into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: 'Upload a family photo',
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Nice photo!',
    previewSubhead: 'Now choose an art style for your family portrait.',
    previewAlt: 'Your family',
    nameLabel: 'Family name (optional)',
    namePlaceholder: 'e.g. The Smiths',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
  children: {
    headline: 'Turn your child into a classic portrait',
    subhead: 'Upload a photo to get started. One fixed price for your digital bundle.',
    uploadLabel: "Upload your child's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Sweet photo!',
    previewSubhead: 'Now choose an art style for the portrait.',
    previewAlt: 'Your child',
    nameLabel: "Child's name (optional)",
    namePlaceholder: 'e.g. Emma',
    nameHint: "Optional – we'll use it to personalize your experience.",
    generatingTitle: 'Creating your portrait…',
    ctaButton: 'Create my portrait',
  },
}
