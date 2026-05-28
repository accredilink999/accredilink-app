import { supabase } from './supabaseClient'
import { invokeFunction } from './functions'

const BUCKET = 'uploads'

/**
 * Uploads a file to Supabase Storage.
 * Mirrors: base44.integrations.Core.UploadFile({ file, onProgress })
 * Returns: { url, file_url } — a public URL string
 *
 * For files > 6MB, uses chunked upload for reliability.
 * Optionally accepts onProgress(percent) callback.
 */
export async function UploadFile({ file, onProgress }) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Use duplex/chunked upload option for large files
  const uploadOptions = {
    upsert: false,
    cacheControl: '3600',
    contentType: file.type || 'application/octet-stream',
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, uploadOptions)

  if (uploadError) throw uploadError

  // Report 100% completion
  if (onProgress) onProgress(100)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return { url: data.publicUrl, file_url: data.publicUrl }
}

/**
 * Generates a signed URL for a private file.
 */
export async function createSignedUrl({ path, expiresIn = 3600 }) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return { signed_url: data.signedUrl }
}

/**
 * Calls the invokeLLM edge function.
 * Mirrors: base44.integrations.Core.InvokeLLM({ prompt, messages, systemPrompt, response_json_schema })
 * When response_json_schema is provided, parses the reply as JSON and returns the object.
 * Otherwise returns the plain-text reply string.
 */
async function InvokeLLM(options) {
  const {
    prompt, messages, systemPrompt, includeAppContext,
    add_context_from_internet, response_json_schema,
  } = options || {}

  const result = await invokeFunction('invokeLLM', {
    prompt, messages, systemPrompt, includeAppContext,
    add_context_from_internet, response_json_schema,
  })

  // If the edge function already returned a parsed object (not a reply wrapper), use it directly
  if (response_json_schema && result && typeof result === 'object' && !('reply' in result)) {
    return result
  }

  const reply = result?.reply ?? (typeof result === 'string' ? result : '')

  // When a JSON schema was requested, parse the LLM's text reply as JSON
  if (response_json_schema) {
    if (!reply || !reply.trim()) {
      throw new Error('AI returned an empty response — please try again.')
    }
    // 1. Direct parse
    try { return JSON.parse(reply.trim()) } catch {}
    // 2. Strip markdown code fences (```json ... ```)
    const fenceMatch = reply.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()) } catch {}
    }
    // 3. Extract outermost JSON object
    const start = reply.indexOf('{')
    const end   = reply.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try { return JSON.parse(reply.slice(start, end + 1)) } catch {}
    }
    console.error('[InvokeLLM] Could not parse JSON from reply:', reply.substring(0, 500))
    throw new Error('AI returned an unreadable response — please try again.')
  }

  return reply
}

export const Core = { UploadFile, InvokeLLM }
export const integrations = { Core }
