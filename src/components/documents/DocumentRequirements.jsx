import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import EmptyState from '@/components/ui/EmptyState';
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  ClipboardList,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const documentTypeLabels = {
  contract: 'Employment Contract',
  id_proof: 'ID Proof',
  certification: 'Certification',
  right_to_work: 'Right to Work',
  dbs_check: 'DBS Check',
  reference: 'Reference',
  proof_of_address: 'Proof of Address',
  qualification: 'Qualification',
  insurance: 'Insurance',
  drivers_license: "Driver's License",
  medical_clearance: 'Medical Clearance',
  other: 'Other'
};

export default function DocumentRequirements({ user }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    document_type: 'other',
    title: '',
    description: '',
    is_mandatory: true,
    requires_expiry: false,
    reminder_days_before: 30
  });

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['documentRequirements'],
    queryFn: () => base44.entities.DocumentRequirement.list('display_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentRequirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentRequirements'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Requirement created');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentRequirements'] });
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success('Requirement updated');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentRequirements'] });
      toast.success('Requirement deleted');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) =>
      base44.entities.DocumentRequirement.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentRequirements'] });
      toast.success('Requirement updated');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const resetForm = () => {
    setFormData({
      document_type: 'other',
      title: '',
      description: '',
      is_mandatory: true,
      requires_expiry: false,
      reminder_days_before: 30
    });
  };

  const handleEdit = (req) => {
    setEditingId(req.id);
    setFormData({
      document_type: req.document_type,
      title: req.title,
      description: req.description || '',
      is_mandatory: req.is_mandatory,
      requires_expiry: req.requires_expiry,
      reminder_days_before: req.reminder_days_before || 30
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate({
        ...formData,
        created_by: user?.id,
        display_order: requirements.length
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Document Requirements Matrix</h3>
              <p className="text-sm text-slate-600 mt-1">
                Define which documents staff members must upload. Required documents will be tracked for compliance.
              </p>
            </div>
          </div>
          <Button onClick={() => {
            resetForm();
            setEditingId(null);
            setIsDialogOpen(true);
          }} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </div>
      </Card>

      {/* Requirements List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : requirements.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requirements defined"
          description="Create document requirements to track staff compliance."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {requirements.map((req) => (
            <Card key={req.id} className={`p-4 bg-white hover:shadow-md transition-shadow ${!req.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">{req.title}</h3>
                    {req.is_mandatory && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Required
                      </Badge>
                    )}
                    {!req.is_active && (
                      <Badge variant="outline" className="bg-slate-100">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {documentTypeLabels[req.document_type] || req.document_type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(req)}
                    className="text-slate-500 hover:text-teal-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(req.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {req.description && (
                <p className="text-sm text-slate-600 mb-3">{req.description}</p>
              )}

              <div className="space-y-2">
                {req.requires_expiry && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Expires - {req.reminder_days_before} day reminder</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-slate-500">Active</span>
                  <Switch
                    checked={req.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: req.id, is_active: checked })
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingId(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Document Requirement</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Document Type *</Label>
              <Select 
                value={formData.document_type} 
                onValueChange={(value) => setFormData({...formData, document_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Valid DBS Certificate"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Explain what this document is and why it's needed..."
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label className="font-semibold">Mandatory Requirement</Label>
                <p className="text-xs text-slate-500">All staff must have this document</p>
              </div>
              <Switch
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData({...formData, is_mandatory: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label className="font-semibold">Has Expiry Date</Label>
                <p className="text-xs text-slate-500">Document expires and needs renewal</p>
              </div>
              <Switch
                checked={formData.requires_expiry}
                onCheckedChange={(checked) => setFormData({...formData, requires_expiry: checked})}
              />
            </div>

            {formData.requires_expiry && (
              <div>
                <Label>Reminder Days Before Expiry</Label>
                <Input
                  type="number"
                  value={formData.reminder_days_before}
                  onChange={(e) => setFormData({...formData, reminder_days_before: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || createMutation.isPending || updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}