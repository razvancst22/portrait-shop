import type { MetadataRoute } from 'next'
import { CATEGORY_ROUTES } from '@/lib/prompts/artStyles'
import { SITE_DOMAIN } from '@/lib/site-config'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${SITE_DOMAIN}`

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryUrls = Object.values(CATEGORY_ROUTES).map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  const staticUrls = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${BASE_URL}/order-lookup`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${BASE_URL}/refunds`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${BASE_URL}/commercial`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ]

  return [...staticUrls, ...categoryUrls]
}
