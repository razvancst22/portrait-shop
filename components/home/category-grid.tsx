import Link from 'next/link'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'
import type { SubjectTypeId } from '@/lib/prompts/artStyles'
import { getButtonClassName } from '@/components/primitives/button'

const CATEGORY_ICONS: Record<SubjectTypeId, string> = {
  pet: '🐕',
  family: '👨‍👩‍👧‍👦',
  children: '👧',
  couple: '💑',
  self: '🖼️',
}

const CATEGORY_SUBTITLES: Record<SubjectTypeId, string> = {
  pet: 'Dogs, cats, and more',
  family: 'Group portraits',
  children: 'Child portraits',
  couple: 'Two people',
  self: 'Your portrait',
}

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in animate-fade-in-delay-2">
      {SUBJECT_TYPE_IDS.map((id) => {
        const route = CATEGORY_ROUTES[id]
        return (
          <Link
            key={id}
            href={route.path}
            className={getButtonClassName(
              'outline',
              'lg',
              'h-auto flex flex-col items-center justify-center gap-2 py-6 rounded-xl text-left hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <span className="text-4xl" aria-hidden>
              {CATEGORY_ICONS[id]}
            </span>
            <span className="font-semibold text-foreground">{route.title}</span>
            <span className="text-sm text-muted-foreground font-normal">
              {CATEGORY_SUBTITLES[id]}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
