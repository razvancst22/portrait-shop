import { Skeleton } from '@/components/primitives/skeleton'

export default function CreateLoading() {
  return (
    <div className="py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <Skeleton className="mb-6 h-8 w-16 rounded-full" />
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-8 h-5 w-full max-w-md" />
        <div className="space-y-8">
          <div>
            <Skeleton className="mb-3 h-5 w-24" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="aspect-[4/5] rounded-lg" />
              <Skeleton className="aspect-[4/5] rounded-lg" />
            </div>
          </div>
          <div>
            <Skeleton className="mb-3 h-5 w-20" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
