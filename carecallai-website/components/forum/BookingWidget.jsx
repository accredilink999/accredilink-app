'use client'
import { useState, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, Loader2, X } from 'lucide-react'

const HOURS = Array.from({ length: 8 }, (_, i) => i + 9) // 9am to 4pm (last slot start)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function hhmm(t) {
  return (t || '').slice(0, 5)
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatLongDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BookingWidget({ token, userId, profile }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [userBookings, setUserBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addingSlot, setAddingSlot] = useState(false)
  const [managingSlots, setManagingSlots] = useState(false)

  const isFounder = userId === FOUNDER_ID

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const weekStr = formatDate(weekStart)
      const url = token
        ? `/api/forum/bookings?week=${weekStr}&token=${token}`
        : `/api/forum/bookings?week=${weekStr}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSlots(data.slots || [])
        setBookings(data.bookings || [])
        setUserBookings(data.userBookings || [])
      }
    } catch (err) {
      setError('Failed to load booking data')
    }
    setLoading(false)
  }, [weekStart, token])

  useEffect(() => { fetchData() }, [fetchData])

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return formatDate(d)
  })

  const weekLabel = (() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 4)
    const startMonth = weekStart.toLocaleDateString('en-GB', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-GB', { month: 'short' })
    if (startMonth === endMonth) {
      return `${weekStart.getDate()} - ${end.getDate()} ${startMonth} ${weekStart.getFullYear()}`
    }
    return `${weekStart.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${weekStart.getFullYear()}`
  })()

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  function getSlotStatus(dateStr, hour) {
    const startTime = `${String(hour).padStart(2, '0')}:00`
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`

    const isAvailable = slots.some(s =>
      s.date === dateStr && hhmm(s.start_time) === startTime && hhmm(s.end_time) === endTime
    )
    const isBooked = bookings.some(b =>
      b.date === dateStr && hhmm(b.start_time) === startTime && hhmm(b.end_time) === endTime
    )
    const userBooking = userBookings.find(b =>
      b.date === dateStr && hhmm(b.start_time) === startTime && hhmm(b.end_time) === endTime
    )

    if (userBooking) return { status: 'mine', booking: userBooking }
    if (isBooked) return { status: 'booked' }
    if (isAvailable) {
      const slot = slots.find(s =>
        s.date === dateStr && hhmm(s.start_time) === startTime && hhmm(s.end_time) === endTime
      )
      return { status: 'available', slot }
    }
    return { status: 'empty' }
  }

  function isPast(dateStr, hour) {
    const now = new Date()
    const slotTime = new Date(dateStr + 'T' + String(hour).padStart(2, '0') + ':00:00')
    return slotTime < now
  }

  async function handleBook() {
    if (!selectedSlot || !token) return
    setBooking(true)
    setError('')
    try {
      const res = await fetch('/api/forum/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          token,
          date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to book')
      } else {
        setSuccess('Your demo has been booked! Check your email for confirmation.')
        setSelectedSlot(null)
        setNotes('')
        fetchData()
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setBooking(false)
  }

  async function handleCancel(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    setError('')
    try {
      const res = await fetch('/api/forum/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', token, id: bookingId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to cancel')
      } else {
        setSuccess('Booking cancelled successfully.')
        fetchData()
      }
    } catch {
      setError('Network error. Please try again.')
    }
  }

  async function handleAddSlot(dateStr, hour) {
    if (!isFounder) return
    setAddingSlot(true)
    setError('')
    try {
      const res = await fetch('/api/forum/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-slot',
          token,
          date: dateStr,
          start_time: `${String(hour).padStart(2, '0')}:00`,
          end_time: `${String(hour + 1).padStart(2, '0')}:00`,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to add slot')
      } else {
        fetchData()
      }
    } catch {
      setError('Network error')
    }
    setAddingSlot(false)
  }

  async function handleRemoveSlot(slotId) {
    if (!isFounder) return
    setError('')
    try {
      const res = await fetch('/api/forum/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-slot', token, id: slotId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to remove slot')
      } else {
        fetchData()
      }
    } catch {
      setError('Network error')
    }
  }

  async function handleAddAllSlots() {
    if (!isFounder) return
    setAddingSlot(true)
    setError('')
    const slotsToAdd = []
    weekDates.forEach(dateStr => {
      if (isPast(dateStr, 16)) return // skip fully past days
      HOURS.forEach(hour => {
        if (isPast(dateStr, hour)) return
        const info = getSlotStatus(dateStr, hour)
        if (info.status === 'empty') {
          slotsToAdd.push({
            date: dateStr,
            start_time: `${String(hour).padStart(2, '0')}:00`,
            end_time: `${String(hour + 1).padStart(2, '0')}:00`,
          })
        }
      })
    })

    if (slotsToAdd.length === 0) {
      setError('No empty slots to add')
      setAddingSlot(false)
      return
    }

    try {
      const res = await fetch('/api/forum/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-slots-bulk', token, slots: slotsToAdd }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to add slots')
      } else {
        setSuccess(`Added ${data.count} slots`)
        fetchData()
      }
    } catch {
      setError('Network error')
    }
    setAddingSlot(false)
  }

  // Clear messages after 5s
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 5000); return () => clearTimeout(t) }
  }, [success])

  return (
    <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          <h3 className="font-semibold text-sm text-white">Book a Demo</h3>
        </div>
        {isFounder && (
          <button
            onClick={() => setManagingSlots(!managingSlots)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              managingSlots
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {managingSlots ? 'Done Managing' : 'Manage Slots'}
          </button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03]">
        <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-slate-300">{weekLabel}</span>
        <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Founder: Add all slots button */}
      {isFounder && managingSlots && (
        <div className="px-4 py-2 border-b border-white/10 bg-amber-500/5">
          <button
            onClick={handleAddAllSlots}
            disabled={addingSlot}
            className="w-full px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 border border-amber-400/20"
          >
            {addingSlot ? 'Adding...' : 'Add All Empty Slots This Week'}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 bg-red-500/10 border border-red-400/20 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <X className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
        </div>
      )}
      {success && (
        <div className="mx-4 mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-400/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
            <span className="ml-2 text-sm text-slate-400">Loading calendar...</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-slate-200">
              <div className="p-2 bg-slate-50"></div>
              {weekDates.map((dateStr, i) => {
                const isToday = dateStr === formatDate(new Date())
                return (
                  <div key={dateStr} className={`p-2 text-center border-l border-slate-200 ${isToday ? 'bg-teal-50' : 'bg-slate-50'}`}>
                    <div className={`text-[10px] uppercase tracking-wider font-semibold ${isToday ? 'text-teal-600' : 'text-slate-500'}`}>
                      {SHORT_DAYS[i]}
                    </div>
                    <div className={`text-sm font-bold ${isToday ? 'text-teal-700' : 'text-slate-700'}`}>
                      {formatDisplayDate(dateStr)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time slots */}
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-slate-100 last:border-b-0">
                <div className="p-2 flex items-center justify-center bg-slate-50 border-r border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500">{`${hour}:00`}</span>
                </div>
                {weekDates.map((dateStr, dayIdx) => {
                  const info = getSlotStatus(dateStr, hour)
                  const past = isPast(dateStr, hour)

                  return (
                    <div key={`${dateStr}-${hour}`} className="border-l border-slate-100 p-0.5">
                      {past ? (
                        <div className="h-full min-h-[36px] rounded bg-slate-50 flex items-center justify-center">
                          <span className="text-[9px] text-slate-300">Past</span>
                        </div>
                      ) : info.status === 'available' ? (
                        managingSlots && isFounder ? (
                          <button
                            onClick={() => handleRemoveSlot(info.slot.id)}
                            className="w-full h-full min-h-[36px] rounded bg-emerald-50 hover:bg-red-50 border border-emerald-200 hover:border-red-200 flex items-center justify-center transition-colors group"
                            title="Click to remove this slot"
                          >
                            <span className="text-[9px] font-medium text-emerald-600 group-hover:hidden">Open</span>
                            <X className="w-3 h-3 text-red-400 hidden group-hover:block" />
                          </button>
                        ) : token ? (
                          <button
                            onClick={() => {
                              setSelectedSlot({
                                date: dateStr,
                                start_time: `${String(hour).padStart(2, '0')}:00`,
                                end_time: `${String(hour + 1).padStart(2, '0')}:00`,
                              })
                              setNotes('')
                              setError('')
                            }}
                            className="w-full h-full min-h-[36px] rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 flex items-center justify-center transition-colors"
                            title="Click to book this slot"
                          >
                            <span className="text-[9px] font-semibold text-emerald-600">Available</span>
                          </button>
                        ) : (
                          <div className="h-full min-h-[36px] rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            <span className="text-[9px] font-medium text-emerald-500">Available</span>
                          </div>
                        )
                      ) : info.status === 'mine' ? (
                        <div
                          className="h-full min-h-[36px] rounded bg-teal-100 border border-teal-300 flex items-center justify-center cursor-pointer group relative"
                          onClick={() => handleCancel(info.booking.id)}
                          title="Click to cancel your booking"
                        >
                          <span className="text-[9px] font-bold text-teal-700 group-hover:hidden">Your Demo</span>
                          <span className="text-[9px] font-medium text-red-500 hidden group-hover:block">Cancel</span>
                        </div>
                      ) : info.status === 'booked' ? (
                        <div className="h-full min-h-[36px] rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <span className="text-[9px] font-medium text-slate-400">Booked</span>
                        </div>
                      ) : (
                        // Empty — no slot set
                        managingSlots && isFounder ? (
                          <button
                            onClick={() => handleAddSlot(dateStr, hour)}
                            disabled={addingSlot}
                            className="w-full h-full min-h-[36px] rounded bg-white hover:bg-amber-50 border border-dashed border-slate-200 hover:border-amber-300 flex items-center justify-center transition-colors"
                            title="Click to add this slot"
                          >
                            <span className="text-[9px] text-slate-300 hover:text-amber-500">+ Add</span>
                          </button>
                        ) : (
                          <div className="h-full min-h-[36px] rounded bg-white border border-transparent"></div>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></div>
            <span className="text-[10px] text-slate-400">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-teal-100 border border-teal-300"></div>
            <span className="text-[10px] text-slate-400">Your Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div>
            <span className="text-[10px] text-slate-400">Booked</span>
          </div>
        </div>

        {/* Not logged in message */}
        {!token && (
          <div className="mt-3 px-3 py-2 bg-blue-500/10 border border-blue-400/20 rounded-lg">
            <p className="text-xs text-blue-300 text-center">Sign in to book a demo session</p>
          </div>
        )}
      </div>

      {/* User's upcoming bookings */}
      {userBookings.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Bookings</h4>
          {userBookings.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-teal-500/10 border border-teal-400/20 rounded-xl px-3 py-2 mb-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <div>
                  <p className="text-xs font-medium text-white">{formatLongDate(b.date)}</p>
                  <p className="text-[10px] text-slate-400">{hhmm(b.start_time)} - {hhmm(b.end_time)} via Microsoft Teams</p>
                </div>
              </div>
              <button
                onClick={() => handleCancel(b.id)}
                className="text-[10px] text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedSlot(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Book Demo Session</h3>
              <button onClick={() => setSelectedSlot(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/[0.06] rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-white font-medium">{formatLongDate(selectedSlot.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-white font-medium">{selectedSlot.start_time} - {selectedSlot.end_time}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">1-hour personal walkthrough via Microsoft Teams</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any specific areas you'd like to cover..."
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50 resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-400/20 rounded-lg text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
