import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: () => ({ value: 'test-guest-id' }),
    })
  ),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClientIfConfigured: vi.fn(() => ({})),
}))

vi.mock('@/lib/tokens/guest-tokens', () => ({
  getGuestBalance: vi.fn(() => Promise.resolve({ balance: 1 })),
  deductGuestToken: vi.fn(),
}))

vi.mock('@/lib/tokens/guest-abuse-prevention', () => ({
  canUseFreeGeneration: vi.fn(() => Promise.resolve(true)),
}))

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid artStyle', async () => {
    const { POST } = await import('@/app/api/generate/route')
    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: 'https://example.com/photo.jpg',
        artStyle: 'invalid_style',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.error).toContain('Invalid artStyle')
  })

  it('returns 400 for missing imageUrl', async () => {
    const { POST } = await import('@/app/api/generate/route')
    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ artStyle: 'renaissance' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid JSON body', async () => {
    const { POST } = await import('@/app/api/generate/route')
    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('INVALID_JSON')
  })

  it('returns 403 when guest has no tokens', async () => {
    const { getGuestBalance } = await import('@/lib/tokens/guest-tokens')
    vi.mocked(getGuestBalance).mockResolvedValueOnce({ balance: 0 })

    const { POST } = await import('@/app/api/generate/route')
    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: 'https://example.com/photo.jpg',
        artStyle: 'renaissance',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.code).toBe('INSUFFICIENT_CREDITS')
  })
})
