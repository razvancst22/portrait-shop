import { cn } from '@/lib/utils'

type PageContainerProps = {
  children: React.ReactNode
  className?: string
  /** Max width: 'sm' (max-w-md), 'md' (max-w-2xl), 'lg' (max-w-3xl), 'xl' (max-w-4xl). Default: lg */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  /** Vertical padding. Default: py-12 md:py-16 */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const maxWidthClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
}

const paddingClasses = {
  none: '',
  sm: 'py-6 md:py-8',
  md: 'py-8 md:py-12',
  lg: 'py-10 md:py-14',
}

export function PageContainer({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto px-4',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
