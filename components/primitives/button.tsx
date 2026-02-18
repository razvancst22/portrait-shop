import * as React from 'react'
import { cn } from '@/lib/utils'

const variantClasses: Record<string, string> = {
  default:
    'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
  destructive:
    'bg-destructive text-white shadow-md shadow-destructive/20 hover:bg-destructive/95 hover:shadow-lg hover:shadow-destructive/25 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
  outline:
    'border border-input bg-background/80 backdrop-blur-sm shadow-sm hover:border-primary/60 hover:bg-primary/8 hover:text-foreground hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
  secondary:
    'bg-secondary/90 text-secondary-foreground shadow-sm hover:bg-secondary/75 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
  ghost:
    'hover:bg-primary/12 hover:text-foreground hover:-translate-y-0.5 active:bg-primary/20 active:translate-y-0',
  link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80 hover:-translate-y-0.5',
}

const sizeClasses: Record<string, string> = {
  default: 'h-9 px-4 py-2',
  xs: 'h-6 rounded-md px-2 text-xs',
  sm: 'h-8 rounded-md px-3',
  lg: 'h-10 rounded-md px-6',
  icon: 'size-9',
  'icon-sm': 'size-8',
  'icon-lg': 'size-10',
}

const baseButtonClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = 'default', size = 'default', ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        data-slot="button"
        className={cn(
          baseButtonClasses,
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export function getButtonClassName(
  variant: keyof typeof variantClasses = 'default',
  size: keyof typeof sizeClasses = 'default',
  className?: string
) {
  return cn(baseButtonClasses, variantClasses[variant], sizeClasses[size], className)
}

export { Button }
export { variantClasses as buttonVariants, sizeClasses as buttonSizeClasses }
