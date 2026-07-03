import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/ui/PageHeader';
import LeaveBalance from '@/components/leave/LeaveBalance';
import LeaveRequests from '@/components/leave/LeaveRequests';
import RequestLeave from '@/components/leave/RequestLeave';
import { Calendar, Phone, Save, Edit2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

const LEAVE_PRESETS = [
  { label: 'Full-Time (37.5 hours/week)', hours: 210, days: 28 },
  { label: 'Full-Time (40 hours/week)', hours: 224, days: 29.87 },
  { label: 'Part-Time (20 hours/week)', hours: 112, days: 14.87 },
  { label: 'Part-Time (15 hours/week)', hours: 84, days: 11.2 },
];

function AdminAllBalances() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [showDialog, setShowDialog] = useState(false);
  const [editingBalance, setEditingBalance] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [formData, setFormData] = useState({
    total_allowance_days: 0,
    total_allowance_hours: 0,
    carried_over_days: 0,
    used_days: 0,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allBalances = [] } = useQuery({
    queryKey: ['allLeaveBalances', currentYear],
    queryFn: async () => {
      return base44.entities.HolidayAllowance.filter({ year: currentYear });
    },
  });

  const activeStaff = staff.filter(s => s.employment_status === 'active');

  // Map balances by staff_id for quick lookup
  const balanceMap = {};
  allBalances.forEach(b => { balanceMap[b.staff_id] = b; });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HolidayAllowance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLeaveBalances'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      setShowDialog(false);
      toast.success('Leave balance created');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HolidayAllowance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLeaveBalances'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      setShowDialog(false);
      toast.success('Leave balance updated');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const openEdit = (staffMember, balance) => {
    setSelectedStaffId(staffMember.id);
    if (balance) {
      setEditingBalance(balance);
      setFormData({
        total_allowance_days: balance.total_allowance_days || 0,
        total_allowance_hours: balance.total_allowance_hours || 0,
        carried_over_days: balance.carried_over_days || 0,
        used_days: balance.used_days || 0,
      });
    } else {
      setEditingBalance(null);
      setFormData({
        total_allowance_days: 28,
        total_allowance_hours: 210,
        carried_over_days: 0,
        used_days: 0,
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const staffMember = activeStaff.find(s => s.id === selectedStaffId);
    if (editingBalance) {
      updateMutation.mutate({
        id: editingBalance.id,
        data: {
          total_allowance_days: formData.total_allowance_days,
          total_allowance_hours: formData.total_allowance_hours,
          carried_over_days: formData.carried_over_days,
          used_days: formData.used_days,
        }
      });
    } else {
      createMutation.mutate({
        staff_id: selectedStaffId,
        staff_name: staffMember?.full_name || '',
        year: currentYear,
        total_allowance_days: formData.total_allowance_days,
        total_allowance_hours: formData.total_allowance_hours,
        carried_over_days: formData.carried_over_days,
        used_days: formData.used_days,
        pending_days: 0,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          All Staff Leave Balances — {currentYear}
        </h3>
      </div>

      <div className="space-y-2">
        {activeStaff.map(member => {
          const balance = balanceMap[member.id];
          const total = balance ? (balance.total_allowance_days || 0) + (balance.carried_over_days || 0) : 0;
          const used = balance?.used_days || 0;
          const remaining = total - used - (balance?.pending_days || 0);
          const remainingHours = remaining * 7.5;
          const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

          return (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{member.full_name}</p>
                  {balance ? (
                    <div className="flex flex-wrap gap-3 mt-1 text-xs">
                      <span className="text-blue-600">Allowance: {balance.total_allowance_days}d ({(balance.total_allowance_hours || (balance.total_allowance_days * 7.5)).toFixed(0)}h)</span>
                      <span className="text-red-600">Used: {used}d ({(used * 7.5).toFixed(1)}h)</span>
                      <span className="font-semibold text-teal-700">Remaining: {remaining}d ({remainingHours.toFixed(1)}h)</span>
                      {balance.carried_over_days > 0 && (
                        <span className="text-amber-600">+{balance.carried_over_days}d carried over</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No balance set</p>
                  )}
                  {balance && total > 0 && (
                    <div className="mt-2 w-full max-w-xs">
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-teal-500'}`}
                          style={{ width: `${Math.min(100, usagePercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(member, balance)}
                  className="flex-shrink-0"
                >
                  {balance ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-1 hidden sm:inline">{balance ? 'Edit' : 'Set'}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBalance ? 'Edit' : 'Set'} Leave Balance — {activeStaff.find(s => s.id === selectedStaffId)?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Quick Select</label>
              <Select onValueChange={(days) => {
                const preset = LEAVE_PRESETS.find(p => p.days.toString() === days);
                setFormData({ ...formData, total_allowance_days: parseFloat(days), total_allowance_hours: preset?.hours || 0 });
              }}>
                <SelectTrigger><SelectValue placeholder="Select preset..." /></SelectTrigger>
                <SelectContent>
                  {LEAVE_PRESETS.map(p => (
                    <SelectItem key={p.label} value={p.days.toString()}>{p.label}: {p.days}d / {p.hours}h</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Days</Label>
                <Input type="number" step="0.5" min="0" value={formData.total_allowance_days}
                  onChange={(e) => setFormData({ ...formData, total_allowance_days: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Total Hours</Label>
                <Input type="number" step="0.5" min="0" value={formData.total_allowance_hours}
                  onChange={(e) => setFormData({ ...formData, total_allowance_hours: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Carried Over Days</Label>
                <Input type="number" step="0.5" min="0" value={formData.carried_over_days}
                  onChange={(e) => setFormData({ ...formData, carried_over_days: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Used Days</Label>
                <Input type="number" step="0.5" min="0" value={formData.used_days}
                  onChange={(e) => setFormData({ ...formData, used_days: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining:</span>
                <span className="font-semibold text-teal-700">
                  {(formData.total_allowance_days + formData.carried_over_days - formData.used_days).toFixed(1)} days
                  ({' '}
                  {((formData.total_allowance_days + formData.carried_over_days - formData.used_days) * 7.5).toFixed(1)} hours)
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
              {editingBalance ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LeaveManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('balance');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager'].includes(user?.job_title);

  // Fetch company sick phone number (admin setting)
  const { data: sickPhoneSettings = [] } = useQuery({
    queryKey: ['companySickPhone'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'company_sick_phone' }),
    enabled: isAdmin,
  });

  const existingSickPhone = sickPhoneSettings[0];
  const [sickPhone, setSickPhone] = useState('');
  const sickPhoneLoaded = React.useRef(false);

  // Sync fetched value into state once
  React.useEffect(() => {
    if (existingSickPhone && !sickPhoneLoaded.current) {
      setSickPhone(existingSickPhone.setting_value || '');
      sickPhoneLoaded.current = true;
    }
  }, [existingSickPhone]);

  const saveSickPhoneMutation = useMutation({
    mutationFn: async () => {
      if (existingSickPhone) {
        return base44.entities.SystemSettings.update(existingSickPhone.id, {
          setting_value: sickPhone.trim(),
        });
      } else {
        return base44.entities.SystemSettings.create({
          setting_key: 'company_sick_phone',
          setting_value: sickPhone.trim(),
          description: 'Company sick line phone number shown to staff when booking sick',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySickPhone'] });
      toast.success('Sick phone number saved');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const tabCount = isAdmin ? 5 : 3;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Manage holidays, sickness, and time off"
        tutorialKey="LeaveManagement"
      >
        <Calendar className="w-6 h-6 text-teal-600" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full max-w-2xl grid-cols-${tabCount}`}>
          <TabsTrigger value="balance">My Balance</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="all-requests">All Requests</TabsTrigger>}
          {isAdmin && <TabsTrigger value="all-balances">All Balances</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="balance" className="mt-6">
          <LeaveBalance userId={user?.id} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            <RequestLeave userId={user?.id} userName={user?.full_name} />
            <LeaveRequests staffId={user?.id} isAdmin={false} />
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="all-requests" className="mt-6">
            <LeaveRequests isAdmin={true} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="all-balances" className="mt-6">
            <AdminAllBalances />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-teal-600" />
                  Company Sick Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                  This phone number is shown to staff when they book sick leave, prompting them to call in immediately.
                </p>
                <div className="space-y-2">
                  <Label>Sick Line Phone Number</Label>
                  <Input
                    type="tel"
                    value={sickPhone}
                    onChange={(e) => setSickPhone(e.target.value)}
                    placeholder="e.g. 01745 123456"
                  />
                </div>
                <Button
                  onClick={() => saveSickPhoneMutation.mutate()}
                  disabled={saveSickPhoneMutation.isPending || !sickPhone.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveSickPhoneMutation.isPending ? 'Saving...' : 'Save Phone Number'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
