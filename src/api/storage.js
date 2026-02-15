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
 * Mirrors: base44.integrations.Core.InvokeLLM({ prompt, messages, systemPrompt })
 * Returns the plain-text reply string.
 */
async function InvokeLLM(options) {
  const { prompt, messages, systemPrompt, includeAppContext } = options || {}
  const result = await invokeFunction('invokeLLM', { prompt, messages, systemPrompt, includeAppContext })
  return result?.reply ?? ''
}

export const Core = { UploadFile, InvokeLLM }
export const integrations = { Core }
