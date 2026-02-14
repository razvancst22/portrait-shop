import { Skeleton } from '@/components/primitives/skeleton'

export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}
