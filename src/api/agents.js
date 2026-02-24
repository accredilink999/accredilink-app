/**
 * agents.js — AI conversation management
 *
 * Implements the base44.agents API surface:
 *   base44.agents.listConversations({ agent_name })
 *   base44.agents.createConversation({ agent_name, metadata })
 *   base44.agents.subscribeToConversation(id, callback)
 *   base44.agents.addMessage(conv, { role, content })
 *
 * Backed by the `ai_conversations` Supabase table.
 * LLM responses are powered by the `invokeLLM` edge function.
 */

import { supabase } from './supabaseClient'
import { invokeFunction } from './functions'

// System prompts per agent
const SYSTEM_PROMPTS = {
  care_assistant: `You are an intelligent task assistant integrated with a care management system. You help care staff and administrators with scheduling, care logs, clients, training, leave requests, incidents, and compliance.

Be concise, professional, and action-oriented. When you don't have access to live data, give helpful general guidance. Format responses using markdown when it aids readability.`,

  admin_assistant: `You are an AI admin assistant for a care management system. You help administrators with user management, system configuration, analytics, compliance, and operational decisions.

Be concise, professional, and data-driven. Provide actionable recommendations. Format responses using markdown when it aids readability.`,
}

/**
 * List all AI conversations for the current user, filtered by agent_name.
 */
export async function listConversations({ agent_name }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', user.id)
    .eq('agent_name', agent_name)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Create a new AI conversation.
 */
export async function createConversation({ agent_name, metadata = {} }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      agent_name,
      user_id: user.id,
      metadata,
      messages: [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Subscribe to real-time updates on a conversation.
 * Calls callback({ messages, metadata, ... }) when the row changes.
 * Returns an unsubscribe function.
 */
export function subscribeToConversation(convId, callback) {
  const channel = supabase
    .channel(`ai_conv:${convId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_conversations',
        filter: `id=eq.${convId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

/**
 * Add a user message to a conversation, call the LLM, and store the reply.
 * The realtime subscription will fire once the row is updated.
 */
export async function addMessage(conv, { role, content }) {
  // Append the new user message locally first
  const existingMessages = conv.messages || []
  const updatedMessages = [...existingMessages, { role, content }]

  // Persist the user message immediately
  const { data: saved, error: saveErr } = await supabase
    .from('ai_conversations')
    .update({
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conv.id)
    .select()
    .single()

  if (saveErr) throw saveErr

  // Build system prompt from agent name
  const systemPrompt =
    SYSTEM_PROMPTS[conv.agent_name] ||
    SYSTEM_PROMPTS.care_assistant

  try {
    // Call LLM edge function
    const result = await invokeFunction('invokeLLM', {
      messages: updatedMessages,
      systemPrompt,
    })

    const aiReply = result?.reply ?? 'Sorry, I could not generate a response.'

    // Append AI reply and save
    const finalMessages = [...updatedMessages, { role: 'assistant', content: aiReply }]

    await supabase
      .from('ai_conversations')
      .update({
        messages: finalMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conv.id)
  } catch (llmError) {
    console.error('LLM invocation failed:', llmError)

    // Save a graceful error message so the UI doesn't hang
    const errorMessages = [
      ...updatedMessages,
      {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      },
    ]

    await supabase
      .from('ai_conversations')
      .update({
        messages: errorMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conv.id)
  }
}

export const agents = {
  listConversations,
  createConversation,
  subscribeToConversation,
  addMessage,
}
