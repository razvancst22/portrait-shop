import type { SubjectTypeId } from '@/lib/prompts/artStyles'
import { CATEGORY_ROUTES } from '@/lib/prompts/artStyles'
import { SITE_NAME, SITE_DOMAIN } from '@/lib/site-config'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${SITE_DOMAIN}`

type CategoryJsonLdProps = {
  category: SubjectTypeId
}

export function CategoryJsonLd({ category }: CategoryJsonLdProps) {
  const route = CATEGORY_ROUTES[category]
  const url = `${BASE_URL}${route.path}`

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${route.title} | ${SITE_NAME}`,
    description: `Turn your ${category} photo into a classic portrait. Renaissance, Baroque, Victorian styles. Free preview, one fixed price.`,
    url,
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: route.title, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  )
}
