/**
 * Branded email templates for Brevo. Shared layout with logo, fonts, footer.
 */

import { SITE_NAME, SITE_DOMAIN } from '@/lib/site-config'

const PRIMARY_COLOR = '#22c55e' // green-500, adjust to match brand
const TEXT_COLOR = '#374151'
const MUTED_COLOR = '#6b7280'

/** Company address for footer – update with your legal address */
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || 'Your Company Name\nStreet, City, Postal Code, Country'

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || `https://${SITE_DOMAIN}`
}

function getLogoUrl(): string {
  return `${getBaseUrl()}/Portraitz_white.png`
}

/**
 * Wraps content in branded layout: logo, main content, footer.
 */
export function emailLayout(content: string): string {
  const logoUrl = getLogoUrl()
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_NAME}</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:${TEXT_COLOR};background-color:#0f0f0f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f0f;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <a href="${getBaseUrl()}" style="text-decoration:none;">
                <img src="${logoUrl}" alt="${SITE_NAME}" width="160" style="display:inline-block;max-width:160px;height:auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1a1a1a;border-radius:12px;padding:32px;color:#e5e5e5;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:${MUTED_COLOR};text-align:center;line-height:1.5;">
              — ${SITE_NAME}<br/>
              ${COMPANY_ADDRESS.replace(/\n/g, '<br/>')}<br/><br/>
              <a href="mailto:support@portraitz.shop" style="color:${PRIMARY_COLOR};text-decoration:none;">support@portraitz.shop</a><br/>
              <a href="${getBaseUrl()}/refunds" style="color:${PRIMARY_COLOR};text-decoration:none;">Refund policy</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

/**
 * CTA button style for emails.
 */
export function ctaButton(href: string, label: string): string {
  return `
<a href="${href}" style="display:inline-block;background-color:${PRIMARY_COLOR};color:#fff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:9999px;margin:16px 0;">
  ${label}
</a>
`.trim()
}

/**
 * Order confirmation email content (payment received, preparing/shipping).
 */
export function orderConfirmationContent(params: {
  firstName: string
  orderNumber: string
  totalUsd: string
  isPhysical: boolean
  itemsSummary: string
}): string {
  const { firstName, orderNumber, totalUsd, isPhysical, itemsSummary } = params
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'
  const baseUrl = getBaseUrl()

  const body = isPhysical
    ? `We've received your payment and your order is being prepared for shipping. We'll email you with tracking information once it's on its way.`
    : `We've received your payment and we're preparing your digital download. You'll receive another email with your download link as soon as it's ready.`

  return emailLayout(`
    <p style="margin:0 0 16px;font-size:18px;">${greeting},</p>
    <p style="margin:0 0 16px;">Thank you for your order!</p>
    <p style="margin:0 0 24px;">${body}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border:1px solid #333;border-radius:8px;">
      <tr><td style="padding:16px;"><strong>Order</strong> ${orderNumber}</td></tr>
      <tr><td style="padding:0 16px 16px;">${itemsSummary}</td></tr>
      <tr><td style="padding:0 16px 16px;"><strong>Total:</strong> $${totalUsd}</td></tr>
    </table>
    <p style="margin:0;font-size:14px;color:#a3a3a3;">
      <a href="${baseUrl}/account" style="color:${PRIMARY_COLOR};text-decoration:none;">View order in your account</a>
    </p>
  `)
}

/**
 * Delivery ready email content (download link).
 */
export function deliveryReadyContent(params: {
  firstName: string
  orderNumber: string
  downloadUrl: string
  expiryDays: number
}): string {
  const { firstName, orderNumber, downloadUrl, expiryDays } = params
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'
  const baseUrl = getBaseUrl()

  return emailLayout(`
    <p style="margin:0 0 16px;font-size:18px;">${greeting},</p>
    <p style="margin:0 0 16px;">Your digital portrait bundle is ready!</p>
    <p style="margin:0 0 24px;">Order <strong>${orderNumber}</strong>. Click below to download your high-resolution portrait.</p>
    <p style="margin:0 0 24px;text-align:center;">
      ${ctaButton(downloadUrl, 'Download your portrait')}
    </p>
    <p style="margin:0;font-size:14px;color:#a3a3a3;">
      This link expires in ${expiryDays} days. Lost your link? Use our <a href="${baseUrl}/order-lookup" style="color:${PRIMARY_COLOR};text-decoration:none;">order lookup</a> page.
    </p>
  `)
}

/**
 * Shipped email content (physical order – tracking).
 */
export function shippedContent(params: {
  firstName: string
  orderNumber: string
  trackingUrl: string | null
  trackingNumber: string | null
}): string {
  const { firstName, orderNumber, trackingUrl, trackingNumber } = params
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'
  const baseUrl = getBaseUrl()

  const trackingSection = trackingUrl
    ? `
    <p style="margin:24px 0;text-align:center;">
      ${ctaButton(trackingUrl, 'Track your shipment')}
    </p>
    ${trackingNumber ? `<p style="margin:0;font-size:14px;color:#a3a3a3;">Tracking number: ${trackingNumber}</p>` : ''}
    `
    : trackingNumber
      ? `<p style="margin:0 0 16px;font-size:14px;">Tracking number: <strong>${trackingNumber}</strong></p>`
      : ''

  return emailLayout(`
    <p style="margin:0 0 16px;font-size:18px;">${greeting},</p>
    <p style="margin:0 0 16px;">Your order has shipped!</p>
    <p style="margin:0 0 24px;">Order <strong>${orderNumber}</strong> is on its way. You should receive it soon.</p>
    ${trackingSection}
    <p style="margin:24px 0 0;font-size:14px;color:#a3a3a3;">
      <a href="${baseUrl}/account" style="color:${PRIMARY_COLOR};text-decoration:none;">View order details</a>
    </p>
  `)
}
