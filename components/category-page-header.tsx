import type { SubjectTypeId } from '@/lib/prompts/artStyles'
import { CREATE_FLOW_COPY } from '@/lib/create-flow-config'

type CategoryPageHeaderProps = {
  category: SubjectTypeId
}

export function CategoryPageHeader({ category }: CategoryPageHeaderProps) {
  const copy = CREATE_FLOW_COPY[category]
  return (
    <section className="max-w-3xl w-full text-center mb-6">
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3 animate-fade-in-up">
        {copy.headline}
      </h1>
      <p className="text-muted-foreground text-lg animate-fade-in">
        {copy.subhead}
      </p>
    </section>
  )
}
