/*
  Forum Booking System - API Route

  Default availability: Mon-Fri 9am-5pm (1-hour slots)
  Founder can block specific slots when unavailable
  Users book available slots

  Uses forum_bookings table:
  - type='booking' — a user's booked session
  - type='blocked' — founder marked as unavailable
*/

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
const FOUNDER_EMAIL = 'mikebohanna.work@gmail.com'

function getWeekRange(weekStart) {
  const start = new Date(weekStart)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

async function authenticateUser(token) {
  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user) return null
  return user
}

async function sendNotificationEmail(to, subject, html) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ to, subject, html }),
    })
  } catch (err) {
    console.error('Failed to send notification email:', err)
  }
}

// GET: fetch blocked slots and bookings for a week
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get('week') || new Date().toISOString().split('T')[0]
    const token = searchParams.get('token')

    const { startDate, endDate } = getWeekRange(weekParam)

    // Fetch blocked slots for the week
    const { data: blocked, error: blockErr } = await supabase
      .from('forum_bookings')
      .select('id, date, start_time, end_time')
      .eq('type', 'blocked')
      .eq('status', 'confirmed')
      .gte('date', startDate)
      .lte('date', endDate)

    if (blockErr) return json({ error: blockErr.message }, 500)

    // Fetch all bookings for the week (don't expose user details to everyone)
    const { data: bookings, error: bookErr } = await supabase
      .from('forum_bookings')
      .select('id, date, start_time, end_time, status')
      .eq('type', 'booking')
      .eq('status', 'confirmed')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time')

    if (bookErr) return json({ error: bookErr.message }, 500)

    // If token provided, fetch user's own bookings (with full details)
    let userBookings = []
    if (token) {
      const user = await authenticateUser(token)
      if (user) {
        const { data: ub } = await supabase
          .from('forum_bookings')
          .select('*')
          .eq('type', 'booking')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date')
          .order('start_time')

        userBookings = ub || []
      }
    }

    return json({ blocked: blocked || [], bookings: bookings || [], userBookings })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: book, cancel, block, unblock
