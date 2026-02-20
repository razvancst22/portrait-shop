/**
 * Art styles and prompt builder for all portrait categories: pet, family, children, couple, self.
 */

/** Interface for art styles with color information for UI display. */
export interface ArtStyleWithColors {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;    // Accent color unique to each style
    secondary: string;  // Complementary color
    background: string; // Background tone
  };
  exampleImageUrl: string;
}

/** Portrait categories (subject types) for routes and API. */
export const PORTRAIT_CATEGORIES = {
  pet: 'pet',
  dog: 'dog',
  cat: 'cat',
  family: 'family',
  children: 'children',
  couple: 'couple',
  self: 'self',
} as const

export type SubjectTypeId = keyof typeof PORTRAIT_CATEGORIES

export const SUBJECT_TYPE_IDS: SubjectTypeId[] = ['pet', 'dog', 'cat', 'family', 'children', 'couple', 'self']

export function isAllowedSubjectType(value: string): value is SubjectTypeId {
  return SUBJECT_TYPE_IDS.includes(value as SubjectTypeId)
}

/** SEO-friendly route and display name per category. */
export const CATEGORY_ROUTES: Record<SubjectTypeId, { path: string; title: string; shortTitle: string }> = {
  pet: { path: '/', title: 'Pet Portraits', shortTitle: 'Pet' },
  dog: { path: '/dog-portraits', title: 'Dog Portraits', shortTitle: 'Dog' },
  cat: { path: '/cat-portraits', title: 'Cat Portraits', shortTitle: 'Cat' },
  family: { path: '/family-portraits', title: 'Family Portraits', shortTitle: 'Family' },
  children: { path: '/children-portraits', title: 'Children Portraits', shortTitle: 'Children' },
  couple: { path: '/couple-portraits', title: 'Couple Portraits', shortTitle: 'Couple' },
  self: { path: '/self-portrait', title: 'Self Portrait', shortTitle: 'Self' },
}

