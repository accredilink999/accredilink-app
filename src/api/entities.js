import { supabase } from './supabaseClient'
import { enqueueAction } from '@/lib/offlineQueue'
import { getCurrentOrgId } from '@/lib/orgContext'

// ────────────────────────────────────────────────────────────────────────────
// Tables where offline writes are supported.
// Only critical day-to-day operations — not admin/settings tables.
// ────────────────────────────────────────────────────────────────────────────
const OFFLINE_ENABLED_TABLES = new Set([
  'care_logs',
  'shifts',
  'shift_calls',
  'healthcare_logs',
  'sitting_logs',
  'incidents',
  'medication_administrations',
  'chat_messages',
  'messages',
  'form_submissions',
])

// ────────────────────────────────────────────────────────────────────────────
// Column name mapping: Base44 code → Supabase DB column names.
// WRITE_ALIASES: when writing data, map code names → DB names.
// READ_ALIASES:  when reading data, add code-friendly aliases on returned rows.
// ────────────────────────────────────────────────────────────────────────────
const WRITE_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  rota_area_id: 'area_id',
  rota_area_name: 'area_name',
}

// Per-table column aliases (code name → DB column name)
// DB columns have been renamed to match code names directly — no per-table aliases needed.
const TABLE_WRITE_ALIASES = {
  leave_requests: { type: 'leave_type', reviewed_by_name: 'reviewer_name' },
  work_calendar_events: { type: 'event_type', start_date: 'start_datetime', end_date: 'end_datetime', assigned_to: 'attendees' },
  holiday_allowances: { total_allowance_days: 'total_days', carried_over_days: 'carried_over', total_allowance_hours: 'total_hours' },
}

// Tables that don't have a created_at column — override the default sort
const TABLE_DEFAULT_SORT = {
  announcement_acknowledgements: 'acknowledged_at',
}

// ────────────────────────────────────────────────────────────────────────────
// Tables that have organization_id — app-level defense-in-depth filtering.
// Even though RLS enforces org isolation at the DB level, we also filter
// in the app to prevent any possible data leakage if RLS is misconfigured.
// ────────────────────────────────────────────────────────────────────────────
const ORG_FILTERED_TABLES = new Set([
  'users', 'rota_areas', 'rota_permissions', 'service_users', 'shifts',
  'shift_calls', 'shift_types', 'shift_patterns', 'client_calls', 'care_logs',
  'healthcare_logs', 'sitting_logs', 'notifications', 'notification_settings',
  'messages', 'conversations', 'chat_messages', 'invoices', 'invoicing_settings',
  'leave_requests', 'expenses', 'pay_periods', 'payroll_records',
  'shift_swap_requests', 'shift_claim_requests', 'base_shift_templates',
  'trainings', 'courses', 'modules', 'lessons', 'course_assignments',
  'course_completions', 'training_certificates', 'training_matrix_records',
  'training_matrix_items', 'documents', 'document_requirements', 'hr_documents',
  'medication_administrations', 'medication_records', 'assessments',
  'sickness_records', 'incidents', 'audit_logs', 'system_settings',
  'care_log_form_configs', 'locations', 'assets', 'care_teams', 'forms',
  'form_submissions', 'archives', 'work_calendar_events', 'shared_files',
  'payments', 'clients', 'holiday_allowances', 'recurring_invoices',
  'call_types', 'announcement_acknowledgements', 'compliance_reports',
  'safeguarding_reports', 'supervision_records', 'meetings',
  'meeting_participants', 'clinical_observations', 'wound_records',
  'falls_records', 'repositioning_records', 'continence_records',
  'archived_mar_charts', 'payroll_settings',
])

/** Add org filter to a query if the table supports it */
function applyOrgFilter(query, tableName) {
  const orgId = getCurrentOrgId()
  if (orgId && ORG_FILTERED_TABLES.has(tableName)) {
    return query.eq('organization_id', orgId)
  }
  return query
}

