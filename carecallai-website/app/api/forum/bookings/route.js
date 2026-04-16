/*
  Forum Demo Booking System - API Route

  SQL to create table:

  CREATE TABLE forum_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type TEXT NOT NULL CHECK (type IN ('slot', 'booking')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    notes TEXT,
    user_name TEXT,
    user_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX idx_forum_bookings_date ON forum_bookings (date);
  CREATE INDEX idx_forum_bookings_type ON forum_bookings (type);
  CREATE INDEX idx_forum_bookings_user ON forum_bookings (user_id);
*/

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
const FOUNDER_EMAIL = 'mikebohanna.work@gmail.com'

function getWeekRange(weekStart) {
  const start = new Date(weekStart)
  // Ensure we start on Monday
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

// GET: fetch available slots and existing bookings for a week
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get('week') || new Date().toISOString().split('T')[0]
    const token = searchParams.get('token')

    const { startDate, endDate } = getWeekRange(weekParam)

    // Fetch all slots for the week
    const { data: slots, error: slotErr } = await supabase
      .from('forum_bookings')
      .select('id, date, start_time, end_time, status')
      .eq('type', 'slot')
      .eq('status', 'confirmed')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time')

    if (slotErr) return json({ error: slotErr.message }, 500)

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

    return json({ slots: slots || [], bookings: bookings || [], userBookings })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: create booking, add/remove slots, cancel booking
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

      // Check that a matching slot exists and is available
      const { data: matchingSlots } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'slot')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)
        .eq('end_time', end_time)

      if (!matchingSlots || matchingSlots.length === 0) {
        return json({ error: 'This time slot is no longer available' }, 400)
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

      // Check user doesn't already have a booking this week
      const bookDate = new Date(date)
      const day = bookDate.getDay()
      const mondayDiff = day === 0 ? -6 : 1 - day
      const monday = new Date(bookDate)
      monday.setDate(monday.getDate() + mondayDiff)
      const friday = new Date(monday)
      friday.setDate(friday.getDate() + 4)

      const { data: weekBookings } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'booking')
        .eq('status', 'confirmed')
        .eq('user_id', user.id)
        .gte('date', monday.toISOString().split('T')[0])
        .lte('date', friday.toISOString().split('T')[0])

      if (weekBookings && weekBookings.length > 0) {
        return json({ error: 'You already have a booking this week. Please cancel your existing booking first.' }, 409)
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

      // Format date and time for email
      const dateObj = new Date(date + 'T00:00:00')
      const formattedDate = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      const hhmm = (t) => (t || '').slice(0, 5)

      // Send email notification to founder
      await sendNotificationEmail(
        FOUNDER_EMAIL,
        `New Demo Booking: ${userName} - ${formattedDate}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Demo Booking</h1>
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
              ${notes ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Notes</td><td style="padding: 8px 0; font-size: 14px;">${notes}</td></tr>` : ''}
            </table>
            <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;">This booking was made via the CareCallAI forum.</p>
          </div>
        </div>
        `
      )

      // Send confirmation email to user
      await sendNotificationEmail(
        userEmail,
        `Demo Booking Confirmed - ${formattedDate}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488, #0891b2); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Your Demo is Confirmed!</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 15px; color: #334155;">Hi ${userName},</p>
            <p style="font-size: 14px; color: #475569;">Your CareCallAI demo session has been confirmed:</p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Time:</strong> ${hhmm(start_time)} - ${hhmm(end_time)}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Platform:</strong> Microsoft Teams</p>
            </div>
            <p style="font-size: 14px; color: #475569;">We'll send you a Microsoft Teams meeting link before your session. If you need to reschedule, you can cancel and rebook from the forum.</p>
            <p style="font-size: 14px; color: #475569; margin-top: 16px;">Looking forward to showing you CareCallAI!</p>
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
          message: `${userName} booked a demo on ${formattedDate} at ${hhmm(start_time)}`,
        })
      } catch {}

      return json({ success: true, booking })
    }

    // --- ADD SLOT (founder only) ---
    if (action === 'add-slot') {
      if (!isFounder) return json({ error: 'Only the founder can manage slots' }, 403)

      const { date, start_time, end_time } = body
      if (!date || !start_time || !end_time) return json({ error: 'Missing date or time' }, 400)

      // Validate the date is not in the past
      const today = new Date().toISOString().split('T')[0]
      if (date < today) return json({ error: 'Cannot add slots in the past' }, 400)

      // Check for duplicate slot
      const { data: existing } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'slot')
        .eq('status', 'confirmed')
        .eq('date', date)
        .eq('start_time', start_time)
        .eq('end_time', end_time)

      if (existing && existing.length > 0) {
        return json({ error: 'This slot already exists' }, 409)
      }

      const { data: slot, error: insertErr } = await supabase
        .from('forum_bookings')
        .insert({
          user_id: user.id,
          type: 'slot',
          date,
          start_time,
          end_time,
          status: 'confirmed',
        })
        .select()
        .single()

      if (insertErr) return json({ error: insertErr.message }, 500)
      return json({ success: true, slot })
    }

    // --- ADD SLOTS IN BULK (founder only) ---
    if (action === 'add-slots-bulk') {
      if (!isFounder) return json({ error: 'Only the founder can manage slots' }, 403)

      const { slots } = body
      if (!slots || !Array.isArray(slots) || slots.length === 0) return json({ error: 'No slots provided' }, 400)

      const today = new Date().toISOString().split('T')[0]
      const validSlots = slots.filter(s => s.date >= today && s.start_time && s.end_time)

      if (validSlots.length === 0) return json({ error: 'No valid slots to add' }, 400)

      // Check for duplicates
      const { data: existingSlots } = await supabase
        .from('forum_bookings')
        .select('date, start_time, end_time')
        .eq('type', 'slot')
        .eq('status', 'confirmed')
        .in('date', validSlots.map(s => s.date))

      const existingSet = new Set((existingSlots || []).map(s => `${s.date}_${s.start_time}_${s.end_time}`))
      const newSlots = validSlots
        .filter(s => !existingSet.has(`${s.date}_${s.start_time}_${s.end_time}`))
        .map(s => ({
          user_id: user.id,
          type: 'slot',
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          status: 'confirmed',
        }))

      if (newSlots.length === 0) return json({ error: 'All slots already exist' }, 409)

      const { data: created, error: insertErr } = await supabase
        .from('forum_bookings')
        .insert(newSlots)
        .select()

      if (insertErr) return json({ error: insertErr.message }, 500)
      return json({ success: true, count: created.length, slots: created })
    }

    // --- REMOVE SLOT (founder only) ---
    if (action === 'remove-slot') {
      if (!isFounder) return json({ error: 'Only the founder can manage slots' }, 403)

      const { id } = body
      if (!id) return json({ error: 'Missing slot id' }, 400)

      // Check there's no booking for this slot time before removing
      const { data: slot } = await supabase
        .from('forum_bookings')
        .select('date, start_time, end_time')
        .eq('id', id)
        .eq('type', 'slot')
        .single()

      if (!slot) return json({ error: 'Slot not found' }, 404)

      const { data: bookingsAtTime } = await supabase
        .from('forum_bookings')
        .select('id')
        .eq('type', 'booking')
        .eq('status', 'confirmed')
        .eq('date', slot.date)
        .eq('start_time', slot.start_time)

      if (bookingsAtTime && bookingsAtTime.length > 0) {
        return json({ error: 'Cannot remove slot that has an active booking. Cancel the booking first.' }, 409)
      }

      const { error: delErr } = await supabase
        .from('forum_bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (delErr) return json({ error: delErr.message }, 500)
      return json({ success: true })
    }

    // --- CANCEL BOOKING ---
    if (action === 'cancel') {
      const { id } = body
      if (!id) return json({ error: 'Missing booking id' }, 400)

      // Verify ownership or founder
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

      // Notify founder if user cancelled
      if (!isFounder) {
        const dateObj = new Date(booking.date + 'T00:00:00')
        const formattedDate = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const hhmm = (t) => (t || '').slice(0, 5)

        await sendNotificationEmail(
          FOUNDER_EMAIL,
          `Demo Cancelled: ${booking.user_name} - ${formattedDate}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Demo Cancelled</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; color: #475569;"><strong>${booking.user_name}</strong> has cancelled their demo booking:</p>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Time:</strong> ${hhmm(booking.start_time)} - ${hhmm(booking.end_time)}</p>
              </div>
              <p style="font-size: 13px; color: #94a3b8;">The slot is now available again for other users.</p>
            </div>
          </div>
          `
        )

        try {
          await supabase.from('forum_notifications').insert({
            user_id: FOUNDER_ID,
            actor_id: user.id,
            type: 'booking_cancel',
            message: `${booking.user_name} cancelled their demo on ${formattedDate} at ${hhmm(booking.start_time)}`,
          })
        } catch {}
      }

      // Notify user if founder cancelled
      if (isFounder && booking.user_email) {
        const dateObj = new Date(booking.date + 'T00:00:00')
        const formattedDate = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const hhmm = (t) => (t || '').slice(0, 5)

        await sendNotificationEmail(
          booking.user_email,
          `Demo Cancelled - ${formattedDate}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Demo Session Cancelled</h1>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 15px; color: #334155;">Hi ${booking.user_name},</p>
              <p style="font-size: 14px; color: #475569;">Unfortunately, your demo session has been cancelled:</p>
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
