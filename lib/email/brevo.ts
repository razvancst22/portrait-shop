/**
 * Brevo (formerly Sendinblue) transactional email API.
 * Sends branded emails via Brevo. Requires BREVO_API_KEY.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

type BrevoSendParams = {
  to: string
  subject: string
  htmlContent: string
  tags?: string[]
  replyTo?: string
}

/**
 * Send a transactional email via Brevo API.
 * Returns messageId on success, throws on error.
 */
export async function sendBrevoEmail(params: BrevoSendParams): Promise<string> {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'orders@portraitz.shop'
  const fromName = process.env.BREVO_FROM_NAME || 'portraitz.shop'

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set')
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      tags: params.tags ?? [],
      replyTo: params.replyTo ? { email: params.replyTo } : undefined,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Brevo API error ${res.status}: ${errBody}`)
  }

  const data = (await res.json()) as { messageId?: string }
  return data.messageId ?? ''
}