// ────────────────────────────────────────────────────────────────────────────
// Sort string parser
// Base44 uses "-field_name" for DESC, "field_name" for ASC
// e.g. "-created_date" → { column: 'created_at', ascending: false }
// ────────────────────────────────────────────────────────────────────────────
function parseSort(sort, tableName) {
  if (!sort) return null
  const desc = sort.startsWith('-')
  let column = desc ? sort.slice(1) : sort
  const tableAliases = TABLE_WRITE_ALIASES[tableName]
  column = WRITE_ALIASES[column] || (tableAliases && tableAliases[column]) || column
  return { column, ascending: !desc }
}

// ────────────────────────────────────────────────────────────────────────────
// Map code-side column names to DB column names in outgoing data.
// Used for filter criteria, create, and update payloads.
// ────────────────────────────────────────────────────────────────────────────
function mapKeys(data, tableName) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const tableAliases = TABLE_WRITE_ALIASES[tableName]
  const mapped = {}
  for (const [key, value] of Object.entries(data)) {
    const resolved = WRITE_ALIASES[key] || (tableAliases && tableAliases[key]) || key
    mapped[resolved] = value
  }
  return mapped
}

// ────────────────────────────────────────────────────────────────────────────
// Add Base44-compatible aliases to returned records so that code referencing
// `record.created_date` or `record.rota_area_id` still works.
// ────────────────────────────────────────────────────────────────────────────

// Per-table read aliases (DB column → code name)
// DB columns have been renamed to match code names directly — no per-table aliases needed.
const TABLE_READ_ALIASES = {
  leave_requests: { leave_type: 'type', reviewer_name: 'reviewed_by_name' },
  work_calendar_events: { event_type: 'type', start_datetime: 'start_date', end_datetime: 'end_date', attendees: 'assigned_to' },
  holiday_allowances: { total_days: 'total_allowance_days', carried_over: 'carried_over_days', total_hours: 'total_allowance_hours' },
}

function addAliases(record, tableName) {
  if (!record || typeof record !== 'object') return record
  if (record.created_at && !record.created_date) record.created_date = record.created_at
  if (record.updated_at && !record.updated_date) record.updated_date = record.updated_at
  if (record.area_id && !record.rota_area_id) record.rota_area_id = record.area_id
  if (record.area_name && !record.rota_area_name) record.rota_area_name = record.area_name
  // Call scheduling aliases — bidirectional
  if (record.call_time && !record.scheduled_time) record.scheduled_time = record.call_time
  if (record.scheduled_time && !record.call_time) record.call_time = record.scheduled_time
  if (record.duration && !record.duration_minutes) record.duration_minutes = record.duration
  if (record.duration_minutes && !record.duration) record.duration = record.duration_minutes
  // Per-table read aliases (always overwrite if source has a real value)
  const readAliases = TABLE_READ_ALIASES[tableName]
  if (readAliases) {
    for (const [dbCol, codeName] of Object.entries(readAliases)) {
      if (record[dbCol] !== undefined && record[dbCol] !== null) {
        record[codeName] = record[dbCol]
      }
    }
  }
  return record
}

function addAliasesToArray(records, tableName) {
  if (!Array.isArray(records)) return records
  return records.map(r => addAliases(r, tableName))
}

