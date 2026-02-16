import type { Metadata } from 'next'
import Link from 'next/link'
import { Button, getButtonClassName } from '@/components/primitives/button'
import { PageContainer } from '@/components/layout/page-container'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Download your bundle – petportrait.shop',
  description: 'Download your pet portrait bundle. Links expire in 1 hour. Lost your link? Use order lookup to get a new one.',
}
import { verifyDownloadToken } from '@/lib/email/delivery'
import { BUCKET_DELIVERABLES } from '@/lib/constants'

const SIGNED_URL_EXPIRY = 3600 // 1 hour

const ASSET_LABELS: Record<string, string> = {
  portrait_4_5: 'Portrait (4:5)',
  phone_9_16: 'Phone wallpaper (9:16)',
  square_4_4: 'Square (4:4)',
  tablet_3_4: 'Tablet (3:4)',
}

async function getDownloadData(token: string | null) {
  if (!token || typeof token !== 'string') return null
  const payload = verifyDownloadToken(token)
  if (!payload) return null

  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .eq('id', payload.orderId)
    .single()

  if (orderError || !order || order.status !== 'delivered') return null

  const { data: deliverables, error: delError } = await supabase
    .from('order_deliverables')
    .select('asset_type, file_path')
    .eq('order_id', order.id)

  if (delError || !deliverables?.length) return null

  const downloads: { asset_type: string; url: string; label: string }[] = []
  for (const d of deliverables) {
    const { data: signed } = await supabase.storage
      .from(BUCKET_DELIVERABLES)
      .createSignedUrl(d.file_path, SIGNED_URL_EXPIRY)
    if (signed?.signedUrl) {
      downloads.push({
        asset_type: d.asset_type,
        url: signed.signedUrl,
        label: ASSET_LABELS[d.asset_type] ?? d.asset_type,
      })
    }
  }

  return { orderNumber: order.order_number, downloads }
}

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }> | { token?: string | string[] }
}) {
  const resolved = 'then' in searchParams && typeof searchParams.then === 'function'
    ? await (searchParams as Promise<{ token?: string | string[] }>)
    : (searchParams as { token?: string | string[] })
  const tokenParam = resolved.token
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

  const data = await getDownloadData(token ?? null)

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-xl border border-border bg-card p-6">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Invalid or expired link</h1>
          <p className="text-muted-foreground mb-6">
            This download link is invalid or has expired. You can request a new link using your
            order number and email.
          </p>
          <Link href="/order-lookup" className={getButtonClassName('default', 'lg', 'rounded-full')}>
            Get a new download link
          </Link>
          <p className="mt-6">
            <Link href="/" className={getButtonClassName('ghost', 'sm')}>
              Back to home
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <PageContainer maxWidth="md" padding="md">
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Your portrait bundle</h1>
        <p className="text-muted-foreground mb-6">
          Order <strong className="text-foreground">{data.orderNumber}</strong>. Download links expire in 1 hour.
        </p>
        <ul className="space-y-3">
          {data.downloads.map((d) => (
            <li key={d.asset_type}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span>{d.label}</span>
                <span className="text-sm text-muted-foreground">Download</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">
          Lost your link?{' '}
          <Link href="/order-lookup" className="text-foreground underline hover:no-underline">
            Get a new download link
          </Link>
        </p>
        <p className="mt-4">
          <Link href="/" className={getButtonClassName('ghost', 'sm')}>
            Back to home
          </Link>
        </p>
    </PageContainer>
  )
}
