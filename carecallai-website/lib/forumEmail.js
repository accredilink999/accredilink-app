/**
 * Forum Email Notifications
 * Sends emails via the send-campaign-email Supabase edge function
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const FROM_EMAIL = 'CareCall AI Forum <hello@carecallai.co.uk>'
const FORUM_URL = 'https://carecallai.co.uk/forum'

async function sendEmail({ to, subject, html }) {
  if (!to || !SUPABASE_URL || !SUPABASE_ANON_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-campaign-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ to, from: FROM_EMAIL, subject, html }),
    })
  } catch (err) {
    console.error('Forum email error:', err)
  }
}

function wrapHtml(title, body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#0d9488;border-radius:12px 12px 0 0;padding:20px 24px;text-align:center;">
    <h1 style="margin:0;color:white;font-size:20px;">CareCall AI Forum</h1>
  </div>
  <div style="background:white;border-radius:0 0 12px 12px;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">${title}</h2>
    ${body}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
      <a href="${FORUM_URL}" style="display:inline-block;background:#0d9488;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px;">Visit Forum</a>
    </div>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">CareCall AI &mdash; Care Management Software</p>
</div>
</body></html>`
}

/**
 * Get a user's email from auth.users via service role client
 */
async function getUserEmail(supabase, userId) {
  const { data } = await supabase.from('forum_profiles').select('id').eq('id', userId).single()
  if (!data) return null
  // Use admin API to get email
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  return user?.email || null
}

/**
 * Notify thread author when someone replies
 */
export async function notifyReply(supabase, { threadAuthorId, threadTitle, threadId, replyAuthor, replyContent }) {
  const email = await getUserEmail(supabase, threadAuthorId)
  if (!email) return

  const preview = (replyContent || '').slice(0, 200)
  const threadUrl = `${FORUM_URL}/thread/${threadId}`

  await sendEmail({
    to: email,
    subject: `New reply to "${threadTitle}" - CareCall AI Forum`,
    html: wrapHtml(
      `${replyAuthor} replied to your thread`,
      `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">
        Your thread <strong>"${threadTitle}"</strong> received a new reply:
      </p>
      <div style="background:#f8fafc;border-left:3px solid #0d9488;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 12px;">
        <p style="color:#334155;font-size:14px;line-height:1.5;margin:0;">${preview}${replyContent?.length > 200 ? '...' : ''}</p>
      </div>
      <p style="margin:0;"><a href="${threadUrl}" style="color:#0d9488;font-size:14px;text-decoration:none;font-weight:600;">View Thread &rarr;</a></p>`
    ),
  })
}

/**
 * Notify user when their thread or reply is liked
 */
export async function notifyLike(supabase, { userId, actorName, threadTitle, threadId }) {
  const email = await getUserEmail(supabase, userId)
  if (!email) return

  await sendEmail({
    to: email,
    subject: `${actorName} liked your post - CareCall AI Forum`,
    html: wrapHtml(
      `${actorName} liked your post`,
      `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
        ${actorName} liked your post in <strong>"${threadTitle}"</strong>.
      </p>
      <p style="margin:12px 0 0;"><a href="${FORUM_URL}/thread/${threadId}" style="color:#0d9488;font-size:14px;text-decoration:none;font-weight:600;">View Thread &rarr;</a></p>`
    ),
  })
}

/**
 * Notify user when mentioned or when mod action is taken
 */
export async function notifyModAction(supabase, { userId, action, threadTitle, reason }) {
  const email = await getUserEmail(supabase, userId)
  if (!email) return

  const messages = {
    ban: `Your forum account has been suspended. Reason: ${reason || 'Violation of community guidelines'}`,
    unban: 'Your forum account has been reinstated. You can now post again.',
    thread_delete: `Your thread "${threadTitle}" has been removed by a moderator.`,
    thread_lock: `Your thread "${threadTitle}" has been locked by a moderator.`,
  }

  await sendEmail({
    to: email,
    subject: `Forum Notification - CareCall AI`,
    html: wrapHtml('Forum Notification', `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">${messages[action] || 'You have a new forum notification.'}</p>`),
  })
}
