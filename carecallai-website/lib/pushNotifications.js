/**
 * Server-side push notification helper
 * Uses web-push to send notifications to subscribed browsers
 */
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails('mailto:support@carecallai.co.uk', pub, priv)
  vapidConfigured = true
  return true
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId, payload) {
  if (!ensureVapid()) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const message = JSON.stringify(payload)

  for (const row of subs) {
    try {
      await webpush.sendNotification(row.subscription, message)
    } catch (err) {
      // Remove expired/invalid subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', row.id)
      }
    }
  }
}

/**
 * Send push notification to the founder
 */
export async function sendPushToFounder(payload) {
  const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
  await sendPushToUser(FOUNDER_ID, payload)
}

/**
 * Send push notification to all subscribers (e.g. thread subscribers)
 */
export async function sendPushToUsers(userIds, payload) {
  for (const userId of userIds) {
    await sendPushToUser(userId, payload)
  }
}
