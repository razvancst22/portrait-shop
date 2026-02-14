import { Skeleton } from '@/components/primitives/skeleton'

export default function CheckoutLoading() {
  return (
    <div className="py-8 px-4">
      <div className="container max-w-md mx-auto">
        <Skeleton className="mb-6 h-8 w-32 rounded-full" />
        <Skeleton className="mb-2 h-8 w-28" />
        <Skeleton className="mb-6 h-5 w-full" />
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-1.5 h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
