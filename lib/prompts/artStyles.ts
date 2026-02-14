/**
 * Art styles and prompt builder for all portrait categories: pet, family, children, couple, self.
 */

/** Portrait categories (subject types) for routes and API. */
export const PORTRAIT_CATEGORIES = {
  pet: 'pet',
  family: 'family',
  children: 'children',
  couple: 'couple',
  self: 'self',
} as const

export type SubjectTypeId = keyof typeof PORTRAIT_CATEGORIES

export const SUBJECT_TYPE_IDS: SubjectTypeId[] = ['pet', 'family', 'children', 'couple', 'self']

export function isAllowedSubjectType(value: string): value is SubjectTypeId {
  return SUBJECT_TYPE_IDS.includes(value as SubjectTypeId)
}

/** SEO-friendly route and display name per category. */
export const CATEGORY_ROUTES: Record<SubjectTypeId, { path: string; title: string; shortTitle: string }> = {
  pet: { path: '/pet-portraits', title: 'Pet Portraits', shortTitle: 'Pet' },
  family: { path: '/family-portraits', title: 'Family Portraits', shortTitle: 'Family' },
  children: { path: '/children-portraits', title: 'Children Portraits', shortTitle: 'Children' },
  couple: { path: '/couple-portraits', title: 'Couple Portraits', shortTitle: 'Couple' },
  self: { path: '/self-portrait', title: 'Self Portrait', shortTitle: 'Self' },
}

export const ART_STYLE_PROMPTS = {
  renaissance: {
    name: 'Renaissance',
    description:
      'Classical Italian Renaissance style with rich colors and dramatic lighting',
    basePrompt: `A masterful Renaissance portrait in the style of Leonardo da Vinci and Raphael, oil painting on canvas, rich jewel tones, dramatic chiaroscuro lighting, ornate noble clothing with intricate embroidery and gold details, regal pose with confident expression, Renaissance court background with classical architecture, museum quality, highly detailed, 16th century Italian master painting --style raw --ar 4:5 --v 7`,
    petModifier: `majestic noble [PET_TYPE] portrayed as Renaissance royalty, wearing ornate royal collar with jewels, regal bearing, painted with the precision and dignity of a Renaissance master`,
    selfModifier: `elegant self-portrait as Renaissance nobility, single figure in ornate period attire, dignified and confident, painted with the precision of a Renaissance master`,
    coupleModifier: `two people as a Renaissance couple, noble attire, romantic and dignified double portrait, period costume and court setting`,
    familyModifier: `family group portrait in Renaissance style, multiple figures in noble attire, warm and dignified composition, Renaissance court setting`,
    childrenModifier: `child portrait in Renaissance style, young subject in period-appropriate noble attire, delicate and refined, Renaissance master quality`,
  },
  baroque: {
    name: 'Baroque',
    description: 'Dramatic Baroque style with intense emotions and rich textures',
    basePrompt: `A magnificent Baroque portrait in the style of Rembrandt and Rubens, oil painting with dramatic lighting and deep shadows, opulent baroque costume with velvet and silk, rich burgundy and gold tones, theatrical pose with emotional depth, luxurious baroque interior, masterful brushwork, 17th century Dutch/Flemish master painting --style raw --ar 4:5 --v 7`,
    petModifier: `noble [PET_TYPE] as Baroque aristocracy, dramatic lighting highlighting their regal features, luxurious textures and rich colors befitting Baroque grandeur`,
    selfModifier: `dramatic self-portrait in Baroque style, single figure in opulent costume, intense lighting and deep shadows, theatrical presence`,
    coupleModifier: `Baroque couple portrait, two figures in opulent velvet and silk, dramatic lighting, romantic and theatrical double portrait`,
    familyModifier: `Baroque family group portrait, multiple figures in rich fabrics, dramatic chiaroscuro, luxurious interior setting`,
    childrenModifier: `Baroque child portrait, young subject in rich period costume, dramatic lighting, dignified and tender`,
  },
  victorian: {
    name: 'Victorian Era',
    description: 'Refined Victorian portrait with elegant details and proper posture',
    basePrompt: `An exquisite Victorian era portrait in the style of John Singer Sargent, formal Victorian attire with high collars and elegant fabrics, refined color palette with muted tones and subtle highlights, proper Victorian posture and dignified expression, Victorian parlor or garden setting, impeccable detail and realism, 19th century portrait photography quality --style raw --ar 4:5 --v 7`,
    petModifier: `distinguished [PET_TYPE] in Victorian splendor, portrayed with the refinement and attention to detail of Victorian portrait artists, elegant collar or bow, dignified pose`,
    selfModifier: `refined Victorian self-portrait, single figure in formal period attire, proper posture and dignified expression, Sargent-like elegance`,
    coupleModifier: `Victorian couple portrait, two figures in formal attire, refined and romantic, proper Victorian posture and setting`,
    familyModifier: `Victorian family portrait, group in formal period dress, refined palette and dignified composition, parlor or garden setting`,
    childrenModifier: `Victorian child portrait, young subject in elegant period dress, soft and refined, proper Victorian sensibility`,
  },
  regal: {
    name: 'Royal Court',
    description: 'Majestic royal portrait with crown jewels and throne room setting',
    basePrompt: `A magnificent royal portrait fit for a monarch, wearing elaborate crown or coronation regalia with precious jewels, opulent royal robes in deep crimson and gold with ermine trim, throne room setting with ornate columns and royal tapestries, commanding regal pose with scepter or orb, museum quality oil painting, European royal portrait tradition --style raw --ar 4:5 --v 7`,
    petModifier: `majestic [PET_TYPE] as crowned royalty, wearing elaborate crown and royal regalia, commanding presence worthy of a monarch, throne room background`,
    selfModifier: `majestic self-portrait as royalty, single figure in crown and royal robes, throne room setting, commanding and dignified`,
    coupleModifier: `royal couple portrait, two figures in crown and regalia, throne room, romantic and majestic double portrait`,
    familyModifier: `royal family portrait, group in crowns and royal attire, throne room, majestic and warm group composition`,
    childrenModifier: `royal child portrait, young subject in crown and period regalia, dignified and tender, throne room setting`,
  },
  belle_epoque: {
    name: 'Belle Époque',
    description:
      'Elegant turn-of-the-century French portrait with art nouveau influences',
    basePrompt: `An elegant Belle Époque portrait in the style of Giovanni Boldini, fashionable early 1900s attire with flowing fabrics and art nouveau details, soft romantic lighting with warm tones, graceful pose capturing movement, Parisian salon or garden setting, loose confident brushwork, sophisticated French portrait style --style raw --ar 4:5 --v 7`,
    petModifier: `elegant [PET_TYPE] in Belle Époque refinement, captured with the grace and style of turn-of-the-century Paris, soft romantic lighting, fashionable accessories`,
    selfModifier: `elegant Belle Époque self-portrait, single figure in fashionable period attire, soft romantic lighting, Parisian sophistication`,
    coupleModifier: `Belle Époque couple portrait, two figures in fashionable attire, soft romantic lighting, Parisian salon elegance`,
    familyModifier: `Belle Époque family portrait, group in elegant period fashion, soft lighting, Parisian salon or garden`,
    childrenModifier: `Belle Époque child portrait, young subject in elegant period dress, soft and graceful, art nouveau refinement`,
  },
} as const

