/**
 * Home page gallery images with optimized loading.
 * Images are pre-optimized in multiple formats and sizes for best performance.
 */

export interface GalleryImage {
  id: string;
  text: string;
  // Responsive image sources
  sources: {
    webp: {
      sm: string;   // 400px - mobile
      md: string;   // 800px - desktop
      lg: string;   // 1200px - large screens
    };
    jpeg: {
      sm: string;   // 400px fallback
      md: string;   // 800px fallback
      lg: string;   // 1200px fallback
    };
  };
  // Low-quality blur placeholder
  blurDataURL: string;
  // Default fallback
  fallback: string;
}

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: '1',
    text: 'Renaissance',
    sources: {
      webp: {
        sm: '/gallery-optimized/1-sm.webp',
        md: '/gallery-optimized/1.webp', 
        lg: '/gallery-optimized/1-lg.webp'
      },
      jpeg: {
        sm: '/gallery-optimized/1-sm.jpg',
        md: '/gallery-optimized/1.jpg',
        lg: '/gallery-optimized/1-lg.jpg'
      }
    },
    blurDataURL: '/gallery-optimized/1-blur.webp',
    fallback: '/gallery-optimized/1.jpg'
  },
  {
    id: '2', 
    text: 'Baroque',
    sources: {
      webp: {
        sm: '/gallery-optimized/2-sm.webp',
        md: '/gallery-optimized/2.webp',
        lg: '/gallery-optimized/2-lg.webp'
      },
      jpeg: {
        sm: '/gallery-optimized/2-sm.jpg', 
        md: '/gallery-optimized/2.jpg',
        lg: '/gallery-optimized/2-lg.jpg'
      }
    },
    blurDataURL: '/gallery-optimized/2-blur.webp',
    fallback: '/gallery-optimized/2.jpg'
  },
  {
    id: '3',
    text: 'Victorian', 
    sources: {
      webp: {
        sm: '/gallery-optimized/3-sm.webp',
        md: '/gallery-optimized/3.webp',
        lg: '/gallery-optimized/3-lg.webp'
      },
      jpeg: {
        sm: '/gallery-optimized/3-sm.jpg',
        md: '/gallery-optimized/3.jpg', 
        lg: '/gallery-optimized/3-lg.jpg'
      }
    },
    blurDataURL: '/gallery-optimized/3-blur.webp',
    fallback: '/gallery-optimized/3.jpg'
  },
  {
    id: '4',
    text: 'Classical',
    sources: {
      webp: {
        sm: '/gallery-optimized/4-sm.webp',
        md: '/gallery-optimized/4.webp',
        lg: '/gallery-optimized/4-lg.webp' 
      },
      jpeg: {
        sm: '/gallery-optimized/4-sm.jpg',
        md: '/gallery-optimized/4.jpg',
        lg: '/gallery-optimized/4-lg.jpg'
      }
    },
    blurDataURL: '/gallery-optimized/4-blur.webp',
    fallback: '/gallery-optimized/4.jpg'
  }
];

// Utility function to get the optimal image URL based on screen size
export function getOptimalImageUrl(image: GalleryImage, screenWidth?: number): string {
  const width = screenWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Determine size based on screen width
  const size = width <= 480 ? 'sm' : width <= 1024 ? 'md' : 'lg';
  
  // Prefer WebP if supported, fallback to JPEG
  const supportsWebP = typeof window !== 'undefined' && 
    window.document?.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0;
  
  if (supportsWebP) {
    return image.sources.webp[size];
  } else {
    return image.sources.jpeg[size];
  }
}

// Legacy format for backward compatibility
export const GALLERY_IMAGES_LEGACY: { image: string; text: string }[] = GALLERY_IMAGES.map(img => ({
  image: img.fallback,
  text: img.text
}));

/** Page keys for gallery selection. 'home' = main page; others = category pages. */
export type GalleryPageKey = 'home' | 'pet' | 'dog' | 'cat' | 'family' | 'children' | 'couple' | 'self'

/** Different photos per page, same CircularGallery style. Add or reorder images per page as needed. */
export const GALLERY_IMAGES_BY_PAGE: Record<GalleryPageKey, GalleryImage[]> = {
  home: [GALLERY_IMAGES[0], GALLERY_IMAGES[1], GALLERY_IMAGES[2], GALLERY_IMAGES[3]],
  pet: [GALLERY_IMAGES[0], GALLERY_IMAGES[1], GALLERY_IMAGES[2], GALLERY_IMAGES[3]],
  dog: [GALLERY_IMAGES[1], GALLERY_IMAGES[2], GALLERY_IMAGES[3], GALLERY_IMAGES[0]],
  cat: [GALLERY_IMAGES[2], GALLERY_IMAGES[3], GALLERY_IMAGES[0], GALLERY_IMAGES[1]],
  family: [GALLERY_IMAGES[3], GALLERY_IMAGES[0], GALLERY_IMAGES[1], GALLERY_IMAGES[2]],
  children: [GALLERY_IMAGES[0], GALLERY_IMAGES[2], GALLERY_IMAGES[1], GALLERY_IMAGES[3]],
  couple: [GALLERY_IMAGES[1], GALLERY_IMAGES[3], GALLERY_IMAGES[0], GALLERY_IMAGES[2]],
  self: [GALLERY_IMAGES[2], GALLERY_IMAGES[0], GALLERY_IMAGES[3], GALLERY_IMAGES[1]],
}

/** Returns gallery images for a page. Pass isHomePage=true for main page, or category for category pages. */
export function getGalleryImagesForPage(
  category: string,
  isHomePage: boolean
): GalleryImage[] {
  const key: GalleryPageKey = isHomePage ? 'home' : (category as GalleryPageKey)
  return GALLERY_IMAGES_BY_PAGE[key] ?? GALLERY_IMAGES
}
