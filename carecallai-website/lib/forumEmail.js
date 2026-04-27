/**
 * Forum Email Notifications
 * Sends emails via the send-campaign-email Supabase edge function
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const FROM_EMAIL = 'CareCall AI Forum <support@carecallai.co.uk>'
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
/**
 * Notify user when mentioned in a post
 */
export async function notifyMention(supabase, { userId, actorName, threadTitle, threadId, content }) {
  const email = await getUserEmail(supabase, userId)
  if (!email) return

  const preview = (content || '').slice(0, 200)
  await sendEmail({
    to: email,
    subject: `${actorName} mentioned you in "${threadTitle}" - CareCall AI Forum`,
    html: wrapHtml(
      `${actorName} mentioned you`,
      `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">
        You were mentioned in <strong>"${threadTitle}"</strong>:
      </p>
      <div style="background:#f8fafc;border-left:3px solid #0d9488;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 12px;">
        <p style="color:#334155;font-size:14px;line-height:1.5;margin:0;">${preview}${content?.length > 200 ? '...' : ''}</p>
      </div>
      <p style="margin:0;"><a href="${FORUM_URL}/thread/${threadId}" style="color:#0d9488;font-size:14px;text-decoration:none;font-weight:600;">View Thread &rarr;</a></p>`
    ),
  })
}

/**
 * Notify subscriber when new reply is posted to watched thread
 */
export async function notifySubscriber(supabase, { userId, threadTitle, threadId, replyAuthor, replyContent }) {
  const email = await getUserEmail(supabase, userId)
  if (!email) return

  const preview = (replyContent || '').slice(0, 200)
  await sendEmail({
    to: email,
    subject: `New activity in "${threadTitle}" - CareCall AI Forum`,
    html: wrapHtml(
      `New reply in a thread you're watching`,
      `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">
        <strong>${replyAuthor}</strong> replied in <strong>"${threadTitle}"</strong>:
      </p>
      <div style="background:#f8fafc;border-left:3px solid #0d9488;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 12px;">
        <p style="color:#334155;font-size:14px;line-height:1.5;margin:0;">${preview}${replyContent?.length > 200 ? '...' : ''}</p>
      </div>
      <p style="margin:0;"><a href="${FORUM_URL}/thread/${threadId}" style="color:#0d9488;font-size:14px;text-decoration:none;font-weight:600;">View Thread &rarr;</a></p>`
    ),
  })
}

/**
 * Notify founder when a new thread is created
 */
