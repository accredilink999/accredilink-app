import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftCallApi } from '@/api/rotaApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import MARChart from '@/components/medications/MARChart';
import { createPageUrl } from '@/utils';
import CareLogViewer from './CareLogViewer';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';
import SpeechButton from '@/components/ui/SpeechButton';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import DraftRecoveryPrompt from '@/components/ui/DraftRecoveryPrompt';
import { useCareLogFormConfig, getActiveConfig, getEnabledSections } from '@/components/hooks/useCareLogFormConfig';
import { SECTION_REQUIRED_FIELDS } from '@/constants/careLogFormDefaults';
import CustomSectionRenderer from './CustomSectionRenderer';

export default function CareLogForm({ shift, serviceUser, open, onClose, callId, scheduledTime }) {
  const queryClient = useQueryClient();
  const [submittedCareLog, setSubmittedCareLog] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const initialFormData = {
    mood: '',
    food_intake: '',
    fluid_intake: '',
    welfare_impression_on_arrival: '',
    personal_care: '',
    personal_care_description: '',
    continence_care_provided: '',
    continence_care_monitoring: [],
    catheter_care_provided: '',
    catheter_care_description: '',
    repositioned_on_visit: '',
    repositioned_description: '',
    skincare_provided: '',
    skincare_description: '',
    skin_integrity_concerns: '',
    skin_integrity_description: '',
    food_offered: '',
    food_accepted: '',
    food_given: '',
    food_outcome: '',
    drinks_offered: '',
    drinks_accepted: '',
    drinks_given: '',
    drinks_outcome: '',
    add_medication_round: '',
    medication_round_outcome: '',
    medication_concerns: '',
    medication_concerns_details: '',
    healthcare_visit_required: '',
    healthcare_visit_type: '',
    staff_grade: '',
    double_handed_call: '',
    staff_1: '',
    staff_2: '',
    extended_notes: '',
    further_concerns: '',
    further_concerns_details: '',
    health_observations: '',
    notes: '',
    duration_minutes: shift?.end_time ? calculateDuration(shift) : '',
    timestamp: new Date().toISOString()
  };

  const { formData, setFormData, hasDraft, restoreDraft, discardDraft, clearDraft } = useFormPersistence(
    `draft:careLog:${shift?.id || 'new'}`,
    initialFormData
  );

  const [showMARPopup, setShowMARPopup] = useState(false);
  const [expandedMedicationOutcome, setExpandedMedicationOutcome] = useState(false);
  const { data: formConfigData } = useCareLogFormConfig();
  const enabledSections = getEnabledSections(formConfigData);
  const enabledIds = new Set(enabledSections.map(s => s.id));
  const [customFields, setCustomFields] = useState({});
  const handleCustomFieldChange = (sectionId) => (fieldId, value) => {
    setCustomFields(prev => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [fieldId]: value }
    }));
  };

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staffMembers'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getAllStaff', {});
        // invokeFunction returns parsed JSON directly, not { data: ... }
        return response.staffList || response.data?.staffList || [];
      } catch (error) {
        console.error('Error fetching staff via edge function, falling back to profiles:', error);
        // Fallback: query profiles table directly
        try {
          const profiles = await base44.entities.User.list();
          return profiles.map(p => ({ id: p.id, name: p.staff_full_name || p.full_name || p.email }));
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return [];
        }
      }
    },
  });

  function calculateDuration(shift) {
    if (!shift?.start_time || !shift?.end_time) return '';
    const [startH, startM] = shift.start_time.split(':').map(Number);
    const [endH, endM] = shift.end_time.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  useEffect(() => {
    if (open && !hasDraft) {
      setFormData({
        ...initialFormData,
        duration_minutes: shift?.end_time ? calculateDuration(shift) : '',
        timestamp: new Date().toISOString()
      });
    }
  }, [open, shift]);

  // Whitelist of columns that exist in the care_logs table
  const CARE_LOG_COLUMNS = new Set([
    'shift_id', 'shift_call_id', 'service_user_id', 'service_user_name',
    'staff_id', 'staff_name', 'visit_date', 'visit_time', 'mood',
    'food_intake', 'fluid_intake', 'personal_care_provided', 'health_observations',
    'notes', 'status', 'submitted_at', 'log_type',
    'welfare_impression_on_arrival', 'personal_care', 'personal_care_description',
    'continence_care_provided', 'continence_care_monitoring',
    'catheter_care_provided', 'catheter_care_description',
    'repositioned_on_visit', 'repositioned_description',
    'skincare_provided', 'skincare_description',
    'skin_integrity_concerns', 'skin_integrity_description',
    'food_offered', 'food_accepted', 'food_given', 'food_outcome',
    'drinks_offered', 'drinks_accepted', 'drinks_given', 'drinks_outcome',
    'add_medication_round', 'medication_round_outcome',
    'medication_concerns', 'medication_concerns_details',
    'healthcare_visit_required', 'healthcare_visit_type',
    'staff_grade', 'double_handed_call', 'staff_1', 'staff_2',
    'extended_notes', 'further_concerns', 'further_concerns_details',
    'duration_minutes', 'log_timestamp', 'shift_end_time', 'branch',
    'custom_fields',
  ]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Clean the payload: remove empty strings, convert types, rename reserved words
      const cleanData = { ...data };

      // Rename 'timestamp' → 'log_timestamp' (reserved word in PostgreSQL)
      if (cleanData.timestamp) {
        cleanData.log_timestamp = cleanData.timestamp;
      }
      delete cleanData.timestamp;

      // Convert duration_minutes to integer or null (DB column is INTEGER, not TEXT)
      if (cleanData.duration_minutes === '' || cleanData.duration_minutes === undefined) {
        delete cleanData.duration_minutes;
      } else {
        cleanData.duration_minutes = parseInt(cleanData.duration_minutes) || null;
      }

      // Remove any undefined values that could cause issues
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) delete cleanData[key];
      });

      const payload = {
        shift_id: shift.id,
        shift_call_id: callId || null,
        service_user_id: serviceUser.id,
        service_user_name: serviceUser.full_name,
        staff_id: user?.id || shift.staff_id,
        staff_name: user?.full_name || shift.staff_name,
        visit_date: shift.date,
        visit_time: scheduledTime || shift.start_time,
        shift_end_time: shift.end_time || '',
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        branch: shift.branch || '',
        ...cleanData,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
      };

      // Strip any fields not in the care_logs table to prevent DB errors
      Object.keys(payload).forEach(key => {
        if (!CARE_LOG_COLUMNS.has(key)) {
          console.warn(`[CareLog] Stripping unknown column: ${key}`);
          delete payload[key];
        }
      });

      const careLog = await base44.entities.CareLog.create(payload);

      // Update the call status if this was for a specific call
      if (callId) {
        await ShiftCallApi.update(callId, {
          status: 'completed',
          care_log_id: careLog.id
        });
      }

      return careLog;
    },
    onSuccess: async (careLog) => {
      clearDraft();
      toast.success('Care log submitted successfully');

      // Auto clock out the call
      if (callId) {
        try {
          await ShiftCallApi.update(callId, {
            clock_out_time: new Date().toISOString(),
            status: 'completed'
          });
        } catch (err) {
          console.error('Error updating call status:', err);
        }
      }

      // Complete matching calls on shared/paired shifts for the same service user
      if (callId && serviceUser?.id) {
        try {
          const currentCalls = await ShiftCallApi.filter({ id: callId });
          const currentCall = currentCalls[0];
          if (currentCall?.call_date && currentCall?.scheduled_time) {
            const matchingCalls = await ShiftCallApi.filter({
              service_user_id: serviceUser.id,
              call_date: currentCall.call_date,
              scheduled_time: currentCall.scheduled_time
            });
            const otherCalls = matchingCalls.filter(c => c.id !== callId && c.status !== 'completed');
            const notifiedStaffIds = new Set();
            for (const otherCall of otherCalls) {
              await ShiftCallApi.update(otherCall.id, {
                clock_out_time: new Date().toISOString(),
                status: 'completed',
                care_log_id: careLog.id
              });
              // Look up the shift to find the other staff member
              if (otherCall.shift_id) {
                try {
                  const otherShift = await base44.entities.Shift.read(otherCall.shift_id);
                  if (otherShift?.staff_id && otherShift.staff_id !== user?.id && !notifiedStaffIds.has(otherShift.staff_id)) {
                    notifiedStaffIds.add(otherShift.staff_id);
                    const staffName = user?.staff_full_name || user?.full_name || 'Your shift partner';
                    await base44.functions.invoke('createNotification', {
                      recipient_ids: [otherShift.staff_id],
                      type: 'care_log',
                      title: `Care log completed: ${serviceUser.full_name}`,
                      message: `${staffName} has filled out a log for this client and completed the call.`,
                      priority: 'normal',
                      action_url: '/CareLogs',
                      send_push: true,
                    }).catch(e => console.warn('Push to partner failed:', e));
                  }
                } catch (e) {
                  console.warn('Could not notify partner:', e);
                }
              }
            }
            if (otherCalls.length > 0) {
              console.log(`[CareLog] Auto-completed ${otherCalls.length} shared call(s)`);
            }
          }
        } catch (err) {
          console.log('Error updating shared shift calls:', err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['careLogs'] });
      queryClient.invalidateQueries({ queryKey: ['allCareLogs'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });

      // Notify admins of care log completion
      const staffName = user?.staff_full_name || user?.full_name || 'Staff';
      const clientName = serviceUser?.full_name || 'a client';
      notifyAdminsOfActivity({
        title: `Care log submitted: ${clientName}`,
        message: `${staffName} has submitted a care log for ${clientName}.`,
        excludeUserId: user?.id,
        actionUrl: '/CareLogs',
      });

      setSubmittedCareLog(careLog);

      // Close modal after 2 seconds to show preview
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error('Care log submission failed:', error);
      const msg = error?.message || error?.details || error?.hint || JSON.stringify(error) || 'Unknown error';
      toast.error('Failed to submit care log: ' + msg);
    },
  });




  const handleSubmit = () => {
    // Build required fields from enabled sections only
    const requiredFields = {};
    for (const section of enabledSections) {
      if (section.type === 'builtin') {
        const sectionReqs = SECTION_REQUIRED_FIELDS[section.id];
        if (sectionReqs) Object.assign(requiredFields, sectionReqs);
      }
    }
    const missing = Object.entries(requiredFields)
      .filter(([key]) => !formData[key])
      .map(([, label]) => label);
    // Validate required custom fields
    for (const section of enabledSections) {
      if (section.type === 'custom' && section.fields) {
        for (const field of section.fields) {
          if (field.required) {
            const val = customFields[section.id]?.[field.id];
            if (!val || (Array.isArray(val) && val.length === 0)) {
              missing.push(field.label);
            }
          }
        }
      }
    }
    if (missing.length > 0) {
      toast.error(`Please complete: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}`);
      return;
    }
    if (formData.double_handed_call === 'yes' && (!formData.staff_1 || !formData.staff_2)) {
      toast.error('Please select both staff members for double handed call');
      return;
    }
    if (formData.double_handed_call === 'no' && !formData.staff_1) {
      toast.error('Please select a staff member');
      return;
    }
    if (formData.medication_concerns === 'yes' && !formData.medication_concerns_details) {
      toast.error('Please provide medication concerns details');
      return;
    }
    mutation.mutate(formData);
  };

  const renderBuiltinSection = (sectionId) => {
    switch (sectionId) {
      case 'core_observations':
        return (
          <div className="space-y-4" key="core_observations">
            <h3 className="font-semibold text-slate-900">Essential Observations</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Mood *</Label>
                <Select value={formData.mood} onValueChange={(value) => setFormData({...formData, mood: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="upset">Upset</SelectItem>
                    <SelectItem value="unwell">Unwell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Food Intake *</Label>
                <Select value={formData.food_intake} onValueChange={(value) => setFormData({...formData, food_intake: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fluid Intake *</Label>
                <Select value={formData.fluid_intake} onValueChange={(value) => setFormData({...formData, fluid_intake: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Welfare Impression on arrival? *</Label>
              <Select value={formData.welfare_impression_on_arrival} onValueChange={(value) => setFormData({...formData, welfare_impression_on_arrival: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safe_no_concerns">Safe With No Concerns</SelectItem>
                  <SelectItem value="safe_minor_concerns">Safe With Minor Concerns (See Notes)</SelectItem>
                  <SelectItem value="unsafe_interventions_required">Unsafe Interventions Required</SelectItem>
                  <SelectItem value="safe_with_interventions_required">Safe With Interventions Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'personal_care':
        return (
          <div className="space-y-3" key="personal_care">
              <Label>Personal Care Provided? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, personal_care: 'yes'})}
                  className={formData.personal_care === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, personal_care: 'no', personal_care_description: ''})}
                  className={formData.personal_care === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.personal_care === 'yes' && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Label>What Personal Care was provided during Visit?</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={formData.personal_care_description}
                      onChange={(e) => setFormData({...formData, personal_care_description: e.target.value})}
                      placeholder="Describe the personal care provided..."
                      rows={4}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <SpeechButton
                         onResult={(text) => setFormData(prev => ({ ...prev, personal_care_description: (prev.personal_care_description || '') + ' ' + text }))}
                         className="h-12 px-3"
                       />
                       <Button
                         type="button"
                         onClick={() => setFormData({...formData, personal_care_description: ''})}
                         className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                         title="Clear text"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                     </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'continence_care':
        return (
          <div className="space-y-3" key="continence_care">
              <Label>Continence Care Provided? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, continence_care_provided: 'yes'})}
                  className={formData.continence_care_provided === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, continence_care_provided: 'no', continence_care_monitoring: []})}
                  className={formData.continence_care_provided === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.continence_care_provided === 'yes' && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <Label className="font-semibold">Continence Care Monitoring</Label>
                  <div className="space-y-2">
                    {['Passed Urine', 'Bowels Opened', 'Pad Dry', 'Pad Wet/Changed', 'Pad Wet & Soiled/Changed', 'Bed/Chair Wet', 'Bed/Chair Wet & Soiled', 'No Output'].map((option) => (
                      <div key={option} className="flex items-center gap-3">
                        <Checkbox
                          id={option}
                          checked={formData.continence_care_monitoring.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({...formData, continence_care_monitoring: [...formData.continence_care_monitoring, option]});
                            } else {
                              setFormData({...formData, continence_care_monitoring: formData.continence_care_monitoring.filter(item => item !== option)});
                            }
                          }}
                        />
                        <Label htmlFor={option} className="cursor-pointer text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        );

      case 'catheter_care':
        return (
          <div className="space-y-3" key="catheter_care">
              <Label>Any Catheter Care Provided Or Output To Be Reported? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, catheter_care_provided: 'yes'})}
                  className={formData.catheter_care_provided === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, catheter_care_provided: 'no', catheter_care_description: ''})}
                  className={formData.catheter_care_provided === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.catheter_care_provided === 'yes' && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Label>Catheter Care Details</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={formData.catheter_care_description}
                      onChange={(e) => setFormData({...formData, catheter_care_description: e.target.value})}
                      placeholder="Describe the catheter care provided or output..."
                      rows={4}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <SpeechButton
                         onResult={(text) => setFormData(prev => ({ ...prev, catheter_care_description: (prev.catheter_care_description || '') + ' ' + text }))}
                         className="h-12 px-3"
                       />
                       <Button
                         type="button"
                         onClick={() => setFormData({...formData, catheter_care_description: ''})}
                         className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                         title="Clear text"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                     </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'repositioning':
        return (
          <div className="space-y-3" key="repositioning">
              <Label>Was the Citizen Repositioned On This Visit? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, repositioned_on_visit: 'yes'})}
                  className={formData.repositioned_on_visit === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, repositioned_on_visit: 'no', repositioned_description: ''})}
                  className={formData.repositioned_on_visit === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.repositioned_on_visit === 'yes' && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Label>Repositioning Details</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={formData.repositioned_description}
                      onChange={(e) => setFormData({...formData, repositioned_description: e.target.value})}
                      placeholder="Describe the repositioning provided..."
                      rows={4}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <SpeechButton
                         onResult={(text) => setFormData(prev => ({ ...prev, repositioned_description: (prev.repositioned_description || '') + ' ' + text }))}
                         className="h-12 px-3"
                       />
                       <Button
                         type="button"
                         onClick={() => setFormData({...formData, repositioned_description: ''})}
                         className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                         title="Clear text"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                     </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'skincare':
        return (
          <div className="space-y-3" key="skincare">
               <Label>Was Any Skincare Provided? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, skincare_provided: 'yes'})}
                  className={formData.skincare_provided === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, skincare_provided: 'no', skincare_description: ''})}
                  className={formData.skincare_provided === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.skincare_provided === 'yes' && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Label>Skincare Details</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={formData.skincare_description}
                      onChange={(e) => setFormData({...formData, skincare_description: e.target.value})}
                      placeholder="Describe the skincare provided..."
                      rows={4}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <SpeechButton
                         onResult={(text) => setFormData(prev => ({ ...prev, skincare_description: (prev.skincare_description || '') + ' ' + text }))}
                         className="h-12 px-3"
                       />
                       <Button
                         type="button"
                         onClick={() => setFormData({...formData, skincare_description: ''})}
                         className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                         title="Clear text"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                     </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'skin_integrity':
        return (
          <div className="space-y-3" key="skin_integrity">
              <Label>Are there Any Skin Integrity Concerns? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, skin_integrity_concerns: 'yes'})}
                  className={formData.skin_integrity_concerns === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, skin_integrity_concerns: 'no', skin_integrity_description: ''})}
                  className={formData.skin_integrity_concerns === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.skin_integrity_concerns === 'yes' && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Label>Skin Integrity Concerns Details</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={formData.skin_integrity_description}
                      onChange={(e) => setFormData({...formData, skin_integrity_description: e.target.value})}
                      placeholder="Describe any skin integrity concerns..."
                      rows={4}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <SpeechButton
                         onResult={(text) => setFormData(prev => ({ ...prev, skin_integrity_description: (prev.skin_integrity_description || '') + ' ' + text }))}
                         className="h-12 px-3"
                       />
                       <Button
                         type="button"
                         onClick={() => setFormData({...formData, skin_integrity_description: ''})}
                         className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                         title="Clear text"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                     </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'food_management':
        return (
          <div className="space-y-3" key="food_management">
              <Label>Food Offered?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, food_offered: 'yes'})}
                  className={formData.food_offered === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, food_offered: 'no', food_accepted: '', food_given: '', food_outcome: ''})}
                  className={formData.food_offered === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.food_offered === 'yes' && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <Label>Accepted?</Label>
                    <Select value={formData.food_accepted} onValueChange={(value) => setFormData({...formData, food_accepted: value, food_given: value === 'refused' ? '' : formData.food_given, food_outcome: value === 'refused' ? '' : formData.food_outcome})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="refused">Refused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.food_accepted === 'yes' && (
                    <>
                      <div>
                        <Label>What Was Given</Label>
                        <Input
                          value={formData.food_given}
                          onChange={(e) => setFormData({...formData, food_given: e.target.value})}
                          placeholder="Describe what food was given..."
                        />
                      </div>

                      <div>
                        <Label>Outcome</Label>
                        <Select value={formData.food_outcome} onValueChange={(value) => setFormData({...formData, food_outcome: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select outcome..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_meal_consumed">Full Meal Consumed</SelectItem>
                            <SelectItem value="half_meal_consumed">Half Meal Consumed</SelectItem>
                            <SelectItem value="little_consumed">Little Consumed</SelectItem>
                            <SelectItem value="left_with_citizen">Left With Citizen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
        );

      case 'drinks_management':
        return (
          <div className="space-y-3" key="drinks_management">
              <Label>Drinks Offered?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, drinks_offered: 'yes'})}
                  className={formData.drinks_offered === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, drinks_offered: 'no', drinks_accepted: '', drinks_given: '', drinks_outcome: ''})}
                  className={formData.drinks_offered === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.drinks_offered === 'yes' && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <Label>Accepted?</Label>
                    <Select value={formData.drinks_accepted} onValueChange={(value) => setFormData({...formData, drinks_accepted: value, drinks_given: value === 'refused' ? '' : formData.drinks_given, drinks_outcome: value === 'refused' ? '' : formData.drinks_outcome})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="refused">Refused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.drinks_accepted === 'yes' && (
                    <>
                      <div>
                        <Label>What Was Given</Label>
                        <Input
                          value={formData.drinks_given}
                          onChange={(e) => setFormData({...formData, drinks_given: e.target.value})}
                          placeholder="Describe what drink was given..."
                        />
                      </div>

                      <div>
                        <Label>Outcome</Label>
                        <Select value={formData.drinks_outcome} onValueChange={(value) => setFormData({...formData, drinks_outcome: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select outcome..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_drink_taken">Full Drink Taken</SelectItem>
                            <SelectItem value="half_drink_taken">Half Drink Taken</SelectItem>
                            <SelectItem value="small_amount_taken">Small Amount Taken</SelectItem>
                            <SelectItem value="left_with_citizen">Left With Citizen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
        );

      case 'medication_round':
        return (
          <div className="space-y-3" key="medication_round">
              <Label>Would You Like To Add A Medication Round For This Visit? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setFormData({...formData, add_medication_round: 'yes'});
                    setShowMARPopup(true);
                    setExpandedMedicationOutcome(true);
                  }}
                  className={formData.add_medication_round === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, add_medication_round: 'no'})}
                  className={formData.add_medication_round === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>
              {formData.add_medication_round === 'yes' && (
                <>
                  <p className="text-sm font-medium text-teal-700 bg-teal-50 p-3 rounded-lg">
                    Medication Offered See MAR Chart
                  </p>
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <button
                      onClick={() => setExpandedMedicationOutcome(!expandedMedicationOutcome)}
                      className="flex items-center gap-2 font-semibold text-slate-900 hover:text-teal-600 transition-colors"
                    >
                      <span className={`transform transition-transform ${expandedMedicationOutcome ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      Medication Round Outcome *
                    </button>
                    {expandedMedicationOutcome && (
                      <div className="space-y-2 pl-6">
                        {['Accepted & Consumed', 'Left With Citizen Or Family To Administer', 'Refused By Citizen', 'Not Offered For Other Reasons Please See Notes'].map((option) => (
                          <div key={option} className="flex items-center gap-3">
                            <input
                              type="radio"
                              id={option}
                              name="medication_round_outcome"
                              value={option}
                              checked={formData.medication_round_outcome === option}
                              onChange={() => setFormData({...formData, medication_round_outcome: option})}
                              className="w-4 h-4"
                            />
                            <label htmlFor={option} className="cursor-pointer text-sm">{option}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
        );

      case 'medication_concerns':
        return (
          <div className="space-y-3" key="medication_concerns">
              <Label>Any Medication Concerns To Be Flagged? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, medication_concerns: 'yes'})}
                  className={formData.medication_concerns === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, medication_concerns: 'no', medication_concerns_details: ''})}
                  className={formData.medication_concerns === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.medication_concerns === 'yes' && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="bg-red-100 border-2 border-red-600 rounded-lg p-3">
                    <p className="font-bold text-red-700">PLEASE CALL OFFICE EMERGENCY NUMBER - 01824 538688</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Detail Issues, Concerns, Witness & who you have reported this to. Consider Safeguarding Prior to leaving the call.</Label>
                    <div className="flex gap-2 mt-2">
                      <Textarea
                        value={formData.medication_concerns_details}
                        onChange={(e) => setFormData({...formData, medication_concerns_details: e.target.value})}
                        placeholder="Describe medication concerns in detail..."
                        rows={6}
                        className="flex-1"
                      />
                      <div className="flex flex-col gap-2">
                        <SpeechButton
                           onResult={(text) => setFormData(prev => ({ ...prev, medication_concerns_details: (prev.medication_concerns_details || '') + ' ' + text }))}
                           className="h-12 px-3"
                         />
                         <Button
                           type="button"
                           onClick={() => setFormData({...formData, medication_concerns_details: ''})}
                           className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                           title="Clear text"
                         >
                           <Trash2 className="w-5 h-5" />
                         </Button>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'further_concerns':
        return (
          <div className="space-y-3" key="further_concerns">
              <Label>Any Further Concerns To Raise? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, further_concerns: 'yes'})}
                  className={formData.further_concerns === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, further_concerns: 'no', further_concerns_details: ''})}
                  className={formData.further_concerns === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.further_concerns === 'yes' && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="bg-red-100 border-2 border-red-600 rounded-lg p-3">
                    <p className="font-bold text-red-700">PLEASE CALL OFFICE EMERGENCY NUMBER - 01824 538688</p>
                  </div>
                  <Label>Further Concerns Details</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={formData.further_concerns_details}
                      onChange={(e) => setFormData({...formData, further_concerns_details: e.target.value})}
                      placeholder="Describe any further concerns..."
                      rows={6}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <SpeechButton
                        onResult={(text) => setFormData(prev => ({ ...prev, further_concerns_details: (prev.further_concerns_details || '') + ' ' + text }))}
                        className="h-12 px-3"
                      />
                      <Button
                        type="button"
                        onClick={() => setFormData({...formData, further_concerns_details: ''})}
                        className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                        title="Clear text"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
        );

      case 'healthcare_visit':
        return (
          <div className="space-y-3" key="healthcare_visit">
             <Label>Is A Healthcare Visit Required? *</Label>
             <div className="flex gap-3">
               <Button
                 type="button"
                 onClick={() => setFormData({...formData, healthcare_visit_required: 'yes'})}
                 className={formData.healthcare_visit_required === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
               >
                 Yes
               </Button>
               <Button
                 type="button"
                 onClick={() => setFormData({...formData, healthcare_visit_required: 'no', healthcare_visit_type: ''})}
                 className={formData.healthcare_visit_required === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
               >
                 No
               </Button>
             </div>

             {formData.healthcare_visit_required === 'yes' && (
               <div className="mt-4 space-y-3 border-t pt-4">
                 <Label className="font-semibold">Type of Healthcare Professional Required</Label>
                 <div className="space-y-2">
                   {['Doctor GP', 'Nurse', 'Occupational Therapist', 'Ambulance Non Urgent', 'Ambulance Urgent', 'Mental Health Advisor', 'Social Worker', 'Podiatrist', 'Dentist', 'Optician', 'Audiology'].map((option) => (
                     <div key={option} className="flex items-center gap-3">
                       <input
                         type="radio"
                         id={`healthcare-${option}`}
                         name="healthcare_visit_type"
                         value={option}
                         checked={formData.healthcare_visit_type === option}
                         onChange={() => setFormData({...formData, healthcare_visit_type: option})}
                         className="w-4 h-4"
                       />
                       <label htmlFor={`healthcare-${option}`} className="cursor-pointer text-sm">{option}</label>
                     </div>
                   ))}
                 </div>
               </div>
             )}
            </div>
        );

      case 'extended_notes':
        return (
          <div className="space-y-3" key="extended_notes">
              <Label>Extended Notes For This Visit? *</Label>
              <div className="flex gap-2">
                <Textarea
                  value={formData.extended_notes}
                  onChange={(e) => setFormData({...formData, extended_notes: e.target.value})}
                  placeholder="Enter extended notes for this visit..."
                  rows={8}
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  <SpeechButton
                    onResult={(text) => setFormData(prev => ({ ...prev, extended_notes: (prev.extended_notes || '') + ' ' + text }))}
                    className="h-12 px-3"
                  />
                  <Button
                    type="button"
                    onClick={() => setFormData({...formData, extended_notes: ''})}
                    className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                    title="Clear text"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
        );

      case 'staff_information':
        return (
          <React.Fragment key="staff_information">
            <div className="space-y-3">
              <Label>Grade Of Staff Member Filling Out This Form *</Label>
              <div className="space-y-2">
                {['Care Practitioner', 'Manager', 'Medic', 'Trainee', 'RI', 'RM'].map((option) => (
                  <div key={option} className="flex items-center gap-3">
                    <input
                      type="radio"
                      id={`staff-grade-${option}`}
                      name="staff_grade"
                      value={option}
                      checked={formData.staff_grade === option}
                      onChange={() => setFormData({...formData, staff_grade: option})}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`staff-grade-${option}`} className="cursor-pointer text-sm">{option}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Was This A Double Handed Call? *</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, double_handed_call: 'yes', staff_2: ''})}
                  className={formData.double_handed_call === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, double_handed_call: 'no', staff_1: '', staff_2: ''})}
                  className={formData.double_handed_call === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >
                  No
                </Button>
              </div>

              {formData.double_handed_call && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <Label>Staff 1 *</Label>
                    <Select value={formData.staff_1} onValueChange={(value) => setFormData({...formData, staff_1: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.double_handed_call === 'yes' && (
                    <div>
                      <Label>Staff 2 *</Label>
                      <Select value={formData.staff_2} onValueChange={(value) => setFormData({...formData, staff_2: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  if (submittedCareLog) {
    return (
      <CareLogViewer
        careLog={submittedCareLog}
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSubmittedCareLog(null);
            onClose();
          }
        }}
      />
    );
  }

  return (
    <>
      <DraftRecoveryPrompt open={open && hasDraft} onRestore={restoreDraft} onDiscard={discardDraft} />
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Care Log - {serviceUser?.full_name}</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">{shift?.date} • {shift?.start_time} - {shift?.end_time}</p>
        </DialogHeader>

        <div className="space-y-6">
          {enabledSections.map(section => {
            if (section.type === 'custom') {
              return (
                <CustomSectionRenderer
                  key={section.id}
                  section={section}
                  values={customFields[section.id] || {}}
                  onChange={handleCustomFieldChange(section.id)}
                />
              );
            }
            return (
              <React.Fragment key={section.id}>
                {renderBuiltinSection(section.id)}
              </React.Fragment>
            );
          })}

          {/* Timestamp - always shown */}
          <div className="space-y-3">
              <Label>Time of Log Submission *</Label>
              <Input
                type="datetime-local"
                value={formData.timestamp ? new Date(formData.timestamp).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({...formData, timestamp: new Date(e.target.value).toISOString()})}
                className="w-full"
              />
            </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Care Log
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MAR Chart Popup */}
      {showMARPopup && (
        <div className="fixed inset-0 z-50 flex">
          <div className="ml-auto w-full max-w-4xl bg-white shadow-lg overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Medication Administration Record - {serviceUser?.full_name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMARPopup(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <MARChart serviceUserId={serviceUser?.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}