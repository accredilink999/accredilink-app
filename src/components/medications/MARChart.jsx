import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, Edit, Trash2, Check, Archive } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import MedicationInfoPopup from './MedicationInfoPopup';
import ArchivedMARCharts from './ArchivedMARCharts';

export default function MARChart({ serviceUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [showMedDialog, setShowMedDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [selectedMed, setSelectedMed] = useState(null);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    route: 'oral',
    times_per_day: 1,
    special_instructions: ''
  });
  const [adminName, setAdminName] = useState('');
  const [selectedMedInfo, setSelectedMedInfo] = useState(null);
  const [showMedInfoPopup, setShowMedInfoPopup] = useState(false);
  const [showArchivedCharts, setShowArchivedCharts] = useState(false);

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', serviceUser?.id],
    queryFn: () => base44.entities.MedicationRecord.filter({ service_user_id: serviceUser.id }),
    enabled: !!serviceUser?.id,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ['medicationAdministrations', serviceUser?.id],
    queryFn: () => base44.entities.MedicationAdministration.filter({ service_user_id: serviceUser.id }),
    enabled: !!serviceUser?.id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createMedMutation = useMutation({
    mutationFn: (data) => base44.entities.MedicationRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowAdminDialog(false);
      resetForm();
    },
  });

  const updateMedMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MedicationRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowAdminDialog(false);
      resetForm();
    },
  });

  const deleteMedMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicationRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  const recordAdminMutation = useMutation({
    mutationFn: (data) => base44.entities.MedicationAdministration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationAdministrations'] });
      setShowMedDialog(false);
      setSelectedMed(null);
    },
  });

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: '',
      route: 'oral',
      times_per_day: 1,
      special_instructions: ''
    });
    setEditingMed(null);
    setAdminName('');
  };

  const handleEditMed = (med) => {
    setEditingMed(med);
    setFormData({
      medication_name: med.medication_name,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      times_per_day: med.times_per_day || 1,
      special_instructions: med.special_instructions || ''
    });
    setShowAdminDialog(true);
  };

  const handleSubmitMed = () => {
    if (editingMed) {
      updateMedMutation.mutate({
        id: editingMed.id,
        data: formData
      });
    } else {
      createMedMutation.mutate({
        ...formData,
        service_user_id: serviceUser.id,
        service_user_name: serviceUser.full_name,
        times_per_day: parseInt(formData.times_per_day),
        is_active: true
      });
    }
  };

  const handleRecordAdmin = (med, date, instance) => {
    if (!adminName.trim()) return;
    recordAdminMutation.mutate({
      medication_record_id: med.id,
      service_user_id: serviceUser.id,
      service_user_name: serviceUser.full_name,
      medication_name: med.medication_name,
      administered_by: currentUser?.id,
      administered_by_name: currentUser?.full_name,
      staff_name: adminName,
      administered_at: date,
      instance: instance,
      status: 'given'
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const maxTimesPerDay = medications.length > 0 ? Math.max(...medications.map(m => m.times_per_day || 1)) : 1;

  const getAdminForDay = (medId, date, instance) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return administrations.find(
      a => a.medication_record_id === medId && 
           a.administered_at.split('T')[0] === dateStr && 
           a.status === 'given' &&
           a.instance === instance
    );
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
         <div>
           <h4 className="font-semibold text-slate-900">Medication Administration Record</h4>
           <p className="text-xs text-slate-500">Week of {format(weekStart, 'MMM d, yyyy')}</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
           <Button 
             onClick={() => setShowArchivedCharts(true)}
             variant="outline"
             className="w-full sm:w-auto"
             size="sm"
           >
             <Archive className="w-4 h-4 mr-2" />
             Past MAR Charts
           </Button>
           {isAdmin && (
             <Button 
               onClick={() => {
                 resetForm();
                 setShowAdminDialog(true);
               }}
               className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
               size="sm"
             >
               <Plus className="w-4 h-4 mr-2" />
               Add Medication
             </Button>
           )}
         </div>
       </div>

      {/* MAR Chart */}
      {medications.length === 0 ? (
        <Card className="p-6 text-center">
          <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No medications recorded</p>
        </Card>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-900">Medication</th>
                {weekDays.map(day => (
                  <th key={format(day, 'yyyy-MM-dd')} className="border border-slate-200 p-1 sm:p-2 font-semibold text-slate-900 min-w-12">
                    <div className="text-center">
                      <div className="text-slate-600 text-xs">{format(day, 'EEE')}</div>
                      <div className="text-slate-500 text-xs">{format(day, 'd')}</div>
                    </div>
                  </th>
                ))}
                {isAdmin && <th className="border border-slate-200 p-2 text-center font-semibold text-slate-900">Actions</th>}
              </tr>
            </thead>
            <tbody>
               {medications.map(med => {
                 const instanceCount = med.times_per_day || 1;
                 return Array.from({ length: instanceCount }).map((_, instanceIdx) => (
                   <tr key={`${med.id}-${instanceIdx}`} className="hover:bg-slate-50">
                     {instanceIdx === 0 && (
                       <td 
                         className="border border-slate-200 p-2 cursor-pointer hover:bg-teal-50 transition-colors"
                         onClick={() => {
                           setSelectedMedInfo(med);
                           setShowMedInfoPopup(true);
                         }}
                         rowSpan={instanceCount}
                       >
                         <div className="flex items-start gap-2">
                           <Pill className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                           <div className="min-w-0">
                             <p className="font-medium text-slate-900 text-xs sm:text-sm hover:text-teal-600">{med.medication_name}</p>
                             <p className="text-xs text-slate-600">{med.dosage}</p>
                             <p className="text-xs text-slate-500">{med.frequency}</p>
                           </div>
                         </div>
                       </td>
                     )}
                     {weekDays.map(day => {
                       const dateStr = format(day, 'yyyy-MM-dd');
                       const admin = getAdminForDay(med.id, day, instanceIdx);
                       return (
                         <td key={`${dateStr}-${instanceIdx}`} className="border border-slate-200 p-1 sm:p-2 text-center">
                           <button
                             onClick={() => {
                               setSelectedMed({ med, date: dateStr, instance: instanceIdx });
                               setShowMedDialog(true);
                             }}
                             className={`w-full p-1 rounded transition-colors ${
                               admin
                                 ? 'bg-teal-100 hover:bg-teal-200'
                                 : 'bg-slate-100 hover:bg-slate-200'
                             }`}
                             title={admin ? `Given by ${admin.staff_name}` : 'Record administration'}
                           >
                             {admin ? (
                               <span className="text-xs font-bold text-teal-700">{getInitials(admin.staff_name)}</span>
                             ) : (
                               <span className="text-slate-400 text-xs">-</span>
                             )}
                           </button>
                         </td>
                       );
                     })}
                     {isAdmin && instanceIdx === 0 && (
                       <td className="border border-slate-200 p-2" rowSpan={instanceCount}>
                         <div className="flex items-center justify-center gap-1">
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7"
                             onClick={() => handleEditMed(med)}
                           >
                             <Edit className="w-3 h-3 text-slate-600" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7 text-red-600 hover:text-red-700"
                             onClick={() => {
                               if (confirm('Delete this medication?')) {
                                 deleteMedMutation.mutate(med.id);
                               }
                             }}
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </div>
                       </td>
                     )}
                   </tr>
                 ));
               })}
             </tbody>
          </table>
        </div>
      )}

      {/* Record Administration Dialog */}
      <Dialog open={showMedDialog} onOpenChange={(open) => {
        setShowMedDialog(open);
        if (!open) setAdminName('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Medication Administration</DialogTitle>
          </DialogHeader>
          {selectedMed && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Medication</p>
                <p className="text-slate-900">{selectedMed.med.medication_name}</p>
                <p className="text-xs text-slate-600">{selectedMed.med.dosage} - {selectedMed.med.frequency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Date</p>
                <p className="text-slate-900">{format(new Date(selectedMed.date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Staff Member Name *</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Enter staff member's full name"
                  className="w-full border rounded px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMedDialog(false);
              setAdminName('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedMed) {
                  handleRecordAdmin(selectedMed.med, `${selectedMed.date}T${format(new Date(), 'HH:mm:ss')}`, selectedMed.instance || 0);
                }
              }}
              disabled={!adminName.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Medication Dialog */}
      {isAdmin && (
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMed ? 'Edit Medication' : 'Add Medication'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Medication Name *</label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({...formData, medication_name: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g., Amoxicillin"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Dosage *</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Frequency *</label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g., Twice daily"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Times Per Day *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.times_per_day}
                  onChange={(e) => setFormData({...formData, times_per_day: parseInt(e.target.value) || 1})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Route</label>
                <Select value={formData.route} onValueChange={(value) => setFormData({...formData, route: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="inhaled">Inhaled</SelectItem>
                    <SelectItem value="eye_drops">Eye Drops</SelectItem>
                    <SelectItem value="ear_drops">Ear Drops</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Special Instructions</label>
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g., Take with food"
                  rows="3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAdminDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitMed}
                disabled={!formData.medication_name || !formData.dosage || !formData.frequency}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {editingMed ? 'Update' : 'Add'} Medication
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}

        {selectedMedInfo && (
        <MedicationInfoPopup 
        medication={selectedMedInfo} 
        open={showMedInfoPopup} 
        onOpenChange={setShowMedInfoPopup}
        serviceUserId={serviceUser?.id}
        />
        )}

        <ArchivedMARCharts 
          serviceUserId={serviceUser?.id}
          open={showArchivedCharts}
          onOpenChange={setShowArchivedCharts}
        />
        </div>
        );
        }