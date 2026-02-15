/**
 * ShiftSittingLogs
 *
 * Inline sitting log management for Sit-In shifts.
 * - Shows a form to add sitting log entries for any client
 * - Entries are listed on the shift for reference
 * - Entries also save to the client's personal sitting log page
 * - "Create End of Shift Report" compiles all logs into a daily report per client
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpeechButton from '@/components/ui/SpeechButton';
import { Plus, FileText, Trash2, User, Clock, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const VISIT_TYPE_LABELS = {
  food_drink: 'Food & Drink',
  mood: 'Mood',
  concerns: 'Concerns',
  compliments: 'Compliments & Complaints',
  healthcare_visit: 'Healthcare Visit',
  social_care_call: 'Social Care Call',
  appointment: 'Appointment',
  social_care_outing: 'Social Care Outing',
};

export default function ShiftSittingLogs({ shift, isMyShift, isAdmin }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    service_user_id: '',
    visit_type: 'food_drink',
    notes: '',
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch service users for the client dropdown
  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }, 'full_name', 500),
  });

  // Fetch sitting logs for this shift
  const { data: shiftLogs = [], isLoading } = useQuery({
    queryKey: ['shiftSittingLogs', shift?.id],
    queryFn: () => base44.entities.SittingLog.filter({ shift_id: shift.id }, '-created_at', 200),
    enabled: !!shift?.id,
  });

  const createLogMutation = useMutation({
    mutationFn: (data) => base44.entities.SittingLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSittingLogs', shift.id] });
      // Also invalidate the client's personal sitting logs
      queryClient.invalidateQueries({ queryKey: ['sittingLogs'] });
      setFormData({ service_user_id: formData.service_user_id, visit_type: 'food_drink', notes: '' });
      setIsAdding(false);
      toast.success('Sitting log saved');
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId) => base44.entities.SittingLog.delete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSittingLogs', shift.id] });
      queryClient.invalidateQueries({ queryKey: ['sittingLogs'] });
      toast.success('Log deleted');
    },
  });

  // Create End of Shift Report — compiles all logs from this shift into a daily report per client
  const createReportMutation = useMutation({
    mutationFn: async () => {
      const nonReportLogs = shiftLogs.filter(l => !l.is_daily_report);
      if (nonReportLogs.length === 0) throw new Error('No logs to compile');

      // Group logs by client
      const byClient = {};
      for (const log of nonReportLogs) {
        const key = log.service_user_id;
        if (!byClient[key]) byClient[key] = { name: log.service_user_name, logs: [] };
        byClient[key].logs.push(log);
      }

      // Create a report for each client
      const today = new Date().toISOString().split('T')[0];
      for (const [clientId, data] of Object.entries(byClient)) {
        const compiledNotes = data.logs
          .map(log => `[${VISIT_TYPE_LABELS[log.visit_type] || log.visit_type}] ${format(new Date(log.visit_date), 'HH:mm')}\n${log.notes}`)
          .join('\n\n---\n\n');

        await base44.entities.SittingLog.create({
          service_user_id: clientId,
          service_user_name: data.name,
          visit_type: 'daily_report',
          visitor_name: currentUser?.full_name || '',
          visit_date: new Date().toISOString(),
          notes: compiledNotes,
          recorded_by: currentUser?.id,
          recorded_by_name: currentUser?.full_name,
          is_daily_report: true,
          report_date: today,
          shift_id: shift.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSittingLogs', shift.id] });
      queryClient.invalidateQueries({ queryKey: ['sittingLogs'] });
      toast.success('End of shift report created');
    },
    onError: (err) => {
      toast.error('Failed to create report: ' + (err.message || 'Unknown error'));
    },
  });

  const handleSubmit = () => {
    if (!formData.service_user_id || !formData.notes.trim()) {
      toast.error('Please select a client and enter details');
      return;
    }

    const selectedClient = serviceUsers.find(u => u.id === formData.service_user_id);

    createLogMutation.mutate({
      service_user_id: formData.service_user_id,
      service_user_name: selectedClient?.full_name || '',
      visit_type: formData.visit_type,
      visitor_name: currentUser?.full_name || '',
      visit_date: new Date().toISOString(),
      notes: formData.notes,
      recorded_by: currentUser?.id,
      recorded_by_name: currentUser?.full_name,
      shift_id: shift.id,
    });
  };

  const nonReportLogs = shiftLogs.filter(l => !l.is_daily_report);
  const reportLogs = shiftLogs.filter(l => l.is_daily_report);
  const hasReport = reportLogs.length > 0;

  return (
    <div className="space-y-4">
      {/* Add Sitting Log Button */}
      {!isAdding && (isMyShift || isAdmin) && shift.status !== 'completed' && (
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full bg-teal-600 hover:bg-teal-700 min-h-[48px] text-base touch-manipulation"
        >
          <Plus className="w-4 h-4 mr-2" />
          Sitting Log
        </Button>
      )}

      {/* Inline Form */}
      {isAdding && (
        <Card className="p-4 space-y-3 border-teal-200 bg-teal-50">
          <h4 className="font-semibold text-slate-900 text-sm">New Sitting Log Entry</h4>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Client</label>
            <Select value={formData.service_user_id} onValueChange={(value) => setFormData({...formData, service_user_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {serviceUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Entry Type</label>
            <Select value={formData.visit_type} onValueChange={(value) => setFormData({...formData, visit_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food_drink">Food & Drink Log</SelectItem>
                <SelectItem value="mood">Mood Log</SelectItem>
                <SelectItem value="concerns">Concerns Log</SelectItem>
                <SelectItem value="compliments">Compliments & Complaints Log</SelectItem>
                <SelectItem value="healthcare_visit">Healthcare Visit</SelectItem>
                <SelectItem value="social_care_call">Social Care Call</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="social_care_outing">Social Care Outing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Details</label>
            <div className="flex gap-2">
              <Textarea
                placeholder="Enter details..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="h-24 flex-1"
              />
              <SpeechButton
                onResult={(text) => setFormData(prev => ({ ...prev, notes: (prev.notes || '') + ' ' + text }))}
                className="h-12 px-3"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={createLogMutation.isPending}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              {createLogMutation.isPending ? 'Saving...' : 'Save Sitting Log'}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1 min-h-[44px] touch-manipulation">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Log entries for this shift */}
      {isLoading ? (
        <p className="text-center text-slate-500 py-4 text-sm">Loading logs...</p>
      ) : nonReportLogs.length === 0 && !hasReport ? (
        <Card className="p-6 text-center">
          <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">No sitting logs yet for this shift</p>
          <p className="text-slate-400 text-xs mt-1">Tap "Sitting Log" above to add an entry</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {nonReportLogs.map(log => (
            <Card key={log.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-slate-900 text-sm truncate">{log.service_user_name}</span>
                    <Badge variant="outline" className="text-xs py-0 px-1.5">
                      {VISIT_TYPE_LABELS[log.visit_type] || log.visit_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.visit_date), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.recorded_by_name}
                    </span>
                  </div>
                </div>
                {(isAdmin || isMyShift) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLogMutation.mutate(log.id)}
                    disabled={deleteLogMutation.isPending}
                    className="text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* End of Shift Report */}
      {hasReport && (
        <Card className="p-3 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-amber-700" />
            <span className="font-semibold text-amber-900 text-sm">End of Shift Report Created</span>
          </div>
          <p className="text-xs text-amber-700">
            Report compiled for {[...new Set(reportLogs.map(l => l.service_user_name))].join(', ')}
          </p>
        </Card>
      )}

      {/* Create End of Shift Report button */}
      {nonReportLogs.length > 0 && !hasReport && (isMyShift || isAdmin) && (
        <Button
          onClick={() => createReportMutation.mutate()}
          disabled={createReportMutation.isPending}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold min-h-[48px] touch-manipulation"
        >
          <FileText className="w-4 h-4 mr-2" />
          {createReportMutation.isPending ? 'Creating Report...' : 'Create End of Shift Report'}
        </Button>
      )}
    </div>
  );
}
