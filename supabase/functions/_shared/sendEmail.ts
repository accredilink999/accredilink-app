/**
 * sendEmail.ts — Shared email helper for all edge functions
 *
 * Uses Resend (https://resend.com) to send emails.
 * Set your API key: supabase secrets set RESEND_API_KEY=re_...
 * Set sender:       supabase secrets set FROM_EMAIL=noreply@yourdomain.com
 */

interface SendEmailOptions {
  to: string | string[]
  subject: string
  body: string
  html?: string
}

export async function sendEmail({ to, subject, body, html }: SendEmailOptions): Promise<void> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@carecallai.app'

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email not sent')
    return
  }

  const recipients = Array.isArray(to) ? to : [to]
  const htmlContent = html || body.replace(/\n/g, '<br>')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html: htmlContent,
      text: body,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to send email: ${errorText}`)
  }
}
