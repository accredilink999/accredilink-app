import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Columns that can be updated in the care_logs table
const EDITABLE_COLUMNS = new Set([
  'mood', 'food_intake', 'fluid_intake',
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
  'health_observations', 'notes', 'status',
]);

export default function CareLogEditForm({ careLog, open, onOpenChange, onClose }) {
  const [formData, setFormData] = useState(careLog || {});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => {
      // Only send editable columns — strip id, created_at, updated_at, etc.
      const cleanData = {};
      Object.keys(data).forEach(key => {
        if (EDITABLE_COLUMNS.has(key) && data[key] !== undefined) {
          cleanData[key] = data[key];
        }
      });

      // Convert duration_minutes to integer or null
      if (cleanData.duration_minutes === '' || cleanData.duration_minutes === undefined) {
        delete cleanData.duration_minutes;
      } else if (cleanData.duration_minutes !== null) {
        cleanData.duration_minutes = parseInt(cleanData.duration_minutes) || null;
      }

      return base44.entities.CareLog.update(careLog.id, cleanData);
    },
    onSuccess: () => {
      toast.success('Care log updated successfully');
      queryClient.invalidateQueries({ queryKey: ['allCareLogs'] });
      queryClient.invalidateQueries({ queryKey: ['careLogs'] });
      onClose();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Care log update failed:', error);
      const msg = error?.message || error?.details || error?.hint || JSON.stringify(error) || 'Unknown error';
      toast.error('Failed to update care log: ' + msg);
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white pb-4">
          <DialogTitle className="text-lg">Edit Care Log</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {/* Essential Observations */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Mood</label>
              <Select value={formData.mood || ''} onValueChange={(value) => handleChange('mood', value)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <label className="text-sm font-semibold text-slate-700 block mb-2">Food Intake</label>
              <Select value={formData.food_intake || ''} onValueChange={(value) => handleChange('food_intake', value)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <label className="text-sm font-semibold text-slate-700 block mb-2">Fluid Intake</label>
              <Select value={formData.fluid_intake || ''} onValueChange={(value) => handleChange('fluid_intake', value)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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

          {/* Welfare Impression */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Welfare Impression on Arrival</label>
            <Select value={formData.welfare_impression_on_arrival || ''} onValueChange={(value) => handleChange('welfare_impression_on_arrival', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select welfare impression" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe_no_concerns">Safe With No Concerns</SelectItem>
                <SelectItem value="safe_minor_concerns">Safe With Minor Concerns</SelectItem>
                <SelectItem value="unsafe_interventions_required">Unsafe Interventions Required</SelectItem>
                <SelectItem value="safe_with_interventions_required">Safe With Interventions Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Yes/No toggle fields */}
          {[
            { key: 'personal_care', label: 'Personal Care Provided?' },
            { key: 'continence_care_provided', label: 'Continence Care Provided?' },
            { key: 'catheter_care_provided', label: 'Catheter Care Provided?' },
            { key: 'repositioned_on_visit', label: 'Repositioned on Visit?' },
            { key: 'skincare_provided', label: 'Skincare Provided?' },
            { key: 'skin_integrity_concerns', label: 'Skin Integrity Concerns?' },
            { key: 'food_offered', label: 'Food Offered?' },
            { key: 'drinks_offered', label: 'Drinks Offered?' },
            { key: 'add_medication_round', label: 'Medication Round?' },
            { key: 'medication_concerns', label: 'Medication Concerns?' },
            { key: 'further_concerns', label: 'Further Concerns?' },
            { key: 'healthcare_visit_required', label: 'Healthcare Visit Required?' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100">
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <div className="flex gap-2">
                <Button
                  type="button" size="sm"
                  onClick={() => handleChange(key, 'yes')}
                  className={formData[key] === 'yes' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >Yes</Button>
                <Button
                  type="button" size="sm"
                  onClick={() => handleChange(key, 'no')}
                  className={formData[key] === 'no' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                >No</Button>
              </div>
            </div>
          ))}

          {/* Personal Care Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Personal Care Details</label>
            <Textarea
              value={formData.personal_care_description || ''}
              onChange={(e) => handleChange('personal_care_description', e.target.value)}
              placeholder="Enter personal care details..."
              className="h-20"
            />
          </div>

          {/* Continence Care Monitoring */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Continence Care Monitoring</label>
            <Textarea
              value={Array.isArray(formData.continence_care_monitoring) ? formData.continence_care_monitoring.join('\n') : ''}
              onChange={(e) => handleChange('continence_care_monitoring', e.target.value.split('\n').filter(x => x))}
              placeholder="Enter each item on a new line..."
              className="h-20"
            />
          </div>

          {/* Catheter Care Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Catheter Care Details</label>
            <Textarea
              value={formData.catheter_care_description || ''}
              onChange={(e) => handleChange('catheter_care_description', e.target.value)}
              placeholder="Enter catheter care details..."
              className="h-20"
            />
          </div>

          {/* Repositioning Details */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Repositioning Details</label>
            <Textarea
              value={formData.repositioned_description || ''}
              onChange={(e) => handleChange('repositioned_description', e.target.value)}
              placeholder="Enter repositioning details..."
              className="h-20"
            />
          </div>

          {/* Skincare Details */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Skincare Details</label>
            <Textarea
              value={formData.skincare_description || ''}
              onChange={(e) => handleChange('skincare_description', e.target.value)}
              placeholder="Enter skincare details..."
              className="h-20"
            />
          </div>

          {/* Skin Integrity */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Skin Integrity Concerns</label>
            <Textarea
              value={formData.skin_integrity_description || ''}
              onChange={(e) => handleChange('skin_integrity_description', e.target.value)}
              placeholder="Describe any skin integrity concerns..."
              className="h-20"
            />
          </div>

          {/* Medication Round Outcome */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Medication Round Outcome</label>
            <Textarea
              value={formData.medication_round_outcome || ''}
              onChange={(e) => handleChange('medication_round_outcome', e.target.value)}
              placeholder="Enter medication round outcome..."
              className="h-20"
            />
          </div>

          {/* Medication Concerns */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Medication Concerns Details</label>
            <Textarea
              value={formData.medication_concerns_details || ''}
              onChange={(e) => handleChange('medication_concerns_details', e.target.value)}
              placeholder="Enter medication concerns..."
              className="h-20"
            />
          </div>

          {/* Healthcare Visit Type */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Healthcare Professional Required</label>
            <Input
              value={formData.healthcare_visit_type || ''}
              onChange={(e) => handleChange('healthcare_visit_type', e.target.value)}
              placeholder="e.g. GP, Nurse, Specialist"
            />
          </div>

          {/* Further Concerns */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Further Concerns</label>
            <Textarea
              value={formData.further_concerns_details || ''}
              onChange={(e) => handleChange('further_concerns_details', e.target.value)}
              placeholder="Enter any further concerns..."
              className="h-20"
            />
          </div>

          {/* Extended Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Extended Notes</label>
            <Textarea
              value={formData.extended_notes || ''}
              onChange={(e) => handleChange('extended_notes', e.target.value)}
              placeholder="Enter extended notes..."
              className="h-20"
            />
          </div>

          {/* Staff Grade */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Staff Grade</label>
            <Input
              value={formData.staff_grade || ''}
              onChange={(e) => handleChange('staff_grade', e.target.value)}
              placeholder="Enter staff grade"
            />
          </div>

          {/* Double Handed Call */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Double Handed Call</label>
            <Select value={formData.double_handed_call || ''} onValueChange={(value) => handleChange('double_handed_call', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">General Notes</label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter general notes..."
              className="h-20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}