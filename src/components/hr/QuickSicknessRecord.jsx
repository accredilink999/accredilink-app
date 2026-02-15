import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function QuickSicknessRecord({ open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    staff_id: '',
    start_date: '',
    end_date: '',
    reason: 'illness',
    description: '',
    fit_note_required: false,
    is_paid: true,
    status: 'active'
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SicknessRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sicknessRecords'] });
      onClose();
      setFormData({
        staff_id: '',
        start_date: '',
        end_date: '',
        reason: 'illness',
        description: '',
        fit_note_required: false,
        is_paid: true,
        status: 'active'
      });
    },
  });

  const handleSubmit = () => {
    const selectedStaff = staff.find(s => s.id === formData.staff_id);
    if (!selectedStaff) return;

    const startDate = new Date(formData.start_date);
    const endDate = formData.end_date ? new Date(formData.end_date) : null;
    const days = endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : null;

    createMutation.mutate({
      ...formData,
      staff_name: selectedStaff.gps_map_name || selectedStaff.full_name,
      days_absent: days,
      reported_by: 'Admin'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Staff Sickness</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Staff Member *</Label>
            <Select value={formData.staff_id} onValueChange={(value) => setFormData({...formData, staff_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.gps_map_name || s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <Label>End Date (if known)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Reason *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="illness">Illness</SelectItem>
                <SelectItem value="injury">Injury</SelectItem>
                <SelectItem value="medical_appointment">Medical Appointment</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.staff_id || !formData.start_date || createMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Record Sickness
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}