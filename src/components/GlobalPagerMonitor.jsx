import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle } from 'lucide-react';
import PagerSvg from '@/components/PagerSvg';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

// Scrolling ticker text inside the LCD
function LcdTicker({ text }) {
  return (
    <div className="overflow-hidden w-full h-full flex items-center" style={{ fontFamily: 'monospace' }}>
      <span
        className="whitespace-nowrap text-slate-700 text-sm font-mono font-semibold"
        style={{
          display: 'inline-block',
          animation: 'pagerScroll 8s linear infinite',
        }}
      >
        {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
      </span>
      <style>{`
        @keyframes pagerScroll {
          0%   { transform: translateX(60%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

export default function GlobalPagerMonitor() {
  const { user, isAuthenticated } = useAuth();
  const [incomingPage, setIncomingPage] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const audioRef = useRef(null);
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const orgId = getOrgId();
    const channel = supabase
      .channel('global-pager-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pager_messages' },
        (payload) => {
          const msg = payload.new;
          // Ignore own messages and wrong org
          if (msg.organization_id !== orgId) return;
          if (seenRef.current.has(msg.id)) return;
          if (msg.sent_by === user.id) return;
          seenRef.current.add(msg.id);

          // Check if this page is addressed to this user
          const userAreaId = user.rota_area_id || user.area_id;
          const addressed =
            msg.recipient_mode === 'global' ||
            (msg.recipient_mode === 'area' && msg.recipient_area_id && msg.recipient_area_id === userAreaId) ||
            (msg.recipient_mode === 'individual' && msg.recipient_id === user.id);

          if (!addressed) return;

          setIncomingPage(msg);
          setDismissed(false);

          // Play pager sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, user?.id]);

  const dismiss = () => {
    setDismissed(true);
    if (audioRef.current) audioRef.current.pause();
    setTimeout(() => { setIncomingPage(null); setDismissed(false); }, 300);
  };

  return (
    <>
      <audio ref={audioRef} src="/pager.mp3" preload="auto" loop />

      {incomingPage && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
            dismissed ? 'opacity-0 scale-95' : 'opacity-100'
          }`}
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={dismiss}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Pager device */}
            <div className="relative select-none">
              <PagerSvg className="w-full drop-shadow-2xl" />

              {/* LCD — scrolling message */}
              <div
                className="absolute flex flex-col overflow-hidden"
                style={{ top: '12.94%', left: '12.73%', right: '12.73%', height: '52.35%' }}
              >
                <LcdTicker text={incomingPage.message} />
                <div className="text-right text-[9px] text-slate-500 pr-1.5 pb-0.5 font-mono shrink-0">
                  FROM: {incomingPage.sent_by_name}
                  {incomingPage.recipient_mode !== 'global' && incomingPage.recipient_mode !== 'individual' && (
                    <>&nbsp;· {incomingPage.recipient_area_name}</>
                  )}
                </div>
              </div>

              {/* Green button = acknowledge */}
              <button
                onClick={dismiss}
                title="Acknowledge"
                className="absolute rounded opacity-0 hover:opacity-20 bg-green-400 transition-opacity cursor-pointer"
                style={{ top: '65%', left: '15%', width: '13%', height: '13%' }}
              />
            </div>

            {/* Acknowledge button */}
            <button
              onClick={dismiss}
              className="mt-3 w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Acknowledge Page
            </button>

            {/* Who sent it */}
            <p className="text-center text-xs text-white/60 mt-2">
              {incomingPage.recipient_mode === 'global'
                ? 'Sent to all staff'
                : incomingPage.recipient_mode === 'area'
                ? `Sent to ${incomingPage.recipient_area_name || 'your area'}`
                : 'Sent directly to you'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
