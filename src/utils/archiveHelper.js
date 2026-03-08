/**
 * archiveHelper.js — Soft-delete helper.
 * Archives an item before permanently deleting it from the source table.
 * Used across the app so deleted items appear in the Archive page.
 */
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';

/**
 * Archive an item before deleting it.
 * @param {Object} opts
 * @param {string} opts.entityType - e.g. 'client', 'document', 'staff', 'message', 'training', 'care_log'
 * @param {string} opts.entityId   - UUID of the item
 * @param {string} opts.itemName   - Human-readable name (e.g. client's full_name)
 * @param {Object} opts.itemData   - Full row data to store (for restore)
 * @param {string} [opts.reason]   - Optional reason for deletion
 * @param {string} [opts.deletedByName] - Name of the user performing delete
 * @returns {Promise<{id: string}>} The archive record ID
 */
export async function archiveItem({
  entityType,
  entityId,
  itemName,
  itemData,
  reason,
  deletedByName,
}) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('archives').insert({
    entity_type: entityType,
    entity_id: entityId,
    item_name: itemName || entityType,
    data: itemData,
    archived_by: user?.id || null,
    deleted_by_name: deletedByName || user?.user_metadata?.full_name || user?.email || 'Unknown',
    archive_reason: reason || null,
    organization_id: getCurrentOrgId(),
    is_restored: false,
  }).select('id').single();

  if (error) {
    console.error('Archive insert failed:', error);
    // Don't block the delete — archive is best-effort
  }

  return data;
}

/**
 * Convenience: archive then delete from a Supabase table.
 * @param {Object} opts - Same as archiveItem plus:
 * @param {string} opts.table - Source table name (e.g. 'service_users')
 * @returns {Promise<void>}
 */
export async function archiveAndDelete({
  table,
  entityType,
  entityId,
  itemName,
  itemData,
  reason,
  deletedByName,
}) {
  await archiveItem({ entityType, entityId, itemName, itemData, reason, deletedByName });

  const { error } = await supabase.from(table).delete().eq('id', entityId);
  if (error) throw error;
}
