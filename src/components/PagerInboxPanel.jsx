import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { CheckCircle, X, Volume2 } from 'lucide-react';
import PagerSvg from '@/components/PagerSvg';
import PagerPanel from '@/components/admin/PagerPanel';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

const SHAKE_CSS = `
  @keyframes alerterVibrate {
    0%,100% { transform: translateX(0) rotate(0deg); }
    10%      { transform: translateX(-5px) rotate(-0.6deg); }
    20%      { transform: translateX(5px)  rotate(0.6deg);  }
    30%      { transform: translateX(-5px) rotate(-0.6deg); }
    40%      { transform: translateX(5px)  rotate(0.6deg);  }
    50%      { transform: translateX(-4px) rotate(0deg);    }
    60%      { transform: translateX(4px)  rotate(0deg);    }
    70%      { transform: translateX(-2px) rotate(0deg);    }
    80%      { transform: translateX(2px)  rotate(0deg);    }
    90%      { transform: translateX(-1px) rotate(0deg);    }
  }
  @keyframes pagerInboxScroll {
    0%   { transform: translateX(60%); }
    100% { transform: translateX(-100%); }
  }
`;

function LcdTicker({ text }) {
  return (
    <div className="overflow-hidden w-full h-full flex items-center">
      <span
        className="whitespace-nowrap text-slate-700 text-xs font-mono font-semibold"
        style={{ display: 'inline-block', animation: 'pagerInboxScroll 9s linear infinite' }}
      >
        {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
      </span>
    </div>
  );
}

function loadDismissed(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export default function PagerInboxPanel({ open, onOpenChange, user, incomingAlert, onAlertSilenced }) {
  const orgId   = getOrgId();
  const userId  = user ? user.id : null;
  const isAdmin = user ? (user.role === 'admin' || user.role === 'super_admin') : false;
  const seenKey      = 'pager_last_seen_' + userId;
  const dismissedKey = 'pager_dismissed_' + userId;

  const [seenAt]        = useState(() => localStorage.getItem(seenKey) || '1970-01-01T00:00:00Z');
  const [dismissedIds, setDismissedIds] = useState(() => loadDismissed(dismissedKey));
  const [alerting,     setAlerting]     = useState(false);
  const [silenced,     setSilenced]     = useState(false);
  const [alertMsg,     setAlertMsg]     = useState(null);
  const [needsGesture, setNeedsGesture] = useState(false);
  const audioRef = useRef(null);

  const dismissOne = (id) => {
    const next = dismissedIds.concat([id]);
    setDismissedIds(next);
    try { localStorage.setItem(dismissedKey, JSON.stringify(next)); } catch (e) {}
  };

  const dismissAll = (msgs) => {
    const lookup = {};
    dismissedIds.forEach((i) => { lookup[i] = true; });
    msgs.forEach((m) => { lookup[m.id] = true; });
    const next = Object.keys(lookup);
    setDismissedIds(next);
    try { localStorage.setItem(dismissedKey, JSON.stringify(next)); } catch (e) {}
  };

  // Mark seen when panel opens MANUALLY (no incoming alert).
  // When opened from a push notification (incomingAlert is set), do NOT update seenAt
  // here — the on-load check in GlobalPagerMonitor needs the original seenAt to find
  // the unread alert. seenAt is updated on acknowledge() instead.
  useEffect(() => {
    if (open && !incomingAlert) {
      try { localStorage.setItem(seenKey, new Date().toISOString()); } catch (e) {}
    }
  }, [open, incomingAlert]);

  // Trigger alert state when incomingAlert changes
  useEffect(() => {
    if (!incomingAlert || !open) return;
    setSilenced(false);
    setNeedsGesture(false);
    setAlerting(true);
    if (typeof incomingAlert === 'object') setAlertMsg(incomingAlert);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — set flag so tapping the pager starts audio
        setNeedsGesture(true);
      });
    }

    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300, 100, 300]);
  }, [incomingAlert, open]);

  // When panel closes, silence everything
  useEffect(() => {
    if (!open) {
      setAlerting(false);
      setSilenced(false);
      setNeedsGesture(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      if (navigator.vibrate) navigator.vibrate(0);
      window.dispatchEvent(new CustomEvent('alerter:silence'));
    }
  }, [open]);

  const silence = () => {
    setAlerting(false);
    setSilenced(true);
    setNeedsGesture(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (navigator.vibrate) navigator.vibrate(0);
    window.dispatchEvent(new CustomEvent('alerter:silence'));
  };

  const acknowledge = () => {
    silence();
    setSilenced(false);
    setAlertMsg(null);
    // Mark all messages seen now that the user has acknowledged the alert
    try { localStorage.setItem(seenKey, new Date().toISOString()); } catch (e) {}
    if (onAlertSilenced) onAlertSilenced();
  };

  const dismissPanel = () => {
    acknowledge();
    onOpenChange(false);
  };

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
      const userAreaId = user ? (user.rota_area_id || user.area_id) : null;
      return (data || []).filter((msg) => {
        // Always show messages individually addressed to this user, even if they sent it
        const directlyAddressed = msg.recipient_mode === 'individual' && msg.recipient_id === userId;
        // Otherwise, skip messages this user sent (they're in the sent log, not the inbox)
        if (msg.sent_by === userId && !directlyAddressed) return false;
        return (
          msg.recipient_mode === 'global' ||
          (msg.recipient_mode === 'area' && msg.recipient_area_id === userAreaId) ||
          directlyAddressed
        );
      });
    },
    enabled: !!userId && !!orgId,
    refetchInterval: open ? 8000 : false,
  });

  // When deep-linking in, set alertMsg to latest message once messages load
  useEffect(() => {
    if (incomingAlert === 'deeplink' && messages.length > 0 && !alertMsg) {
      setAlertMsg(messages[0]);
    }
  }, [incomingAlert, messages, alertMsg]);

  // Fast O(1) dismissed lookup using plain object
  const dismissedLookup = {};
  dismissedIds.forEach((id) => { dismissedLookup[id] = true; });

  const visibleMessages = messages.filter((m) => !dismissedLookup[m.id]);
  const unreadCount = visibleMessages.filter((m) => m.created_at > seenAt).length;
  const latestMsg = alertMsg || visibleMessages[0] || null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`w-full p-0 flex flex-col bg-white overflow-hidden ${isAdmin ? 'sm:w-[480px]' : 'sm:w-80'}`}>
        <style>{SHAKE_CSS}</style>
        <audio ref={audioRef} src="/pager.mp3" preload="auto" loop />

        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            Alerter Inbox
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            {alerting && (
              <span className="ml-auto text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
                ● INCOMING
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">


          {/* Admin compose */}
          {isAdmin && !alerting && (
            <div className="px-4 pt-4 pb-2 border-b border-slate-100">
              <PagerPanel user={user} />
            </div>
          )}

          {/* Pager device — staff view or alerting mode */}
          {(!isAdmin || alerting) && (
            <div className="px-5 pt-4 pb-3">
              <div
                className="relative select-none"
                style={alerting ? { animation: 'alerterVibrate 0.35s ease-in-out infinite', cursor: 'pointer' } : {}}
                onClick={alerting ? (needsGesture ? () => {
                  // First tap: browser blocked autoplay — use this gesture to start audio
                  setNeedsGesture(false);
                  if (audioRef.current) audioRef.current.play().catch(() => {});
                } : silence) : undefined}
                title={alerting ? (needsGesture ? 'Tap to enable sound' : 'Tap to silence') : undefined}
              >
                <PagerSvg className="w-full drop-shadow-md" />

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

                {alerting && !needsGesture && (
                  <div className="absolute inset-0 flex items-end justify-center pb-[8%]">
                    <span className="text-[9px] font-bold text-red-600 bg-white/80 px-2 py-0.5 rounded-full animate-pulse">
                      TAP TO SILENCE
                    </span>
                  </div>
                )}
                {alerting && needsGesture && (
                  <div className="absolute inset-0 flex items-end justify-center pb-[8%]">
                    <span className="text-[9px] font-bold text-amber-700 bg-white/90 px-2 py-0.5 rounded-full animate-pulse">
                      TAP TO ENABLE SOUND
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acknowledge / Dismiss after silencing */}
          {silenced && alertMsg && (
            <div className="px-5 pb-4 space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm font-mono text-slate-800 leading-snug break-words">{alertMsg.message}</p>
                <p className="text-xs text-slate-500 mt-1">From: {alertMsg.sent_by_name}</p>
              </div>
              <button
                onClick={acknowledge}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Acknowledge
              </button>
              <button
                onClick={dismissPanel}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Dismiss
              </button>
            </div>
          )}

          {/* Message list */}
          {!alerting && (
            <div className="px-4 pb-6 space-y-2">
              {visibleMessages.length > 0 && (
                <div className="flex justify-end pb-1">
                  <button
                    onClick={() => dismissAll(visibleMessages)}
                    className="text-[10px] text-slate-400 hover:text-red-500 font-medium underline underline-offset-2 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
              {visibleMessages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No alerts received yet</p>
              ) : (
                visibleMessages.map((msg) => {
                  const isNew = msg.created_at > seenAt;
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl border relative ${isNew ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <button
                        onClick={() => dismissOne(msg.id)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors"
                        aria-label="Clear alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-sm font-mono text-slate-800 leading-snug break-words pr-5">{msg.message}</p>
                      <div className="flex items-start justify-between gap-2 mt-1.5 flex-wrap">
                        <p className="text-[10px] text-slate-500">
                          <span className="font-medium">{msg.sent_by_name}</span>
                          {' · '}
                          {msg.recipient_mode === 'global' ? 'All staff' :
                           msg.recipient_mode === 'area'   ? msg.recipient_area_name : 'You'}
                        </p>
                        <p className="text-[10px] text-slate-400 shrink-0">
                          {format(new Date(msg.created_at), 'dd MMM HH:mm')}
                        </p>
                      </div>
                      {isNew && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-amber-600 uppercase tracking-wider">New</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
