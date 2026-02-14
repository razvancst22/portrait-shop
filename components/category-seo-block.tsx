import Link from 'next/link'
import type { SubjectTypeId } from '@/lib/prompts/artStyles'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'

type CategorySeoBlockProps = {
  category: SubjectTypeId
  intro: string
  benefits?: string[]
}

export function CategorySeoBlock({ category, intro, benefits }: CategorySeoBlockProps) {
  const others = SUBJECT_TYPE_IDS.filter((c) => c !== category)

  return (
    <section className="container max-w-2xl mx-auto px-4 py-8 text-center border-b border-border">
      <p className="text-muted-foreground mb-6">{intro}</p>
      {benefits && benefits.length > 0 && (
        <ul className="text-sm text-muted-foreground mb-6 list-none space-y-2">
          {benefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        Also try:{' '}
        {others.map((c, i) => (
          <span key={c}>
            <Link href={CATEGORY_ROUTES[c].path} className="text-foreground underline hover:no-underline">
              {CATEGORY_ROUTES[c].title}
            </Link>
            {i < others.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>
    </section>
  )
}