export async function notifyFounderNewThread(supabase, { authorName, title, content, categoryName, threadSlug, categorySlug }) {
  const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
  const email = await getUserEmail(supabase, FOUNDER_ID)
  if (!email) return

  const preview = (content || '').replace(/[#*_`>\[\]]/g, '').slice(0, 300)
  const threadUrl = `${FORUM_URL}/${categorySlug}/${threadSlug}`

  await sendEmail({
    to: email,
    subject: `New post by ${authorName}: "${title}" — CareCall AI Forum`,
    html: wrapHtml(
      `New post in ${categoryName}`,
      `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">
        <strong>${authorName}</strong> created a new thread in <strong>${categoryName}</strong>:
      </p>
      <h3 style="color:#1e293b;font-size:16px;margin:0 0 8px;">${title}</h3>
      <div style="background:#f8fafc;border-left:3px solid #0d9488;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 12px;">
        <p style="color:#334155;font-size:14px;line-height:1.5;margin:0;">${preview}${content?.length > 300 ? '...' : ''}</p>
      </div>
      <p style="margin:0;"><a href="${threadUrl}" style="color:#0d9488;font-size:14px;text-decoration:none;font-weight:600;">View Thread &rarr;</a></p>`
    ),
  })
}

/**
 * Notify founder when a reply is posted to any thread
 */
export async function notifyFounderNewReply(supabase, { authorName, threadTitle, threadId, replyContent }) {
  const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
  const email = await getUserEmail(supabase, FOUNDER_ID)
  if (!email) return

  const preview = (replyContent || '').slice(0, 300)
  const threadUrl = `${FORUM_URL}/thread/${threadId}`

  await sendEmail({
    to: email,
    subject: `${authorName} replied to "${threadTitle}" — CareCall AI Forum`,
    html: wrapHtml(
      `New reply in "${threadTitle}"`,
      `<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">
        <strong>${authorName}</strong> replied to <strong>"${threadTitle}"</strong>:
      </p>
      <div style="background:#f8fafc;border-left:3px solid #0d9488;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 12px;">
        <p style="color:#334155;font-size:14px;line-height:1.5;margin:0;">${preview}${replyContent?.length > 300 ? '...' : ''}</p>
      </div>
      <p style="margin:0;"><a href="${threadUrl}" style="color:#0d9488;font-size:14px;text-decoration:none;font-weight:600;">View Thread &rarr;</a></p>`
    ),
  })
}

/**
 * Generate the forum invite email HTML — used for bulk invites to trial/org admins
 */
export function forumInviteHtml(name) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:linear-gradient(135deg,#0d9488,#0f766e);border-radius:16px 16px 0 0;padding:28px 24px;text-align:center;">
    <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">CareCall<span style="opacity:0.85">AI</span> Community Forum</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Connect &bull; Learn &bull; Get Support</p>
  </div>
  <div style="background:white;border-radius:0 0 16px 16px;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;">
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">Hi ${name || 'there'},</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
      As a CareCallAI user, you have access to our <strong>Community Forum</strong> — a dedicated space for care professionals to get support, share ideas, and connect with the CareCallAI team.
    </p>
    <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="color:#0f766e;font-size:14px;font-weight:700;margin:0 0 10px;">What you'll find on the forum:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">&#9989; Direct support from the CareCallAI team</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">&#9989; Tips, guides, and best practices for using CareCallAI</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">&#9989; Connect with other care professionals and share ideas</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">&#9989; Submit feature requests and give feedback</td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;line-height:1.5;">&#9989; Stay updated on new features and releases</td></tr>
      </table>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="color:#1e293b;font-size:14px;font-weight:700;margin:0 0 8px;">&#128273; How to Log In</p>
      <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 10px;">
        Use the <strong>same email and password</strong> you set up for CareCallAI. No need to create a new account — you're already registered.
      </p>
      <p style="color:#1e293b;font-size:13px;font-weight:600;margin:0 0 6px;">Two ways to access the forum:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;">1. Open the <strong>CareCallAI app</strong> &rarr; Quick Links menu &rarr; tap <strong>"Forum"</strong></td></tr>
        <tr><td style="padding:4px 0;color:#475569;font-size:13px;">2. Visit directly: <a href="https://carecallai.co.uk/forum" style="color:#0d9488;font-weight:600;text-decoration:none;">carecallai.co.uk/forum</a></td></tr>
      </table>
    </div>
    <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 8px;">&#128197; Book a Free 1-to-1 Setup Session</p>
      <p style="color:#78350f;font-size:13px;line-height:1.6;margin:0 0 10px;">
        Need help getting started? Book a <strong>free Microsoft Teams session</strong> with our founder to get a personalised walkthrough of CareCallAI, help with setup, or discuss how the platform can work best for your service.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:3px 0;color:#78350f;font-size:12px;">&#128336; Available Monday&ndash;Friday, 9am&ndash;5pm</td></tr>
        <tr><td style="padding:3px 0;color:#78350f;font-size:12px;">&#9202; 1-hour sessions</td></tr>
        <tr><td style="padding:3px 0;color:#78350f;font-size:12px;">&#128187; Via Microsoft Teams (link sent after booking)</td></tr>
      </table>
      <div style="text-align:center;margin-top:14px;">
        <a href="https://carecallai.co.uk/forum/booking" style="background:#d97706;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:13px;display:inline-block;">Book a Session</a>
      </div>
    </div>
    <div style="text-align:center;margin:0 0 20px;">
      <a href="https://carecallai.co.uk/forum" style="background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 2px 8px rgba(13,148,136,0.3);">Visit the Forum</a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Log in with your existing CareCallAI email and password</p>
  </div>
  <div style="text-align:center;padding:20px 0 0;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">CareCallAI &mdash; Smart Care Management Software</p>
    <p style="color:#94a3b8;font-size:11px;margin:0;">
      <a href="https://carecallai.co.uk" style="color:#64748b;text-decoration:none;">carecallai.co.uk</a> &bull;
      <a href="mailto:hello@carecallai.co.uk" style="color:#64748b;text-decoration:none;">hello@carecallai.co.uk</a> &bull;
      WhatsApp: +44 7762 533406
    </p>
  </div>
</div>
</body></html>`
}

/**
 * Send the forum invite email directly (no supabase user lookup needed)
 */
export async function sendForumInvite({ to, name }) {
  await sendEmail({
    to,
    subject: 'Join the CareCallAI Community Forum — Your Account is Ready',
    html: forumInviteHtml(name),
  })
}

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
