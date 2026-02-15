/**
 * transcribeAudio — Transcribes audio to text using Groq's Whisper API.
 * Used as a fallback when the Web Speech API is unavailable (e.g., mobile WebViews).
 *
 * Accepts a base64-encoded audio blob and returns the transcript.
 */

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

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
    if (!GROQ_API_KEY) {
      return Response.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const { audioBase64, mimeType = 'audio/webm' } = await req.json()

    if (!audioBase64) {
      return Response.json(
        { error: 'No audio data provided' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Decode base64 to binary
    const binaryString = atob(audioBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Determine file extension from mime type
    const ext = mimeType.includes('webm') ? 'webm'
      : mimeType.includes('mp4') ? 'm4a'
      : mimeType.includes('ogg') ? 'ogg'
      : mimeType.includes('wav') ? 'wav'
      : 'webm'

    // Build multipart form data for Groq Whisper API
    const formData = new FormData()
    const audioBlob = new Blob([bytes], { type: mimeType })
    formData.append('file', audioBlob, `recording.${ext}`)
    formData.append('model', 'whisper-large-v3')
    formData.append('language', 'en')
    formData.append('response_format', 'json')

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    })

    if (!whisperRes.ok) {
      const errText = await whisperRes.text()
      console.error('Whisper API error:', errText)
      return Response.json(
        { error: `Transcription failed: ${whisperRes.status}` },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const result = await whisperRes.json()

    return Response.json(
      { transcript: result.text || '' },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('transcribeAudio error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
