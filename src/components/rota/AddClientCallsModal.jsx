import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { ShiftCallApi } from '@/api/rotaApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export default function AddClientCallsModal({ shift, open, onClose }) {
  const queryClient = useQueryClient();
  const [selectedCalls, setSelectedCalls] = useState([]);

  // Fetch all active service users (they carry call_times on their profile)
  // Use distinct query key to avoid collision with CreateShiftModal's ['serviceUsers']
  const { data: serviceUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['serviceUsers', 'active'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }),
    enabled: !!open,
  });

  // Fetch existing shift calls so we can exclude already-added ones
  const { data: existingShiftCalls = [], isLoading: existingCallsLoading } = useQuery({
    queryKey: ['existingShiftCalls', shift?.id],
    queryFn: () => shift?.id ? ShiftCallApi.filter({ shift_id: shift.id }) : [],
    enabled: !!open && !!shift?.id,
  });

  const shiftAreaId = shift?.rota_area_id || shift?.area_id;
  const { data: callTypesData = [] } = useQuery({
    queryKey: ['callTypes', shiftAreaId],
    queryFn: async () => {
      let q = supabase.from('call_types').select('*').eq('is_active', true);
      if (shiftAreaId) q = q.or(`area_id.eq.${shiftAreaId},area_id.is.null`);
      const { data, error } = await q.order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!open,
  });

  // Combined loading state — prevents flash of calls before existingShiftCalls loads
  const isLoading = usersLoading || existingCallsLoading;

  const getDefaultTasks = (typeName) => {
    const ct = callTypesData.find(c => c.name === typeName);
    if (!ct?.default_tasks?.length) return [];
    return ct.default_tasks.map(text => ({ text, completed: false }));
  };

  // Build virtual call entries from service_users.call_times
  // One call_time entry = one visit = one virtual call (types stored as array)
  const virtualCalls = useMemo(() => {
    if (!serviceUsers.length || !shift?.start_time || !shift?.end_time) {
      console.log('[AddClientCalls] No data:', { serviceUsers: serviceUsers.length, start: shift?.start_time, end: shift?.end_time });
      return [];
    }

    const shiftStart = timeToMinutes(shift.start_time);
    const shiftEnd = timeToMinutes(shift.end_time);
    // Handle both rota_area_id (new shifts) and area_id (old shifts)
    const shiftArea = shift.rota_area_id || shift.area_id;
    console.log('[AddClientCalls] Shift:', JSON.stringify({ id: shift.id, area: shiftArea, start: shift.start_time, end: shift.end_time }));
    console.log('[AddClientCalls] Service users:', serviceUsers.length, '| Existing shift calls:', existingShiftCalls.length);
    if (existingShiftCalls.length > 0) {
      console.log('[AddClientCalls] Existing calls sample:', existingShiftCalls.slice(0, 3).map(sc => ({ su_id: sc.service_user_id, time: sc.scheduled_time, call_time: sc.call_time })));
    }
    const calls = [];
    let skippedArea = 0;
    let skippedTime = 0;
    let skippedAlready = 0;

    for (const su of serviceUsers) {
      if (!su.call_times || su.call_times.length === 0) continue;

      // Filter by rota area if shift has one
      if (shiftArea && shiftArea !== 'default') {
        const suArea = su.area_id || su.rota_area_id;
        if (suArea && suArea !== shiftArea) {
          skippedArea++;
          continue;
        }
      }

      for (const ct of su.call_times) {
        const callStart = timeToMinutes(ct.time);
        const callDuration = parseInt(ct.duration) || 30;
        const callEnd = callStart + callDuration;

        // Check if call fits within shift window
        if (callStart >= shiftStart && callEnd <= shiftEnd) {
          const types = (ct.types && Array.isArray(ct.types)) ? ct.types : (ct.type ? [ct.type] : ['Visit']);

          // Check if this visit is already on the shift (one call per time slot per service user)
          const alreadyAdded = existingShiftCalls.some(sc =>
            sc.service_user_id === su.id &&
            (sc.scheduled_time === ct.time || sc.call_time === ct.time)
          );
          if (alreadyAdded) {
            skippedAlready++;
            continue;
          }

          calls.push({
            id: `${su.id}-${ct.time}`,
            service_user_id: su.id,
            service_user_name: su.full_name,
            service_user_address: su.address,
            scheduled_time: ct.time,
            duration_minutes: callDuration,
            notes: ct.notes || '',
            call_type: types[0] || 'Visit',
            call_types: types,
          });
        } else {
          skippedTime++;
        }
      }
    }

    console.log('[AddClientCalls] Result:', calls.length, 'calls | Skipped: area=' + skippedArea, 'time=' + skippedTime, 'already=' + skippedAlready);
    return calls;
  }, [serviceUsers, shift, existingShiftCalls]);

  // Group calls by service user
  const callsByClient = useMemo(() => {
    return virtualCalls.reduce((acc, call) => {
      if (!acc[call.service_user_id]) {
        acc[call.service_user_id] = [];
      }
      acc[call.service_user_id].push(call);
      return acc;
    }, {});
  }, [virtualCalls]);

  // Create ShiftCall records from selected virtual calls
  const addCallsMutation = useMutation({
    mutationFn: async (callIds) => {
      const promises = callIds.map(callId => {
        const call = virtualCalls.find(c => c.id === callId);
        if (!call) return Promise.reject(new Error('Call not found'));

        return ShiftCallApi.create({
          shift_id: shift.id,
          service_user_id: call.service_user_id,
          service_user_name: call.service_user_name,
          service_user_address: call.service_user_address,
          scheduled_time: call.scheduled_time,
          call_time: call.scheduled_time,
          duration_minutes: call.duration_minutes,
          call_type: call.call_type,
          call_types: call.call_types || [call.call_type],
          tasks: getDefaultTasks(call.call_type),
          call_date: shift.date,
          status: 'pending',
          notes: call.notes || '',
        });
      });

      return Promise.all(promises);
    },
    onSuccess: (results) => {
      toast.success(`${results.length} call${results.length !== 1 ? 's' : ''} added successfully`);
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
      queryClient.invalidateQueries({ queryKey: ['existingShiftCalls', shift.id] });
      setSelectedCalls([]);
      onClose();
    },
    onError: (error) => {
      console.error('Error adding calls:', error);
      toast.error('Failed to add calls');
    },
  });

  const handleToggleCall = (callId) => {
    setSelectedCalls(prev =>
      prev.includes(callId)
        ? prev.filter(id => id !== callId)
        : [...prev, callId]
    );
  };

  const handleToggleClientCalls = (clientId) => {
    const clientCallIds = callsByClient[clientId]?.map(c => c.id) || [];
    const allSelected = clientCallIds.every(id => selectedCalls.includes(id));

    if (allSelected) {
      setSelectedCalls(prev => prev.filter(id => !clientCallIds.includes(id)));
    } else {
      setSelectedCalls(prev => [...new Set([...prev, ...clientCallIds])]);
    }
  };

  const handleAddAllCalls = () => {
    const allCallIds = virtualCalls.map(c => c.id);
    if (allCallIds.length > 0) {
      addCallsMutation.mutate(allCallIds);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add Client Calls to Shift</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto min-h-0 flex-1 px-6 py-4">
          {virtualCalls.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleAddAllCalls}
                disabled={addCallsMutation.isPending}
                variant="outline"
                className="text-teal-600"
              >
                {addCallsMutation.isPending ? 'Adding All...' : 'Add All Calls'}
              </Button>
            </div>
          )}
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-slate-500">Loading calls...</p>
            </Card>
          ) : Object.entries(callsByClient).length === 0 ? (
            <Card className="p-8 text-center">
              {existingShiftCalls.length > 0 ? (
                <>
                  <p className="text-slate-500">All matching calls are already on this shift</p>
                  <p className="text-xs text-teal-600 mt-2">{existingShiftCalls.length} call{existingShiftCalls.length !== 1 ? 's' : ''} already assigned</p>
                </>
              ) : (
                <>
                  <p className="text-slate-500">No client calls match this shift's time window and area</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Shift: {shift?.start_time}–{shift?.end_time} | Area: {shift?.rota_area_id || shift?.area_id || 'none'} | Users with call times: {serviceUsers.filter(su => su.call_times?.length > 0).length}
                  </p>
                </>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(callsByClient).map(([clientId, calls]) => {
                const clientCallIds = calls.map(c => c.id);
                const allSelected = clientCallIds.every(id => selectedCalls.includes(id));

                return (
                  <Card key={clientId} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => handleToggleClientCalls(clientId)}
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-900">{calls[0]?.service_user_name || 'Unknown'}</p>
                          {calls[0]?.service_user_address && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {calls[0].service_user_address}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{calls.length} call{calls.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="ml-6 space-y-2">
                      {calls.map(call => (
                        <div key={call.id} className="flex items-center gap-3 p-2 rounded border border-slate-200">
                          <Checkbox
                            checked={selectedCalls.includes(call.id)}
                            onCheckedChange={() => handleToggleCall(call.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                              <Clock className="w-3 h-3" />
                              {call.scheduled_time} ({call.duration_minutes}min)
                              {(call.call_types || [call.call_type]).map((t, i) => (
                                <Badge key={i} variant="outline" className="text-xs py-0 px-1.5">{t}</Badge>
                              ))}
                            </p>
                            {call.notes && (
                              <p className="text-xs text-slate-500 mt-1">{call.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedCalls.length > 0) {
                addCallsMutation.mutate(selectedCalls);
              } else {
                onClose();
              }
            }}
            disabled={addCallsMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {addCallsMutation.isPending ? 'Saving...' : `Save${selectedCalls.length > 0 ? ` (${selectedCalls.length})` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