export const ART_STYLE_PROMPTS = {
  renaissance: {
    name: 'Renaissance',
    description: 'Classical Italian Renaissance style with rich colors and dramatic lighting',
    colors: {
      primary: '#D4AF37',    // Gold accent
      secondary: '#8B3A3A',  // Warm burgundy
      background: '#F5F5DC'  // Cream
    },
    basePrompt: `High Renaissance oil painting, museum-grade masterpiece, inspired by Leonardo da Vinci and Raphael, refined earth-tone palette with warm sienna, rich umber, deep forest green, and burgundy wine accents, sfumato technique with soft atmospheric blending, deep chiaroscuro modeling creating sculptural depth, historically accurate 16th century Italian noble setting with subtle marble architectural elements, balanced triangular composition, divine diffused lighting from hidden celestial source, delicate cracked varnish texture suggesting age, fine canvas grain visible in highlights, realistic anatomical precision, polished glazed finish, ultra-detailed brushwork, Sotheby's auction quality. Portrait format 4:5 aspect ratio, vertical composition, subject centered in frame.`,
    petModifier: `the subject portrayed in Renaissance aristocratic nobility, seated in dignified frontal pose with regal bearing, wearing an ornate antique gold filigree collar with subtle Renaissance medallion (no modern elements), delicate chain links with aged patina, anatomical precision in bone structure and musculature, soft sfumato transitions across form, ultra-detailed natural coat texture with individual hair rendering, serene and intelligent expression, commanding yet gentle presence, positioned on a deep crimson velvet cushion with gold braided trim`,
    selfModifier: `the subject as Renaissance nobility in single elegant portrait, historically accurate Italian noble attire with rich embroidered fabrics and subtle gold threading, dignified calm expression with gentle authority, balanced triangular composition placing figure in classical proportion, painted with anatomical precision and soft sfumato shading blending form into atmosphere, serene commanding presence, positioned against subtle architectural backdrop`,
    coupleModifier: `the subjects as Renaissance noble couple in harmonious double portrait, historically accurate Italian court attire with complementary rich fabrics and gold embroidery, dignified romantic presence with subtle interaction, balanced composition following classical golden ratio, both figures rendered with anatomical precision and soft atmospheric blending, gentle divine lighting unifying the pair, subtle classical architecture framing the couple`,
    familyModifier: `the subjects as Renaissance family group arranged in balanced pyramidal composition, multiple figures in period-accurate noble attire with coordinated rich jewel tones and gold details, serene and dignified expressions showing familial bond, classical court setting with subtle architectural elements, each figure painted with individual anatomical precision, soft sfumato creating atmospheric unity across the group`,
    childrenModifier: `the subject as Renaissance noble child, young figure in delicate period-accurate attire with soft silk and fine lace details, gentle sfumato modeling creating tender form, diffused divine lighting emphasizing innocence, realistic child anatomy with soft features, dignified yet youthful presence, positioned on embroidered cushion`,
  },
  baroque: {
    name: 'Baroque',
    description: 'Dramatic Baroque style with intense emotions and rich textures',
    colors: {
      primary: '#6B46C1',    // Deep purple
      secondary: '#8B3A3A',  // Rich burgundy  
      background: '#FFFFF0'  // Ivory
    },
    basePrompt: `Grand Baroque oil painting, dramatic chiaroscuro illumination with deep shadow contrast, inspired by Rembrandt and Rubens, opulent color palette of deep burgundy, rich gold, burnt sienna, and shadowed umber, heavy luxurious velvet and silk textures with visible weave patterns, ornate metallic gold embroidery and intricate lace details, dark atmospheric undefined background fading to near-black, intense directional side lighting creating sculptural drama, cinematic depth with strong foreground-background separation, visible confident brush strokes showing paint texture, aged varnish patina with warm amber glow, 17th century Dutch master quality, hyper-realistic material rendering, museum masterpiece. Portrait format 4:5 aspect ratio, vertical composition, subject centered in frame.`,
    petModifier: `the subject portrayed in Baroque aristocratic grandeur, seated regally in commanding three-quarter pose, wearing an elaborate ermine-trimmed crimson or deep emerald velvet cape with gold embroidered edges, ornate burnished gold chain collar with baroque pearl or ruby accent (unisex, timeless design), dramatic directional side lighting sculpting muscular form and creating deep shadows, ultra-detailed coat texture with individual hairs catching light, dignified powerful presence with intense gaze, positioned on a rich burgundy or forest green velvet cushion with gold tassels and braided trim`,
    selfModifier: `the subject in dramatic Baroque self-portrait, single figure in opulent period attire featuring heavy velvet doublet or gown with silk sleeves and intricate lace collar, intense directional lighting from single source creating strong chiaroscuro, deep shadows defining form, theatrical yet noble presence with confident gaze, rich painterly textures throughout, dark atmospheric background emphasizing illuminated figure`,
    coupleModifier: `the subjects as Baroque noble couple in dramatic double portrait, both figures in luxurious velvet and silk garments with complementary deep jewel tones, intense chiaroscuro lighting unifying the pair with shared light source, romantic yet powerful composition with subtle physical connection, rich textured fabrics rendered in detail, dark museum-quality background creating intimacy`,
    familyModifier: `the subjects as Baroque family group in grand portrait, multiple figures arranged in dynamic composition with dramatic lighting, each wearing rich textured period fabrics in coordinated burgundy, gold, and forest green palette, strong chiaroscuro creating sculptural depth across the group, luxurious interior setting with heavy drapery, cinematic depth and shadow play, visible confident brushwork throughout`,
    childrenModifier: `the subject as Baroque noble child, young figure in ornate period costume with velvet and lace details, dramatic yet tender side lighting creating soft shadows, dignified expression with youthful innocence, rich painterly textures in fabric and skin tones, positioned on embroidered cushion with dramatic fabric backdrop`,
  },
  victorian: {
    name: 'Victorian Era',
    description: 'Refined Victorian portrait with elegant details and proper posture',
    colors: {
      primary: '#10B981',    // Emerald green
      secondary: '#1E3A8A',  // Navy
      background: '#F8FAFC'  // Pearl
    },
    basePrompt: `Victorian era oil portrait, late 19th century aristocratic painting, inspired by John Singer Sargent, refined muted earth-tone palette with warm umber, soft olive, muted sage, and deep burgundy accents, soft diffused natural window light filtering through sheer lace curtains creating gentle illumination, elegant parlor interior atmosphere with heavy velvet drapery in background and subtle candlelit ambiance, realistic anatomical precision with accurate bone structure and musculature, delicate confident brushwork showing masterful control, smooth polished varnish finish with subtle sheen, stately upright posture conveying proper Victorian dignity, museum-quality realism with photographic detail, sophisticated muted color harmonies. Portrait format 4:5 aspect ratio, vertical composition, subject centered in frame.`,
    petModifier: `the subject portrayed in Victorian aristocratic elegance, seated formally in dignified upright pose, wearing a refined antique gold or aged brass chain collar with subtle engraved detailing (no modern elements, unisex timeless design), understated sophistication in accessories, soft natural window light creating gentle shadows and highlights, ultra-detailed coat texture with soft painterly blending of individual hairs, realistic anatomical precision, dignified calm expression with intelligent gaze suggesting refinement, positioned on a tufted velvet cushion in muted burgundy or forest green with subtle button details`,
    selfModifier: `the subject in refined Victorian self-portrait, single figure in formal period attire with high collar, fitted bodice or waistcoat, elegant satin and lace garments in muted earth tones, proper upright posture reflecting Victorian propriety, soft diffused natural lighting from window source, realistic anatomical rendering with delicate confident brushwork, polished finish, positioned against subtle parlor interior with muted drapery`,
    coupleModifier: `the subjects as Victorian aristocratic couple in formal double portrait, both figures in refined period attire with complementary muted palette, proper composed posture suggesting romantic restraint, soft diffused interior lighting creating gentle atmosphere, realistic anatomical detail on both figures, delicate brushwork throughout, elegant parlor setting with subtle velvet drapery, sophisticated color harmonies unifying the pair`,
    familyModifier: `the subjects as Victorian family group in dignified portrait, multiple figures in formal period clothing with coordinated muted earth-tone palette, proper upright postures conveying family dignity, soft natural parlor lighting, each figure rendered with realistic anatomical precision and delicate painterly technique, elegant interior setting with subtle drapery and refined furnishings, sophisticated compositional arrangement`,
    childrenModifier: `the subject as Victorian noble child, young figure in delicate period attire with lace collar, satin ribbons, and fine embroidery in soft muted tones, gentle diffused window lighting creating tender atmosphere, realistic child anatomy with soft features, dignified yet youthful expression, positioned on tufted cushion in parlor setting`,
  },
  regal: {
    name: 'Royal Court',
    description: 'Majestic royal portrait with crown jewels and throne room setting',
    colors: {
      primary: '#2563EB',    // Royal blue
      secondary: '#D4AF37',  // Gold
      background: '#F8FAFC'  // Marble white
    },
    basePrompt: `European coronation portrait, grand royal oil painting in the tradition of court painters, opulent color palette dominated by imperial crimson, regal purple, burnished gold, and pristine ermine white, elaborate ceremonial robes featuring heavy velvet with intricate gold thread embroidery and ermine fur trim with characteristic black spots, ornate jeweled crown set with rubies, sapphires, and diamonds catching light, formal throne room setting with classical marble pillars and rich royal drapery, symmetrical formal composition emphasizing imperial authority, ceremonial lighting with golden glow suggesting divine right, hyper-detailed embroidery work showing individual gold threads, multiple layers of luxurious fabric textures, polished oil glaze finish creating luminous depth, imperial grandeur and majesty, museum masterpiece quality. Portrait format 4:5 aspect ratio, vertical composition, subject centered in frame.`,
    petModifier: `the subject as crowned sovereign monarch, seated in commanding frontal pose on regal throne position, wearing an elaborate jeweled crown with gold, rubies, and sapphires (unisex imperial design), draped in imperial crimson and purple velvet robes with white ermine fur trim and gold embroidered edges, ornate antique gold ceremonial collar with royal medallions and precious gem accents, ultra-detailed coat texture with individual hairs rendered in royal magnificence, commanding presence with dignified expression of absolute authority, intelligent regal gaze, positioned on an imperial golden velvet cushion with elaborate tassels and royal braided trim`,
    selfModifier: `the subject as crowned monarch in grand royal portrait, single figure in full imperial regalia including jeweled crown and ceremonial robes of crimson velvet with ermine trim and gold embroidery, commanding yet dignified expression conveying sovereign authority, symmetrical formal composition placing crowned figure in position of power, throne room setting with marble pillars and royal banners, ceremonial golden lighting emphasizing divine majesty`,
    coupleModifier: `the subjects as royal crowned couple in imperial coronation portrait, both figures wearing elaborate crowns and ceremonial robes in coordinated crimson and purple with ermine and gold details, throne room setting with symmetrical marble architecture, majestic formal composition emphasizing dual sovereignty, commanding presence with dignified romantic connection, ceremonial lighting unifying the crowned pair in golden glow`,
    familyModifier: `the subjects as crowned royal family in grand state portrait, multiple figures each in imperial regalia with coordinated robes and crowns, throne room backdrop featuring classical marble pillars and royal purple drapery with gold fringe, symmetrical majestic composition showing dynastic power, each figure rendered with individual detail while maintaining unified royal presence, ceremonial lighting creating golden atmospheric unity`,
    childrenModifier: `the subject as royal heir in coronation portrait, young figure wearing delicate jeweled crown and miniature ceremonial robes in crimson velvet with ermine trim, dignified yet tender expression showing noble birthright, formal throne room setting with reduced scale appropriate to youth, ceremonial lighting emphasizing innocence and future authority, positioned on royal cushion`,
  },
  belle_epoque: {
    name: 'Belle Époque',
    description: 'Elegant turn-of-the-century French portrait with art nouveau influences',
    colors: {
      primary: '#F472B6',    // Coral pink
      secondary: '#F5DEB3',  // Champagne
      background: '#FDF2F8'  // Cream
    },
    basePrompt: `Belle Époque oil portrait, early 1900s Parisian elegance, inspired by Giovanni Boldini and John Singer Sargent, sophisticated color palette of warm ivory, soft rose gold, muted lavender, sage green, and champagne tones with subtle iridescent quality, flowing Art Nouveau fashion with organic curved lines and delicate floral motifs, warm romantic golden-hour lighting with soft peachy glow, graceful dynamic pose suggesting movement and life, elegant Parisian salon or garden terrace setting with subtle architectural ironwork details, loose confident brush strokes showing painterly virtuosity, refined pastel and warm harmonies, smooth polished canvas finish with luminous quality, sophisticated French aristocratic elegance and joie de vivre, turn-of-the-century refinement. Portrait format 4:5 aspect ratio, vertical composition, subject centered in frame.`,
    petModifier: `the subject captured in Belle Époque Parisian refinement, graceful relaxed pose suggesting elegant movement, wearing a fashionable Art Nouveau inspired collar featuring delicate sterling silver or rose gold metalwork with subtle floral or curved organic motifs (unisex, refined design), soft romantic golden-hour lighting creating warm peachy glow across form, ultra-detailed coat texture with flowing painterly strokes suggesting life and movement, intelligent gentle expression with soft gaze, sophisticated presence, positioned on an elegant silk cushion in soft sage green or warm ivory with delicate embroidered details and subtle fringe`,
    selfModifier: `the subject in elegant Belle Époque self-portrait, single figure in flowing early 1900s attire with Art Nouveau details, soft fabrics with organic curved lines and delicate lace, warm romantic golden lighting creating luminous atmosphere, graceful pose with subtle movement suggesting life, loose confident brushwork, refined pastel and warm color palette, Parisian salon elegance with subtle architectural details`,
    coupleModifier: `the subjects as Belle Époque Parisian couple, both figures in fashionable turn-of-the-century attire with Art Nouveau influences and flowing fabrics, soft romantic golden-hour lighting unifying the pair in warm glow, graceful interactive pose suggesting tender romance, loose painterly brushwork throughout, elegant salon or garden terrace setting, refined warm color harmonies creating sophisticated atmosphere`,
    familyModifier: `the subjects as Belle Époque family group, multiple figures in refined early 1900s fashion with coordinated soft pastel and warm tones, warm golden lighting creating familial warmth and unity, elegant relaxed arrangement suggesting natural interaction, Parisian salon or garden setting with Art Nouveau architectural details, each figure painted with loose confident strokes, sophisticated French refinement throughout`,
    childrenModifier: `the subject as Belle Époque child, young figure in delicate turn-of-the-century attire with soft flowing fabrics and Art Nouveau inspired lace details, warm romantic lighting creating tender peachy glow, graceful youthful pose, loose painterly brushwork suggesting innocence and movement, positioned on embroidered silk cushion in soft sage or ivory tones`,
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
 * Build the full prompt for any portrait category (GPT Image, etc.).
 * Prompts request 4:5 portrait format, vertical composition, subject centered.
 * For pet: petType optional (dog/cat); when omitted the model infers from the reference image.
 */
/**
 * Get art styles with color information for UI display.
 */
export function getArtStylesWithColors(): ArtStyleWithColors[] {
  return ART_STYLE_IDS.map(styleId => ({
    id: styleId,
    name: ART_STYLE_PROMPTS[styleId].name,
    description: ART_STYLE_PROMPTS[styleId].description,
    colors: ART_STYLE_PROMPTS[styleId].colors,
    exampleImageUrl: `/style-examples/${styleId}.jpg`
  }));
}

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

  if (subjectType === 'pet' || subjectType === 'dog' || subjectType === 'cat') {
    const petLabel = subjectType === 'pet' && petType ? PET_TYPES[petType] : subjectType
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