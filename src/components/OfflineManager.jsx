import { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import {
  getPendingActions,
  removeAction,
  getPendingCount,
} from '@/lib/offlineQueue';

export default function OfflineManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const syncingRef = useRef(false);

  const syncPendingActions = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;

    let actions;
    try {
      actions = await getPendingActions();
    } catch {
      syncingRef.current = false;
      return;
    }

    if (actions.length === 0) {
      syncingRef.current = false;
      return;
    }

    for (const action of actions) {
      try {
        if (action.operation === 'create') {
          const { error } = await supabase
            .from(action.table)
            .insert(action.data);
          if (error) throw error;
        } else if (action.operation === 'update') {
          const { error } = await supabase
            .from(action.table)
            .update(action.data)
            .eq('id', action.recordId);
          if (error) throw error;
        }
        await removeAction(action.queueId);
      } catch (err) {
        console.error(`Sync failed for ${action.operation} on ${action.table}:`, err);
      }
    }

    syncingRef.current = false;
  }, []);

  useEffect(() => {
    // Sync any pending items on mount
    syncPendingActions();

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => syncPendingActions(), 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically try to sync pending items
    const interval = setInterval(() => {
      if (navigator.onLine) syncPendingActions();
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncPendingActions]);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 pointer-events-none flex justify-center" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="pointer-events-auto bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm w-full">
        <WifiOff className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Offline Mode</p>
          <p className="text-xs text-slate-300">Changes will sync when back online</p>
        </div>
      </div>
    </div>
  );
}