/** Phase 1: dog and cat only */
export const PET_TYPES = {
  dog: 'dog',
  cat: 'cat',
} as const

export type ArtStyleId = keyof typeof ART_STYLE_PROMPTS
export type PetTypeId = keyof typeof PET_TYPES

export const ART_STYLE_IDS: ArtStyleId[] = [
  'renaissance',
  'baroque',
  'victorian',
  'regal',
  'belle_epoque',
]

export const PET_TYPE_IDS: PetTypeId[] = ['dog', 'cat']

export function isAllowedArtStyle(value: string): value is ArtStyleId {
  return ART_STYLE_IDS.includes(value as ArtStyleId)
}

export function isAllowedPetType(value: string): value is PetTypeId {
  return PET_TYPE_IDS.includes(value as PetTypeId)
}

/**
 * Build the full Midjourney-ready prompt for any portrait category.
 * For pet: petType optional (dog/cat); when omitted the model infers from the reference image.
 */
export function buildPrompt(
  artStyle: ArtStyleId,
  subjectType: SubjectTypeId,
  petType?: PetTypeId,
  _customizations?: {
    background?: string
    clothing?: string
    accessories?: string[]
  }
): string {
  const style = ART_STYLE_PROMPTS[artStyle]

  if (subjectType === 'pet') {
    const petLabel = petType ? PET_TYPES[petType] : 'pet'
    const petPrompt = style.petModifier.replace('[PET_TYPE]', petLabel)
    return `${petPrompt}, ${style.basePrompt}`
  }

  const modifierKey = `${subjectType}Modifier` as keyof typeof style
  const modifier = style[modifierKey]
  if (typeof modifier === 'string') {
    return `${modifier}, ${style.basePrompt}`
  }

  return style.basePrompt
}
