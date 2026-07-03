import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Plus, 
  CalendarOff,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User
} from 'lucide-react';

const leaveTypeLabels = {
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
  unpaid_leave: 'Unpaid Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  compassionate: 'Compassionate Leave',
  other: 'Other'
};

const leaveTypeColors = {
  annual_leave: 'bg-blue-100 text-blue-700',
  sick_leave: 'bg-red-100 text-red-700',
  unpaid_leave: 'bg-slate-100 text-slate-700',
  maternity: 'bg-pink-100 text-pink-700',
  paternity: 'bg-purple-100 text-purple-700',
  compassionate: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-700'
};

export default function LeaveRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'annual_leave',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaveRequests'] }),
  });

  const resetForm = () => {
    setFormData({
      type: 'annual_leave',
      start_date: '',
      end_date: '',
      reason: ''
    });
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      staff_id: user?.id,
      staff_name: user?.full_name,
      status: 'pending'
    });
  };

  const handleApprove = async (request) => {
    try {
      // 1. Find all shifts for this staff in the leave date range
      const { data: affectedShifts = [] } = await supabase
        .from('shifts')
        .select('id, paired_shift_id')
        .eq('staff_id', request.staff_id)
        .gte('date', request.start_date)
        .lte('date', request.end_date);

      // 2. Clear staff from affected shifts (revert to blank/available)
      for (const shift of affectedShifts) {
        await supabase.from('shift_calls').delete().eq('shift_id', shift.id);
        if (shift.paired_shift_id) {
          await supabase.from('shifts')
            .update({ paired_shift_id: null, paired_staff_name: null })
            .eq('id', shift.paired_shift_id);
        }
        await supabase.from('shifts')
          .update({
            staff_id: null, staff_name: null,
            paired_shift_id: null, paired_staff_name: null,
            shift_pattern_id: null, is_base_shift: true,
            status: 'available_cover'
          })
          .eq('id', shift.id);
      }

      // 3. Update leave request status
      updateMutation.mutate({
        id: request.id,
        data: {
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_by_name: user?.full_name
        }
      });

      if (affectedShifts.length > 0) {
        toast.success(`Leave approved — ${affectedShifts.length} shift(s) cleared from rota`);
      }
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['todayShifts'] });
    } catch (err) {
      console.error('Leave approval error:', err);
      toast.error('Failed to clear shifts: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReject = (request) => {
    updateMutation.mutate({
      id: request.id,
      data: {
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const myRequests = leaveRequests.filter(r => r.staff_id === user?.id);
  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const allRequests = leaveRequests;

  const displayedRequests = activeTab === 'my' ? myRequests :
                           activeTab === 'pending' ? pendingRequests : allRequests;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Manage time off and availability"
        tutorialKey="LeaveManagement"
      >
        <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{pendingRequests.length}</p>
              <p className="text-sm text-amber-600">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3">
             <CheckCircle2 className="w-5 h-5 text-emerald-600" />
             <div>
               <p className="text-2xl font-bold text-emerald-700">
                 {leaveRequests.filter(r => r.status === 'approved').length}
               </p>
               <p className="text-sm text-emerald-600">Approved</p>
             </div>
           </div>
         </Card>
         <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">
                {leaveRequests.filter(r => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="my">My Requests</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 h-24 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : displayedRequests.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="No leave requests"
              description={activeTab === 'my' ? "You haven't submitted any leave requests." : "No leave requests to display."}
              action={
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Request Leave
                </Button>
              }
            />
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {displayedRequests.map((request, idx) => {
                const days = differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1;
                const colors = [
                  'from-blue-50 to-cyan-50 border-blue-100',
                  'from-purple-50 to-pink-50 border-purple-100',
                  'from-emerald-50 to-teal-50 border-emerald-100',
                  'from-orange-50 to-red-50 border-orange-100',
                  'from-amber-50 to-yellow-50 border-amber-100'
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <Card key={request.id} className={`p-3 sm:p-4 bg-gradient-to-r ${colorClass} shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-4">
                        <Avatar name={request.staff_name} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{request.staff_name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${leaveTypeColors[request.type]}`}>
                              {leaveTypeLabels[request.type]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {format(new Date(request.start_date), 'dd MMM')} - {format(new Date(request.end_date), 'dd MMM yyyy')}
                            <span className="text-slate-400"> ({days} day{days > 1 ? 's' : ''})</span>
                          </p>
                          {request.reason && (
                            <p className="text-sm text-slate-600 mt-2">{request.reason}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={request.status} />
                        {request.status === 'pending' && isAdmin && request.staff_id !== user?.id && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReject(request)}
                              disabled={updateMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-500" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(request)}
                              disabled={updateMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {request.reviewed_by_name && (
                      <p className="text-xs text-slate-400 mt-3 pt-3 border-t">
                        Reviewed by {request.reviewed_by_name}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Leave Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
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
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            {formData.start_date && formData.end_date && (
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-lg font-bold text-slate-900">
                  {differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1}
                </p>
                <p className="text-sm text-slate-500">days requested</p>
              </div>
            )}

            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Add any notes or reason for your request..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.start_date || !formData.end_date || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}