'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LOGO_WHITE, LOGO_BLACK } from '@/lib/site-config'

interface LogoProps {
  href?: string
  className?: string
  /** Fixed height in px – used when heightClass is not set */
  height?: number
  /** Responsive Tailwind height classes, e.g. "h-10 md:h-14 lg:h-20" – overrides height when set */
  heightClass?: string
}

export function Logo({ href = '/', className = '', height = 36, heightClass }: LogoProps) {
  const imgStyle = !heightClass ? { height: `${height}px`, width: 'auto' } as React.CSSProperties : undefined
  const content = (
    <>
      {/* Black logo for light backgrounds */}
      <img
        src={LOGO_BLACK}
        alt="portraitz.shop"
        className={cn('w-auto object-contain dark:hidden', heightClass)}
        style={imgStyle}
      />
      {/* White logo for dark backgrounds */}
      <img
        src={LOGO_WHITE}
        alt="portraitz.shop"
        className={cn('w-auto object-contain hidden dark:block', heightClass)}
        style={imgStyle}
      />
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn('inline-flex items-center', className)} aria-label="Go to home">
        {content}
      </Link>
    )
  }

  return <span className={cn('inline-flex items-center', className)}>{content}</span>
}
