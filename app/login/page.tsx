import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Sign In – Create More Classic Art Portraits',
  description: 'Sign in to access unlimited portrait generations, manage your artwork, and get exclusive discounts. Start creating more Renaissance, Baroque, and Victorian masterpieces.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  const redirectUrl = redirect && redirect.startsWith('/') ? redirect : undefined
  return (
    <div className="flex flex-col items-center px-4 py-8 md:py-12 bg-generating">
      <main className="max-w-md w-full text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-3">
          Log in
        </h1>
        <p className="text-muted-foreground mb-8">
          Sign in to buy more Portrait Generations and see your portraits.
        </p>
        <div className="text-left">
          <AuthForm redirectUrl={redirectUrl} />
        </div>
      </main>
    </div>
  )
}
