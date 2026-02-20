/**
 * Accessibility utilities for color contrast validation
 * Based on WCAG 2.1 guidelines
 */

/**
 * Parse OKLCH color string to RGB values
 */
function oklchToRgb(oklch: string): [number, number, number] {
  // Extract L, C, H values from oklch(L C H) format
  const match = oklch.match(/oklch\(([^)]+)\)/);
  if (!match) return [0, 0, 0];

  const [l, c, h = 0] = match[1].split(' ').map(Number);
  
  // Convert OKLCH to RGB (simplified approximation)
  // This is a rough approximation - in production, use a proper color conversion library
  const lightness = l * 255;
  const chroma = c * 128;
  const hueRad = (h * Math.PI) / 180;
  
  // Approximate conversion to RGB
  const a = chroma * Math.cos(hueRad);
  const b = chroma * Math.sin(hueRad);
  
  // Convert to RGB (simplified)
  let r = lightness + a * 0.3;
  let g = lightness - a * 0.15 - b * 0.2;
  let bl = lightness - a * 0.15 + b * 0.2;
  
  // Clamp values
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  bl = Math.max(0, Math.min(255, bl));
  
  return [Math.round(r), Math.round(g), Math.round(bl)];
}

/**
 * Calculate relative luminance of an RGB color
 */
function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = oklchToRgb(color1);
  const rgb2 = oklchToRgb(color2);
  
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsWCAG(ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean {
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  // WCAG AA
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Get contrast rating label
 */
export function getContrastRating(ratio: number): { label: string; level: string; color: string } {
  if (ratio >= 7) {
    return { label: 'Excellent', level: 'AAA', color: 'green' };
  } else if (ratio >= 4.5) {
    return { label: 'Good', level: 'AA', color: 'blue' };
  } else if (ratio >= 3) {
    return { label: 'Fair', level: 'AA Large', color: 'orange' };
  } else {
    return { label: 'Poor', level: 'Fail', color: 'red' };
  }
}

/**
 * Test all critical color combinations for a theme
 */
export interface ColorTest {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  rating: ReturnType<typeof getContrastRating>;
  critical: boolean;
}

export function validateThemeAccessibility(theme: {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
}): ColorTest[] {
  const tests: ColorTest[] = [
    {
      name: 'Body Text',
      foreground: theme.foreground,
      background: theme.background,
      ratio: getContrastRatio(theme.foreground, theme.background),
      rating: getContrastRating(getContrastRatio(theme.foreground, theme.background)),
      critical: true
    },
    {
      name: 'Primary Button',
      foreground: theme.primaryForeground,
      background: theme.primary,
      ratio: getContrastRatio(theme.primaryForeground, theme.primary),
      rating: getContrastRating(getContrastRatio(theme.primaryForeground, theme.primary)),
      critical: true
    },
    {
      name: 'Secondary Button',
      foreground: theme.secondaryForeground,
      background: theme.secondary,
      ratio: getContrastRatio(theme.secondaryForeground, theme.secondary),
      rating: getContrastRating(getContrastRatio(theme.secondaryForeground, theme.secondary)),
      critical: true
    },
    {
      name: 'Muted Text',
      foreground: theme.mutedForeground,
      background: theme.background,
      ratio: getContrastRatio(theme.mutedForeground, theme.background),
      rating: getContrastRating(getContrastRatio(theme.mutedForeground, theme.background)),
      critical: false
    },
    {
      name: 'Card Content',
      foreground: theme.cardForeground,
      background: theme.card,
      ratio: getContrastRatio(theme.cardForeground, theme.card),
      rating: getContrastRating(getContrastRatio(theme.cardForeground, theme.card)),
      critical: true
    }
  ];

  return tests;
}

/**
 * Simplified color values for themes (for testing purposes)
 * In a real implementation, you'd extract these from CSS variables
 */
export const THEME_COLORS = {
  atelier: {
    background: 'oklch(0.985 0.004 85)',
    foreground: 'oklch(0.18 0.01 285)',
    primary: 'oklch(0.42 0.14 18)',
    primaryForeground: 'oklch(0.985 0 0)',
    secondary: 'oklch(0.965 0.006 85)',
    secondaryForeground: 'oklch(0.25 0.01 285)',
    muted: 'oklch(0.96 0.005 85)',
    mutedForeground: 'oklch(0.5 0.01 285)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.18 0.01 285)',
    border: 'oklch(0.91 0.008 85)'
  },
  monochrome: {
    background: 'oklch(0.99 0 0)',
    foreground: 'oklch(0.15 0 0)',
    primary: 'oklch(0.45 0.2 240)',
    primaryForeground: 'oklch(0.99 0 0)',
    secondary: 'oklch(0.95 0 0)',
    secondaryForeground: 'oklch(0.2 0 0)',
    muted: 'oklch(0.96 0 0)',
    mutedForeground: 'oklch(0.45 0 0)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.15 0 0)',
    border: 'oklch(0.88 0 0)'
  },
  earth: {
    background: 'oklch(0.97 0.008 75)',
    foreground: 'oklch(0.2 0.02 40)',
    primary: 'oklch(0.48 0.12 35)',
    primaryForeground: 'oklch(0.97 0.008 75)',
    secondary: 'oklch(0.92 0.01 75)',
    secondaryForeground: 'oklch(0.25 0.02 40)',
    muted: 'oklch(0.94 0.008 75)',
    mutedForeground: 'oklch(0.48 0.02 40)',
    card: 'oklch(0.99 0.005 80)',
    cardForeground: 'oklch(0.2 0.02 40)',
    border: 'oklch(0.86 0.01 75)'
  },
  professional: {
    background: 'oklch(0.98 0.005 240)',
    foreground: 'oklch(0.18 0.02 240)',
    primary: 'oklch(0.3 0.08 240)',
    primaryForeground: 'oklch(0.98 0.005 240)',
    secondary: 'oklch(0.94 0.005 240)',
    secondaryForeground: 'oklch(0.22 0.02 240)',
    muted: 'oklch(0.96 0.005 240)',
    mutedForeground: 'oklch(0.45 0.02 240)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.18 0.02 240)',
    border: 'oklch(0.88 0.005 240)'
  },
  pastels: {
    background: 'oklch(0.98 0.01 310)',
    foreground: 'oklch(0.22 0.02 280)',
    primary: 'oklch(0.65 0.08 300)',
    primaryForeground: 'oklch(0.98 0.01 310)',
    secondary: 'oklch(0.93 0.008 310)',
    secondaryForeground: 'oklch(0.26 0.02 280)',
    muted: 'oklch(0.95 0.008 310)',
    mutedForeground: 'oklch(0.48 0.02 280)',
    card: 'oklch(0.995 0.005 320)',
    cardForeground: 'oklch(0.22 0.02 280)',
    border: 'oklch(0.88 0.01 310)'
  },
  bold: {
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.1 0 0)',
    primary: 'oklch(0.1 0 0)',
    primaryForeground: 'oklch(1 0 0)',
    secondary: 'oklch(0.92 0 0)',
    secondaryForeground: 'oklch(0.1 0 0)',
    muted: 'oklch(0.95 0 0)',
    mutedForeground: 'oklch(0.4 0 0)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.1 0 0)',
    border: 'oklch(0.85 0 0)'
  }
} as const;

export type ThemeName = keyof typeof THEME_COLORS;