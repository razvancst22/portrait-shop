import { Skeleton } from '@/components/primitives/skeleton'

export default function DownloadLoading() {
  return (
    <div className="py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Skeleton className="mb-2 h-8 w-56" />
        <Skeleton className="mb-6 h-5 w-full max-w-sm" />
        <div className="space-y-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <Skeleton className="mt-8 h-4 w-40" />
      </div>
    </div>
  )
}
