/**
 * invokeLLM — OpenAI GPT-4o wrapper
 *
 * Accepts:
 *   { prompt }                        — single-turn: plain text prompt
 *   { messages, systemPrompt }        — multi-turn: messages array + optional system prompt
 *   { model }                         — optional override (default: gpt-4o)
 *
 * Returns: plain text string (the assistant reply)
 *
 * Secret required:  supabase secrets set OPENAI_API_KEY=sk-...
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    if (!OPENAI_API_KEY) {
      return Response.json(
        { error: 'OPENAI_API_KEY secret not configured. Run: supabase secrets set OPENAI_API_KEY=sk-...' },
        { status: 500, headers: corsHeaders }
      )
    }

    const body = await req.json()
    const { prompt, messages, systemPrompt, model = 'gpt-4o' } = body

    // Build messages array for OpenAI
    let openAiMessages: { role: string; content: string }[] = []

    if (systemPrompt) {
      openAiMessages.push({ role: 'system', content: systemPrompt })
    }

    if (messages && Array.isArray(messages)) {
      // Multi-turn: pass existing conversation history
      openAiMessages = [...openAiMessages, ...messages]
    } else if (prompt) {
      // Single-turn: wrap the prompt as a user message
      openAiMessages.push({ role: 'user', content: prompt })
    } else {
      return Response.json({ error: 'Provide either "prompt" or "messages"' }, { status: 400, headers: corsHeaders })
    }

    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openAiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!openAiRes.ok) {
      const errText = await openAiRes.text()
      throw new Error(`OpenAI API error: ${errText}`)
    }

    const openAiData = await openAiRes.json()
    const reply = openAiData.choices?.[0]?.message?.content ?? ''

    return Response.json({ reply }, { headers: corsHeaders })
  } catch (error) {
    console.error('invokeLLM error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    )
  }
})
