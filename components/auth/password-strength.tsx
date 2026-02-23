'use client'

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'empty'

/**
 * Computes password strength based on length and character variety.
 * - empty: no input
 * - weak: < 8 chars or only 1 character type
 * - medium: 8+ chars with 2+ types (upper, lower, digit, symbol)
 * - strong: 10+ chars with 3+ types, or 8+ chars with all 4 types
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password.length) return 'empty'

  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const typeCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length
  const len = password.length

  if (len < 8 || typeCount < 2) return 'weak'
  if (len >= 10 && typeCount >= 3) return 'strong'
  if (len >= 8 && typeCount >= 4) return 'strong'
  if (len >= 8 && typeCount >= 2) return 'medium'

  return 'weak'
}

/** Returns true if strength meets or exceeds the minimum required for signup. */
export function meetsMinStrength(
  strength: PasswordStrength,
  min: 'medium' | 'strong' = 'medium'
): boolean {
  if (strength === 'empty' || strength === 'weak') return false
  if (min === 'strong') return strength === 'strong'
  return strength === 'medium' || strength === 'strong'
}

const strengthLabels: Record<PasswordStrength, string> = {
  empty: '',
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
}

const strengthColors: Record<PasswordStrength, string> = {
  empty: 'bg-muted',
  weak: 'bg-destructive',
  medium: 'bg-amber-500',
  strong: 'bg-emerald-500',
}

type PasswordStrengthIndicatorProps = {
  password: string
  minStrength?: 'medium' | 'strong'
  /** Show label text (e.g. "Weak", "Medium", "Strong") */
  showLabel?: boolean
  /** Additional class for the container */
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  minStrength = 'medium',
  showLabel = true,
  className = '',
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password)
  const isValid = meetsMinStrength(strength, minStrength)

  if (strength === 'empty') {
    return (
      <div className={`flex items-center gap-2 mt-1.5 ${className}`}>
        <div
          className="h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={0}
        >
          <div className="h-full w-0 transition-all duration-300" />
        </div>
      </div>
    )
  }

  const barCount = strength === 'weak' ? 1 : strength === 'medium' ? 2 : 3

  return (
    <div className={`flex items-center gap-2 mt-1.5 ${className}`}>
      <div
        className="h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden flex gap-0.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={barCount}
        aria-label={`Password strength: ${strengthLabels[strength]}`}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              i <= barCount ? strengthColors[strength] : 'bg-transparent'
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            isValid ? 'text-muted-foreground' : 'text-destructive'
          }`}
        >
          {strengthLabels[strength]}
        </span>
      )}
    </div>
  )
}
