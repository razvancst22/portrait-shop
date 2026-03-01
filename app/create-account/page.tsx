import type { Metadata } from 'next'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create an account to save portraits, buy digital packs, access high-res downloads.",
}

export default async function CreateAccountPage({
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
          Create account
        </h1>
        <p className="text-muted-foreground mb-8">
          Create an account to purchase Digital Packs and manage your portraits.
        </p>
        <div className="text-left">
          <AuthForm redirectUrl={redirectUrl} initialMode="signup" />
        </div>
      </main>
    </div>
  )
}
