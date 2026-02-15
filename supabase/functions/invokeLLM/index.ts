/**
 * invokeLLM — Groq LLM wrapper (free tier) with optional app context
 *
 * Accepts:
 *   { prompt }                        — single-turn: plain text prompt
 *   { messages, systemPrompt }        — multi-turn: messages array + optional system prompt
 *   { includeAppContext: true }       — fetch real app data for the user and inject into system prompt
 *
 * Returns: { reply: string }
 *
 * Secret required:  supabase secrets set GROQ_API_KEY=gsk_...
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Fetch app context data for the authenticated user */
async function fetchAppContext(userId: string) {
  const admin = createClient(supabaseUrl, supabaseServiceKey)
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  try {
    // Fetch data in parallel
    const [
      profileRes,
      staffRes,
      clientsRes,
      shiftsRes,
      leaveRes,
      incidentsRes,
      trainingRes,
    ] = await Promise.all([
      // Current user's profile
      admin.from('profiles').select('full_name, email, role, job_title').eq('id', userId).single(),
      // All active staff (count + names)
      admin.from('profiles').select('id, full_name, role, job_title, is_active').eq('is_active', true).limit(100),
      // All active clients
      admin.from('service_users').select('id, full_name, status, address').eq('status', 'active').limit(100),
      // Shifts this week and next week
      admin.from('shifts').select('id, staff_id, date, start_time, end_time, status').gte('date', today).lte('date', weekAhead).order('date').limit(200),
      // Pending leave requests
      admin.from('leave_requests').select('id, staff_id, staff_name, type, start_date, end_date, status, reason').eq('status', 'pending').limit(50),
      // Recent incidents
      admin.from('incidents').select('id, title, type, severity, status, incident_date, description').gte('incident_date', weekAgo).order('incident_date', { ascending: false }).limit(20),
      // Expiring training
      admin.from('training').select('id, staff_id, training_name, expiry_date').gte('expiry_date', today).lte('expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).limit(50),
    ])

    const profile = profileRes.data
    const staff = staffRes.data || []
    const clients = clientsRes.data || []
    const shifts = shiftsRes.data || []
    const leave = leaveRes.data || []
    const incidents = incidentsRes.data || []
    const training = trainingRes.data || []

    // Build staff name lookup
    const staffMap: Record<string, string> = {}
    for (const s of staff) {
      staffMap[s.id] = s.full_name || 'Unknown'
    }

    // Format shifts with staff names
    const formattedShifts = shifts.slice(0, 50).map(s =>
      `${s.date} ${s.start_time}-${s.end_time} | ${staffMap[s.staff_id] || 'Unassigned'} | ${s.status}`
    ).join('\n')

    // Format leave
    const formattedLeave = leave.map(l =>
      `${l.staff_name || staffMap[l.staff_id] || 'Unknown'}: ${l.type} ${l.start_date} to ${l.end_date} (${l.status}) - ${l.reason || 'No reason given'}`
    ).join('\n')

    // Format incidents
    const formattedIncidents = incidents.map(i =>
      `[${i.severity}] ${i.title} (${i.type}) - ${i.incident_date} - ${i.status}: ${(i.description || '').slice(0, 100)}`
    ).join('\n')

    // Format expiring training
    const formattedTraining = training.map(t =>
      `${staffMap[t.staff_id] || 'Unknown'}: ${t.training_name} expires ${t.expiry_date}`
    ).join('\n')

    // Format client list
    const formattedClients = clients.map(c =>
      `${c.full_name} (${c.status})${c.address ? ' - ' + c.address : ''}`
    ).join('\n')

    // Format staff list
    const formattedStaff = staff.map(s =>
      `${s.full_name} - ${s.role} - ${s.job_title || 'No title'}`
    ).join('\n')

    return `
=== LIVE APP DATA (as of ${new Date().toISOString()}) ===

YOUR PROFILE:
Name: ${profile?.full_name || 'Unknown'}
Role: ${profile?.role || 'Unknown'}
Job Title: ${profile?.job_title || 'N/A'}

STAFF SUMMARY (${staff.length} active):
${formattedStaff || 'No staff data'}

CLIENTS (${clients.length} active):
${formattedClients || 'No clients'}

UPCOMING SHIFTS (next 7 days):
${formattedShifts || 'No shifts scheduled'}

PENDING LEAVE REQUESTS (${leave.length}):
${formattedLeave || 'None'}

RECENT INCIDENTS (last 7 days, ${incidents.length}):
${formattedIncidents || 'None'}

TRAINING EXPIRING WITHIN 30 DAYS (${training.length}):
${formattedTraining || 'None'}

=== END LIVE DATA ===`
  } catch (err) {
    console.error('Failed to fetch app context:', err)
    return '\n(Could not fetch live app data)\n'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    if (!GROQ_API_KEY) {
      return Response.json(
        { error: 'GROQ_API_KEY secret not configured.' },
        { status: 500, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { prompt, messages, systemPrompt, includeAppContext } = body

    // Optionally fetch live app data
    let enrichedSystemPrompt = systemPrompt || ''
    if (includeAppContext) {
      const context = await fetchAppContext(user.id)
      enrichedSystemPrompt = enrichedSystemPrompt + '\n' + context
    }

    // Build messages array
    let chatMessages: { role: string; content: string }[] = []

    if (enrichedSystemPrompt) {
      chatMessages.push({ role: 'system', content: enrichedSystemPrompt })
    }

    if (messages && Array.isArray(messages)) {
      chatMessages = [...chatMessages, ...messages]
    } else if (prompt) {
      chatMessages.push({ role: 'user', content: prompt })
    } else {
      return Response.json({ error: 'Provide either "prompt" or "messages"' }, { status: 400, headers: corsHeaders })
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      throw new Error(`Groq API error: ${errText}`)
    }

    const groqData = await groqRes.json()
    const reply = groqData.choices?.[0]?.message?.content ?? ''

    return Response.json({ reply }, { headers: corsHeaders })
  } catch (error) {
    console.error('invokeLLM error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    )
  }
})
