import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import PagerSvg from '@/components/PagerSvg';
import PagerPanel from '@/components/admin/PagerPanel';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

function LcdTicker({ text }) {
  return (
    <div className="overflow-hidden w-full h-full flex items-center">
      <span
        className="whitespace-nowrap text-slate-700 text-xs font-mono font-semibold"
        style={{ display: 'inline-block', animation: 'pagerInboxScroll 9s linear infinite' }}
      >
        {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
      </span>
      <style>{`
        @keyframes pagerInboxScroll {
          0%   { transform: translateX(60%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

export default function PagerInboxPanel({ open, onOpenChange, user }) {
  const orgId   = getOrgId();
  const userId  = user?.id;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const seenKey = `pager_last_seen_${userId}`;

  // Snapshot the "last seen" time at mount so new-message badges reflect state at open time
  const [seenAt] = useState(() => localStorage.getItem(seenKey) || '1970-01-01T00:00:00Z');

  // Mark all current messages as seen when the panel opens
  useEffect(() => {
    if (open) localStorage.setItem(seenKey, new Date().toISOString());
  }, [open]);

  const { data: messages = [] } = useQuery({
    queryKey: ['pagerInbox', orgId, userId],
    queryFn: async () => {
      if (!userId || !orgId) return [];
      const { data } = await supabase
        .from('pager_messages')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      // Keep only messages addressed to this user (exclude own sends)
      return (data || []).filter(msg => {
        if (msg.sent_by === userId) return false;
        return (
          msg.recipient_mode === 'global' ||
          msg.recipient_mode === 'area'   ||
          (msg.recipient_mode === 'individual' && msg.recipient_id === userId)
        );
      });
    },
    enabled: !!userId && !!orgId,
    refetchInterval: open ? 8000 : false,
  });

  const latestMsg  = messages[0] || null;
  const unreadCount = messages.filter(m => m.created_at > seenAt).length;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`w-full p-0 flex flex-col bg-white overflow-hidden ${isAdmin ? 'sm:w-[480px]' : 'sm:w-80'}`}>

        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
          <SheetTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            Pager Inbox
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">

          {/* ── Admin compose section ── */}
          {isAdmin && (
            <div className="px-4 pt-4 pb-2 border-b border-slate-100">
              <PagerPanel user={user} />
            </div>
          )}

          {/* ── Pager device showing latest message (staff only — admin already has compose pager above) ── */}
          {!isAdmin && <div className="px-5 pt-4 pb-3">
            <div className="relative select-none">
              <PagerSvg className="w-full drop-shadow-md" />

              {/* LCD overlay */}
              <div
                className="absolute flex flex-col overflow-hidden"
                style={{ top: '12.94%', left: '12.73%', right: '12.73%', height: '52.35%' }}
              >
                {latestMsg ? (
                  <>
                    <LcdTicker text={latestMsg.message} />
                    <div className="text-right text-[9px] text-slate-500 pr-1.5 pb-0.5 font-mono shrink-0">
                      FROM: {latestMsg.sent_by_name}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px] font-mono text-slate-500 tracking-widest">NO MESSAGES</span>
                  </div>
                )}
              </div>
            </div>
          </div>}

          {/* ── Message list ── */}
          <div className="px-4 pb-6 space-y-2">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No pages received yet</p>
            ) : (
              messages.map(msg => {
                const isNew = msg.created_at > seenAt;
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isNew
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <p className="text-sm font-mono text-slate-800 leading-snug break-words">
                      {msg.message}
                    </p>
                    <div className="flex items-start justify-between gap-2 mt-1.5 flex-wrap">
                      <p className="text-[10px] text-slate-500">
                        <span className="font-medium">{msg.sent_by_name}</span>
                        {' · '}
                        {msg.recipient_mode === 'global'
                          ? 'All staff'
                          : msg.recipient_mode === 'area'
                          ? msg.recipient_area_name
                          : 'You'}
                      </p>
                      <p className="text-[10px] text-slate-400 shrink-0">
                        {format(new Date(msg.created_at), 'dd MMM HH:mm')}
                      </p>
                    </div>
                    {isNew && (
                      <span className="inline-block mt-1 text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </SheetContent>
    </Sheet>

    {/* Fixed close tab — always reachable on the left edge of the screen */}
    {open && (
      <button
        onClick={() => onOpenChange(false)}
        className="fixed left-0 top-24 z-[99999] bg-red-600 text-white py-4 px-2 rounded-r-xl shadow-xl hover:bg-red-700 active:bg-red-800 touch-manipulation"
        aria-label="Close pager"
      >
        <X className="w-5 h-5" />
      </button>
    )}
    </>
  );
}
