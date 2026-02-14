import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className={getButtonClassName('default', 'lg', 'rounded-full')}>
            Back to home
          </Link>
          <Link href="/" className={getButtonClassName('outline', 'lg', 'rounded-full')}>
            Create portrait
          </Link>
        </div>
      </div>
    </div>
  )
}
