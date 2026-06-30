import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, UserCheck, Search, X, Repeat2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyClaimCreated } from '@/utils/shiftClaimNotifications';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const RECURRENCE_OPTIONS = [
  { mode: 'single',   label: 'One-off',        desc: 'Just this shift' },
  { mode: 'weekly',   label: 'Every week',      desc: 'Same day every week' },
  { mode: 'biweekly', label: 'Every 2 weeks',   desc: 'Same day every fortnight' },
  { mode: '3weekly',  label: 'Every 3 weeks',   desc: 'Same day every 3 weeks' },
  { mode: '4weekly',  label: 'Every 4 weeks',   desc: 'Same day every 4 weeks' },
];

const INTERVAL_MAP = { weekly: 7, biweekly: 14, '3weekly': 21, '4weekly': 28 };

export default function ClaimShiftModal({ shift, open, onClose, isAdmin = false }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [allocateStaffId, setAllocateStaffId] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [pendingStaffId, setPendingStaffId] = useState(null);
  const [selfClaimRecurrenceOpen, setSelfClaimRecurrenceOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingClaims = [] } = useQuery({
    queryKey: ['myClaimsForShift', shift?.id, user?.id],
    queryFn: () => base44.entities.ShiftClaimRequest.filter({
      shift_id: shift?.id,
      staff_id: user?.id,
      status: 'pending',
    }),
    enabled: !!shift?.id && !!user?.id,
  });

  const hasPendingClaim = existingClaims.length > 0;

  const { data: allStaff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  async function propagateToFutureBlankShifts(staffId, staffName, mode) {
    if (mode === 'single' || !shift.shift_pattern_id) return;
    const intervalDays = INTERVAL_MAP[mode];
    const { data: futureShifts } = await supabase
      .from('shifts')
      .select('id, date')
      .eq('shift_pattern_id', shift.shift_pattern_id)
      .gt('date', shift.date)
      .is('staff_id', null);
    if (!futureShifts || futureShifts.length === 0) return;
    const shiftDayOfWeek = new Date(shift.date + 'T12:00:00').getDay();
    const baseTime = new Date(shift.date + 'T12:00:00').getTime();
    const toUpdate = futureShifts
      .filter(s => new Date(s.date + 'T12:00:00').getDay() === shiftDayOfWeek)
      .filter(s => {
        const days = Math.round((new Date(s.date + 'T12:00:00').getTime() - baseTime) / 86400000);
        return days % intervalDays === 0;
      });
    if (toUpdate.length > 0) {
      await supabase.from('shifts')
        .update({ staff_id: staffId, staff_name: staffName, status: 'scheduled' })
        .in('id', toUpdate.map(s => s.id));
    }
  }

  const allocateMutation = useMutation({
    mutationFn: async ({ staffId, mode = 'single' }) => {
      const staffMember = allStaff.find(s => s.id === staffId);
      const staffName = staffMember?.staff_full_name || staffMember?.full_name || '';
      await ShiftApi.update(shift.id, { staff_id: staffId, staff_name: staffName, status: 'scheduled' });
      await propagateToFutureBlankShifts(staffId, staffName, mode);
      return staffMember;
    },
    onSuccess: (staffMember) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftClaimRequests'] });
      toast.success(`Shift allocated to ${staffMember?.staff_full_name || staffMember?.full_name}`);
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Failed to allocate shift'),
  });

  const claimMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.ShiftClaimRequest.create(data);
      notifyClaimCreated({ claim: data, areaId: shift.rota_area_id || shift.area_id });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftClaimRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingClaims'] });
      queryClient.invalidateQueries({ queryKey: ['myClaimRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myClaimsForShift'] });
      onClose();
    },
    onError: (e) => console.error('Claim failed:', e),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async () => {
      const calls = await ShiftCallApi.filter({ shift_id: shift.id });
      for (const call of calls) await ShiftCallApi.delete(call.id);
      return ShiftApi.update(shift.id, {
        staff_id: null,
        staff_name: null,
        paired_shift_id: null,
        paired_staff_name: null,
        shift_pattern_id: null,
        is_base_shift: true,
        status: 'scheduled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Shift cleared — now available to claim');
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to clear shift'),
  });

  const adminClaimMutation = useMutation({
    mutationFn: async ({ mode = 'single' } = {}) => {
      const staffId = user.id;
      const staffName = user.staff_full_name || user.full_name;
      await ShiftApi.update(shift.id, { staff_id: staffId, staff_name: staffName, status: 'scheduled' });
      await propagateToFutureBlankShifts(staffId, staffName, mode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Shift claimed and approved');
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Failed to claim shift'),
  });

  const handleSubmit = () => {
    if (!user) return;
    claimMutation.mutate({
      shift_id: shift.id,
      staff_id: user.id,
      staff_name: user.staff_full_name || user.full_name,
      shift_date: shift.date,
      shift_time: `${shift.start_time} - ${shift.end_time}`,
      shift_name: shift.shift_name || null,
      area_id: shift.rota_area_id || shift.area_id || null,
      reason: reason || null,
      status: 'pending',
    });
  };

  const handleAllocateClick = () => {
    if (!allocateStaffId) return;
    setPendingStaffId(allocateStaffId);
    setRecurrenceDialogOpen(true);
  };

  const handleAllocateChoice = (mode) => {
    setRecurrenceDialogOpen(false);
    allocateMutation.mutate({ staffId: pendingStaffId, mode });
  };

  const handleSelfClaimChoice = (mode) => {
    setSelfClaimRecurrenceOpen(false);
    adminClaimMutation.mutate({ mode });
  };

  const areaName = shift?.rota_area_name || shift?.area_name || '';
  const selectedMember = allStaff.find(s => s.id === allocateStaffId);
  const filtered = allStaff.filter(s =>
    (s.staff_full_name || s.full_name || '').toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Available Shift</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-600 font-medium">Shift Details</p>
              {shift?.shift_name && (
                <p className="font-medium text-slate-900">{shift.shift_name}</p>
              )}
              <p className="text-sm text-slate-600">
                {shift?.date} &bull; {shift?.start_time} - {shift?.end_time}
              </p>
              {areaName && <p className="text-xs text-slate-500 mt-1">{areaName}</p>}
            </div>

            {isAdmin && (
              <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-teal-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Allocate to Staff
                </p>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={e => { setStaffSearch(e.target.value); setAllocateStaffId(''); }}
                    placeholder="Search by name…"
                    className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  {staffSearch && (
                    <button onClick={() => { setStaffSearch(''); setAllocateStaffId(''); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {staffSearch && !allocateStaffId && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 text-center">No staff found</p>
                    ) : filtered.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setAllocateStaffId(s.id); setStaffSearch(s.staff_full_name || s.full_name); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50 transition-colors font-medium text-slate-800"
                      >
                        {s.staff_full_name || s.full_name}
                      </button>
                    ))}
                  </div>
                )}

                <Select value={allocateStaffId} onValueChange={v => {
                  setAllocateStaffId(v);
                  const m = allStaff.find(s => s.id === v);
                  setStaffSearch(m ? (m.staff_full_name || m.full_name) : '');
                }}>
                  <SelectTrigger className="w-full bg-white text-sm">
                    <SelectValue placeholder="Or pick from list…" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStaff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.staff_full_name || s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAllocateClick}
                  disabled={!allocateStaffId || allocateMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {allocateMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Allocating…</>
                    : <><UserCheck className="w-4 h-4 mr-2" />Allocate to {selectedMember ? (selectedMember.staff_full_name || selectedMember.full_name) : 'Staff'}</>
                  }
                </Button>
                <p className="text-xs text-teal-600 text-center">Auto-approved — bypasses claim queue</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-1">
              <p className="text-xs font-medium text-slate-400 mb-3">Or claim for yourself</p>
            </div>

            {hasPendingClaim ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">You already have a pending claim for this shift.</p>
                <p className="text-xs text-amber-600 mt-1">Please wait for admin to review your existing claim.</p>
              </div>
            ) : (
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optionally explain why you'd like to claim this shift..."
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleteShiftMutation.isPending}
                className="w-full sm:w-auto sm:mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Shift
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {!hasPendingClaim && (
              <Button
                onClick={isAdmin ? () => setSelfClaimRecurrenceOpen(true) : handleSubmit}
                disabled={claimMutation.isPending || adminClaimMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {(claimMutation.isPending || adminClaimMutation.isPending)
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isAdmin ? 'Claim & Approve' : 'Claim Shift'}
              </Button>
            )}
          </DialogFooter>

          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="Clear Shift?"
            description="This will remove the staff assignment and revert this shift to a blank available slot."
            confirmLabel="Clear Shift"
            variant="destructive"
            onConfirm={() => deleteShiftMutation.mutate()}
          />
        </DialogContent>
      </Dialog>

      {/* Recurrence dialog — allocating a staff member */}
      <AlertDialog open={recurrenceDialogOpen} onOpenChange={setRecurrenceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Repeat2 className="w-5 h-5 text-teal-600" />
              How often does {selectedMember?.staff_full_name || selectedMember?.full_name || 'this staff member'} work this shift?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Allocates to this shift and matching future blank shifts in the same pattern.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            {RECURRENCE_OPTIONS.map(({ mode, label, desc }) => (
              <Button
                key={mode}
                variant="outline"
                className="justify-start h-auto py-2.5 px-4"
                onClick={() => handleAllocateChoice(mode)}
                disabled={allocateMutation.isPending}
              >
                <div className="text-left">
                  <p className="font-medium text-sm text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recurrence dialog — admin claiming for themselves */}
      <AlertDialog open={selfClaimRecurrenceOpen} onOpenChange={setSelfClaimRecurrenceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Repeat2 className="w-5 h-5 text-teal-600" />
              How often do you work this shift?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Claims this shift and matching future blank shifts in the same pattern.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            {RECURRENCE_OPTIONS.map(({ mode, label, desc }) => (
              <Button
                key={mode}
                variant="outline"
                className="justify-start h-auto py-2.5 px-4"
                onClick={() => handleSelfClaimChoice(mode)}
                disabled={adminClaimMutation.isPending}
              >
                <div className="text-left">
                  <p className="font-medium text-sm text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