// ────────────────────────────────────────────────────────────────────────────
// Core entity builder — mirrors the Base44 entity API surface
// ────────────────────────────────────────────────────────────────────────────
function buildEntity(tableName) {
  return {
    /**
     * Filter by criteria object (AND equality), optional sort string, optional limit.
     * Mirrors: base44.entities.EntityName.filter(criteria, sort, limit)
     */
    async filter(criteria = {}, sort = null, limit = 1000) {
      let query = supabase.from(tableName).select('*')
      query = applyOrgFilter(query, tableName) // defense-in-depth
      const mappedCriteria = mapKeys(criteria, tableName)

      Object.entries(mappedCriteria).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          query = query.is(key, null)
        } else if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      })

      const sortOpts = parseSort(sort, tableName)
      if (sortOpts) {
        query = query.order(sortOpts.column, { ascending: sortOpts.ascending })
      } else {
        query = query.order(TABLE_DEFAULT_SORT[tableName] || 'created_at', { ascending: false })
      }

      if (limit) query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error
      return addAliasesToArray(data || [], tableName)
    },

    /**
     * List all records, optional sort and limit.
     * Mirrors: base44.entities.EntityName.list(sort, limit)
     */
    async list(sort = null, limit = 1000) {
      let query = supabase.from(tableName).select('*')
      query = applyOrgFilter(query, tableName) // defense-in-depth

      const sortOpts = parseSort(sort, tableName)
      if (sortOpts) {
        query = query.order(sortOpts.column, { ascending: sortOpts.ascending })
      } else {
        query = query.order(TABLE_DEFAULT_SORT[tableName] || 'created_at', { ascending: false })
      }

      if (limit) query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error
      return addAliasesToArray(data || [], tableName)
    },

    /**
     * Read a single record by id.
     * Mirrors: base44.entities.EntityName.read(id)
     */
    async read(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return addAliases(data, tableName)
    },

    /**
     * Create a new record.
     * Mirrors: base44.entities.EntityName.create(data)
     * When offline + table is in OFFLINE_ENABLED_TABLES, queues the write.
     */
    async create(data) {
      const mappedData = mapKeys(data, tableName)

      // Auto-inject organization_id if the table supports it and it's not already set
      const orgId = getCurrentOrgId()
      if (orgId && !mappedData.organization_id) {
        mappedData.organization_id = orgId
      }

      if (!navigator.onLine && OFFLINE_ENABLED_TABLES.has(tableName)) {
        await enqueueAction('create', tableName, mappedData)
        // Return a temporary object so the calling code doesn't break
        return { ...data, id: `offline_${Date.now()}`, _offline: true }
      }

      const { data: created, error } = await supabase
        .from(tableName)
        .insert(mappedData)
        .select()
        .single()

      if (error) throw error
      return addAliases(created, tableName)
    },

    /**
     * Update a record by id.
     * Mirrors: base44.entities.EntityName.update(id, data)
     * When offline + table is in OFFLINE_ENABLED_TABLES, queues the write.
     */
    async update(id, data) {
      const mappedData = mapKeys(data, tableName)

      if (!navigator.onLine && OFFLINE_ENABLED_TABLES.has(tableName)) {
        await enqueueAction('update', tableName, mappedData, id)
        return { ...data, id, _offline: true }
      }

      const { data: updated, error } = await supabase
        .from(tableName)
        .update(mappedData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return addAliases(updated, tableName)
    },

    /**
     * Delete a record by id.
     * Mirrors: base44.entities.EntityName.delete(id)
     */
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id }
    },

    /**
     * Subscribe to realtime changes on this table.
     * Mirrors: base44.entities.EntityName.subscribe(callback)
     *
     * Returns an unsubscribe function — call it on component unmount.
     *
     * Usage (unchanged from Base44):
     *   const unsub = base44.entities.Shift.subscribe((event) => {
     *     queryClient.invalidateQueries({ queryKey: ['shifts'] })
     *   })
     *   return () => unsub()
     */
    subscribe(callback) {
      const channelName = `${tableName}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            callback({
              type: payload.eventType,       // 'INSERT' | 'UPDATE' | 'DELETE'
              record: payload.new,
              old_record: payload.old,
              data: payload.new,             // Base44 compat alias
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// All 49 entities mapped to their Supabase table names (snake_case)
// ────────────────────────────────────────────────────────────────────────────
export const entities = {
  // User & Access
  User:                        buildEntity('users'),
  RotaArea:                    buildEntity('rota_areas'),
  RotaPermission:              buildEntity('rota_permissions'),

  // Service Delivery
  CallType:                    buildEntity('call_types'),
  ServiceUser:                 buildEntity('service_users'),
  Shift:                       buildEntity('shifts'),
  ShiftType:                   buildEntity('shift_types'),
  ShiftCall:                   buildEntity('shift_calls'),
  ClientCall:                  buildEntity('client_calls'),
  CareLog:                     buildEntity('care_logs'),
  HealthcareLog:               buildEntity('healthcare_logs'),
  SittingLog:                  buildEntity('sitting_logs'),

  // Notifications
  Notification:                buildEntity('notifications'),
  NotificationSettings:        buildEntity('notification_settings'),
  NotificationPreference:      buildEntity('notification_preferences'),
  NotificationSound:           buildEntity('notification_sounds'),
  NotificationCredentials:     buildEntity('notification_credentials'),
  PushNotificationLog:         buildEntity('push_notification_logs'),
  Message:                     buildEntity('messages'),
  Conversation:                buildEntity('conversations'),
  ChatMessage:                 buildEntity('chat_messages'),

  // Financial
  Invoice:                     buildEntity('invoices'),
  InvoicingSettings:           buildEntity('invoicing_settings'),
  LeaveRequest:                buildEntity('leave_requests'),
  Expense:                     buildEntity('expenses'),
  PayPeriod:                   buildEntity('pay_periods'),
  PayrollRecord:               buildEntity('payroll_records'),
  PayrollSettings:             buildEntity('payroll_settings'),
  ShiftSwapRequest:            buildEntity('shift_swap_requests'),
  ShiftClaimRequest:           buildEntity('shift_claim_requests'),
  BaseShiftTemplate:           buildEntity('base_shift_templates'),

  // Training & Compliance
  Training:                    buildEntity('trainings'),
  Course:                      buildEntity('courses'),
  Module:                      buildEntity('modules'),
  Lesson:                      buildEntity('lessons'),
  CourseAssignment:            buildEntity('course_assignments'),
  CourseCompletion:            buildEntity('course_completions'),
  TrainingCertificate:         buildEntity('training_certificates'),
  TrainingMatrixRecord:        buildEntity('training_matrix_records'),
  TrainingMatrixItem:          buildEntity('training_matrix_items'),

  // Documents
  Document:                    buildEntity('documents'),
  DocumentRequirement:         buildEntity('document_requirements'),
  HRDocument:                  buildEntity('hr_documents'),

  // Healthcare
  MedicationAdministration:    buildEntity('medication_administrations'),
  MedicationRecord:            buildEntity('medication_records'),
  Assessment:                  buildEntity('assessments'),
  SicknessRecord:              buildEntity('sickness_records'),

  // Clinical
  ClinicalObservation:         buildEntity('clinical_observations'),
  WoundRecord:                 buildEntity('wound_records'),
  FallsRecord:                 buildEntity('falls_records'),
  RepositioningRecord:         buildEntity('repositioning_records'),
  ContinenceRecord:            buildEntity('continence_records'),

  // Admin
  Incident:                    buildEntity('incidents'),
  AuditLog:                    buildEntity('audit_logs'),
  SystemSettings:              buildEntity('system_settings'),
  CareLogFormConfig:           buildEntity('care_log_form_configs'),
  Location:                    buildEntity('locations'),
  Asset:                       buildEntity('assets'),
  CareTeam:                    buildEntity('care_teams'),
  AnnouncementAcknowledgement: buildEntity('announcement_acknowledgements'),
  Form:                        buildEntity('forms'),
  FormSubmission:              buildEntity('form_submissions'),
  Archive:                     buildEntity('archives'),
  WorkCalendarEvent:           buildEntity('work_calendar_events'),
  SharedFile:                  buildEntity('shared_files'),
  Payment:                     buildEntity('payments'),
  Client:                      buildEntity('clients'),
  HolidayAllowance:            buildEntity('holiday_allowances'),

  // Compliance & Safeguarding
  ComplianceReport:            buildEntity('compliance_reports'),
  SafeguardingReport:          buildEntity('safeguarding_reports'),
  SupervisionRecord:           buildEntity('supervision_records'),

  // Communications / Meetings
  Meeting:                     buildEntity('meetings'),
  MeetingParticipant:          buildEntity('meeting_participants'),

  // Migrated Payslips
  MigratedPayslip:             buildEntity('migrated_payslips'),

  // Archived MAR Charts
  ArchivedMARChart:            buildEntity('archived_mar_charts'),
}
