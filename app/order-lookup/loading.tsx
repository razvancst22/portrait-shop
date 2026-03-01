import { Skeleton } from '@/components/primitives/skeleton'

export default function OrderLookupLoading() {
  return (
    <div className="pt-4 md:pt-6 pb-8 px-4">
      <div className="container max-w-md mx-auto">
        <Skeleton className="mb-3 h-8 w-28 rounded-full" />
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-6 h-5 w-full" />
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-1.5 h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="mb-1.5 h-4 w-14" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
