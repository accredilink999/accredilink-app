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

export default function QuickDisciplinaryRecord({ open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    staff_id: '',
    record_type: 'verbal_warning',
    severity: 'medium',
    date: new Date().toISOString().split('T')[0],
    incident_description: '',
    action_taken: '',
    witness_present: '',
    status: 'active'
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DisciplinaryRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinaryRecords'] });
      onClose();
      setFormData({
        staff_id: '',
        record_type: 'verbal_warning',
        severity: 'medium',
        date: new Date().toISOString().split('T')[0],
        incident_description: '',
        action_taken: '',
        witness_present: '',
        status: 'active'
      });
    },
  });

  const handleSubmit = () => {
    const selectedStaff = staff.find(s => s.id === formData.staff_id);
    if (!selectedStaff) return;

    createMutation.mutate({
      ...formData,
      staff_name: selectedStaff.gps_map_name || selectedStaff.full_name,
      issued_by: user.id,
      issued_by_name: user.gps_map_name || user.full_name
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Disciplinary Record</DialogTitle>
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
              <Label>Record Type *</Label>
              <Select value={formData.record_type} onValueChange={(value) => setFormData({...formData, record_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verbal_warning">Verbal Warning</SelectItem>
                  <SelectItem value="written_warning">Written Warning</SelectItem>
                  <SelectItem value="final_warning">Final Warning</SelectItem>
                  <SelectItem value="dismissal">Dismissal</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="commendation">Commendation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severity *</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div>
            <Label>Incident Description *</Label>
            <Textarea
              value={formData.incident_description}
              onChange={(e) => setFormData({...formData, incident_description: e.target.value})}
              placeholder="Describe what happened..."
              rows={4}
            />
          </div>

          <div>
            <Label>Action Taken *</Label>
            <Textarea
              value={formData.action_taken}
              onChange={(e) => setFormData({...formData, action_taken: e.target.value})}
              placeholder="What action was taken..."
              rows={3}
            />
          </div>

          <div>
            <Label>Witness Present</Label>
            <Input
              value={formData.witness_present}
              onChange={(e) => setFormData({...formData, witness_present: e.target.value})}
              placeholder="Name of witness (if any)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.staff_id || !formData.incident_description || !formData.action_taken || createMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}