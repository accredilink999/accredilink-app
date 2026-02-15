/**
 * base44Client.js — Supabase compatibility shim
 *
 * This file replaces the original Base44 SDK client.
 * All pages/components import { base44 } from '@/api/base44Client' unchanged.
 * This shim assembles the same API surface using Supabase under the hood.
 */
import { entities } from './entities'
import { auth } from './auth'
import { integrations } from './storage'
import { invokeFunction } from './functions'
import { agents } from './agents'

export const base44 = {
  entities,
  auth,
  integrations,
  agents,
  functions: {
    invoke: invokeFunction,
  },
  // Stub: Base44 app activity logging — not needed in Supabase
  appLogs: {
    logUserInApp: () => Promise.resolve(),
  },
}
