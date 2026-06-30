import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Users, User, MapPin, CheckCircle } from 'lucide-react';
import PagerSvg from '@/components/PagerSvg';

const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

function playPageSentBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (startTime, freq) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };
    beep(ctx.currentTime,        880);
    beep(ctx.currentTime + 0.22, 1100);
    setTimeout(() => ctx.close(), 800);
  } catch (e) {}
}

const MODES = [
  { key: 'global',     label: 'All Staff',  Icon: Users  },
  { key: 'area',       label: 'By Area',    Icon: MapPin },
  { key: 'individual', label: 'Individual', Icon: User   },
];

const LCD = { top: '12.94%', left: '12.73%', right: '12.73%', height: '52.35%' };

export default function PagerPanel({ user }) {
  const queryClient = useQueryClient();
  const orgId = getOrgId();

  const [message,       setMessage]       = useState('');
  const [recipientMode, setRecipientMode] = useState('global');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedArea,  setSelectedArea]  = useState('');
  const [justSent,      setJustSent]      = useState(false);

  const showControls = message.length > 0;

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: async () => {
      const { data } = await supabase.from('rota_areas').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: sentMessages = [] } = useQuery({
    queryKey: ['pagerMessages', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pager_messages')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const staffMember = staff.find(s => s.id === selectedStaff);
      const area        = areas.find(a => a.id === selectedArea);
      const { error } = await supabase.from('pager_messages').insert([{
        organization_id:     orgId,
        message:             message.trim(),
        recipient_mode:      recipientMode,
        recipient_id:        recipientMode === 'individual' ? selectedStaff          : null,
        recipient_name:      recipientMode === 'individual' ? staffMember?.full_name  : null,
        recipient_area_id:   recipientMode === 'area'       ? selectedArea            : null,
        recipient_area_name: recipientMode === 'area'       ? area?.name              : null,
        sent_by:             user?.id        || '',
        sent_by_name:        user?.full_name || 'Admin',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      playPageSentBeep();
      setMessage('');
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['pagerMessages'] });
    },
  });

  const canSend =
    message.trim().length > 0 &&
    (recipientMode === 'global' ||
     (recipientMode === 'individual' && selectedStaff) ||
     (recipientMode === 'area'       && selectedArea));

  const recipientLabel =
    recipientMode === 'global'     ? 'All Staff' :
    recipientMode === 'area'       ? (areas.find(a => a.id === selectedArea)?.name || 'pick area…') :
    (staff.find(s => s.id === selectedStaff)?.full_name || 'pick staff…');

  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* ── Pager device ── */}
      <div className="relative select-none" style={{ isolation: 'isolate' }}>
        <PagerSvg className="w-full drop-shadow-xl" />

        {/* LCD textarea overlay */}
        <div className="absolute flex flex-col overflow-hidden" style={LCD}>
          {justSent ? (
            <div className="flex flex-col items-center justify-center h-full">
              <CheckCircle className="w-7 h-7 text-green-700 mb-1" />
              <span className="text-xs font-bold font-mono text-green-800 tracking-widest">ALERT SENT</span>
            </div>
          ) : (
            <textarea
              className="w-full flex-1 bg-transparent text-slate-700 text-sm resize-none px-2 pt-2 focus:outline-none font-mono placeholder-slate-500 leading-snug"
              placeholder="Type your alert message…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={200}
            />
          )}
          <div className="text-right text-[9px] text-slate-500 pr-1.5 pb-0.5 font-mono shrink-0">
            TO: {recipientLabel}&nbsp;|&nbsp;{message.length}/200
          </div>
        </div>

        {/* ── Controls — slides up inside the pager body when typing ── */}
        <div
          className="absolute rounded-b-[7%] rounded-t-2xl"
          style={{
            left: '7%', right: '7%', bottom: '6%',
            transform: showControls ? 'translateY(0)' : 'translateY(110%)',
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? 'auto' : 'none',
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
            background: '#1a1a1a',
            padding: '10px 12px 14px',
            zIndex: 10,
          }}
        >
          {/* Recipient mode tabs */}
          <div className="flex gap-1.5 mb-2">
            {MODES.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setRecipientMode(key)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold flex-1 justify-center transition-all ${
                  recipientMode === key
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {recipientMode === 'individual' && (
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8 mb-2">
                <SelectValue placeholder="Select staff member…" />
              </SelectTrigger>
              <SelectContent>
                {staff.filter(s => s.is_active !== false).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {recipientMode === 'area' && (
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8 mb-2">
                <SelectValue placeholder="Select rota area…" />
              </SelectTrigger>
              <SelectContent>
                {areas.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <button
            onClick={() => canSend && sendMutation.mutate()}
            disabled={!canSend || sendMutation.isPending}
            className={`w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${
              canSend && !sendMutation.isPending
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            {sendMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : justSent
              ? <CheckCircle className="w-4 h-4" />
              : <Send className="w-4 h-4" />}
            {justSent ? 'Sent!' : 'Send Alert'}
          </button>

          {sendMutation.isError && (
            <p className="text-[10px] text-red-400 text-center mt-1">Failed — try again.</p>
          )}
        </div>
      </div>

      {/* ── Sent message log ── */}
      {sentMessages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Recent alerts</p>
          {sentMessages.map(msg => (
            <Card key={msg.id} className="p-3 bg-white border-0 shadow-sm">
              <p className="text-sm text-slate-800 font-mono leading-snug break-words">{msg.message}</p>
              <p className="text-xs text-slate-500 mt-1">
                To:{' '}
                <span className="font-medium text-slate-600">
                  {msg.recipient_mode === 'global'     ? 'All Staff'             :
                   msg.recipient_mode === 'area'       ? msg.recipient_area_name :
                   msg.recipient_name}
                </span>
                {' · '}{format(new Date(msg.created_at), 'dd MMM HH:mm')}
                {' · '}<span className="text-slate-400">by {msg.sent_by_name}</span>
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
