import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

export async function POST(req) {
  try {
    const body = await req.json()
    const { token, file, fileName, fileType } = body
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // Extract base64 data
    const matches = file.match(/^data:(.+?);base64,(.+)$/)
    if (!matches) return json({ error: 'Invalid file format' }, 400)

    const buffer = Buffer.from(matches[2], 'base64')
    if (buffer.length > 10 * 1024 * 1024) return json({ error: 'File too large (max 10MB)' }, 400)

    const contentType = matches[1]
    const isImage = contentType.startsWith('image/')
    const ext = fileName?.split('.').pop() || 'bin'
    const safeName = (fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')
    const folder = isImage ? 'forum-images' : 'forum-files'
    const filePath = `${folder}/${user.id}/${Date.now()}-${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from('public-assets')
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      })

    if (uploadErr) {
      if (uploadErr.message?.includes('not found') || uploadErr.statusCode === '404') {
        await supabase.storage.createBucket('public-assets', { public: true })
        await supabase.storage.from('public-assets').upload(filePath, buffer, {
          contentType,
          upsert: false,
        })
      } else {
        return json({ error: uploadErr.message }, 500)
      }
    }

    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    // Return markdown snippet
    const markdown = isImage
      ? `![${safeName}](${publicUrl})`
      : `[file:${safeName}](${publicUrl})`

    return json({ success: true, url: publicUrl, markdown, isImage })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
