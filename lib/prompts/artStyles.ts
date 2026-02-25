/**
 * Art styles and prompt builder for all portrait categories: pet, family, children, couple, self.
 *
 * KEY CHANGES (refactored):
 * 1. Technical details (craquelure, lighting, vignetting) now come FIRST in basePrompt
 * 2. Subject-specific details come SECOND in modifiers
 * 3. Added missing critical terms: vignetting, glow halo, specific patina descriptions
 * 4. Removed aspect ratio mentions (handled by API size parameter)
 * 5. Eliminated redundancy between base and modifiers
 * 6. Color palettes are now separate and flexible
 * 7. Uses dynamic [SUBJECT_DESCRIPTION] and color placeholders
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

/** Color palette for each art style variation */
export interface ColorPalette {
  robe: string;
  cushion: string;
  embroidery: string;
  accent?: string;
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

/**
 * COLOR PALETTES - 3 variations per art style
 * Pattern: {styleId}_{variant}
 */
export const COLOR_PALETTES: Record<string, ColorPalette> = {
  // RENAISSANCE PALETTES
  renaissance_classic: {
    robe: 'deep crimson red velvet',
    cushion: 'burgundy wine velvet',
    embroidery: 'golden yellow silk brocade with raised floral damask pattern',
    accent: 'emerald green damask'
  },
  renaissance_royal: {
    robe: 'rich sapphire blue velvet',
    cushion: 'golden amber silk',
    embroidery: 'silver metallic thread with pearl accents',
    accent: 'deep purple damask'
  },
  renaissance_autumn: {
    robe: 'burnt sienna velvet',
    cushion: 'deep forest green silk',
    embroidery: 'copper and gold thread with autumn leaf motifs',
    accent: 'warm honey amber'
  },

  // BAROQUE PALETTES
  baroque_classic: {
    robe: 'rich plum purple Genoa velvet',
    cushion: 'plum purple velvet',
    embroidery: 'dark burnished gold metallic thread with scrolling acanthus leaves',
    accent: 'deep burgundy wine'
  },
  baroque_imperial: {
    robe: 'midnight blue velvet',
    cushion: 'royal blue silk velvet',
    embroidery: 'silver and gold baroque floral motifs',
    accent: 'crimson red'
  },
  baroque_emerald: {
    robe: 'deep emerald green velvet',
    cushion: 'emerald silk velvet',
    embroidery: 'gold metallic thread with ruby accents',
    accent: 'black'
  },

  // ROCOCO PALETTES
  rococo_classic: {
    robe: 'dusty rose mauve velvet',
    cushion: 'celadon sage green silk damask',
    embroidery: 'teal sage green botanical leaf and red berry clusters',
    accent: 'ivory cream'
  },
  rococo_spring: {
    robe: 'soft lavender silk',
    cushion: 'pale mint green silk damask',
    embroidery: 'pink rose and ivory floral motifs',
    accent: 'champagne gold'
  },
  rococo_sunset: {
    robe: 'peach apricot silk',
    cushion: 'soft coral silk damask',
    embroidery: 'gold and turquoise botanical designs',
    accent: 'warm cream'
  },

  // VICTORIAN PALETTES
  victorian_classic: {
    robe: 'charcoal grey wool broadcloth',
    cushion: 'deep burgundy wine velvet with tufted buttons',
    embroidery: 'subtle antique gold geometric trim',
    accent: 'muted olive green'
  },
  victorian_refined: {
    robe: 'deep navy wool broadcloth',
    cushion: 'forest green velvet with tufted buttons',
    embroidery: 'aged brass geometric details',
    accent: 'warm brown'
  },
  victorian_elegant: {
    robe: 'warm brown wool broadcloth',
    cushion: 'muted sage green velvet with tufted buttons',
    embroidery: 'antique silver trim',
    accent: 'soft grey'
  },

  // REGAL PALETTES
  regal_classic: {
    robe: 'deep crimson red velvet',
    cushion: 'imperial golden yellow silk velvet',
    embroidery: 'raised gold metallic thread with royal heraldic motifs',
    accent: 'regal purple silk'
  },
  regal_sapphire: {
    robe: 'royal sapphire blue velvet',
    cushion: 'deep purple silk velvet',
    embroidery: 'gold and silver heraldic designs with sapphires',
    accent: 'crimson red'
  },
  regal_imperial: {
    robe: 'imperial purple velvet',
    cushion: 'crimson red silk velvet',
    embroidery: 'gold thread with diamond and ruby accents',
    accent: 'pure white ermine'
  },

  // BELLE ÉPOQUE PALETTES
  belle_epoque_classic: {
    robe: 'soft rose gold silk',
    cushion: 'soft sage green silk',
    embroidery: 'delicate Art Nouveau iris and lily motifs in silk thread',
    accent: 'warm ivory cream'
  },
  belle_epoque_lavender: {
    robe: 'muted lavender silk',
    cushion: 'champagne silk',
    embroidery: 'Art Nouveau poppy designs in pearl and silver thread',
    accent: 'pale peach'
  },
  belle_epoque_autumn: {
    robe: 'warm apricot silk',
    cushion: 'pale sage green silk',
    embroidery: 'Art Nouveau organic curved motifs in gold and copper',
    accent: 'soft cream'
  },

  // DUTCH GOLDEN AGE PALETTES
  dutch_classic: {
    robe: 'simple lamp black wool broadcloth',
    cushion: 'humble olive green wool',
    embroidery: 'simple gold silk piping trim',
    accent: 'pressed white linen'
  },
  dutch_merchant: {
    robe: 'somber charcoal grey wool',
    cushion: 'muted brown wool',
    embroidery: 'plain gold piping',
    accent: 'white linen'
  },
  dutch_reformed: {
    robe: 'austere black wool',
    cushion: 'deep brown wool',
    embroidery: 'minimal gold trim',
    accent: 'stark white linen'
  },

  // SPANISH BAROQUE PALETTES
  spanish_classic: {
    robe: 'absolute lamp black Flemish velvet',
    cushion: 'deep crimson wine velvet',
    embroidery: 'silver metallic thread with Habsburg double-headed eagle',
    accent: 'pristine white Venetian lace'
  },
  spanish_royal: {
    robe: 'pure black Flemish velvet',
    cushion: 'royal purple velvet',
    embroidery: 'silver Habsburg heraldic shield motifs',
    accent: 'white starched lace ruff'
  },
  spanish_court: {
    robe: 'deep black velvet',
    cushion: 'burgundy velvet',
    embroidery: 'silver bullion with Catholic devotional symbols',
    accent: 'white linen'
  },
}

/**
 * ART STYLE PROMPTS
 * Structure: basePrompt contains ALL technical details, modifiers contain subject-specific details
 */
export const ART_STYLE_PROMPTS = {
  renaissance: {
    name: 'Renaissance Italian',
    description: 'Classical Italian Renaissance with rich Venetian colors and sfumato technique',
    colors: {
      primary: '#8B0000',
      secondary: '#DAA520',
      background: '#2F4F2F'
    },
    // TECHNICAL DETAILS ONLY - No subject, no specific colors
    basePrompt: `16th century Venetian Renaissance oil painting in the style of Titian and Giorgione. Dramatic chiaroscuro lighting with warm Venetian golden light from right side creating luminous atmospheric glow and soft sculptural shadows. Dark emerald green damask heavy curtain backdrop with botanical acanthus scroll pattern creating depth and richness. Dark vignette around canvas edges with subtle warm golden glow halo behind subject's head drawing focus to central figure. Extensive network of fine craquelure cracks covering entire canvas surface particularly dense in dark background areas. Rich warm amber varnish patina giving antique golden glow to entire painting. Thick impasto brushwork in highlights with visible paint texture and palette knife work. Sfumato atmospheric blending technique creating soft transitions between light and shadow. Alla prima wet-on-wet painting technique. Elaborate textile rendering showing raised brocade patterns, metallic thread embroidery with individual thread coils visible, and dimensional relief work. Hyperrealistic material rendering with scientific precision. Museum-grade Renaissance masterpiece quality with authentic aged appearance.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 16th century Venetian nobility. Wearing [ROBE_COLOR] with puffed slashed sleeves revealing [EMBROIDERY_STYLE], thick twisted gold rope chain collar with large teardrop ruby pendant set in ornate gold filigree mounting. White silk chemise with delicate blackwork geometric embroidery visible at neckline. Sphinx pose with front paws extended forward and positioned elegantly. Resting on [CUSHION_COLOR] featuring raised gold metallic thread floral embroidery in scrolling vine pattern with gold silk tassels and twisted gold cord trim at corners. Ultra-detailed natural coat texture with individual hairs catching warm light, guard hairs and soft undercoat rendered separately. Intelligent dignified expression with direct gaze suggesting Renaissance nobility. Anatomically precise rendering of paw structure, paw pads, and musculature.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 16th century Venetian nobility. Wearing [ROBE_COLOR] with puffed slashed sleeves revealing [EMBROIDERY_STYLE], thick twisted gold rope chain collar with large teardrop ruby pendant in ornate gold filigree setting. White silk chemise with delicate blackwork embroidery at neckline. Seated in relaxed three-quarter pose with one hand resting on [CUSHION_COLOR] featuring raised gold thread embroidery and gold tassels. Intelligent contemplative expression with direct gaze. Anatomically precise Renaissance idealized proportions.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 16th century Venetian nobility. Both figures wearing complementary Renaissance attire in coordinated color palette with slashed sleeves and brocade details, gold chain jewelry coordinated between figures. Seated together in intimate three-quarter poses with subtle physical connection. Both resting near [CUSHION_COLOR] with gold embroidery. Unified warm Venetian lighting creating romantic atmosphere. Anatomically precise rendering of both figures with sfumato blending throughout.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 16th century Venetian nobility. Multiple figures arranged in balanced pyramidal composition, each wearing coordinated Renaissance attire with rich textile details. Family group positioned around [CUSHION_COLOR] with gold embroidery creating unified arrangement. Warm Venetian light unifying the group. Each figure rendered with individual anatomical precision and Renaissance idealized proportions.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 16th century Venetian nobility. Young figure wearing delicate [ROBE_COLOR] with [EMBROIDERY_STYLE] scaled appropriately for youth, small gold chain with simple pendant. Seated with gentle posture on [CUSHION_COLOR] with gold embroidery. Tender expression with youthful innocence. Soft sfumato modeling appropriate for child subject. Renaissance idealized child proportions.`,
  },

  baroque: {
    name: 'Baroque Dramatic',
    description: 'Dramatic Flemish Baroque with intense chiaroscuro and theatrical opulence',
    colors: {
      primary: '#6B46C1',
      secondary: '#B8860B',
      background: '#1C1C1C'
    },
    basePrompt: `17th century Flemish Baroque oil painting in the style of Rubens and Van Dyck. Dramatic Rembrandt chiaroscuro lighting with single strong directional light source from upper left creating deep theatrical shadows and bright sculptural highlights with sharp contrast. Completely dark atmospheric background fading to near-black creating cinematic depth and mystery. Dark vignette around canvas edges with no background detail visible, all attention focused on illuminated subject. Pronounced aged craquelure particularly dense in shadow passages and dark areas showing centuries of age. Dark tobacco-brown varnish patina creating warm antique glow with amber undertones. Vigorous confident brushwork with visible energetic paint texture and thick impasto in highlights. Palette knife work in bright areas creating tactile surface. Thin transparent glazes building rich deep shadows through multiple layers. Heavy luxurious velvet texture with visible weave pattern and dramatic light-catching sheen. Thick white ermine fur with characteristic black ermine tail spots rendered in precise scientific detail. Elaborate gold metallic thread embroidery showing individual thread coils and raised relief work. Flemish theatrical grandeur and baroque dynamism. Museum masterpiece quality with hyperrealistic material rendering emphasizing textile luxury.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Flemish Baroque nobility. Wearing elaborate [ROBE_COLOR] with large-scale raised damask pattern, lavish white ermine fur cape draped dramatically over shoulders featuring numerous black ermine tail spots in natural scattered arrangement, thick ermine fur collar wrapping around neck. Ivory cream scalloped lace trim at inner border of robe with delicate bobbin lace pattern. [EMBROIDERY_STYLE] along robe edges with visible raised relief. Wearing ornate burnished gold chain collar with alternating oval links. Sphinx pose with front paws extended forward in commanding position. Resting on [CUSHION_COLOR] with thick gold bullion fringe trim and large gold silk tassels with twisted cord. Ultra-detailed natural coat texture with individual guard hairs and undercoat rendered separately catching dramatic side lighting. Powerful dignified expression with intense direct gaze suggesting baroque nobility and authority. Anatomically precise rendering of paw pads and musculature with strong chiaroscuro modeling.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Flemish Baroque nobility. Wearing opulent [ROBE_COLOR] with large damask pattern, white ermine fur cape with black spots draped over shoulders, ivory lace collar, [EMBROIDERY_STYLE] along edges. Heavy gold chain with baroque design. Seated in dramatic three-quarter pose with one hand resting on [CUSHION_COLOR] with gold tassels. Powerful commanding expression with direct gaze. Vigorous confident brushwork throughout.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Flemish Baroque nobility. Both figures wearing luxurious coordinated baroque attire with ermine trim and gold embroidery. Dramatic chiaroscuro lighting unifying the pair from single directional source. Seated together in dynamic composition with romantic physical connection. Both near [CUSHION_COLOR] with gold tassels. Intense expressions showing baroque emotional depth. Vigorous painterly technique throughout both figures.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Flemish Baroque nobility. Multiple figures arranged in dynamic baroque composition, each wearing rich coordinated velvets with ermine and metallic embroidery details. Dramatic chiaroscuro creating sculptural depth across entire group. Family positioned around luxurious [CUSHION_COLOR]. Cinematic lighting emphasizing familial bonds. Each figure rendered with vigorous baroque brushwork and emotional intensity.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Flemish Baroque nobility. Young figure wearing [ROBE_COLOR] with ermine trim scaled for child, delicate lace collar, small gold chain. Seated with youthful baroque dignity on [CUSHION_COLOR] with gold tassels. Dramatic yet tender chiaroscuro lighting appropriate for child subject. Intense expression showing baroque emotional depth combined with youthful innocence.`,
  },

  rococo: {
    name: 'Rococo Aristocratic',
    description: 'Elegant 18th century Rococo with luxurious fabrics and refined details',
    colors: {
      primary: '#C08081',
      secondary: '#8FBC8F',
      background: '#3E3528'
    },
    basePrompt: `18th century Rococo oil painting in the style of French court painters. Dramatic chiaroscuro lighting from upper left creating sculptural form modeling and atmospheric depth with sophisticated tonal gradations. Dark warm olive brown neutral atmospheric background with subtle lighter warm halo effect behind subject's head drawing eye naturally to focal point. Dark vignette around canvas edges gradually darkening toward borders. Visible aged craquelure network of fine interconnected cracks across entire canvas surface showing 18th century age. Warm amber varnish patina suggesting centuries of aging with golden undertones. Old Master painterly technique with confident visible brushwork and assured handling. Luxurious textile rendering showing silk taffeta sheen with light reflection, velvet pile texture with depth. White ermine fur with characteristic dark ermine tail spots painted with scientific precision and natural distribution. Delicate ivory cream scalloped bobbin lace with intricate floral pattern showing individual thread work and negative space. Botanical embroidery rendered in raised silk thread technique showing dimensional relief with highlights on raised surfaces. Elaborate gold oval link chain with burnished antique patina and subtle wear. Silk damask cushion with raised acanthus scroll pattern creating dimensional tactile surface. Gold braided piping trim with twisted cord construction showing individual cord strands. Rococo aristocratic elegance and refinement. Museum quality masterpiece with hyperrealistic material and textile rendering.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 18th century Rococo aristocracy. Wearing [ROBE_COLOR] with subtle pile texture and light-catching sheen, white ermine fur lining featuring dark ermine tail spots in natural distribution pattern. Ivory cream scalloped lace trim at inner border with delicate bobbin lace floral motifs. [EMBROIDERY_STYLE] along robe edges executed in raised silk thread technique showing dimensional relief. Wearing gold oval link chain necklace with burnished antique finish and subtle wear patina. Sphinx pose with front paws extended forward in elegant aristocratic position. Resting on [CUSHION_COLOR] with raised acanthus scroll pattern creating tactile dimensional surface, cushion trimmed with gold braided piping in twisted cord construction and gold silk tassels at corners. Draped baroque tablecloth beneath with larger scrolling pattern creating layered depth. Ultra-detailed natural coat texture with individual guard hairs, intermediate coat, and soft undercoat layers all rendered separately with varying light reflection. Intelligent serene expression with direct yet gentle gaze suggesting Rococo refinement and nobility. Anatomically precise rendering of paw pads showing individual toe pad texture and carpal pad detail.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 18th century Rococo aristocracy. Wearing [ROBE_COLOR] with white ermine fur trim featuring black spots, ivory lace at collar and cuffs with scalloped pattern, [EMBROIDERY_STYLE] along edges. Gold oval link chain necklace. Seated in elegant aristocratic posture on [CUSHION_COLOR] with raised acanthus pattern and gold braided trim. Draped tablecloth beneath. Refined serene expression with gentle direct gaze.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 18th century Rococo aristocracy. Both figures wearing coordinated Rococo attire with ermine trim, ivory lace, and embroidery details. Gold chain jewelry complementing each figure. Seated together in elegant aristocratic postures near [CUSHION_COLOR] with gold trim. Unified chiaroscuro lighting from upper left. Refined expressions showing romantic connection. Both figures rendered with Old Master technique.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 18th century Rococo aristocracy. Multiple figures arranged in balanced Rococo composition, each wearing coordinated garments with ermine, lace, and embroidery details. Family group positioned around [CUSHION_COLOR] creating elegant arrangement. Dramatic lighting unifying the group. Each figure painted with individual refinement and aristocratic bearing.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 18th century Rococo aristocracy. Young figure wearing delicate [ROBE_COLOR] with white ermine trim, ivory lace collar with scalloped detail, [EMBROIDERY_STYLE] accents, small gold chain. Seated in youthful aristocratic posture on [CUSHION_COLOR] with gold trim. Tender refined expression showing Rococo elegance combined with childhood innocence. Soft chiaroscuro lighting appropriate for child subject.`,
  },

  victorian: {
    name: 'Victorian Era',
    description: 'Refined Victorian portrait with elegant details and proper dignified bearing',
    colors: {
      primary: '#2F4F4F',
      secondary: '#8B4513',
      background: '#F5F5DC'
    },
    basePrompt: `Late 19th century Victorian oil portrait in the style of John Singer Sargent and William Merritt Chase. Sophisticated atmospheric interior lighting filtering through sheer lace curtains creating soft diffused natural window light with gentle shadows and subtle highlights. Elegant Victorian parlor setting with heavy velvet drapery in background showing rich fabric weight and button tufting details. Polished mahogany furniture glimpsed at edges suggesting refined interior. Subtle warm beige cream atmospheric background with soft tonal gradations. Delicate confident brushwork demonstrating masterful control and technical virtuosity with assured handling. Smooth polished oil varnish finish with subtle sheen suggesting fine craftsmanship. Visible fine craquelure network suggesting age and authenticity. Thin protective varnish layer with warm undertones. Realistic anatomical precision showing accurate bone structure, muscle groups, and natural proportions without idealization. Sophisticated muted earth-tone color harmonies avoiding garish tones. Refined antique gold or aged brass accessories with subtle engraved detailing and natural age patina showing Victorian aesthetic restraint. Tufted velvet cushion texture with button details creating diamond pattern and natural fabric folds showing weight and drape. Museum-quality photographic realism with precise detail rendering.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as late 19th century Victorian subject. Wearing refined antique gold or aged brass chain collar with subtle engraved geometric detailing and natural age patina showing Victorian restrained elegance. Sphinx pose with front paws positioned close together in proper dignified Victorian bearing. Ultra-detailed natural coat texture with soft painterly blending showing individual hair direction and natural layering. Realistic anatomical precision in skeletal structure and muscle definition. Intelligent calm expression with gentle direct gaze suggesting Victorian refinement and proper breeding. Positioned on [CUSHION_COLOR] with subtle round button details creating diamond pattern and natural fabric folds showing weight and drape. Elegant Victorian parlor atmosphere with heavy velvet drapery visible in soft focus background.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as late 19th century Victorian subject. Wearing refined Victorian attire with high standing collar, fitted bodice or tailored waistcoat in muted earth tones, subtle lace at collar and cuffs. Refined antique gold chain or brooch. Seated in proper upright Victorian posture conveying period dignity and restraint. Realistic anatomical rendering with delicate confident brushwork. Positioned on [CUSHION_COLOR] with tufted button details. Elegant parlor interior with heavy drapery.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as late 19th century Victorian subjects. Both figures in refined coordinated Victorian attire with muted earth-tone palette. Proper composed upright postures suggesting Victorian romantic restraint. Soft diffused window lighting creating gentle unified atmosphere. Realistic anatomical detail on both figures with delicate painterly technique. Seated together near [CUSHION_COLOR] with tufted details. Elegant parlor setting with subtle drapery.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as late 19th century Victorian family. Multiple figures in formal coordinated Victorian clothing with muted earth-tone palette. Proper upright postures conveying family dignity and Victorian propriety. Soft natural parlor lighting creating familial warmth. Each figure rendered with realistic anatomical precision and delicate confident brushwork. Elegant interior setting with tufted furniture and velvet drapery.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as late 19th century Victorian child. Young figure in delicate Victorian attire with lace collar, satin ribbons, and fine embroidery in soft muted tones. Gentle diffused window lighting creating tender atmosphere. Proper yet youthful Victorian posture. Realistic child anatomy with soft features. Dignified expression appropriate for Victorian youth. Positioned on [CUSHION_COLOR] with tufted details.`,
  },

  regal: {
    name: 'Royal Court',
    description: 'Majestic coronation portrait with imperial regalia and throne room grandeur',
    colors: {
      primary: '#8B0000',
      secondary: '#FFD700',
      background: '#F8F8FF'
    },
    basePrompt: `European coronation portrait in grand royal oil painting tradition of court painters. Ceremonial golden lighting with warm atmospheric glow suggesting heavenly mandate and divine radiance. Formal symmetrical throne room setting featuring white Carrara marble fluted pillars with Corinthian capitals and acanthus leaf details. Rich royal drapery with gold bullion fringe and tasseled tiebacks visible in background. Symmetrical formal composition emphasizing imperial authority and divine right. Polished oil glaze finish with multiple transparent layers creating luminous depth and jewel-like quality. Hyper-detailed embroidery work showing each individual gold thread and raised relief technique with dimensional quality. Multiple layers of luxurious fabric textures with realistic weight and drape showing gravity and mass. Heavy Genoa velvet with visible pile texture and dramatic light-catching sheen. Intricate raised gold metallic thread embroidery showing individual coiled threads in baroque scrollwork patterns with highlights on raised surfaces. White ermine fur trim with scientifically accurate black ermine tail spots in natural distribution. Ornate jeweled crown featuring faceted precious gems: rubies showing internal fire and depth, blue sapphires with star effect, brilliant-cut diamonds catching light in rainbow dispersion. Imperial grandeur and absolute sovereignty. Museum masterpiece quality celebrating dynastic power and royal lineage.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as crowned sovereign monarch. Wearing elaborate jeweled imperial crown featuring large central faceted ruby with internal fire, blue sapphires with star effect, and brilliant-cut diamonds in ornate gold settings showing rainbow light dispersion. Sphinx pose with front paws positioned majestically forward in commanding sovereign position. Draped in imperial [ROBE_COLOR] with heavy pile texture and rich sheen, white ermine fur trim with numerous black ermine tail spots in natural arrangement wrapping around shoulders and chest. [EMBROIDERY_STYLE] along all robe edges with individual visible thread coils. Wearing ornate ceremonial gold collar featuring royal medallions with embossed coat of arms and precious gem accents including rubies and sapphires. Ultra-detailed natural coat texture with individual guard hairs catching ceremonial golden light. Commanding presence with dignified expression of absolute imperial authority. Intelligent regal gaze suggesting divine right to rule. Positioned on [CUSHION_COLOR] with elaborate gold bullion fringe, large gold silk tassels with twisted cord, and raised gold embroidery featuring royal heraldic symbols. Formal symmetrical throne room setting with white marble Corinthian pillars visible in background.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as crowned monarch. Wearing elaborate jeweled crown with rubies, sapphires, and diamonds in gold settings. Draped in imperial [ROBE_COLOR] with white ermine fur trim with black spots, [EMBROIDERY_STYLE] depicting heraldic motifs. Ornate gold ceremonial collar with royal medallions and gems. Seated in commanding sovereign posture conveying absolute authority. Positioned on imperial [CUSHION_COLOR] with gold fringe and tassels. Formal symmetrical throne room with marble pillars. Ceremonial golden lighting emphasizing divine majesty.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as royal crowned couple. Both figures wearing elaborate crowns with precious gems and imperial robes with ermine trim and gold embroidery. Ornate gold ceremonial collars with heraldic medallions. Seated together in commanding sovereign postures conveying dual authority with dignified romantic connection. Positioned on imperial [CUSHION_COLOR]. Symmetrical throne room setting with marble pillars. Ceremonial lighting unifying the crowned pair.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as crowned royal family. Multiple figures each wearing elaborate crowns and imperial robes with ermine trim and heraldic embroidery. Ornate ceremonial collars with precious gems. Arranged in symmetrical majestic composition showing dynastic power. Positioned on imperial [CUSHION_COLOR]. Formal throne room with marble pillars. Ceremonial golden lighting creating atmospheric unity emphasizing divine lineage.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as royal heir. Young figure wearing delicate jeweled crown scaled for youth and miniature ceremonial robes with ermine trim and gold embroidery. Small ornate gold collar. Seated in dignified yet tender posture showing noble birthright. Positioned on imperial [CUSHION_COLOR]. Formal throne room setting with reduced scale appropriate to youth. Ceremonial lighting emphasizing innocence and future sovereign authority.`,
  },

  belle_epoque: {
    name: 'Belle Époque',
    description: 'Elegant turn-of-the-century French portrait with Art Nouveau grace',
    colors: {
      primary: '#FFB6C1',
      secondary: '#F0E68C',
      background: '#FFF8DC'
    },
    basePrompt: `Belle Époque oil portrait in early 1900s Parisian elegance, inspired by Giovanni Boldini and John Singer Sargent. Warm romantic golden-hour lighting with soft peachy glow creating luminous atmosphere and gentle shadows. Elegant Parisian salon or garden terrace setting with subtle architectural ironwork details showing Art Nouveau curved organic forms and whiplash lines. Soft warm cornsilk cream atmospheric background with subtle warm tonal gradations. Loose confident alla prima brush strokes showing painterly virtuosity and spontaneous execution with visible energetic handling. Feathery brushwork creating sense of movement and life with fluid gestural marks. Refined pastel and warm color harmonies avoiding harsh contrasts, using subtle iridescent quality suggesting silk fabric. Smooth polished canvas finish with luminous quality from thin oil glazes. Flowing Art Nouveau fashion featuring organic curved whiplash lines and delicate naturalistic floral motifs including iris, lily, and stylized poppy designs. Delicate sterling silver or rose gold metalwork with Art Nouveau floral or curved organic motifs and natural forms. Soft silk cushion with delicate embroidered details and subtle silk fringe. Turn-of-the-century sophisticated metropolitan grace and joie de vivre. Sophisticated French aristocratic elegance and Belle Époque refinement emphasizing beauty, grace, and natural movement.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as early 1900s Belle Époque subject. Wearing fashionable Art Nouveau inspired collar featuring delicate sterling silver or rose gold metalwork with subtle floral motifs including stylized iris or lily designs and organic curved whiplash lines showing period aesthetic. Graceful relaxed sphinx pose with front paws extended forward suggesting elegant movement and natural ease rather than rigid formality. Ultra-detailed natural coat texture rendered with flowing painterly strokes suggesting life and graceful movement. Loose confident brushwork with visible alla prima technique and feathery handling. Intelligent gentle expression with soft direct gaze suggesting Belle Époque refined sensibility. Sophisticated elegant presence conveying turn-of-the-century Parisian grace. Positioned on [CUSHION_COLOR] with delicate hand-embroidered Art Nouveau floral details in silk thread and subtle silk fringe trim. Elegant Parisian salon atmosphere with soft focus architectural details showing Art Nouveau ironwork curves in background.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as early 1900s Belle Époque subject. Wearing flowing turn-of-the-century attire with Art Nouveau details including organic curved lines and naturalistic floral motifs, soft fabrics with delicate lace and silk. Sterling silver or rose gold Art Nouveau jewelry with floral designs. Graceful relaxed posture suggesting elegant movement and natural ease. Loose confident alla prima brushwork with feathery handling. Positioned on [CUSHION_COLOR] with embroidered details. Refined Parisian salon setting with Art Nouveau architectural elements.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as early 1900s Belle Époque couple. Both figures in fashionable coordinated turn-of-the-century attire with Art Nouveau influences and flowing fabrics. Delicate Art Nouveau jewelry with organic motifs. Graceful interactive postures suggesting tender romantic movement. Warm romantic golden-hour lighting unifying the pair in peachy luminous glow. Loose painterly brushwork throughout both figures with feathery handling. Positioned together near [CUSHION_COLOR]. Refined Parisian salon or garden terrace setting with Art Nouveau ironwork details.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as early 1900s Belle Époque family. Multiple figures in refined coordinated turn-of-the-century fashion with Art Nouveau details and soft flowing fabrics. Art Nouveau jewelry coordinated across family. Graceful relaxed arrangement suggesting natural familial interaction and movement. Warm golden-hour lighting creating unified familial warmth and luminous atmosphere. Each figure painted with loose confident alla prima strokes and feathery handling. Positioned around [CUSHION_COLOR]. Sophisticated Parisian salon or garden setting with Art Nouveau architectural details.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as early 1900s Belle Époque child. Young figure in delicate turn-of-the-century attire with soft flowing fabrics, Art Nouveau inspired lace details and naturalistic floral embroidery. Delicate silver or gold jewelry with organic motifs scaled for youth. Graceful youthful posture suggesting natural movement. Warm romantic lighting creating tender peachy glow. Loose painterly brushwork with feathery handling suggesting innocence and life. Positioned on [CUSHION_COLOR] with embroidered Art Nouveau details.`,
  },

  dutch_golden_age: {
    name: 'Dutch Golden Age',
    description: 'Rembrandt-inspired portrait with dramatic chiaroscuro and Protestant restraint',
    colors: {
      primary: '#000000',
      secondary: '#CD853F',
      background: '#3E2723'
    },
    basePrompt: `17th century Dutch Golden Age oil painting inspired by Rembrandt van Rijn. Dramatic Rembrandt chiaroscuro lighting with strong concentrated light from upper left illuminating subject while deep mysterious shadows envelope remainder creating psychological depth and spiritual introspection. Completely dark atmospheric brown background fading to near-black suggesting undefined interior space with no architectural details, emphasizing subject's presence and inner character. Simple modest Protestant aesthetic rejecting ostentation and luxury, emphasizing spiritual values over material display. Visible thick painterly alla prima brushwork with loaded brush technique in highlights showing confident handling. Palette knife work creating impasto texture in bright illuminated areas with tactile surface. Thin transparent oil glazes building deep rich shadows through multiple layers creating spatial depth. Pronounced aged craquelure especially in dark shadow passages showing centuries of age. Dark tobacco-brown varnish patina creating warm antique glow with deep amber undertones. Extremely restrained somber earth-tone palette dominated by lamp black, raw umber, burnt sienna, yellow ochre, and warm grey with minimal color saturation. Simple modest wool broadcloth fabric with matte texture showing natural weave. Protestant restraint and psychological introspection emphasizing inner character over external display. Contemplative mood suggesting Dutch Reformed spiritual values and introspection. Museum masterpiece quality with psychological depth.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Dutch Golden Age subject. Wearing simple single heavy gold link chain with plain oval medallion showing restrained Dutch aesthetic and Protestant values. Sphinx pose with front paws positioned quietly and modestly forward in contemplative position avoiding ostentation. Ultra-detailed natural coat texture rendered with visible thick painterly brushwork using loaded brush technique, individual hairs catching dramatic side light while shadow areas show thin transparent glazes building depth. Intelligent contemplative expression with gentle introspective gaze suggesting inner character and Protestant spiritual depth rather than worldly pride. Quiet dignified presence emphasizing character over material display. Positioned on [CUSHION_COLOR] with simple gold silk piping trim and no tassels showing modest restraint. Cushion rendered with natural fabric folds and subtle wear suggesting use rather than pristine luxury.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Dutch Golden Age subject. Wearing somber black wool broadcloth garment with simple pressed white linen falling band collar showing minimal decoration. Single heavy gold link chain with plain medallion. Seated in quiet contemplative three-quarter pose with hand resting modestly. Dramatic Rembrandt lighting from upper left illuminating face while deep shadows envelope form. Extremely restrained earth-tone palette. Visible thick painterly brushwork with palette knife in highlights and thin glazes in shadows. Positioned on [CUSHION_COLOR] with simple trim.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Dutch Golden Age couple. Both figures in somber coordinated black wool garments with simple white linen collars, modest gold chains. Seated together in quiet contemplative poses suggesting spiritual partnership rather than worldly display. Dramatic Rembrandt chiaroscuro from upper left illuminating both faces while shadows create intimacy. Restrained earth-tone palette throughout. Visible painterly technique on both figures. Positioned near [CUSHION_COLOR]. Dark atmospheric background emphasizing inner character and marital spiritual bond.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Dutch Golden Age family. Multiple figures in coordinated somber black wool garments with white linen collars and modest gold chains. Arranged in contemplative family group emphasizing spiritual bonds over material wealth. Dramatic chiaroscuro creating psychological depth across entire group. Restrained earth-tone palette. Each figure rendered with thick painterly brushwork and thin shadow glazes. Positioned around [CUSHION_COLOR]. Dark atmospheric background emphasizing family's inner character and Protestant values.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Dutch Golden Age child. Young figure in simple black wool garment with white linen collar scaled for youth, small plain gold chain. Seated in quiet contemplative posture appropriate for Dutch Reformed upbringing. Dramatic yet tender Rembrandt lighting from upper left. Restrained earth-tone palette. Visible painterly brushwork. Positioned on [CUSHION_COLOR]. Dark atmospheric background emphasizing youthful innocence and spiritual character formation.`,
  },

  spanish_baroque: {
    name: 'Spanish Baroque',
    description: 'Velázquez court portrait with stark formality and Habsburg dignity',
    colors: {
      primary: '#000000',
      secondary: '#C0C0C0',
      background: '#4A4A4A'
    },
    basePrompt: `17th century Spanish Baroque court oil painting inspired by Diego Velázquez. Single dramatic light source from upper left creating sharp defined shadows and emphasizing three-dimensional form and texture with sculptural quality. Completely neutral dark brown background with absolutely no architectural or decorative elements creating stark isolation and focusing all attention on subject's presence and character. Austere Spanish Habsburg court aesthetic emphasizing formality and dignity over decoration, reflecting court protocol. Severe restricted color palette dominated by absolute lamp black Flemish velvet, pristine pure white Venetian lace, burnished silver metallic chain showing restrained palette. Black Flemish velvet with deep matte pile texture absorbing light dramatically. Elaborate starched white Venetian lace ruff collar with precise geometric figure-eight pattern standing high showing technical mastery. Heavy twisted silver chain with large religious medallion featuring embossed crucifixion scene and Latin inscription border showing Catholic Habsburg devotion. Simple white linen cuffs with minimal bobbin lace trim maintaining restraint. Precise realist brushwork with loaded brush technique showing absolute technical control and mastery. Thin transparent glazes in black areas creating deep spatial recession and atmospheric depth. Visible aged craquelure particularly in dark passages showing centuries of age. Warm dark varnish patina with amber undertones. Velázquez court portrait conventions emphasizing Habsburg dignity and Catholic piety. Museum masterpiece quality with stark formality and psychological intensity.`,

    petModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Spanish Baroque court subject. Wearing heavy twisted silver chain with large religious medallion featuring embossed crucifixion scene and Latin inscription around border showing Catholic Habsburg devotion and piety. Sphinx pose with front paws positioned together in rigidly formal upright position emphasizing court protocol and Spanish dignity. Ultra-detailed natural coat texture rendered with precise realist brushwork showing absolute technical control, individual hairs catching harsh side light while maintaining overall tonal unity. Dignified severe expression with direct commanding gaze suggesting Spanish Habsburg authority and Catholic piety. Rigid formal bearing emphasizing court protocol over warmth or ease. Positioned on [CUSHION_COLOR] with silver metallic thread embroidered Habsburg double-headed eagle and heraldic shield motifs showing dynastic allegiance, cushion trimmed with silver bullion fringe in precise construction showing court standards.`,

    selfModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Spanish Baroque court subject. Wearing severe black Flemish velvet robe with deep matte finish, elaborate starched white Venetian lace ruff collar in figure-eight pattern standing high. Heavy twisted silver chain with religious medallion showing crucifixion and Latin inscription. Simple white linen cuffs with minimal lace. Seated rigidly upright in formal frontal court pose emphasizing Habsburg protocol. Single dramatic light from upper left creating sharp shadows. Extremely restrained palette of black, white, and silver. Precise realist brushwork with loaded brush technique. Positioned on [CUSHION_COLOR] with silver embroidered Habsburg heraldic motifs and bullion fringe.`,

    coupleModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Spanish Baroque court couple. Both figures in severe coordinated black velvet garments with elaborate white lace ruffs and silver chains with religious medallions. Seated rigidly together in formal court poses emphasizing Habsburg protocol rather than warmth. Single dramatic light from upper left illuminating both figures with sharp shadows. Extremely restrained black, white, and silver palette. Precise realist technique on both figures. Positioned near [CUSHION_COLOR] with silver Habsburg heraldic embroidery. Completely neutral dark background emphasizing court formality and Catholic devotion.`,

    familyModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Spanish Baroque court family. Multiple figures in coordinated severe black velvet garments with elaborate white lace ruffs and silver chains with religious medallions. Arranged in rigidly formal court group composition emphasizing Habsburg dynastic hierarchy. Single dramatic lighting creating sharp shadows across group. Restrained black, white, silver palette. Each figure rendered with precise realist brushwork. Positioned around [CUSHION_COLOR] with silver Habsburg heraldic embroidery. Neutral dark background emphasizing court protocol and Catholic family piety.`,

    childrenModifier: `Formal portrait of [SUBJECT_DESCRIPTION] as 17th century Spanish Baroque court child. Young figure in severe black velvet garment with white lace ruff collar scaled for youth, small silver chain with religious medallion. Seated in rigidly formal upright posture appropriate for Habsburg court upbringing. Single dramatic light from upper left creating defined shadows. Restrained palette of black, white, and silver. Precise realist brushwork. Positioned on [CUSHION_COLOR] with silver Habsburg embroidery. Neutral dark background emphasizing youthful dignity and Catholic devotion.`,
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
  'rococo',
  'victorian',
  'regal',
  'belle_epoque',
  'dutch_golden_age',
  'spanish_baroque',
]

export const PET_TYPE_IDS: PetTypeId[] = ['dog', 'cat']

export function isAllowedArtStyle(value: string): value is ArtStyleId {
  return ART_STYLE_IDS.includes(value as ArtStyleId)
}

export function isAllowedPetType(value: string): value is PetTypeId {
  return PET_TYPE_IDS.includes(value as PetTypeId)
}

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

/** Maps art style IDs to their palette key prefix (for styles with non-matching names) */
const PALETTE_PREFIX_BY_STYLE: Partial<Record<ArtStyleId, string>> = {
  dutch_golden_age: 'dutch_',
  spanish_baroque: 'spanish_',
}

/**
 * Get default color palette for a given art style
 */
export function getDefaultPalette(artStyle: ArtStyleId): string {
  if (artStyle === 'dutch_golden_age') return 'dutch_classic'
  if (artStyle === 'spanish_baroque') return 'spanish_classic'
  return `${artStyle}_classic`
}

/**
 * Get all palette variations for a given art style
 */
export function getPalettesForStyle(artStyle: ArtStyleId): string[] {
  const prefix = PALETTE_PREFIX_BY_STYLE[artStyle] ?? `${artStyle}_`
  return Object.keys(COLOR_PALETTES).filter(key => key.startsWith(prefix))
}

/**
 * Build the full prompt with proper ordering and dynamic replacements.
 *
 * @param artStyle - The art style ID
 * @param subjectType - The subject type (pet, dog, cat, family, etc.)
 * @param subjectDescription - Detailed description of the subject (e.g., "a fluffy white Persian cat with bright blue eyes")
 * @param colorPalette - Optional color palette ID (e.g., "renaissance_classic"). If omitted, uses default.
 * @param customizations - Optional custom overrides
 * @returns Complete prompt with technical details first, subject details second
 */
export function buildPrompt(
  artStyle: ArtStyleId,
  subjectType: SubjectTypeId,
  subjectDescription: string,
  colorPalette?: string,
  customizations?: {
    background?: string
    clothing?: string
    accessories?: string[]
  }
): string {
  const style = ART_STYLE_PROMPTS[artStyle]

  // Get color palette (use default if not specified)
  const paletteId = colorPalette || getDefaultPalette(artStyle)
  const palette = COLOR_PALETTES[paletteId]

  if (!palette) {
    throw new Error(`Color palette "${paletteId}" not found`)
  }

  // Determine which modifier to use based on subject type
  let modifierKey: keyof typeof style

  if (subjectType === 'pet' || subjectType === 'dog' || subjectType === 'cat') {
    modifierKey = 'petModifier'
  } else if (subjectType === 'self') {
    modifierKey = 'selfModifier'
  } else if (subjectType === 'couple') {
    modifierKey = 'coupleModifier'
  } else if (subjectType === 'family') {
    modifierKey = 'familyModifier'
  } else if (subjectType === 'children') {
    modifierKey = 'childrenModifier'
  } else {
    modifierKey = 'petModifier' // fallback
  }

  const modifier = style[modifierKey]

  if (typeof modifier !== 'string') {
    throw new Error(`Modifier "${modifierKey}" not found for style "${artStyle}"`)
  }

  // Replace placeholders in modifier
  let resolvedModifier = modifier
    .replaceAll('[SUBJECT_DESCRIPTION]', subjectDescription)
    .replaceAll('[ROBE_COLOR]', palette.robe)
    .replaceAll('[CUSHION_COLOR]', palette.cushion)
    .replaceAll('[EMBROIDERY_STYLE]', palette.embroidery)

  // Apply customizations if provided
  if (customizations?.clothing) {
    resolvedModifier = resolvedModifier.replace(/wearing [^.]+\./, `wearing ${customizations.clothing}.`)
  }

  // CRITICAL: Technical details FIRST, subject details SECOND
  // This ensures the aging effects, lighting, and textures are prioritized
  return `${style.basePrompt}. ${resolvedModifier}`
}

/**
 * Helper function to get a random palette for a style (useful for variety)
 */
export function getRandomPaletteForStyle(artStyle: ArtStyleId): string {
  const palettes = getPalettesForStyle(artStyle)
  if (palettes.length === 0) return getDefaultPalette(artStyle)
  return palettes[Math.floor(Math.random() * palettes.length)]
}

/** Composition hints for family portraits by art style (multi-image) */
const FAMILY_COMPOSITION_HINTS: Partial<Record<ArtStyleId, string>> = {
  renaissance: 'Pyramidal composition with parents central and children flanking in balanced arrangement.',
  baroque: 'Dynamic diagonal grouping with figures at varied heights creating baroque dynamism.',
  rococo: 'Elegant balanced grouping with figures arranged in aristocratic tiered composition.',
  victorian: 'Formal row or tiered seating with dignified spacing and proper Victorian bearing.',
  regal: 'Throne-room hierarchy with parents elevated centrally and children at sides.',
  belle_epoque: 'Graceful relaxed grouping suggesting natural familial interaction.',
  dutch_golden_age: 'Contemplative family group in quiet dignified arrangement.',
  spanish_baroque: 'Rigidly formal court group composition emphasizing dynastic hierarchy.',
}

/**
 * Migration helper: Convert old prompts to new format.
 * Use for API routes that pass (artStyle, subjectType, petType).
 * When imageCount >= 2 for family/couple, prepends multi-image reference instructions.
 */
export function buildPromptLegacy(
  artStyle: ArtStyleId,
  subjectType: SubjectTypeId,
  petType?: PetTypeId,
  imageCount?: number,
): string {
  const subjectLabel =
    subjectType === 'pet' && petType
      ? `a ${petType}`
      : subjectType === 'dog'
        ? 'a dog'
        : subjectType === 'cat'
          ? 'a cat'
          : subjectType === 'couple' || subjectType === 'family'
            ? 'the subjects'
            : 'the subject'

  let prompt = buildPrompt(artStyle, subjectType, subjectLabel)

  // Multi-image: prepend reference instructions for family/couple
  if (
    imageCount != null &&
    imageCount >= 2 &&
    (subjectType === 'family' || subjectType === 'couple')
  ) {
    const refLines: string[] = []
    for (let i = 0; i < imageCount; i++) {
      refLines.push(
        `Image ${i + 1}: reference photo of ${subjectType === 'couple' ? (i === 0 ? 'person 1' : 'person 2') : `family member ${i + 1}`}.`
      )
    }
    const compositionHint =
      subjectType === 'family' ? FAMILY_COMPOSITION_HINTS[artStyle as ArtStyleId] : null
    const multiImagePrefix = [
      `REFERENCE IMAGES PROVIDED: ${refLines.join(' ')}`,
      'Create a unified portrait preserving each person\'s exact likeness and facial features from their reference image.',
      compositionHint ? `Composition: ${compositionHint}` : null,
    ]
      .filter(Boolean)
      .join(' ')
    prompt = `${multiImagePrefix}. ${prompt}`
  }

  return prompt
}
