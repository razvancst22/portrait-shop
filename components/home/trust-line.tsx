import { cn } from '@/lib/utils'

type TrustLineProps = {
  className?: string
}

export function TrustLine({ className }: TrustLineProps) {
  return (
    <p className={cn('text-sm text-muted-foreground text-center', className)}>
      No credit card for preview. Same image in high resolution when you purchase—no re-generation, no surprises.
    </p>
  )
}