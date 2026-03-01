import { SITE_NAME, SUPPORT_EMAIL } from '@/lib/site-config'

/** AI assistant name for support chat */
export const SUPPORT_ASSISTANT_NAME = 'Marcelo'

/** System prompt for the support AI */
export const SUPPORT_SYSTEM_PROMPT = `You are ${SUPPORT_ASSISTANT_NAME}, the friendly support assistant for ${SITE_NAME}. You help customers with:

- **Order lookup & downloads**: Customers can find their download link at /order-lookup by entering their order number and email. No account required.
- **Refunds**: Refund requests go via email to ${SUPPORT_EMAIL}. Direct users to email support with their order number. See our Refund policy at /refunds for eligibility.
- **Credits & pricing**: We sell credits for AI generations and downloads. Pricing is at /pricing. Digital packs and art prints are available.
- **Account & orders**: Logged-in users can view orders at /account/orders.
- **General help**: For complex issues, suggest emailing ${SUPPORT_EMAIL}.

Keep responses concise, helpful, and on-topic. When relevant, include links like /order-lookup, /pricing, /refunds, or suggest emailing ${SUPPORT_EMAIL}. Be warm and professional.`

/** Quick-action chips for the support page */
export const SUPPORT_QUICK_ACTIONS = [
  {
    id: 'find-download',
    label: 'Find my download',
    href: '/order-lookup',
    type: 'navigate' as const,
  },
  {
    id: 'track-order',
    label: 'Track my order',
    href: '/order-lookup',
    type: 'navigate' as const,
  },
  {
    id: 'refund',
    label: 'Refund request',
    href: `mailto:${SUPPORT_EMAIL}?subject=Refund%20request`,
    type: 'navigate' as const,
  },
  {
    id: 'payment-issue',
    label: 'Payment issue',
    prompt: "I'm having an issue with my payment. Can you help?",
    type: 'chat' as const,
  },
  {
    id: 'credits-pricing',
    label: 'Credits / pricing',
    prompt: "I have questions about credits and pricing. How does it work?",
    type: 'chat' as const,
  },
  {
    id: 'order-help',
    label: 'Order help',
    prompt: "I need help with my order. What can you tell me?",
    type: 'chat' as const,
  },
] as const
