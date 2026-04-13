import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from('forum_profiles')
      .select('id, username, display_name, avatar_url, bio, forum_role, thread_count, post_count, reputation, created_at, last_seen_at')
      .eq('is_banned', false)
      .order('created_at', { ascending: true })

    if (error) return json({ error: error.message }, 500)
    return json({ members: members || [] })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
