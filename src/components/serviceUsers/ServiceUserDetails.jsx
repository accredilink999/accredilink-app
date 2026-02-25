import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Avatar from '@/components/ui/Avatar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CareLogViewer from '../careLogs/CareLogViewer';
import HealthcareLogManager from '../careLogs/HealthcareLogManager';
import MARChart from '../medications/MARChart';
import CarePlanViewer from './CarePlanViewer';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';
import { deployClientCallsToRota } from '@/utils/deployPattern';
import { ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import CallTypeManager from '../rota/CallTypeManager';
import SafeguardingReports from './SafeguardingReports';
import {
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Heart,
  Pill,
  FileText,
  Edit,
  Trash2,
  Download,
  Loader2,
  X,
  Plus,
  Clock,
  ListChecks,
  Shield
} from 'lucide-react';

export default function ServiceUserDetails({ serviceUser, open, onClose, onEdit, onEditDisabled = false, careLogs = [] }) {
   const queryClient = useQueryClient();
    const [selectedLog, setSelectedLog] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
    const [marFullscreen, setMARFullscreen] = useState(false);
    const [deleteServiceUserConfirmOpen, setDeleteServiceUserConfirmOpen] = useState(false);
    const [showCommunicationPastLogs, setShowCommunicationPastLogs] = useState(false);
    const [showSittingPastLogs, setShowSittingPastLogs] = useState(false);
    const [displayedLogs, setDisplayedLogs] = useState([]);
    const [careLogDateRange, setCareLogDateRange] = useState({
       start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
       end: new Date().toISOString().split('T')[0]
     });
     const [healthLogDateRange, setHealthLogDateRange] = useState({
       start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
       end: new Date().toISOString().split('T')[0]
     });

     // Refetch care logs when dialog opens or service user changes
     useEffect(() => {
       if (!open || !serviceUser?.id) return;
       queryClient.refetchQueries({ queryKey: ['allCareLogs'] });
     }, [open, serviceUser?.id, queryClient]);

     // Filter and sync careLogs to displayedLogs when they change
     useEffect(() => {
       if (serviceUser?.id && careLogs.length > 0) {
         const filtered = careLogs.filter(log => log.service_user_id === serviceUser.id);
         setDisplayedLogs(filtered);
       }
     }, [careLogs, serviceUser?.id]);

     // Update displayed logs count in badge
     const filteredLogsCount = careLogs.filter(log => log.service_user_id === serviceUser?.id).length;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.ServiceUser.update(serviceUser.id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      queryClient.setQueryData(['currentServiceUser', serviceUser.id], (old) => ({
        ...old,
        status: pendingStatus
      }));
    },
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', serviceUser?.id],
    queryFn: () => base44.entities.MedicationRecord.filter({ service_user_id: serviceUser.id }),
    enabled: !!serviceUser?.id,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['serviceUserShifts', serviceUser?.id],
    queryFn: () => ShiftApi.filter({ service_user_id: serviceUser.id }, '-date', 10),
    enabled: !!serviceUser?.id,
  });

  // ── Call Times editing state ──
  const [callTimesLocal, setCallTimesLocal] = useState([]);
  const [editingCallIdx, setEditingCallIdx] = useState(null);
  const [newCall, setNewCall] = useState({ time: '09:00', duration: 30, types: [], notes: '', tasks: [] });
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isCallTypeManagerOpen, setIsCallTypeManagerOpen] = useState(false);
  const callFormRef = React.useRef(null);

  // Only sync call times from server when not actively editing (dirty)
  useEffect(() => {
    if (callTimesDirty) return; // Don't overwrite local edits
    if (serviceUser?.call_times) {
      setCallTimesLocal(serviceUser.call_times);
    } else {
      setCallTimesLocal([]);
    }
  }, [serviceUser?.call_times]);

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: callTypes = [] } = useQuery({
    queryKey: ['callTypes'],
    queryFn: () => base44.entities.CallType.filter({ is_active: true }, 'sort_order'),
  });

  const clientArea = rotaAreas.find(a => a.id === serviceUser?.area_id);

  // Helper: normalize old string type to array
  const normalizeTypes = (call) => {
    if (call.types && Array.isArray(call.types)) return call.types;
    if (call.type) return [call.type];
    return [];
  };

  const updateCallTimesMutation = useMutation({
    mutationFn: (newCallTimes) =>
      base44.entities.ServiceUser.update(serviceUser.id, { call_times: newCallTimes }),
    onSuccess: async (_, savedCallTimes) => {
      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      toast.success('Call times updated');

      // Auto-deploy calls to rota shifts
      try {
        const suAreaId = serviceUser.area_id;
        if (suAreaId && savedCallTimes && savedCallTimes.length > 0) {
          const { created } = await deployClientCallsToRota({
            serviceUserId: serviceUser.id,
            serviceUserName: serviceUser.full_name || '',
            serviceUserAddress: serviceUser.address || '',
            areaId: suAreaId,
            callTimes: savedCallTimes,
          });
          if (created > 0) {
            toast.success(`${created} calls deployed to rota`);
            queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
            queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
          }
        }
      } catch (err) {
        console.error('Auto-deploy calls error:', err);
      }

      // Notify admins
      const clientName = serviceUser.full_name || 'Client';
      notifyAdminsOfActivity({
        title: `Call times updated: ${clientName}`,
        message: `${clientName}'s scheduled call times have been updated.`,
        excludeUserId: currentUser?.id,
        actionUrl: '/Clients',
      });

      // Notify staff who have upcoming shifts/calls with this client
      try {
        const today = new Date().toISOString().split('T')[0];
        const upcomingCalls = await ShiftCallApi.filter({ service_user_id: serviceUser.id });
        const futureCalls = upcomingCalls.filter(c => c.call_date >= today);
        const shiftIds = [...new Set(futureCalls.map(c => c.shift_id).filter(Boolean))];

        if (shiftIds.length > 0) {
          const allShifts = await ShiftApi.list('-created_date', 500);
          const staffIds = [...new Set(
            allShifts
              .filter(s => shiftIds.includes(s.id) && s.staff_id && s.staff_id !== currentUser?.id)
              .map(s => s.staff_id)
          )];

          if (staffIds.length > 0) {
            await base44.functions.invoke('createNotification', {
              recipient_ids: staffIds,
              type: 'shift_activity',
              title: `Call times updated: ${clientName}`,
              message: `${clientName}'s scheduled call times have been updated. Please check the latest schedule.`,
              priority: 'normal',
              action_url: '/Rota',
              send_push: true,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to notify staff of call time changes:', e);
      }
    },
    onError: () => toast.error('Failed to update call times'),
  });

  const handleToggleType = (typeName) => {
    setNewCall(prev => {
      const has = prev.types.includes(typeName);
      return { ...prev, types: has ? prev.types.filter(t => t !== typeName) : [...prev.types, typeName] };
    });
  };

  const handleSelectAllTypes = () => {
    const allNames = callTypes.map(ct => ct.name);
    const allSelected = allNames.every(n => newCall.types.includes(n));
    setNewCall(prev => ({ ...prev, types: allSelected ? [] : allNames }));
  };

  const [callTimesDirty, setCallTimesDirty] = useState(false);

  const handleSaveCallTime = () => {
    if (newCall.types.length === 0) {
      toast.error('Please select at least one call type');
      return;
    }
    const updated = [...callTimesLocal];
    const entry = { time: newCall.time, duration: parseInt(newCall.duration) || 30, types: newCall.types, type: newCall.types[0], notes: newCall.notes, tasks: newCall.tasks || [] };
    if (editingCallIdx !== null) {
      updated[editingCallIdx] = entry;
      setEditingCallIdx(null);
    } else {
      updated.push(entry);
    }
    updated.sort((a, b) => a.time.localeCompare(b.time));
    setCallTimesLocal(updated);
    setCallTimesDirty(true);
    setNewCall({ time: '09:00', duration: 30, types: [], notes: '', tasks: [] });
    setNewTaskInput('');
  };

  const handleAddTask = () => {
    const text = newTaskInput.trim();
    if (!text) return;
    setNewCall(prev => ({ ...prev, tasks: [...(prev.tasks || []), text] }));
    setNewTaskInput('');
  };

  const handleRemoveTask = (idx) => {
    setNewCall(prev => ({ ...prev, tasks: (prev.tasks || []).filter((_, i) => i !== idx) }));
  };

  const handleEditCall = (idx) => {
    const call = callTimesLocal[idx];
    setNewCall({ time: call.time, duration: call.duration, types: normalizeTypes(call), notes: call.notes || '', tasks: call.tasks || [] });
    setEditingCallIdx(idx);
    // Scroll to the edit form so it's visible on mobile
    setTimeout(() => {
      callFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteCall = (idx) => {
    const updated = callTimesLocal.filter((_, i) => i !== idx);
    setCallTimesLocal(updated);
    setCallTimesDirty(true);
  };

  const handleSaveAllCallTimes = () => {
    updateCallTimesMutation.mutate(callTimesLocal, {
      onSuccess: () => {
        setCallTimesDirty(false);
        onClose();
      },
    });
  };

  // ── One-off / Impromptu call ──
  const [showOneOffForm, setShowOneOffForm] = useState(false);
  const [oneOffCall, setOneOffCall] = useState({ date: new Date().toISOString().split('T')[0], time: '09:00', duration: 30, types: [], notes: '' });

  const oneOffMutation = useMutation({
    mutationFn: async () => {
      const areaId = serviceUser?.area_id || serviceUser?.rota_area_id;
      if (!areaId) throw new Error('Client has no rota area assigned');
      if (oneOffCall.types.length === 0) throw new Error('Select at least one call type');

      // Find an assigned shift on this date in this area that covers the call time
      const [ch, cm] = oneOffCall.time.split(':').map(Number);
      const callMins = ch * 60 + cm;
      const dur = parseInt(oneOffCall.duration) || 30;

      const { data: areaShifts } = await supabase
        .from('shifts')
        .select('id, start_time, end_time')
        .not('staff_id', 'is', null)
        .eq('rota_area_id', areaId)
        .eq('date', oneOffCall.date);

      const match = (areaShifts || []).find(s => {
        const [sh, sm] = s.start_time.split(':').map(Number);
        const [eh, em] = s.end_time.split(':').map(Number);
        return callMins >= sh * 60 + sm && callMins + dur <= eh * 60 + em;
      });

      if (!match) throw new Error(`No shift found on ${oneOffCall.date} covering ${oneOffCall.time}. Make sure a shift exists in this area.`);

      await ShiftCallApi.create({
        shift_id: match.id,
        service_user_id: serviceUser.id,
        service_user_name: serviceUser.full_name,
        service_user_address: serviceUser.address || '',
        scheduled_time: oneOffCall.time,
        call_time: oneOffCall.time,
        call_date: oneOffCall.date,
        call_type: oneOffCall.types[0],
        call_types: oneOffCall.types,
        duration_minutes: dur,
        status: 'pending',
        notes: oneOffCall.notes || '',
      });
    },
    onSuccess: () => {
      toast.success('One-off call added to rota');
      queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      setShowOneOffForm(false);
      setOneOffCall({ date: new Date().toISOString().split('T')[0], time: '09:00', duration: 30, types: [], notes: '' });
    },
    onError: (err) => toast.error(err.message || 'Failed to add call'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ServiceUser.delete(serviceUser.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      onClose();
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('downloadCarePlanPDF', {
        serviceUserId: serviceUser.id
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `care-plan-${serviceUser.full_name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    },
  });

  const downloadLogsMutation = useMutation({
    mutationFn: async (logType) => {
      const dateRange = logType === 'care' ? careLogDateRange : healthLogDateRange;
      const response = await base44.functions.invoke('downloadLogsAsPDF', {
        serviceUserId: serviceUser.id,
        serviceUserName: serviceUser.full_name,
        logType,
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${logType}-logs-${serviceUser.full_name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    },
  });

  if (!serviceUser) return null;

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    in_hospital: 'bg-red-100 text-red-700',
    in_respite: 'bg-blue-100 text-blue-700',
    discharged: 'bg-slate-100 text-slate-700'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={serviceUser.full_name} size="lg" src={serviceUser.photo_url} />
              <div>
                <DialogTitle>{serviceUser.full_name}</DialogTitle>
                {isAdmin ? (
                  <select
                    value={pendingStatus || serviceUser.status}
                    onChange={(e) => {
                      setPendingStatus(e.target.value);
                      setStatusConfirmOpen(true);
                    }}
                    className={`text-sm px-3 py-1 rounded font-medium border-none cursor-pointer ${statusColors[pendingStatus || serviceUser.status]}`}
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="in_hospital">In Hospital</option>
                    <option value="in_respite">In Respite</option>
                    <option value="discharged">Discharged</option>
                  </select>
                ) : (
                  <Badge className={statusColors[serviceUser.status]}>
                    {serviceUser.status.replace('_', ' ')}
                  </Badge>
                )}
                {serviceUser.status === 'on_hold' && serviceUser.hold_type === 'temporary' && serviceUser.hold_remaining_calls > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-300 ml-1">
                    {serviceUser.hold_remaining_calls} call{serviceUser.hold_remaining_calls !== 1 ? 's' : ''} remaining
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
               {!onEditDisabled && (
               <>
               <Button variant="outline" size="sm" onClick={onEdit}>
                 <Edit className="w-3 h-3 mr-1" />
                 Edit
               </Button>
               </>
               )}
             </div>
          </div>
        </DialogHeader>

        <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Client Status?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingStatus === 'on_hold' ? (
                  <>Are you sure you want to put <strong>{serviceUser.full_name}</strong> on hold? Their calls will be suspended until the hold is manually removed.</>
                ) : (
                  <>Are you sure you want to change {serviceUser.full_name}'s status from <strong>{serviceUser.status.replace('_', ' ')}</strong> to <strong>{pendingStatus?.replace('_', ' ')}</strong>?</>
                )}
                {serviceUser.status === 'on_hold' && pendingStatus === 'active' && serviceUser.hold_type === 'temporary' && (
                  <p className="mt-2 text-amber-600 font-medium">Note: This will cancel the temporary hold ({serviceUser.hold_remaining_calls} calls were remaining).</p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  updateStatusMutation.mutate(pendingStatus);
                  setStatusConfirmOpen(false);
                }}
              >
                Confirm
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <div className="pt-4">
        <Tabs defaultValue="info" className="w-full">
           <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-1 h-auto bg-transparent p-0 mb-6">
             <TabsTrigger value="info" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">Info</TabsTrigger>
             <TabsTrigger value="care" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">Plan</TabsTrigger>
             <TabsTrigger value="medications" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">Meds</TabsTrigger>

             <TabsTrigger value="calls" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">Calls</TabsTrigger>
             <TabsTrigger value="logs" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">
               Logs
               {filteredLogsCount > 0 && (
                 <Badge className="ml-1 bg-teal-600 text-white text-xs">{filteredLogsCount}</Badge>
               )}
             </TabsTrigger>
             <TabsTrigger value="communications" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">Comms</TabsTrigger>
             <TabsTrigger value="sitting" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">Sitting</TabsTrigger>
             <TabsTrigger value="safeguarding" className="text-xs sm:text-sm font-bold rounded-lg py-2 px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-purple-100 data-[state=active]:border data-[state=active]:border-purple-300 data-[state=active]:text-purple-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all">
               <Shield className="w-3 h-3 mr-1 inline" />
               Safe
             </TabsTrigger>
           </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                {serviceUser.address && (
                  <div>
                    <span className="text-slate-500">Address:</span>
                    <p className="text-slate-900">{serviceUser.address}</p>
                    {serviceUser.postcode && <p className="text-slate-900">{serviceUser.postcode}</p>}
                  </div>
                )}
                {serviceUser.phone && (
                   <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-slate-400" />
                     <a href={`tel:${serviceUser.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                       {serviceUser.phone}
                     </a>
                   </div>
                 )}
                {serviceUser.key_safe_code && (
                  <div>
                    <span className="text-slate-500">Key Safe Code:</span>
                    <p className="font-mono text-slate-900">{serviceUser.key_safe_code}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Emergency Contact
              </h4>
              <div className="space-y-2 text-sm">
                {serviceUser.emergency_contact_name && (
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <p className="text-slate-900">{serviceUser.emergency_contact_name}</p>
                  </div>
                )}
                {serviceUser.emergency_contact_phone && (
                   <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-slate-400" />
                     <a href={`tel:${serviceUser.emergency_contact_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                       {serviceUser.emergency_contact_phone}
                     </a>
                   </div>
                 )}
                {serviceUser.emergency_contact_relationship && (
                  <div>
                    <span className="text-slate-500">Relationship:</span>
                    <p className="text-slate-900">{serviceUser.emergency_contact_relationship}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600" />
                Medical Information
              </h4>
              <div className="space-y-2 text-sm">
                {serviceUser.gp_name && (
                  <div>
                    <span className="text-slate-500">GP:</span>
                    <p className="text-slate-900">{serviceUser.gp_name}</p>
                    {serviceUser.gp_phone && <p className="text-slate-600"><a href={`tel:${serviceUser.gp_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{serviceUser.gp_phone}</a></p>}
                  </div>
                )}
                {serviceUser.nhs_number && (
                  <div>
                    <span className="text-slate-500">NHS Number:</span>
                    <p className="text-slate-900">{serviceUser.nhs_number}</p>
                  </div>
                )}
                {serviceUser.allergies && (
                  <div>
                    <span className="text-slate-500">Allergies:</span>
                    <p className="text-slate-900">{serviceUser.allergies}</p>
                  </div>
                )}
                {serviceUser.dietary_requirements && (
                  <div>
                    <span className="text-slate-500">Dietary Requirements:</span>
                    <p className="text-slate-900">{serviceUser.dietary_requirements}</p>
                  </div>
                )}
                {serviceUser.mobility_level && (
                  <div>
                    <span className="text-slate-500">Mobility:</span>
                    <p className="text-slate-900 capitalize">{serviceUser.mobility_level.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="care" className="space-y-4 mt-4">
            <CarePlanViewer serviceUser={serviceUser} />
          </TabsContent>

          <TabsContent value="medications" className="space-y-3 mt-4">
             <Button onClick={() => setMARFullscreen(true)} className="w-full">Open MAR Chart</Button>
           </TabsContent>

           <Dialog open={marFullscreen} onOpenChange={setMARFullscreen}>
             <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
               <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10 flex-shrink-0">
                 <DialogTitle>Medication Administration Record - {serviceUser.full_name}</DialogTitle>
                 <button onClick={() => setMARFullscreen(false)} className="text-slate-500 hover:text-slate-700">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               <div className="overflow-auto flex-1 p-4">
                 <MARChart serviceUser={serviceUser} isAdmin={true} />
               </div>
             </DialogContent>
           </Dialog>



          <TabsContent value="calls" className="space-y-3 mt-4">
            {/* Rota Area badge */}
            {clientArea && (
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Rota Area:</span>
                <Badge style={{ backgroundColor: clientArea.color, color: '#fff' }}>
                  {clientArea.name}
                </Badge>
              </div>
            )}

            {/* One-off / Impromptu call */}
            {isAdmin && (
              <Card className="p-4 border-2 border-dashed border-blue-300 bg-blue-50/50">
                <button
                  onClick={() => setShowOneOffForm(!showOneOffForm)}
                  className="flex items-center gap-2 w-full font-semibold text-blue-700 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Add One-Off Call to Rota
                  <span className={`ml-auto transform transition-transform ${showOneOffForm ? 'rotate-90' : ''}`}>▶</span>
                </button>
                {showOneOffForm && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={oneOffCall.date} onChange={(e) => setOneOffCall({ ...oneOffCall, date: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Time</Label>
                        <Input type="time" value={oneOffCall.time} onChange={(e) => setOneOffCall({ ...oneOffCall, time: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Duration (min)</Label>
                        <Input type="number" value={oneOffCall.duration} onChange={(e) => setOneOffCall({ ...oneOffCall, duration: e.target.value })} min="15" step="15" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Call Types</Label>
                      <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded border mt-1">
                        {callTypes.map((ct) => (
                          <label key={ct.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={oneOffCall.types.includes(ct.name)}
                              onCheckedChange={() => setOneOffCall(prev => ({
                                ...prev,
                                types: prev.types.includes(ct.name)
                                  ? prev.types.filter(t => t !== ct.name)
                                  : [...prev.types, ct.name]
                              }))}
                            />
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ct.color || '#0d9488' }} />
                              <span className="text-xs text-slate-700">{ct.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Input value={oneOffCall.notes} onChange={(e) => setOneOffCall({ ...oneOffCall, notes: e.target.value })} placeholder="e.g. Emergency welfare check" />
                    </div>
                    <Button
                      onClick={() => oneOffMutation.mutate()}
                      disabled={oneOffMutation.isPending || oneOffCall.types.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {oneOffMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add to Rota
                    </Button>
                    <p className="text-[10px] text-blue-600 text-center">This creates a single call on the specified date — it won't repeat</p>
                  </div>
                )}
              </Card>
            )}

            {/* Admin: Add/Edit call time form */}
            {isAdmin && (
              <Card ref={callFormRef} className={`p-4 ${editingCallIdx !== null ? 'bg-amber-50 border-amber-300 border-2' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 text-sm">
                    {editingCallIdx !== null ? 'Edit Call Time' : 'Add Call Time'}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCallTypeManagerOpen(true)}
                    className="text-xs h-7"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Manage Types
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      value={newCall.time}
                      onChange={(e) => setNewCall({ ...newCall, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (min)</Label>
                    <Input
                      type="number"
                      value={newCall.duration}
                      onChange={(e) => setNewCall({ ...newCall, duration: e.target.value })}
                      min="15"
                      step="15"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Call Types</Label>
                    <button
                      type="button"
                      onClick={handleSelectAllTypes}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {callTypes.length > 0 && callTypes.every(ct => newCall.types.includes(ct.name)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded border">
                    {callTypes.map((ct) => (
                      <label key={ct.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newCall.types.includes(ct.name)}
                          onCheckedChange={() => handleToggleType(ct.name)}
                        />
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ct.color || '#0d9488' }} />
                          <span className="text-xs text-slate-700">{ct.name}</span>
                        </div>
                      </label>
                    ))}
                    {callTypes.length === 0 && (
                      <p className="text-xs text-slate-400 col-span-2">No call types — click "Manage Types" to add</p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input
                    value={newCall.notes}
                    onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                    placeholder="e.g. Morning medication round"
                  />
                </div>

                {/* Recurring Tasks */}
                <div className="mt-3">
                  <Label className="text-xs flex items-center gap-1">
                    <ListChecks className="w-3 h-3" />
                    Recurring Tasks
                  </Label>
                  <div className="p-2 bg-white rounded border mt-1 space-y-1.5">
                    {(newCall.tasks || []).map((task, i) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2 bg-slate-50 rounded border text-xs">
                        <span className="text-slate-700">{task}</span>
                        <button type="button" onClick={() => handleRemoveTask(i)} className="text-red-400 hover:text-red-600 ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        placeholder="Add a task (e.g. Give medication)..."
                        className="h-7 text-xs"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); } }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddTask}
                        disabled={!newTaskInput.trim()}
                        className="h-7 px-2"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {(newCall.tasks || []).length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center">Tasks added here will appear on every deployed call for this time slot</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleSaveCallTime}
                    disabled={updateCallTimesMutation.isPending || newCall.types.length === 0}
                    className="bg-teal-600 hover:bg-teal-700 flex-1"
                    size="sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {editingCallIdx !== null ? 'Update Call' : 'Add Call'}
                  </Button>
                  {editingCallIdx !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCallIdx(null);
                        setNewCall({ time: '09:00', duration: 30, types: [], notes: '', tasks: [] });
                        setNewTaskInput('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Call times list */}
            {callTimesLocal.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No scheduled call times</p>
            ) : (
              callTimesLocal.map((call, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {call.time} - {call.duration} minutes
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {normalizeTypes(call).map((t, i) => {
                          const ct = callTypes.find(c => c.name === t);
                          return (
                            <Badge key={i} className="text-xs" style={{ backgroundColor: ct?.color || '#64748b', color: '#fff' }}>
                              {t}
                            </Badge>
                          );
                        })}
                      </div>
                      {call.notes && <p className="text-sm text-slate-500 mt-1">{call.notes}</p>}
                      {call.tasks && call.tasks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <ListChecks className="w-3 h-3 text-slate-400 mt-0.5" />
                          {call.tasks.map((task, ti) => (
                            <Badge key={ti} variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-50">
                              {task}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCall(idx)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCall(idx)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}

            {/* Save button — always visible for admin */}
            {isAdmin && (
              <Card className={`p-4 border-2 ${callTimesDirty ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
                <Button
                  onClick={handleSaveAllCallTimes}
                  disabled={!callTimesDirty || updateCallTimesMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                  size="lg"
                >
                  {updateCallTimesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : callTimesDirty ? (
                    `Save All Call Times (${callTimesLocal.length})`
                  ) : (
                    'All Changes Saved'
                  )}
                </Button>
                {callTimesDirty && (
                  <p className="text-xs text-teal-700 text-center mt-2 font-medium">
                    You have unsaved changes
                  </p>
                )}
              </Card>
            )}

            {isCallTypeManagerOpen && (
              <CallTypeManager
                open={isCallTypeManagerOpen}
                onClose={() => setIsCallTypeManagerOpen(false)}
              />
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-3 mt-4">
           {isAdmin && (
             <Card className="p-4 bg-slate-50 border-slate-200">
               <div className="flex flex-col sm:flex-row gap-3 items-end">
                 <div className="flex-1">
                   <label className="text-sm font-medium text-slate-700 block mb-1">From</label>
                   <input
                     type="date"
                     value={careLogDateRange.start}
                     onChange={(e) => setCareLogDateRange({...careLogDateRange, start: e.target.value})}
                     className="w-full border rounded px-2 py-1.5 text-sm"
                   />
                 </div>
                 <div className="flex-1">
                   <label className="text-sm font-medium text-slate-700 block mb-1">To</label>
                   <input
                     type="date"
                     value={careLogDateRange.end}
                     onChange={(e) => setCareLogDateRange({...careLogDateRange, end: e.target.value})}
                     className="w-full border rounded px-2 py-1.5 text-sm"
                   />
                 </div>
                 <Button
                   size="sm"
                   onClick={() => downloadLogsMutation.mutate('care')}
                   disabled={downloadLogsMutation.isPending}
                   className="w-full sm:w-auto"
                 >
                   {downloadLogsMutation.isPending ? (
                     <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                   ) : (
                     <Download className="w-3 h-3 mr-1" />
                   )}
                   Download PDF
                 </Button>
               </div>
             </Card>
           )}
           {displayedLogs.length === 0 ? (
             <p className="text-center text-slate-500 py-8">No care logs yet</p>
           ) : (
             displayedLogs.slice(0, 10).map(log => (
               <div
                 key={log.id}
                 onClick={() => {
                   setSelectedLog(log);
                   setViewerOpen(true);
                 }}
                 className="cursor-pointer"
               >
                 <Card className="p-4 hover:shadow-md hover:border-slate-300 transition-all">
                   <div className="flex items-start justify-between mb-2">
                     <div>
                       <p className="font-medium text-slate-900">
                         {log.visit_date} at {log.visit_time}
                       </p>
                       <p className="text-sm text-slate-600">{log.staff_name}</p>
                     </div>
                     <Badge className={
                       log.status === 'submitted' ? 'bg-green-100 text-green-700' :
                       log.status === 'overdue' ? 'bg-red-100 text-red-700' :
                       'bg-yellow-100 text-yellow-700'
                     }>
                       {log.status}
                     </Badge>
                   </div>
                   {log.notes && (
                     <p className="text-sm text-slate-600 mt-2 line-clamp-2">{log.notes}</p>
                   )}
                 </Card>
               </div>
             ))
           )}
           <CareLogViewer 
             careLog={selectedLog}
             open={viewerOpen}
             onOpenChange={setViewerOpen}
             isAdmin={isAdmin}
           />
           </TabsContent>

           <TabsContent value="communications" className="space-y-3 mt-4">
           {isAdmin && (
            <>
              <Button
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"
                onClick={() => setShowCommunicationPastLogs(!showCommunicationPastLogs)}
              >
                {showCommunicationPastLogs ? 'Hide' : 'Show'} Past Logs
              </Button>
              {showCommunicationPastLogs && (
                <Card className="p-4 bg-slate-50 border-slate-200">
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-700 block mb-1">From</label>
                      <input
                        type="date"
                        value={healthLogDateRange.start}
                        onChange={(e) => setHealthLogDateRange({...healthLogDateRange, start: e.target.value})}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-700 block mb-1">To</label>
                      <input
                        type="date"
                        value={healthLogDateRange.end}
                        onChange={(e) => setHealthLogDateRange({...healthLogDateRange, end: e.target.value})}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadLogsMutation.mutate('healthcare')}
                      disabled={downloadLogsMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {downloadLogsMutation.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3 mr-1" />
                      )}
                      Download PDF
                    </Button>
                  </div>
                </Card>
              )}
            </>
           )}
           <HealthcareLogManager serviceUser={serviceUser} />
           </TabsContent>

           <TabsContent value="sitting" className="space-y-3 mt-4">
           <HealthcareLogManager serviceUser={serviceUser} logType="sitting" />
           </TabsContent>

           <TabsContent value="safeguarding" className="space-y-3 mt-4">
             <SafeguardingReports serviceUser={serviceUser} />
           </TabsContent>
           </Tabs>
           </div>

           <ConfirmDialog
             open={deleteServiceUserConfirmOpen}
             onOpenChange={setDeleteServiceUserConfirmOpen}
             title="Delete Service User?"
             description="Are you sure you want to delete this service user? This action cannot be undone."
             confirmLabel="Yes, Delete"
             variant="destructive"
             onConfirm={() => deleteMutation.mutate()}
           />
           </DialogContent>
           </Dialog>
           );
           }