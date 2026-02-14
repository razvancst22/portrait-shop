import * as React from 'react'
import { cn } from '@/lib/utils'

const variantClasses: Record<string, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
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
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

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
