import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Edit2, Plus } from 'lucide-react';
import { format } from 'date-fns';

const LEAVE_PRESETS = [
  { label: 'Full-Time (37.5 hours/week)', hours: 210, days: 28 },
  { label: 'Full-Time (40 hours/week)', hours: 224, days: 29.87 },
  { label: 'Part-Time (20 hours/week)', hours: 112, days: 14.87 },
  { label: 'Part-Time (15 hours/week)', hours: 84, days: 11.2 },
];

export default function StaffLeaveBalance({ staffId, isAdmin, staffName }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    total_allowance_days: 0,
    total_allowance_hours: 0,
    carried_over_days: 0
  });

  const currentYear = new Date().getFullYear();

  const { data: leaveBalances = [] } = useQuery({
    queryKey: ['leaveBalance', staffId],
    queryFn: async () => {
      const balances = await base44.entities.HolidayAllowance.filter({ staff_id: staffId });
      return balances.sort((a, b) => b.year - a.year);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HolidayAllowance.create({
      staff_id: staffId,
      staff_name: staffName,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', staffId] });
      setShowDialog(false);
      setFormData({ total_allowance_days: 0, carried_over_days: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.HolidayAllowance.update(editingYear.id, {
      total_allowance_days: data.total_allowance_days,
      total_allowance_hours: data.total_allowance_hours,
      carried_over_days: data.carried_over_days
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', staffId] });
      setShowDialog(false);
      setEditingYear(null);
      setFormData({ total_allowance_days: 0, total_allowance_hours: 0, carried_over_days: 0 });
    },
  });

  const handleOpenDialog = (balance = null) => {
    if (balance) {
      setEditingYear(balance);
      setFormData({
        total_allowance_days: balance.total_allowance_days,
        total_allowance_hours: balance.total_allowance_hours || 0,
        carried_over_days: balance.carried_over_days
      });
    } else {
      setEditingYear(null);
      setFormData({
        total_allowance_days: 0,
        total_allowance_hours: 0,
        carried_over_days: 0,
        year: currentYear
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingYear) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate({
        ...formData,
        year: currentYear
      });
    }
  };

  const convertDaysToHours = (days) => {
    return (days * 7.5).toFixed(1);
  };

  const currentYearBalance = leaveBalances.find(b => b.year === currentYear);
  const remaining = currentYearBalance 
    ? (currentYearBalance.total_allowance_days + currentYearBalance.carried_over_days) - currentYearBalance.used_days - currentYearBalance.pending_days
    : 0;
  const remainingHours = remaining * 7.5;

  return (
    <div className="space-y-6">
      {/* Current Year Summary */}
      {currentYearBalance ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentYear} Leave Balance</CardTitle>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(currentYearBalance)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-medium">Total Allowance</p>
                <p className="text-2xl font-bold text-blue-900">{currentYearBalance.total_allowance_days}</p>
                <p className="text-xs text-blue-600 mt-1">days</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-medium">Total Allowance</p>
                <p className="text-2xl font-bold text-blue-900">{convertDaysToHours(currentYearBalance.total_allowance_days)}</p>
                <p className="text-xs text-blue-600 mt-1">hours</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                <p className="text-xs text-amber-600 font-medium">Carried Over</p>
                <p className="text-2xl font-bold text-amber-900">{currentYearBalance.carried_over_days}</p>
                <p className="text-xs text-amber-600 mt-1">days</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                <p className="text-xs text-red-600 font-medium">Used</p>
                <p className="text-2xl font-bold text-red-900">{currentYearBalance.used_days}</p>
                <p className="text-xs text-red-600 mt-1">days</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-xs text-green-600 font-medium">Remaining Leave Balance</p>
                <p className="text-2xl font-bold text-green-900">{remaining}</p>
                <p className="text-xs text-green-600 mt-1">days</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-xs text-green-600 font-medium">Remaining Leave Balance</p>
                <p className="text-2xl font-bold text-green-900">{remainingHours.toFixed(1)}</p>
                <p className="text-xs text-green-600 mt-1">hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isAdmin ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">No leave balance set for {currentYear}</p>
                  <p className="text-sm text-slate-600">Create a leave balance entry to get started</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenDialog()}
                className="flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <p className="text-slate-500">No leave balance set for {currentYear}</p>
          </CardContent>
        </Card>
      )}

      {/* Historical Balances */}
      {leaveBalances.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Historical Leave Balances</h3>
          <div className="space-y-2">
            {leaveBalances.map(balance => (
              <Card key={balance.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-slate-900">{balance.year}</p>
                      {balance.year === currentYear && (
                        <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Allocated</p>
                        <p className="font-semibold text-slate-900">{balance.total_allowance_days}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Carried Over</p>
                        <p className="font-semibold text-slate-900">{balance.carried_over_days}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Used</p>
                        <p className="font-semibold text-slate-900">{balance.used_days}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Remaining</p>
                        <p className="font-semibold text-slate-900">
                          {(balance.total_allowance_days + balance.carried_over_days) - balance.used_days - balance.pending_days}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isAdmin && balance.year === currentYear && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(balance)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingYear ? `Edit ${editingYear.year} Leave Balance` : `Create ${currentYear} Leave Balance`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Quick Select Leave Entitlement
              </label>
              <Select onValueChange={(days) => {
                const preset = LEAVE_PRESETS.find(p => p.days.toString() === days);
                setFormData({ ...formData, total_allowance_days: parseFloat(days), total_allowance_hours: preset?.hours || 0 });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave entitlement..." />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.days.toString()}>
                      {preset.label}: {preset.hours} hours - {preset.days} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Total Allowance Days
                </label>
                <Input
                  type="number"
                  value={formData.total_allowance_days}
                  onChange={(e) => setFormData({ ...formData, total_allowance_days: parseFloat(e.target.value) })}
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Total Allowance Hours
                </label>
                <Input
                  type="number"
                  value={formData.total_allowance_hours}
                  onChange={(e) => setFormData({ ...formData, total_allowance_hours: parseFloat(e.target.value) })}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Remaining Leave Balance Days
              </label>
              <Input
                type="number"
                disabled
                value={(formData.total_allowance_days + formData.carried_over_days).toFixed(1)}
                className="bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Remaining Leave Balance Hours
              </label>
              <Input
                type="number"
                disabled
                value={((formData.total_allowance_days + formData.carried_over_days) * 7.5).toFixed(1)}
                className="bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Carried Over Days
              </label>
              <Input
                type="number"
                value={formData.carried_over_days}
                onChange={(e) => setFormData({ ...formData, carried_over_days: parseFloat(e.target.value) })}
                min="0"
                step="0.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {editingYear ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}