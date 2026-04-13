import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

export async function POST(req) {
  try {
    const body = await req.json()
    const { token, action } = body
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    if (action === 'update-avatar') {
      const { avatar } = body // base64 data URL
      if (!avatar) return json({ error: 'No image provided' }, 400)

      // Extract base64 data
      const matches = avatar.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/)
      if (!matches) return json({ error: 'Invalid image format' }, 400)

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
      const buffer = Buffer.from(matches[2], 'base64')
      if (buffer.length > 2 * 1024 * 1024) return json({ error: 'Image too large (max 2MB)' }, 400)

      const filePath = `forum-avatars/${user.id}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('public-assets')
        .upload(filePath, buffer, {
          contentType: `image/${matches[1]}`,
          upsert: true,
        })

      if (uploadErr) {
        // If bucket doesn't exist, try creating it
        if (uploadErr.message?.includes('not found') || uploadErr.statusCode === '404') {
          await supabase.storage.createBucket('public-assets', { public: true })
          await supabase.storage.from('public-assets').upload(filePath, buffer, {
            contentType: `image/${matches[1]}`,
            upsert: true,
          })
        } else {
          return json({ error: uploadErr.message }, 500)
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now() // cache bust

      // Update forum profile
      await supabase.from('forum_profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)

      return json({ success: true, avatarUrl })
    }

    if (action === 'update-bio') {
      const { bio } = body
      await supabase.from('forum_profiles').update({ bio: (bio || '').slice(0, 200) }).eq('id', user.id)
      return json({ success: true })
    }

    if (action === 'update-display-name') {
      const { displayName } = body
      if (!displayName?.trim()) return json({ error: 'Display name required' }, 400)
      await supabase.from('forum_profiles').update({ display_name: displayName.trim().slice(0, 50) }).eq('id', user.id)
      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
