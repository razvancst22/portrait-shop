import * as React from 'react'
import { cn } from '@/lib/utils'

function Card(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border py-6 shadow-sm',
        className
      )}
      {...rest}
    />
  )
}

function CardHeader(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-2 px-6', className)}
      {...rest}
    />
  )
}

function CardTitle(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...rest}
    />
  )
}

function CardDescription(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...rest}
    />
  )
}

function CardContent(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...rest}
    />
  )
}

function CardFooter(props: React.ComponentProps<'div'>) {
  const { className, ...rest } = props
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6', className)}
      {...rest}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
