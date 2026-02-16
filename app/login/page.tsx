import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Log in | petportrait.shop',
  description: 'Sign in to your account to buy more credits and manage your portraits.',
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:py-24">
      <main className="max-w-md w-full text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-3">
          Log in
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in to buy more credits and see your portraits.
        </p>
        <div className="text-left">
          <AuthForm />
        </div>
      </main>
    </div>
  )
}
