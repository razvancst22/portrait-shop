import type { SubjectTypeId } from '@/lib/prompts/artStyles'

export type CreateFlowCopy = {
  headline: string
  subhead: string
  uploadLabel: string
  uploadDropLabel: string
  previewTitle: string
  previewSubhead: string
  previewAlt: string
  generatingTitle: string
  ctaButton: string
}

export const CREATE_FLOW_COPY: Record<SubjectTypeId, CreateFlowCopy> = {
  pet: {
    headline: 'Create a Masterpiece of Your Beloved Pet',
    subhead: 'Upload any photo – we transform it into stunning Renaissance, Baroque, or Victorian art. Free preview • Pay only when satisfied.',
    uploadLabel: "Upload your pet's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Beautiful photo!',
    previewSubhead: 'Choose an art style to transform your pet into a timeless classic.',
    previewAlt: 'Your pet',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
  dog: {
    headline: 'Immortalize Your Dog in Classic Art',
    subhead: 'Turn any dog photo into a museum-worthy Renaissance or Baroque portrait. See your preview free • High-resolution download included.',
    uploadLabel: "Upload your dog's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Perfect shot!',
    previewSubhead: 'Select an art style and watch your dog transform into a timeless work of art.',
    previewAlt: 'Your dog',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
  cat: {
    headline: 'Turn Your Cat Into a Royal Masterpiece',
    subhead: 'Transform any cat photo into elegant Renaissance or Victorian art. Free preview available • Museum-quality results.',
    uploadLabel: "Upload your cat's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Stunning photo!',
    previewSubhead: 'Pick a style to give your cat the royal treatment it deserves.',
    previewAlt: 'Your cat',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
  self: {
    headline: 'Transform Yourself Into a Classic Work of Art',
    subhead: 'Upload a selfie and become the subject of a Renaissance or Victorian masterpiece. See your preview instantly • No payment until you love it.',
    uploadLabel: 'Upload your photo',
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Great photo!',
    previewSubhead: 'Choose an art style to become part of art history.',
    previewAlt: 'Your photo',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
  couple: {
    headline: 'Capture Your Love in Timeless Art',
    subhead: 'Upload 2 photos and we\'ll create a romantic Renaissance or Victorian double portrait. Free preview • One price for everything.',
    uploadLabel: 'Add 2 photos\n(one of each person)',
    uploadDropLabel: 'Drop your photos here',
    previewTitle: 'Lovely photo!',
    previewSubhead: 'Select a style to immortalize your love story as a classic masterpiece.',
    previewAlt: 'Your photo',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
  family: {
    headline: 'Create an Heirloom Family Portrait',
    subhead: 'Upload 2-6 photos (one per person) and we\'ll create a stunning Renaissance or Victorian group portrait. Perfect for gifts • Free preview included.',
    uploadLabel: 'Add 2-6 photos\n(one per family member)',
    uploadDropLabel: 'Drop your photos here',
    previewTitle: 'Wonderful photo!',
    previewSubhead: 'Choose an art style to turn this moment into a family treasure for generations.',
    previewAlt: 'Your family',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
  children: {
    headline: 'Turn Your Child Into a Little Prince or Princess',
    subhead: 'Transform any child photo into a beautiful Renaissance or Victorian portrait. The perfect keepsake • See your preview free.',
    uploadLabel: "Upload your child's photo",
    uploadDropLabel: 'Drop your photo here',
    previewTitle: 'Sweet photo!',
    previewSubhead: 'Pick a style to create a timeless portrait your family will cherish forever.',
    previewAlt: 'Your child',
    generatingTitle: 'Creating your masterpiece…',
    ctaButton: 'Create my portrait',
  },
}
