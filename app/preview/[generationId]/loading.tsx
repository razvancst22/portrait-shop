import { Skeleton } from '@/components/primitives/skeleton'

export default function PreviewLoading() {
  return (
    <div className="py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Skeleton className="mb-6 h-8 w-24 rounded-full" />
        <Skeleton className="mb-2 h-8 w-56" />
        <Skeleton className="mb-6 h-5 w-full max-w-md" />
        <Skeleton className="mb-6 h-4 w-full max-w-lg rounded-lg" />
        <Skeleton className="mb-6 aspect-[4/5] w-full max-w-sm mx-auto rounded-xl" />
        <Skeleton className="h-10 w-full max-w-sm mx-auto rounded-full" />
        <Skeleton className="mt-4 h-3 w-48 mx-auto" />
      </div>
    </div>
  )
}
