import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShiftCallApi } from '@/api/rotaApi';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Clock, Play, Timer, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';

function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    [0, 600, 1200].forEach(delay => {
      setTimeout(() => {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      }, delay);
    });
  } catch (e) {}
}

export default function OverdueCallAlert({ userId }) {
  const [overdueCalls, setOverdueCalls] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [reportingDelay, setReportingDelay] = useState(false);
  const [removingCall, setRemovingCall] = useState(false);
  const [externalSuppress, setExternalSuppress] = useState(false);
  const audioInterval = useRef(null);
  const queryClient = useQueryClient();

  const checkForOverdueCalls = async () => {
    if (!userId) return;
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const cutoff = new Date(now.getTime() - 15 * 60 * 1000);
      const cutoffTime = `${String(cutoff.getHours()).padStart(2, '0')}:${String(cutoff.getMinutes()).padStart(2, '0')}`;

      // Check for late shift clock-on (not yet clocked in, 15+ min past start time)
      const { data: lateShifts } = await supabase
        .from('shifts')
        .select('id, start_time, staff_name')
        .eq('staff_id', userId)
        .eq('date', today)
        .eq('status', 'scheduled')
        .is('clock_in_time', null)
        .lt('start_time', cutoffTime)
        .or(`delay_until.is.null,delay_until.lt.${now.toISOString()}`);

      // Map late shifts to the same shape as calls for unified display
      const shiftAlerts = (lateShifts || []).map(s => ({
        id: `shift-${s.id}`,
        shift_id: s.id,
        _type: 'shift_start',
        service_user_name: 'Shift Clock-On',
        scheduled_time: s.start_time,
        delay_until: null,
      }));

      // Check for overdue pending calls
      const { data: myShifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('staff_id', userId)
        .eq('date', today)
        .in('status', ['scheduled', 'in_progress']);

      let callAlerts = [];
      if (myShifts?.length) {
        // Don't fire overdue call alerts while staff is actively in a call — let them finish
        const { data: activeCall } = await supabase
          .from('shift_calls')
          .select('id')
          .in('shift_id', myShifts.map(s => s.id))
          .eq('status', 'in_progress')
          .not('clock_in_time', 'is', null)
          .is('clock_out_time', null)
          .limit(1);

        if (!activeCall?.length) {
          const { data: calls } = await supabase
            .from('shift_calls')
            .select('*')
            .in('shift_id', myShifts.map(s => s.id))
            .eq('status', 'pending')
            .eq('call_date', today)
            .lt('scheduled_time', cutoffTime)
            .or(`delay_until.is.null,delay_until.lt.${now.toISOString()}`);
          callAlerts = (calls || []).map(c => ({ ...c, _type: 'call' }));
        }
      }

      const found = [...shiftAlerts, ...callAlerts];

      // Un-dismiss items where a delay has now expired
      if (found.length > 0) {
        setDismissedIds(prev => {
          const next = new Set(prev);
          found.forEach(c => {
            if (c.delay_until && new Date(c.delay_until) < now) next.delete(c.id);
          });
          return next;
        });
      }

      setOverdueCalls(found);
    } catch (e) {
      console.warn('OverdueCallAlert check failed:', e);
    }
  };

  useEffect(() => {
    checkForOverdueCalls();
    const interval = setInterval(checkForOverdueCalls, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const suppress = () => setExternalSuppress(true);
    const unsuppress = () => { setExternalSuppress(false); checkForOverdueCalls(); };
    window.addEventListener('suppress-overdue-alert', suppress);
    window.addEventListener('unsuppress-overdue-alert', unsuppress);
    return () => {
      window.removeEventListener('suppress-overdue-alert', suppress);
      window.removeEventListener('unsuppress-overdue-alert', unsuppress);
    };
  }, []);

  const visibleCalls = overdueCalls.filter(c => !dismissedIds.has(c.id));

  useEffect(() => {
    clearInterval(audioInterval.current);
    if (visibleCalls.length > 0) {
      playAlertSound();
      audioInterval.current = setInterval(playAlertSound, 15000);
    }
    return () => clearInterval(audioInterval.current);
  }, [visibleCalls.length]);

  if (!visibleCalls.length || externalSuppress) return null;

  const call = visibleCalls[0];

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      if (call._type === 'shift_start') {
        // Clock on to the shift itself
        await supabase
          .from('shifts')
          .update({ clock_in_time: new Date().toISOString(), status: 'in_progress', overdue_alert_sent_at: new Date().toISOString() })
          .eq('id', call.shift_id);
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        toast.success('Clocked on — open your shift to begin calls');
      } else {
        await ShiftCallApi.update(call.id, {
          clock_in_time: new Date().toISOString(),
          status: 'in_progress',
          overdue_alert_sent_at: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
        toast.success('Checked in — head to your shift for the care log');
      }
      setDismissedIds(prev => new Set([...prev, call.id]));
    } catch (e) {
      toast.error('Check-in failed — please try from the shift page');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleReportDelay = async () => {
    if (!delayMinutes || parseInt(delayMinutes) < 1) return;
    setReportingDelay(true);
    try {
      const mins = parseInt(delayMinutes);
      const delayUntil = new Date(Date.now() + mins * 60 * 1000).toISOString();

      if (call._type === 'shift_start') {
        await supabase
          .from('shifts')
          .update({ delay_until: delayUntil, overdue_alert_sent_at: new Date().toISOString() })
          .eq('id', call.shift_id);
      } else {
        await ShiftCallApi.update(call.id, {
          delay_until: delayUntil,
          overdue_alert_sent_at: new Date().toISOString(),
        });
      }

      const { data: shift } = await supabase
        .from('shifts')
        .select('staff_name, rota_area_id, area_id, paired_shift_id, staff_id, organization_id')
        .eq('id', call.shift_id)
        .single();

      const delayTitle = call._type === 'shift_start'
        ? `⏱ Late shift start`
        : `⏱ Delayed check-in: ${call.service_user_name}`;
      const delayMsg = call._type === 'shift_start'
        ? `Staff is running ${mins} minutes late starting their ${call.scheduled_time} shift.`
        : `Staff is running ${mins} minutes late to ${call.service_user_name}'s ${call.scheduled_time} call.`;
      notifyAdminsOfActivity({
        title: delayTitle,
        message: `${shift?.staff_name || 'Staff'} — ${delayMsg}`,
        excludeUserId: userId,
        areaId: shift?.rota_area_id || shift?.area_id,
      });

      if (shift?.paired_shift_id) {
        const { data: pairedShift } = await supabase
          .from('shifts')
          .select('staff_id')
          .eq('id', shift.paired_shift_id)
          .single();
        if (pairedShift?.staff_id) {
          base44.functions.invoke('createNotification', {
            recipient_ids: [pairedShift.staff_id],
            type: 'shift_activity',
            title: call._type === 'shift_start' ? `Partner running late` : `Partner delayed: ${call.service_user_name}`,
            message: `${shift?.staff_name || 'Your partner'} — ${delayMsg}`,
            priority: 'high',
            action_url: '/Rota',
            send_push: true,
          }).catch(e => console.warn('Partner delay notification failed:', e));
        }
      }

      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
      setDismissedIds(prev => new Set([...prev, call.id]));
      setShowDelayDialog(false);
      setDelayMinutes('');
      toast.success(`Delay of ${mins} minutes reported — you'll be re-alerted when it expires`);
    } catch (e) {
      toast.error('Failed to report delay');
    } finally {
      setReportingDelay(false);
    }
  };

  const handleNotMyCall = async () => {
    if (call._type !== 'call') return;
    setRemovingCall(true);
    try {
      await ShiftCallApi.update(call.id, { status: 'missed' });
      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
      setDismissedIds(prev => new Set([...prev, call.id]));
      toast.success('Call removed from your list — an admin has been notified');
      notifyAdminsOfActivity({
        title: `Call removed: ${call.service_user_name}`,
        message: `Staff reported ${call.service_user_name}'s ${call.scheduled_time} call is not theirs and it has been flagged as missed.`,
        excludeUserId: userId,
      });
    } catch (e) {
      toast.error('Failed to remove call');
    } finally {
      setRemovingCall(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-red-950/80 flex items-end sm:items-center justify-center p-4 pb-safe">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Red header */}
        <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {call._type === 'shift_start' ? 'Late Shift Start' : 'Possible Missed Call'}
            </h3>
            <p className="text-red-100 text-xs">Immediate action required</p>
          </div>
          {visibleCalls.length > 1 && (
            <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
              +{visibleCalls.length - 1} more
            </span>
          )}
        </div>

        <div className="p-5">
          {/* Call info */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
            <p className="font-semibold text-slate-900 text-base">
              {call._type === 'shift_start' ? 'Your shift was due to start' : call.service_user_name}
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {call._type === 'shift_start' ? `Start time: ${call.scheduled_time}` : `Scheduled: ${call.scheduled_time}`}
            </p>
          </div>

          {!showDelayDialog ? (
            <div className="space-y-2">
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                {checkingIn ? 'Clocking on...' : call._type === 'shift_start' ? 'Clock On Now' : 'Check In Now'}
              </Button>
              <Button
                onClick={() => setShowDelayDialog(true)}
                variant="outline"
                className="w-full h-12 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
              >
                <Timer className="w-5 h-5 mr-2" />
                Report a Delay
              </Button>
              {call._type === 'call' && (
                <Button
                  onClick={handleNotMyCall}
                  disabled={removingCall}
                  variant="outline"
                  className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 font-semibold disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  {removingCall ? 'Removing...' : 'Not My Call'}
                </Button>
              )}
              <button
                onClick={() => setDismissedIds(prev => new Set([...prev, call.id]))}
                className="w-full py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors"
              >
                Dismiss temporarily
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">How many minutes are you delayed?</p>
              <div className="grid grid-cols-4 gap-2">
                {['10', '15', '20', '30'].map(m => (
                  <button
                    key={m}
                    onClick={() => setDelayMinutes(m)}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      delayMinutes === m
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder="Or enter custom minutes..."
                min="1"
                max="120"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReportDelay}
                  disabled={!delayMinutes || parseInt(delayMinutes) < 1 || reportingDelay}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 h-11 font-semibold disabled:opacity-50"
                >
                  {reportingDelay ? 'Reporting...' : 'Confirm Delay'}
                </Button>
                <Button
                  onClick={() => { setShowDelayDialog(false); setDelayMinutes(''); }}
                  variant="outline"
                  className="flex-1 h-11"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
