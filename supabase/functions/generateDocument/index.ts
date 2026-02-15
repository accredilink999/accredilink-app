import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!OPENAI_API_KEY) {
      return Response.json(
        { error: 'OPENAI_API_KEY secret not configured.' },
        { status: 500 }
      )
    }

    const { type, content } = await req.json()

    const prompts: Record<string, string> = {
      sop: `Create a detailed Standard Operating Procedure (SOP) document based on the following information:\n${content}\n\nFormat it with clear sections including: Purpose, Scope, Procedure Steps, Responsibilities, and Safety Considerations. Make it professional and ready to use.`,
      care_plan: `Create a comprehensive Care Plan document based on the following client information:\n${content}\n\nInclude sections: Client Profile, Care Needs Assessment, Care Goals, Daily Schedule, Medication Management, Emergency Contacts, and Review Schedule. Make it professional and client-centered.`,
      incident_report: `Create a detailed Incident Report based on the following information:\n${content}\n\nInclude sections: Incident Summary, Date/Time, Location, Individuals Involved, Description of Events, Immediate Actions Taken, Injuries/Damage, Witnesses, and Recommended Follow-up Actions. Use professional language.`,
      policy: `Create a formal Policy document based on the following information:\n${content}\n\nInclude sections: Policy Statement, Purpose, Scope, Policy Details, Responsibilities, Review Date, and Approval. Use professional language.`,
    }

    const prompt = prompts[type] ?? prompts.sop

    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional care management document writer. Return a JSON object with keys: title (string), content (string), sections (array of {heading, body}).',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 2048,
      }),
    })

    if (!openAiRes.ok) {
      const errText = await openAiRes.text()
      throw new Error(`OpenAI error: ${errText}`)
    }

    const openAiData = await openAiRes.json()
    const parsed = JSON.parse(openAiData.choices?.[0]?.message?.content ?? '{}')

    const docTitle = parsed.title ?? `Generated ${type?.replace('_', ' ')} document`
    const docContent = parsed.content ?? ''

    const categoryMap: Record<string, string> = {
      sop: 'procedure',
      care_plan: 'care',
      incident_report: 'incident',
      policy: 'policy',
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        title: docTitle,
        category: categoryMap[type] ?? 'other',
        description: `AI-generated ${type?.replace('_', ' ')} document`,
        file_url: `data:text/plain;base64,${btoa(String.fromCharCode(...new TextEncoder().encode(docContent)))}`,
        file_type: 'text/plain',
        version: '1.0',
        uploaded_by: user.id,
        applicable_roles: ['admin', 'supervisor', 'staff'],
      })
      .select()
      .single()

    if (docError) throw docError

    return Response.json({
      success: true,
      document: doc,
      content: docContent,
      sections: parsed.sections ?? [],
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('generateDocument error:', error)
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
})
