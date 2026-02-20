import { NextResponse } from 'next/server'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { createDownloadToken } from '@/lib/email/delivery'

export type MyOrderItem = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_usd: number
  downloadUrl: string
}

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_usd: number
  customer_email: string | null
  user_id?: string | null
}

/**
 * GET /api/my-orders – list delivered orders for the logged-in user.
 * Matches by user_id (when logged in at checkout) or customer_email (guest/legacy).
 * Resilient when user_id column is missing (migration not applied).
 */
export async function GET() {
  const user = await getOptionalUser()
  if (!user?.email) {
    return NextResponse.json({ orders: [] })
  }

  const supabase = createClientIfConfigured()
  if (!supabase) {
    return NextResponse.json({ orders: [] })
  }

  const emailLower = user.email.trim().toLowerCase()
  let byUserId: OrderRow[] = []

  // Try user_id query (fails if column doesn't exist)
  const { data: userIdRows, error: errByUser } = await supabase
    .from('orders')
    .select('id, order_number, created_at, status, total_usd, customer_email')
    .eq('status', 'delivered')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!errByUser && userIdRows) {
    byUserId = userIdRows as OrderRow[]
  } else if (errByUser) {
    console.error('my-orders (user_id) error:', errByUser)
  }

  // Fallback: query all delivered (no user_id - works when column missing)
  const { data: allRows, error: errAll } = await supabase
    .from('orders')
    .select('id, order_number, created_at, status, total_usd, customer_email')
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(100)

  if (errAll) {
    console.error('my-orders (all) error:', errAll)
    return NextResponse.json({ orders: mapToOrders(byUserId) })
  }

  const rows = (allRows ?? []) as OrderRow[]
  const matchedByEmail = rows.filter(
    (o) => (o.customer_email || '').trim().toLowerCase() === emailLower
  )

  const seenIds = new Set<string>()
  const merged: OrderRow[] = []
  for (const o of [...byUserId, ...matchedByEmail]) {
    if (!seenIds.has(o.id)) {
      seenIds.add(o.id)
      merged.push(o)
    }
  }

  merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const orders = mapToOrders(merged.slice(0, 50))
  return NextResponse.json({ orders })
}

function mapToOrders(rows: OrderRow[]): MyOrderItem[] {
  return rows.map((o) => {
    const token = createDownloadToken(o.id)
    return {
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      status: o.status,
      total_usd: Number(o.total_usd) || 0,
      downloadUrl: `/download?token=${encodeURIComponent(token)}`,
    }
  })
}
