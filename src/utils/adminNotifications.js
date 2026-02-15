/**
 * adminNotifications.js — Send shift activity push notifications to admins.
 *
 * Fetches admins who have shift_activity_notifications enabled,
 * excludes the current user, and sends via createNotification.
 */
import { base44 } from '@/api/base44Client'

/**
 * Send a shift-activity notification to all admins (except excludeUserId).
 * Silently swallows errors — callers should not await this.
 */
export async function notifyAdminsOfActivity({ title, message, excludeUserId, actionUrl = '/Rota' }) {
  try {
    const allUsers = await base44.entities.User.list()
    const admins = allUsers.filter(u =>
      u.is_active !== false &&
      (u.role === 'admin' || u.job_title === 'admin' || u.job_title === 'manager') &&
      u.id !== excludeUserId &&
      u.shift_activity_notifications !== false   // default true if column is null
    )

    if (admins.length === 0) return

    const recipientIds = admins.map(a => a.id)

    await base44.functions.invoke('createNotification', {
      recipient_ids: recipientIds,
      type: 'shift_activity',
      title,
      message,
      priority: 'normal',
      action_url: actionUrl,
      send_push: true,
    })
  } catch (e) {
    console.warn('[AdminNotify] Failed:', e)
  }
}
