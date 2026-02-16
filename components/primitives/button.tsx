import * as React from 'react'
import { cn } from '@/lib/utils'

const variantClasses: Record<string, string> = {
  default:
    'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]',
  destructive:
    'bg-destructive text-white shadow-md hover:bg-destructive/90 hover:shadow-lg active:scale-[0.98]',
  outline:
    'border border-input bg-background shadow-sm hover:border-primary hover:bg-primary/5 hover:text-foreground hover:shadow-md active:scale-[0.98]',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/70 hover:shadow-md active:scale-[0.98]',
  ghost:
    'hover:bg-primary/10 hover:text-foreground active:bg-primary/15',
  link: 'text-primary underline-offset-4 hover:underline hover:text-primary/90',
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
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

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
