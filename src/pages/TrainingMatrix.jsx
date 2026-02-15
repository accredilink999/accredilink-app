import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus, Send, Upload, Edit2, X, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, addMonths } from 'date-fns';
import { cn } from "@/lib/utils";

export default function TrainingMatrix() {
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', description: '', frequency_months: 12, is_mandatory: true });
  
  const queryClient = useQueryClient();

  const { data: matrixItems = [] } = useQuery({
    queryKey: ['trainingMatrixItems'],
    queryFn: () => base44.entities.TrainingMatrixItem.filter({ is_active: true }, '-created_date'),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staffList'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['trainingMatrixRecords'],
    queryFn: () => base44.entities.TrainingMatrixRecord.list(),
  });

  const createItemMutation = useMutation({
    mutationFn: async (itemData) => {
      return await base44.entities.TrainingMatrixItem.create(itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingMatrixItems'] });
      setShowNewItemDialog(false);
      setNewItem({ title: '', description: '', frequency_months: 12, is_mandatory: true });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (itemData) => {
      return await base44.entities.TrainingMatrixItem.update(editingItem.id, itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingMatrixItems'] });
      setShowEditDialog(false);
      setEditingItem(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      return await base44.entities.TrainingMatrixItem.update(itemId, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingMatrixItems'] });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (recordData) => {
      return await base44.functions.invoke('sendTrainingReminder', {
        staffEmail: recordData.staff_email,
        staffName: recordData.staff_name,
        trainingTitle: recordData.matrix_item_title,
        expiryDate: recordData.expiry_date
      });
    },
    onSuccess: () => {
      setRemindingId(null);
      queryClient.invalidateQueries({ queryKey: ['trainingMatrixRecords'] });
    },
  });

  const getStatusColor = (record) => {
    if (!record.expiry_date) return 'bg-gray-100 text-gray-700';
    
    const expiryDate = parseISO(record.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'bg-red-100 text-red-700';
    if (daysUntilExpiry < 30) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusLabel = (record) => {
    if (!record.expiry_date) return 'Not Started';
    
    const expiryDate = parseISO(record.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'OVERDUE';
    if (daysUntilExpiry < 30) return 'DUE SOON';
    return 'COMPLETED';
  };

  const staffWithRecords = staff.filter(s => records.some(r => r.staff_id === s.id));

  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.staff_full_name || staffMember?.full_name || staffId;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Staff Training Matrix"
        subtitle="View and manage training completion status across all staff"
      >
        <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              New Training Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Training Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Training Title</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g., First Aid Certification"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Details about this training"
                  rows={3}
                />
              </div>
              <div>
                <Label>Frequency (months)</Label>
                <Input
                  type="number"
                  value={newItem.frequency_months}
                  onChange={(e) => setNewItem({ ...newItem, frequency_months: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <Button 
                onClick={() => createItemMutation.mutate(newItem)}
                disabled={!newItem.title || createItemMutation.isPending}
                className="w-full"
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Staff Filter */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            <span className="font-medium text-slate-900">View Training for:</span>
          </div>
          <div className="w-full sm:w-64">
            <Select value={selectedStaffId || ""} onValueChange={(value) => setSelectedStaffId(value || null)}>
              <SelectTrigger>
                {selectedStaffId ? (
                  <span>{getStaffName(selectedStaffId)}</span>
                ) : (
                  <SelectValue placeholder="Select staff member..." />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Staff</SelectItem>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.staff_full_name || s.full_name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Matrix Display */}
      <Card className="overflow-x-auto">
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900 sticky left-0 bg-white min-w-[200px]">Staff Member</th>
                {matrixItems.map(item => (
                  <th key={item.id} className="text-center py-3 px-2 font-semibold text-slate-900 min-w-[140px]">
                    <div className="text-xs">{item.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffWithRecords.filter(s => !selectedStaffId || s.id === selectedStaffId).map(staffMember => (
                <tr key={staffMember.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900 sticky left-0 bg-white">{staffMember.full_name}</td>
                  {matrixItems.map(item => {
                    const record = records.find(r => r.staff_id === staffMember.id && r.matrix_item_id === item.id);
                    return (
                      <td key={item.id} className="text-center py-3 px-2">
                        {record ? (
                          <div className="space-y-1">
                            <Badge className={cn("text-xs", getStatusColor(record))}>
                              {getStatusLabel(record)}
                            </Badge>
                            {record.expiry_date && (
                              <p className="text-xs text-slate-500">{format(parseISO(record.expiry_date), 'dd MMM yy')}</p>
                            )}
                            {record.certificate_url && (
                              <a href={record.certificate_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="text-xs text-teal-600">
                                  <Upload className="w-3 h-3" />
                                </Button>
                              </a>
                            )}
                            {getStatusLabel(record) === 'OVERDUE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRemindingId(record.id);
                                  sendReminderMutation.mutate(record);
                                }}
                                disabled={remindingId === record.id}
                                className="w-full text-xs"
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not Set</Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Training Items Management */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Training Items</h3>
        <div className="space-y-2">
          {matrixItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                <p className="text-xs text-slate-400 mt-1">Renews every {item.frequency_months} months</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={showEditDialog && editingItem?.id === item.id} onOpenChange={(open) => {
                  if (!open) setEditingItem(null);
                  setShowEditDialog(open);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Training Item</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                      <div className="space-y-4">
                        <div>
                          <Label>Training Title</Label>
                          <Input
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={editingItem.description || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Frequency (months)</Label>
                          <Input
                            type="number"
                            value={editingItem.frequency_months}
                            onChange={(e) => setEditingItem({ ...editingItem, frequency_months: parseInt(e.target.value) })}
                          />
                        </div>
                        <Button 
                          onClick={() => updateItemMutation.mutate(editingItem)}
                          disabled={updateItemMutation.isPending}
                          className="w-full"
                        >
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteItemMutation.mutate(item.id)}
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}