export async function POST(req) {
  try {
    const body = await req.json()
    const { action, token } = body

    if (!token) return json({ error: 'Unauthorized' }, 401)
    if (!action) return json({ error: 'Missing action' }, 400)

    const user = await authenticateUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const isFounder = user.id === FOUNDER_ID

    // --- BOOK a slot ---
    if (action === 'book') {
      const { date, start_time, end_time, notes } = body
      if (!date || !start_time || !end_time) return json({ error: 'Missing date or time' }, 400)

      // Validate it's a weekday
      const dateObj = new Date(date + 'T00:00:00')
      const dayOfWeek = dateObj.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) return json({ error: 'Bookings are only available Monday to Friday' }, 400)

      // Validate it's within 9am-5pm
      const hour = parseInt(start_time.split(':')[0])
      if (hour < 9 || hour >= 17) return json({ error: 'Bookings are only available between 9am and 5pm' }, 400)

      // Check not in the past
      const now = new Date()
      const slotTime = new Date(date + 'T' + start_time)
      if (slotTime < now) return json({ error: 'Cannot book a slot in the past' }, 400)

      // Check not blocked by founder
      const { data: blockedSlots } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'blocked')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)

      if (blockedSlots && blockedSlots.length > 0) {
        return json({ error: 'This time slot is unavailable' }, 400)
      }

      // Check no existing booking at this time
      const { data: existingBookings } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'booking')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)

      if (existingBookings && existingBookings.length > 0) {
        return json({ error: 'This slot has already been booked' }, 409)
      }

      // Get user profile info
      const { data: profile } = await supabase
        .from('forum_profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single()

      const userName = profile?.display_name || profile?.username || user.email
      const userEmail = user.email

      // Create the booking
      const { data: booking, error: insertErr } = await supabase
        .from('forum_bookings')
        .insert({
          user_id: user.id,
          type: 'booking',
          date,
          start_time,
          end_time,
          status: 'confirmed',
          notes: notes || null,
          user_name: userName,
          user_email: userEmail,
        })
        .select()
        .single()

      if (insertErr) return json({ error: insertErr.message }, 500)

      const formattedDate = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      const hhmm = (t) => (t || '').slice(0, 5)

      // Send email notification to founder
      await sendNotificationEmail(
        FOUNDER_EMAIL,
        `New Session Booking: ${userName} - ${formattedDate}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Session Booking</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Name</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${hhmm(start_time)} - ${hhmm(end_time)}</td>
              </tr>
              ${notes ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">What they want to cover</td><td style="padding: 8px 0; font-size: 14px;">${notes}</td></tr>` : ''}
            </table>
            <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;">This booking was made via the CareCallAI forum.</p>
          </div>
        </div>
        `
      )

      // Send confirmation email to user
      await sendNotificationEmail(
        userEmail,
        `Session Confirmed - ${formattedDate}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Your Session is Confirmed!</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px; color: #334155;">Hi ${userName},</p>
            <p style="font-size: 14px; color: #475569;">Your CareCallAI session has been confirmed:</p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Time:</strong> ${hhmm(start_time)} - ${hhmm(end_time)}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Platform:</strong> Microsoft Teams</p>
            </div>
            <p style="font-size: 14px; color: #475569;">We'll send you a Microsoft Teams meeting link before your session. If you need to reschedule, you can cancel and rebook from the forum.</p>
            <p style="font-size: 14px; color: #475569; margin-top: 16px;">Looking forward to helping you!</p>
            <p style="font-size: 14px; color: #475569;">- The CareCallAI Team</p>
          </div>
        </div>
        `
      )

      // Create forum notification for founder
      try {
        await supabase.from('forum_notifications').insert({
          user_id: FOUNDER_ID,
          actor_id: user.id,
          type: 'booking',
          message: `${userName} booked a session on ${formattedDate} at ${hhmm(start_time)}`,
        })
      } catch {}

      return json({ success: true, booking })
    }

    // --- BLOCK SLOT (founder only) ---
    if (action === 'block') {
      if (!isFounder) return json({ error: 'Only the founder can manage availability' }, 403)

      const { date, start_time, end_time } = body
      if (!date || !start_time || !end_time) return json({ error: 'Missing date or time' }, 400)

      // Check for existing booking — can't block a slot that's already booked
      const { data: existingBookings } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'booking')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)

      if (existingBookings && existingBookings.length > 0) {
        return json({ error: 'Cannot block a slot that has an active booking. Cancel the booking first.' }, 409)
      }

      // Check not already blocked
      const { data: existing } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'blocked')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)

      if (existing && existing.length > 0) {
        return json({ success: true, message: 'Already blocked' })
      }

      const { error: insertErr } = await supabase
        .from('forum_bookings')
        .insert({
          user_id: user.id,
          type: 'blocked',
          date,
          start_time,
          end_time,
          status: 'confirmed',
        })

      if (insertErr) return json({ error: insertErr.message }, 500)
      return json({ success: true })
    }

    // --- UNBLOCK SLOT (founder only) ---
    if (action === 'unblock') {
      if (!isFounder) return json({ error: 'Only the founder can manage availability' }, 403)

      const { date, start_time } = body
      if (!date || !start_time) return json({ error: 'Missing date or time' }, 400)

      const { error: delErr } = await supabase
        .from('forum_bookings')
        .update({ status: 'cancelled' })
        .eq('type', 'blocked')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)

      if (delErr) return json({ error: delErr.message }, 500)
      return json({ success: true })
    }

    // --- BLOCK FULL DAY (founder only) ---
    if (action === 'block-day') {
      if (!isFounder) return json({ error: 'Only the founder can manage availability' }, 403)

      const { date } = body
      if (!date) return json({ error: 'Missing date' }, 400)

      // Check for bookings on this day
      const { data: dayBookings } = await supabase
        .from('forum_bookings')
        .select('id, start_time')
        .eq('type', 'booking')
        .eq('status', 'confirmed')
        .eq('date', date)

      if (dayBookings && dayBookings.length > 0) {
        return json({ error: `Cannot block this day — ${dayBookings.length} booking(s) exist. Cancel them first.` }, 409)
      }

      // Get already blocked slots for this day
      const { data: existingBlocked } = await supabase
        .from('forum_bookings')
        .select('start_time')
        .eq('type', 'blocked')
        .eq('status', 'confirmed')
        .eq('date', date)

      const blockedTimes = new Set((existingBlocked || []).map(b => (b.start_time || '').slice(0, 5)))
      const newBlocks = []

      for (let h = 9; h < 17; h++) {
        const st = `${String(h).padStart(2, '0')}:00`
        if (!blockedTimes.has(st)) {
          newBlocks.push({
            user_id: user.id,
            type: 'blocked',
            date,
            start_time: st,
            end_time: `${String(h + 1).padStart(2, '0')}:00`,
            status: 'confirmed',
          })
        }
      }

      if (newBlocks.length > 0) {
        const { error: insertErr } = await supabase.from('forum_bookings').insert(newBlocks)
        if (insertErr) return json({ error: insertErr.message }, 500)
      }

      return json({ success: true, blocked: newBlocks.length })
    }

    // --- UNBLOCK FULL DAY (founder only) ---
    if (action === 'unblock-day') {
      if (!isFounder) return json({ error: 'Only the founder can manage availability' }, 403)

      const { date } = body
      if (!date) return json({ error: 'Missing date' }, 400)

      const { error: delErr } = await supabase
        .from('forum_bookings')
        .update({ status: 'cancelled' })
        .eq('type', 'blocked')
        .eq('status', 'confirmed')
        .eq('date', date)

      if (delErr) return json({ error: delErr.message }, 500)
      return json({ success: true })
    }

    // --- CANCEL BOOKING ---
    if (action === 'cancel') {
      const { id } = body
      if (!id) return json({ error: 'Missing booking id' }, 400)

      const { data: booking } = await supabase
        .from('forum_bookings')
        .select('*')
        .eq('id', id)
        .eq('type', 'booking')
        .eq('status', 'confirmed')
        .single()

      if (!booking) return json({ error: 'Booking not found' }, 404)
      if (booking.user_id !== user.id && !isFounder) {
        return json({ error: 'You can only cancel your own bookings' }, 403)
      }

      const { error: updateErr } = await supabase
        .from('forum_bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (updateErr) return json({ error: updateErr.message }, 500)

      const bookDateObj = new Date(booking.date + 'T00:00:00')
      const formattedDate = bookDateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      const hhmm = (t) => (t || '').slice(0, 5)

      // Notify founder if user cancelled
      if (!isFounder) {
        await sendNotificationEmail(
          FOUNDER_EMAIL,
          `Session Cancelled: ${booking.user_name} - ${formattedDate}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Session Cancelled</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; color: #475569;"><strong>${booking.user_name}</strong> has cancelled their session:</p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Time:</strong> ${hhmm(booking.start_time)} - ${hhmm(booking.end_time)}</p>
              </div>
              <p style="font-size: 13px; color: #94a3b8;">The slot is now available again.</p>
            </div>
          </div>
          `
        )

        try {
          await supabase.from('forum_notifications').insert({
            user_id: FOUNDER_ID,
            actor_id: user.id,
            type: 'booking_cancel',
            message: `${booking.user_name} cancelled their session on ${formattedDate} at ${hhmm(booking.start_time)}`,
          })
        } catch {}
      }

      // Notify user if founder cancelled
      if (isFounder && booking.user_email) {
        await sendNotificationEmail(
          booking.user_email,
          `Session Cancelled - ${formattedDate}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Session Cancelled</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 15px; color: #334155;">Hi ${booking.user_name},</p>
              <p style="font-size: 14px; color: #475569;">Unfortunately, your session has been cancelled:</p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Time:</strong> ${hhmm(booking.start_time)} - ${hhmm(booking.end_time)}</p>
              </div>
              <p style="font-size: 14px; color: #475569;">Please visit the forum to book a new slot. We apologise for any inconvenience.</p>
              <p style="font-size: 14px; color: #475569;">- The CareCallAI Team</p>
            </div>
          </div>
          `
        )
      }

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
