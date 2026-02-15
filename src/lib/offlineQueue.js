/**
 * Offline Queue — IndexedDB-based queue for offline writes.
 *
 * When the app is offline, entity create/update calls are stored in IndexedDB.
 * When connection returns, OfflineManager replays them in order against Supabase.
 */

const DB_NAME = 'care-call-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending_actions'

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'queueId', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Enqueue an offline action.
 * @param {'create'|'update'} operation
 * @param {string} table - Supabase table name
 * @param {object} data - The data payload
 * @param {string|null} recordId - For updates, the record id
 */
export async function enqueueAction(operation, table, data, recordId = null) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).add({
    operation,
    table,
    data,
    recordId,
    timestamp: Date.now(),
  })
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

/**
 * Get all pending actions in insertion order.
 * @returns {Promise<Array>}
 */
export async function getPendingActions() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

/**
 * Remove a single action by its queueId after successful sync.
 */
export async function removeAction(queueId) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(queueId)
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

/**
 * Clear all pending actions (e.g. after full sync).
 */
export async function clearAllActions() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

/**
 * Get the count of pending actions.
 */
export async function getPendingCount() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  return new Promise((resolve, reject) => {
    const req = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
