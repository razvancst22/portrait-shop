import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFrom = vi.fn()
const mockStorageFrom = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: () => ({ value: 'other-guest-id' }),
    })
  ),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  })),
}))

describe('GET /api/generate/[id]/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when session does not match (wrong guest)', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'gen-123',
            preview_image_url: 'preview/path.jpg',
            session_id: 'owner-guest-id',
          },
          error: null,
        }),
      }),
    })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { GET } = await import('@/app/api/generate/[id]/preview/route')
    const req = new NextRequest('http://localhost:3000/api/generate/gen-123/preview')
    const res = await GET(req, {
      params: Promise.resolve({ id: 'gen-123' }),
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Forbidden')
  })

  it('returns 404 when generation has no preview', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }),
    })
    mockFrom.mockReturnValue({ select: mockSelect })

    const { GET } = await import('@/app/api/generate/[id]/preview/route')
    const req = new NextRequest('http://localhost:3000/api/generate/unknown-id/preview')
    const res = await GET(req, {
      params: Promise.resolve({ id: 'unknown-id' }),
    })
    expect(res.status).toBe(404)
  })
})
