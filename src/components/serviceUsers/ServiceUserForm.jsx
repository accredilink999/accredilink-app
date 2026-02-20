import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Plus, Trash2, FileIcon, Download, X, ChevronDown, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { deployClientCallsToRota } from '@/utils/deployPattern';
import MARChart from '@/components/medications/MARChart';
import ClientRotaSetup from '@/components/serviceUsers/ClientRotaSetup';
import DraftRecoveryPrompt from '@/components/ui/DraftRecoveryPrompt';

// Draft persistence helpers
const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
function loadDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > DRAFT_MAX_AGE) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}
function saveDraftToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() })); } catch {}
}
function removeDraft(key) {
  try { localStorage.removeItem(key); } catch {}
}

export default function ServiceUserForm({ serviceUser, open, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!serviceUser;
  const [showRotaSetup, setShowRotaSetup] = useState(false);
  const [newServiceUser, setNewServiceUser] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const formDirtyRef = useRef(false);
  const prevOpenRef = useRef(false);
  const draftKey = isEdit ? `draft:service-user:${serviceUser?.id}` : 'draft:service-user:new';

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  // Initialize call times from serviceUser with proper IDs
  const initialCallTimes = serviceUser?.call_times?.map((call, idx) => ({
    ...call,
    id: `existing-${idx}`
  })) || [];
  
  const [formData, setFormData] = useState(() => {
    if (serviceUser) {
      const { call_times, ...rest } = serviceUser;
      return rest;
    }
    return {
      full_name: '',
      date_of_birth: '',
      address: '',
      postcode: '',
      phone: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      gp_name: '',
      gp_phone: '',
      nhs_number: '',
      care_plan: '',
      risk_assessments: '',
      preferences: '',
      allergies: '',
      dietary_requirements: '',
      mobility_level: 'independent',
      communication_needs: '',
      key_safe_code: '',
      status: 'active',
      notes: '',
      quick_reference: '',
      what_matters_to_me: '',
      brief_history: '',
      medical_history: '',
      dna_cpr_in_place: '',
      assistance_equipment: '',
      emergency_shutoff_water: '',
      emergency_shutoff_electricity: '',
      emergency_shutoff_gas: '',
      pets_in_property: '',
      personal_plan_aims: '',
      risk_management: '',
      person_centred_plan: '',
      care_plan_date: new Date().toISOString().split('T')[0],
      plan_completed_by: '',
      plan_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  });

  const [callTimes, setCallTimes] = useState(initialCallTimes);
  const [editingCallId, setEditingCallId] = useState(null);
  const [newCall, setNewCall] = useState({ time: '', duration: '', type: 'visit', notes: '', tasks: [] });
  const [newTaskInput, setNewTaskInput] = useState('');
  
  // Parse person centred plan calls
  const parsePersonCentredCalls = (data) => {
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [personCentredCalls, setPersonCentredCalls] = useState(() => 
    parsePersonCentredCalls(formData.person_centred_plan)
  );
  const [newPersonCentredCall, setNewPersonCentredCall] = useState({ call_number: '', section1: '', section2: '', section3: '' });
  const [editingPCCallId, setEditingPCCallId] = useState(null);
  
  const [riskAssessmentFiles, setRiskAssessmentFiles] = useState(
    serviceUser?.risk_assessment_files?.map((file, idx) => ({ ...file, id: `existing-${idx}` })) || []
  );
  const [uploadingRisk, setUploadingRisk] = useState(false);
  
  const riskCategories = ['Health', 'Medication', 'Mobility', 'Nutrition', 'Environment'];

  const [riskRows, setRiskRows] = useState(() => {
         const defaultRows = riskCategories.map((cat, idx) => ({ col1: cat, col2: '', col3: '' }));
         if (serviceUser?.risk_assessment_rows) {
           try {
             const parsed = JSON.parse(serviceUser.risk_assessment_rows);
             if (Array.isArray(parsed) && parsed.length > 0) {
               // Merge saved data with defaults, preserving col2 and col3 values
               const mergedRows = defaultRows.map((defaultRow, idx) => {
                 const savedRow = parsed[idx];
                 return {
                   col1: defaultRow.col1,
                   col2: savedRow?.col2 ?? '',
                   col3: savedRow?.col3 ?? ''
                 };
               });
               // Add any additional risks beyond the defaults
               const additionalRisks = parsed.slice(riskCategories.length).map(row => ({
                 col1: row.col1 ?? '',
                 col2: row.col2 ?? '',
                 col3: row.col3 ?? ''
               }));
               return [...mergedRows, ...additionalRisks];
             }
             return defaultRows;
           } catch {
             return defaultRows;
           }
         }
         return defaultRows;
       });
  const [newAdditionalRisk, setNewAdditionalRisk] = useState({ col1: '', col2: '', col3: '' });
  const [additionalRiskCollapsed, setAdditionalRiskCollapsed] = useState(true);
  const [editingRiskIndex, setEditingRiskIndex] = useState(null);

  // Only reset form when dialog transitions from closed → open (not on every serviceUser change)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (!justOpened) return;

    // Check for saved draft
    const key = isEdit ? `draft:service-user:${serviceUser?.id}` : 'draft:service-user:new';
    const draft = loadDraft(key);
    if (draft) {
      setHasDraft(true);
    }

    formDirtyRef.current = false;

    if (serviceUser) {
      const { call_times, ...rest } = serviceUser;
      setFormData(rest);
      setCallTimes(serviceUser.call_times?.map((call, idx) => ({ ...call, id: `existing-${idx}` })) || []);
      setPersonCentredCalls(parsePersonCentredCalls(serviceUser.person_centred_plan));
    } else {
      setFormData({
        full_name: '',
        date_of_birth: '',
        address: '',
        postcode: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        gp_name: '',
        gp_phone: '',
        nhs_number: '',
        care_plan: '',
        risk_assessments: '',
        preferences: '',
        allergies: '',
        dietary_requirements: '',
        mobility_level: 'independent',
        communication_needs: '',
        key_safe_code: '',
        status: 'active',
        notes: '',
        quick_reference: '',
        what_matters_to_me: '',
        brief_history: '',
        medical_history: '',
        dna_cpr_in_place: '',
        assistance_equipment: '',
        emergency_shutoff_water: '',
        emergency_shutoff_electricity: '',
        emergency_shutoff_gas: '',
        pets_in_property: '',
        personal_plan_aims: '',
        risk_management: '',
        person_centred_plan: '',
        care_plan_date: new Date().toISOString().split('T')[0],
        plan_completed_by: '',
        plan_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setCallTimes([]);
      setPersonCentredCalls([]);
    }
    setEditingCallId(null);
    setNewCall({ time: '', duration: '', type: 'visit', notes: '', tasks: [] });
    setNewTaskInput('');
    setEditingPCCallId(null);
    setNewPersonCentredCall({ call_number: '', section1: '', section2: '', section3: '' });
    if (serviceUser?.risk_assessment_files) {
      setRiskAssessmentFiles(serviceUser.risk_assessment_files.map((file, idx) => ({ ...file, id: `existing-${idx}` })));
    } else {
      setRiskAssessmentFiles([]);
    }
    const defaultRows = riskCategories.map((cat) => ({ col1: cat, col2: '', col3: '' }));
    if (serviceUser?.risk_assessment_rows) {
      try {
        const parsed = JSON.parse(serviceUser.risk_assessment_rows);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mergedRows = defaultRows.map((defaultRow, idx) => {
            const savedRow = parsed[idx];
            return { col1: defaultRow.col1, col2: savedRow?.col2 ?? '', col3: savedRow?.col3 ?? '' };
          });
          const additionalRisks = parsed.slice(riskCategories.length).map(row => ({
            col1: row.col1 ?? '', col2: row.col2 ?? '', col3: row.col3 ?? ''
          }));
          setRiskRows([...mergedRows, ...additionalRisks]);
        } else {
          setRiskRows(defaultRows);
        }
      } catch {
        setRiskRows(defaultRows);
      }
    } else {
      setRiskRows(defaultRows);
    }
  }, [open, serviceUser?.id]);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (!open) return;
    formDirtyRef.current = true;
    const timer = setTimeout(() => {
      saveDraftToStorage(draftKey, { formData, callTimes, personCentredCalls, riskRows, riskAssessmentFiles });
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, callTimes, personCentredCalls, riskRows, riskAssessmentFiles]);

  // Flush draft on page hide / app background
  useEffect(() => {
    if (!open) return;
    const flush = () => {
      if (formDirtyRef.current) {
        saveDraftToStorage(draftKey, { formData, callTimes, personCentredCalls, riskRows, riskAssessmentFiles });
      }
    };
    const onVisChange = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('pagehide', flush);
    };
  }, [open, draftKey, formData, callTimes, personCentredCalls, riskRows, riskAssessmentFiles]);

  // Restore draft handler
  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft(draftKey);
    if (draft) {
      if (draft.formData) setFormData(draft.formData);
      if (draft.callTimes) setCallTimes(draft.callTimes);
      if (draft.personCentredCalls) setPersonCentredCalls(draft.personCentredCalls);
      if (draft.riskRows) setRiskRows(draft.riskRows);
      if (draft.riskAssessmentFiles) setRiskAssessmentFiles(draft.riskAssessmentFiles);
      toast.success('Draft restored');
    }
    setHasDraft(false);
  }, [draftKey]);

  const handleDiscardDraft = useCallback(() => {
    removeDraft(draftKey);
    setHasDraft(false);
  }, [draftKey]);

  // Safe close — warn if dirty
  const handleSafeClose = useCallback(() => {
    if (formDirtyRef.current) {
      setConfirmCloseOpen(true);
    } else {
      onClose();
    }
  }, [onClose]);

  const handleConfirmClose = useCallback(() => {
    setConfirmCloseOpen(false);
    // Draft is already saved via auto-save
    onClose();
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      let result;
      if (isEdit) {
        result = await base44.entities.ServiceUser.update(serviceUser.id, data);
      } else {
        result = await base44.entities.ServiceUser.create(data);
      }
      return result;
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      toast.success(isEdit ? 'Client updated successfully' : 'Client created successfully');
      removeDraft(draftKey);
      formDirtyRef.current = false;
      onClose();

      // Auto-deploy call times to rota shifts
      try {
        const suId = result?.id || serviceUser?.id;
        const suAreaId = result?.area_id || serviceUser?.area_id || formData.area_id;
        const suCallTimes = result?.call_times || callTimes.map(({ id, ...c }) => ({ ...c, duration: String(c.duration) }));
        if (suId && suAreaId && suCallTimes.length > 0) {
          const { created } = await deployClientCallsToRota({
            serviceUserId: suId,
            serviceUserName: formData.full_name || serviceUser?.full_name || '',
            serviceUserAddress: formData.address || serviceUser?.address || '',
            areaId: suAreaId,
            callTimes: suCallTimes,
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
    },
    onError: (error) => {
      console.error('Client save error:', error);
      toast.error(`Failed to save client: ${error.message || 'Unknown error'}`);
    },
  });

  const handleAddCallTask = () => {
    const text = newTaskInput.trim();
    if (!text) return;
    setNewCall(prev => ({ ...prev, tasks: [...(prev.tasks || []), text] }));
    setNewTaskInput('');
  };

  const handleRemoveCallTask = (idx) => {
    setNewCall(prev => ({ ...prev, tasks: (prev.tasks || []).filter((_, i) => i !== idx) }));
  };

  const handleAddCall = () => {
    if (newCall.time && newCall.duration) {
      if (editingCallId) {
        setCallTimes(callTimes.map(call =>
          call.id === editingCallId ? { ...newCall, id: editingCallId } : call
        ));
        setEditingCallId(null);
      } else {
        setCallTimes([...callTimes, { ...newCall, id: Date.now() }]);
      }
      setNewCall({ time: '', duration: '', type: 'visit', notes: '', tasks: [] });
      setNewTaskInput('');
    }
  };

  const handleEditCall = (call) => {
    setEditingCallId(call.id);
    setNewCall({ time: call.time, duration: call.duration, type: call.type, notes: call.notes, tasks: call.tasks || [] });
    setNewTaskInput('');
  };

  const handleRemoveCall = (id) => {
    setCallTimes(callTimes.filter(call => call.id !== id));
    if (editingCallId === id) {
      setEditingCallId(null);
      setNewCall({ time: '', duration: '', type: 'visit', notes: '', tasks: [] });
      setNewTaskInput('');
    }
  };

  const handleAddPersonCentredCall = () => {
    if (newPersonCentredCall.call_number && newPersonCentredCall.section1 && newPersonCentredCall.section2 && newPersonCentredCall.section3) {
      if (editingPCCallId) {
        setPersonCentredCalls(personCentredCalls.map(call =>
          call.id === editingPCCallId ? { ...newPersonCentredCall, id: editingPCCallId } : call
        ));
        setEditingPCCallId(null);
      } else {
        setPersonCentredCalls([...personCentredCalls, { ...newPersonCentredCall, id: Date.now() }]);
      }
      setNewPersonCentredCall({ call_number: '', section1: '', section2: '', section3: '' });
      // Focus back to call number field for next entry
      setTimeout(() => document.getElementById('pc-call-number')?.focus(), 0);
    }
  };

  const handleEditPersonCentredCall = (call) => {
    setEditingPCCallId(call.id);
    setNewPersonCentredCall({ call_number: call.call_number, section1: call.section1, section2: call.section2, section3: call.section3 });
  };

  const handleRemovePersonCentredCall = (id) => {
    setPersonCentredCalls(personCentredCalls.filter(call => call.id !== id));
    if (editingPCCallId === id) {
      setEditingPCCallId(null);
      setNewPersonCentredCall({ call_number: '', section1: '', section2: '', section3: '' });
    }
  };

  const handleUploadRiskFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingRisk(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setRiskAssessmentFiles([...riskAssessmentFiles, {
          id: Date.now(),
          name: file.name,
          url: file_url,
          type: file.type
        }]);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploadingRisk(false);
      e.target.value = '';
    }
  };

  const handleRemoveRiskFile = (id) => {
    setRiskAssessmentFiles(riskAssessmentFiles.filter(file => file.id !== id));
  };

  const handleUpdateRiskRow = (index, col, value) => {
        const newRows = [...riskRows];
        newRows[index] = { ...newRows[index], [col]: value };
        setRiskRows(newRows);
      };

  const handleAddAdditionalRisk = () => {
        if (newAdditionalRisk.col1 && newAdditionalRisk.col2) {
          if (editingRiskIndex !== null) {
            const updatedRows = [...riskRows];
            updatedRows[editingRiskIndex] = { ...newAdditionalRisk, id: updatedRows[editingRiskIndex].id };
            setRiskRows(updatedRows);
            setEditingRiskIndex(null);
          } else {
            setRiskRows([...riskRows, { ...newAdditionalRisk, id: Date.now() }]);
          }
          setNewAdditionalRisk({ col1: '', col2: '', col3: '' });
        }
      };

  const handleRemoveAdditionalRisk = (index) => {
        setRiskRows(riskRows.filter((_, i) => i !== index));
      };

  const handleSubmit = () => {
     const cleanedCallTimes = callTimes.map(({ id, ...call }) => ({
       ...call,
       duration: String(call.duration)
     }));

     // Save person centred calls as JSON
     const cleanedPersonCentredCalls = personCentredCalls.map(({ id, ...call }) => call);

     // Clean empty strings for DATE columns — PostgreSQL rejects '' for DATE type
     const cleanedFormData = { ...formData };
     ['date_of_birth', 'care_plan_date', 'plan_review_date'].forEach(field => {
       if (!cleanedFormData[field]) cleanedFormData[field] = null;
     });

    // Generate comprehensive care plan from all form data
    const comprehensivePlan = `COMPREHENSIVE CARE PLAN - ${formData.full_name}

PERSONAL INFORMATION:
- Full Name: ${formData.full_name}
- Date of Birth: ${formData.date_of_birth || 'Not provided'}
- Address: ${formData.address}
- Postcode: ${formData.postcode || 'Not provided'}
- Phone: ${formData.phone || 'Not provided'}
- Key Safe Code: ${formData.key_safe_code || 'Not provided'}

EMERGENCY CONTACT:
- Name: ${formData.emergency_contact_name || 'Not provided'}
- Phone: ${formData.emergency_contact_phone || 'Not provided'}
- Relationship: ${formData.emergency_contact_relationship || 'Not provided'}

MEDICAL INFORMATION:
- GP Name: ${formData.gp_name || 'Not provided'}
- GP Phone: ${formData.gp_phone || 'Not provided'}
- NHS Number: ${formData.nhs_number || 'Not provided'}
- Allergies: ${formData.allergies || 'None known'}
- Dietary Requirements: ${formData.dietary_requirements || 'None'}

CARE DETAILS:
- Mobility Level: ${formData.mobility_level}
- Status: ${formData.status}
- Communication Needs: ${formData.communication_needs || 'None specified'}
- Preferences: ${formData.preferences || 'None specified'}

RISK ASSESSMENTS:
${formData.risk_assessments || 'No risk assessments recorded'}

SCHEDULED CALL TIMES:
${cleanedCallTimes.length > 0 
  ? cleanedCallTimes.map(call => 
      `- ${call.time} (${call.duration} mins) - ${call.type}${call.notes ? ': ' + call.notes : ''}`
    ).join('\n')
  : 'No scheduled calls'}

ADDITIONAL NOTES:
${formData.notes || 'None'}

${formData.care_plan ? `CARE PLAN DETAILS:\n${formData.care_plan}` : ''}`;

    const cleanedRiskFiles = riskAssessmentFiles.map(({ id, ...file }) => file);

      // Keep all default rows, only remove completely empty additional risks
        const trimmedRiskRows = riskRows.filter((row, idx) => {
          // Always keep the default 5 category rows
          if (idx < riskCategories.length) return true;
          // For additional risks, keep only if col2 or col3 has content
          return row.col2 || row.col3;
        });

      console.log('Trimmed risk rows:', trimmedRiskRows);
      console.log('Risk assessment rows string:', JSON.stringify(trimmedRiskRows));
      
      mutation.mutate({
        ...cleanedFormData,
        care_plan: comprehensivePlan,
        call_times: cleanedCallTimes,
        person_centred_plan: cleanedPersonCentredCalls.length > 0 ? JSON.stringify(cleanedPersonCentredCalls) : '',
        risk_assessment_files: cleanedRiskFiles.length > 0 ? cleanedRiskFiles : [],
        risk_assessment_rows: JSON.stringify(trimmedRiskRows)
      });
  };

  return (
    <>
    <DraftRecoveryPrompt open={open && hasDraft} onRestore={handleRestoreDraft} onDiscard={handleDiscardDraft} />
    <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            Your changes have been saved as a draft. You can restore them next time you open this form.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <AlertDialogCancel onClick={() => setConfirmCloseOpen(false)}>Continue Editing</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">Close Anyway</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !mutation.isPending) handleSafeClose(); }}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Service User' : 'Add New Service User'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
           <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
             <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
             <TabsTrigger value="emergency" className="text-xs sm:text-sm">Emergency</TabsTrigger>
             <TabsTrigger value="medical" className="text-xs sm:text-sm">Medical</TabsTrigger>
             <TabsTrigger value="care" className="text-xs sm:text-sm">Care</TabsTrigger>
             <TabsTrigger value="calls" className="text-xs sm:text-sm">Calls</TabsTrigger>
             <TabsTrigger value="medications" className="text-xs sm:text-sm">Meds & MAR</TabsTrigger>
           </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Address *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Postcode</Label>
                <Input
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  placeholder="Postcode"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <Label>Key Safe Code</Label>
              <Input
                value={formData.key_safe_code}
                onChange={(e) => setFormData({...formData, key_safe_code: e.target.value})}
                placeholder="Key safe code"
              />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 mt-4">
            <div>
              <Label>Emergency Contact Name</Label>
              <Input
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label>Emergency Contact Phone</Label>
              <Input
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                placeholder="Contact phone"
              />
            </div>
            <div>
              <Label>Relationship</Label>
              <Input
                value={formData.emergency_contact_relationship}
                onChange={(e) => setFormData({...formData, emergency_contact_relationship: e.target.value})}
                placeholder="e.g., Daughter, Son"
              />
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GP Name</Label>
                <Input
                  value={formData.gp_name}
                  onChange={(e) => setFormData({...formData, gp_name: e.target.value})}
                  placeholder="GP name"
                />
              </div>
              <div>
                <Label>GP Phone</Label>
                <Input
                  value={formData.gp_phone}
                  onChange={(e) => setFormData({...formData, gp_phone: e.target.value})}
                  placeholder="GP phone"
                />
              </div>
            </div>

            <div>
              <Label>NHS Number</Label>
              <Input
                value={formData.nhs_number}
                onChange={(e) => setFormData({...formData, nhs_number: e.target.value})}
                placeholder="NHS number"
              />
            </div>

            <div>
              <Label>Allergies</Label>
              <Textarea
                value={formData.allergies}
                onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                placeholder="List any allergies..."
                rows={2}
              />
            </div>

            <div>
              <Label>Dietary Requirements</Label>
              <Textarea
                value={formData.dietary_requirements}
                onChange={(e) => setFormData({...formData, dietary_requirements: e.target.value})}
                placeholder="Any dietary requirements..."
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="care" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mobility Level</Label>
                <Select value={formData.mobility_level} onValueChange={(value) => setFormData({...formData, mobility_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="needs_assistance">Needs Assistance</SelectItem>
                    <SelectItem value="wheelchair_user">Wheelchair User</SelectItem>
                    <SelectItem value="bedbound">Bedbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="discharged">Discharged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>



            {/* Care Plan Sections */}
            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">My Quick Reference & Preferences</h3>
              <Textarea
                value={formData.quick_reference}
                onChange={(e) => setFormData({...formData, quick_reference: e.target.value})}
                placeholder="Enter quick reference information and preferences..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">What Matters To Me</h3>
              <Textarea
                value={formData.what_matters_to_me}
                onChange={(e) => setFormData({...formData, what_matters_to_me: e.target.value})}
                placeholder="Describe what is important to you, your values, and priorities..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Brief History Of Me</h3>
              <Textarea
                value={formData.brief_history}
                onChange={(e) => setFormData({...formData, brief_history: e.target.value})}
                placeholder="Provide a brief history or background information..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Communication Needs</h3>
              <Textarea
                value={formData.communication_needs}
                onChange={(e) => setFormData({...formData, communication_needs: e.target.value})}
                placeholder="Any communication needs..."
                rows={2}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Overall Aims Of My Personal Plan</h3>
              <Textarea
                value={formData.personal_plan_aims}
                onChange={(e) => setFormData({...formData, personal_plan_aims: e.target.value})}
                placeholder="Outline the main goals and objectives..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">My Medical History</h3>
              <Textarea
                value={formData.medical_history}
                onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                placeholder="Describe relevant medical history and conditions..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">DNA CPR In Place</h3>
              <Select value={formData.dna_cpr_in_place || ''} onValueChange={(value) => setFormData({...formData, dna_cpr_in_place: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {formData.dna_cpr_in_place === 'yes' && (
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-600 rounded">
                  <p className="text-red-700 font-bold">DNA CPR In Place</p>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-4 text-lg text-center">Managing Risk</h3>
              <div className="space-y-3">
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border-r border-slate-300 p-2 w-1/6 font-semibold text-slate-700 text-sm text-left">Risk Category</th>
                        <th className="border-r border-slate-300 p-2 w-5/12 font-semibold text-slate-700 text-sm text-left">Person Specific Risks</th>
                        <th className="p-2 w-1/6 font-semibold text-slate-700 text-sm text-left">Managing The Risks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskRows.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-100'}>
                          <td className="border-r border-slate-300 p-2 w-1/6 font-semibold text-slate-700 text-sm">
                            {index < riskCategories.length ? riskCategories[index] : row.col1}
                          </td>
                          <td className="border-r border-slate-300 p-2 w-5/12 align-top">
                            <textarea
                              value={row.col2}
                              onChange={(e) => handleUpdateRiskRow(index, 'col2', e.target.value)}
                              placeholder="Risk/Symptom"
                              className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none resize-none"
                              rows="3"
                            />
                          </td>
                          <td className="p-2 w-1/6 align-top">
                            <textarea
                              value={row.col3}
                              onChange={(e) => handleUpdateRiskRow(index, 'col3', e.target.value)}
                              placeholder="Managing the risks"
                              className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none resize-none"
                              rows="3"
                            />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                      </table>
                      </div>

                      <Collapsible open={!additionalRiskCollapsed} onOpenChange={(open) => setAdditionalRiskCollapsed(!open)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full justify-between mb-4 border-slate-300 hover:bg-slate-50">
                            <span className="text-sm font-semibold text-slate-900">Add Additional Risk</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${!additionalRiskCollapsed ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                          <div>
                            <Label className="text-xs">Risk Category</Label>
                            <Input
                              value={newAdditionalRisk.col1}
                              onChange={(e) => setNewAdditionalRisk({...newAdditionalRisk, col1: e.target.value})}
                              placeholder="e.g., Falls, Pressure Wounds, etc."
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Risk/Symptom</Label>
                            <textarea
                              value={newAdditionalRisk.col2}
                              onChange={(e) => setNewAdditionalRisk({...newAdditionalRisk, col2: e.target.value})}
                              placeholder="Describe the risk or symptom..."
                              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              rows="2"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Managing the Risks</Label>
                            <textarea
                              value={newAdditionalRisk.col3}
                              onChange={(e) => setNewAdditionalRisk({...newAdditionalRisk, col3: e.target.value})}
                              placeholder="How to manage or reduce this risk..."
                              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              rows="2"
                            />
                          </div>
                          <Button
                            onClick={handleAddAdditionalRisk}
                            disabled={!newAdditionalRisk.col1 || !newAdditionalRisk.col2}
                            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {editingRiskIndex !== null ? 'Update Risk' : 'Add Risk'}
                          </Button>
                          {editingRiskIndex !== null && (
                            <Button
                              onClick={() => {
                                setEditingRiskIndex(null);
                                setNewAdditionalRisk({ col1: '', col2: '', col3: '' });
                              }}
                              variant="outline"
                              className="w-full"
                            >
                              Cancel Edit
                            </Button>
                          )}
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg">
                        <Label className="font-semibold text-slate-900">Risk Notes</Label>
                        <Textarea
                          value={formData.risk_assessments}
                          onChange={(e) => setFormData({...formData, risk_assessments: e.target.value})}
                          placeholder="Additional risk assessment notes..."
                          rows={6}
                          className="mt-2"
                        />
                      </div>
                
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Upload Assessment Documents</Label>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleUploadRiskFile}
                    disabled={uploadingRisk}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-500 mt-2">PDF, images, or documents (multiple files)</p>
                </div>

                {riskAssessmentFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Attached Documents</Label>
                    {riskAssessmentFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded">
                        <div className="flex items-center gap-2 flex-1">
                          <FileIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {file.url && (
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="w-4 h-4 text-teal-600" />
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRiskFile(file.id)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Assistance Equipment In the Property</h3>
              <Textarea
                value={formData.assistance_equipment}
                onChange={(e) => setFormData({...formData, assistance_equipment: e.target.value})}
                placeholder="List all equipment available in the property..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Location Of Emergency Shut Offs In The Property</h3>
              <div className="space-y-3">
                <div>
                  <Label>Water Shut Off Location</Label>
                  <Textarea
                    value={formData.emergency_shutoff_water}
                    onChange={(e) => setFormData({...formData, emergency_shutoff_water: e.target.value})}
                    placeholder="Describe location of water shut off..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Electricity Shut Off Location</Label>
                  <Textarea
                    value={formData.emergency_shutoff_electricity}
                    onChange={(e) => setFormData({...formData, emergency_shutoff_electricity: e.target.value})}
                    placeholder="Describe location of electricity shut off..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Gas Shut Off Location</Label>
                  <Textarea
                    value={formData.emergency_shutoff_gas}
                    onChange={(e) => setFormData({...formData, emergency_shutoff_gas: e.target.value})}
                    placeholder="Describe location of gas shut off..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Pets In Property</h3>
              <Select value={formData.pets_in_property?.startsWith('yes') ? 'yes' : (formData.pets_in_property?.startsWith('no') ? 'no' : '')} onValueChange={(value) => {
                if (value === 'no') {
                  setFormData({...formData, pets_in_property: 'no'});
                } else if (value === 'yes') {
                  setFormData({...formData, pets_in_property: 'yes'});
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {formData.pets_in_property && !formData.pets_in_property.startsWith('no') && (
                <div className="mt-3">
                  <Label>Pet Details</Label>
                  <Textarea
                    value={formData.pets_in_property === 'yes' ? '' : formData.pets_in_property}
                    onChange={(e) => setFormData({...formData, pets_in_property: e.target.value})}
                    placeholder="List any pets and relevant information..."
                    rows={2}
                  />
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-3 text-lg">Risk Management</h3>
              <Textarea
                value={formData.risk_management}
                onChange={(e) => setFormData({...formData, risk_management: e.target.value})}
                placeholder="Detail risk management strategies..."
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 bg-slate-50">
               <h3 className="font-semibold text-slate-900 mb-3 text-lg">Person Centred Plan By Call</h3>
               <div className="space-y-3">
                 <div>
                   <Label>Call Number/Name</Label>
                   <Select value={newPersonCentredCall.call_number} onValueChange={(value) => setNewPersonCentredCall({...newPersonCentredCall, call_number: value})}>
                     <SelectTrigger id="pc-call-number">
                       <SelectValue placeholder="Select call type..." />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Early Call">Early Call</SelectItem>
                       <SelectItem value="Morning Call">Morning Call</SelectItem>
                       <SelectItem value="Lunch Call">Lunch Call</SelectItem>
                       <SelectItem value="Late Call">Late Call</SelectItem>
                       <SelectItem value="Bed Call">Bed Call</SelectItem>
                       <SelectItem value="Nightshift">Nightshift</SelectItem>
                       <SelectItem value="Sitting Service">Sitting Service</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label className="text-sm font-semibold text-teal-700">Section 1: Intended Outcome</Label>
                   <Textarea
                     value={newPersonCentredCall.section1}
                     onChange={(e) => setNewPersonCentredCall({...newPersonCentredCall, section1: e.target.value})}
                     placeholder="What is the intended outcome of this call..."
                     rows={3}
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-semibold text-teal-700">Section 2: Needs & Preferences</Label>
                   <Textarea
                     value={newPersonCentredCall.section2}
                     onChange={(e) => setNewPersonCentredCall({...newPersonCentredCall, section2: e.target.value})}
                     placeholder="Client's needs and preferences for this call..."
                     rows={3}
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-semibold text-teal-700">Section 3: Care Staff Actions</Label>
                   <Textarea
                     value={newPersonCentredCall.section3}
                     onChange={(e) => setNewPersonCentredCall({...newPersonCentredCall, section3: e.target.value})}
                     placeholder="Actions care staff should take during this call..."
                     rows={3}
                   />
                 </div>
                 <Button
                   onClick={handleAddPersonCentredCall}
                   disabled={!newPersonCentredCall.call_number || !newPersonCentredCall.section1 || !newPersonCentredCall.section2 || !newPersonCentredCall.section3}
                   className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   {editingPCCallId ? 'Update Call' : 'Add Call'}
                 </Button>

                 {personCentredCalls.length > 0 && (
                   <div className="space-y-3 mt-4">
                     {personCentredCalls.map((call) => (
                       <div key={call.id} className={`p-4 rounded-lg border ${editingPCCallId === call.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'}`}>
                         <div className="flex items-start justify-between gap-3 mb-3">
                           <p className="font-bold text-slate-900 text-lg">{call.call_number}</p>
                           <div className="flex gap-2 flex-shrink-0">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleEditPersonCentredCall(call)}
                               className={editingPCCallId === call.id ? 'bg-blue-100 text-blue-700' : ''}
                             >
                               Edit
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleRemovePersonCentredCall(call.id)}
                               className="text-red-600 hover:bg-red-50"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         </div>
                         <div className="space-y-3">
                           <div>
                             <p className="text-sm font-semibold text-teal-700 mb-1">Section 1: Intended Outcome</p>
                             <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{call.section1}</p>
                           </div>
                           <div>
                             <p className="text-sm font-semibold text-teal-700 mb-1">Section 2: Needs & Preferences</p>
                             <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{call.section2}</p>
                           </div>
                           <div>
                             <p className="text-sm font-semibold text-teal-700 mb-1">Section 3: Care Staff Actions</p>
                             <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{call.section3}</p>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>

             <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={2}
              />
             </div>

             <div className="border-t-2 pt-4 border rounded-lg p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-4 text-lg">Plan Documentation</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Date of Plan</Label>
                  <Input
                    type="date"
                    value={formData.care_plan_date}
                    onChange={(e) => setFormData({...formData, care_plan_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Completed/Signed By</Label>
                  <Input
                    value={formData.plan_completed_by}
                    onChange={(e) => setFormData({...formData, plan_completed_by: e.target.value})}
                    placeholder="Name and title"
                  />
                </div>
                <div>
                   <Label>Plan Review Date</Label>
                   <Input
                     type="date"
                     value={formData.plan_review_date}
                     onChange={(e) => setFormData({...formData, plan_review_date: e.target.value})}
                     className="bg-white"
                   />
                   <p className="text-xs text-slate-500 mt-1">Set review date (default: 3 months from plan date)</p>
                 </div>
              </div>
             </div>
          </TabsContent>



          <TabsContent value="medications" className="space-y-4 mt-4">
            {serviceUser?.id && (
              <MARChart serviceUser={serviceUser} isAdmin={isAdmin} />
            )}
            {!serviceUser?.id && (
              <div className="text-center py-8 text-slate-500">
                <p>Save the service user first to manage medications.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calls" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-900">Add Call Time</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newCall.time}
                      onChange={(e) => setNewCall({...newCall, time: e.target.value})}
                      placeholder="HH:MM"
                    />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newCall.duration}
                      onChange={(e) => setNewCall({...newCall, duration: e.target.value})}
                      placeholder="e.g., 60"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input
                    value={newCall.notes}
                    onChange={(e) => setNewCall({...newCall, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Recurring Tasks */}
                <div>
                  <Label className="flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" />
                    Recurring Tasks
                  </Label>
                  <div className="p-2 bg-white rounded border mt-1 space-y-1.5">
                    {(newCall.tasks || []).map((task, i) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2 bg-slate-50 rounded border text-xs">
                        <span className="text-slate-700">{task}</span>
                        <button type="button" onClick={() => handleRemoveCallTask(i)} className="text-red-400 hover:text-red-600 ml-2">
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
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCallTask(); } }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddCallTask}
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

                <Button
                  onClick={handleAddCall}
                  disabled={!newCall.time || newCall.duration === ''}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingCallId ? 'Update Call Time' : 'Add Call Time'}
                </Button>
              </div>

              {callTimes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Scheduled Calls</h3>
                  {callTimes.map((call) => (
                    <div key={call.id} className={`flex items-center justify-between p-3 rounded-lg border ${editingCallId === call.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'}`}>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{call.time} - {call.duration} mins ({call.type})</p>
                        {call.notes && <p className="text-sm text-slate-500">{call.notes}</p>}
                        {call.tasks && call.tasks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <ListChecks className="w-3 h-3 text-slate-400 mt-0.5" />
                            {call.tasks.map((task, ti) => (
                              <span key={ti} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 border">{task}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCall(call)}
                          className={editingCallId === call.id ? 'bg-blue-100 text-blue-700' : ''}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCall(call.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleSafeClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.full_name || !formData.address || mutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Rota Setup Dialog */}
      {newServiceUser && (
        <ClientRotaSetup
          serviceUser={newServiceUser}
          isOpen={showRotaSetup}
          onClose={() => {
            setShowRotaSetup(false);
            setNewServiceUser(null);
            onClose();
          }}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['rota'] });
            queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
            setShowRotaSetup(false);
            setNewServiceUser(null);
            onClose();
          }}
        />
      )}
    </Dialog>
    </>
  );
}