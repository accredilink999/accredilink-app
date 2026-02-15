import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Calendar, User, History, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DailyReportViewer from './DailyReportViewer';
import SpeechButton from '@/components/ui/SpeechButton';
import { toast } from 'sonner';

export default function HealthcareLogManager({ serviceUser, logType = 'communication' }) {
   const queryClient = useQueryClient();
   const [isAdding, setIsAdding] = useState(false);
   const [deleteConfirmId, setDeleteConfirmId] = useState(null);
   const [selectedReport, setSelectedReport] = useState(null);
   const [reportViewerOpen, setReportViewerOpen] = useState(false);
   const [pastLogsOpen, setPastLogsOpen] = useState(false);
   const [selectedPastDate, setSelectedPastDate] = useState('');
  const [formData, setFormData] = useState({
    visit_type: 'healthcare_professional',
    visitor_name: '',
    visit_date: logType === 'sitting' ? new Date().toISOString().slice(0, 16) : '',
    notes: ''
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.User.list(),
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.job_title === 'admin' || currentUser?.job_title === 'manager';


  const { data: logs = [] } = useQuery({
      queryKey: [logType === 'sitting' ? 'sittingLogs' : 'healthcareLogs', serviceUser?.id],
      queryFn: async () => {
        const entity = logType === 'sitting' ? base44.entities.SittingLog : base44.entities.HealthcareLog;
        const allLogs = await entity.filter({ service_user_id: serviceUser.id }, '-visit_date', 1000);
        // Ensure daily reports are included
        return allLogs;
      },
      enabled: !!serviceUser?.id,
    });

  const createMutation = useMutation({
        mutationFn: (data) => base44.entities.HealthcareLog.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['healthcareLogs', serviceUser.id] });
          setFormData({
            visit_type: 'healthcare_professional',
            visitor_name: '',
            visit_date: '',
            notes: ''
          });
          setIsAdding(false);
        },
      });

      const createSittingLogMutation = useMutation({
        mutationFn: (data) => base44.entities.SittingLog.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['sittingLogs', serviceUser.id] });
          setFormData({
            visit_type: 'food_drink',
            visitor_name: '',
            visit_date: logType === 'sitting' ? new Date().toISOString().slice(0, 16) : '',
            notes: ''
          });
          setIsAdding(false);
          toast.success('Sitting log saved');
        },
        onError: (err) => {
          console.error('Failed to save sitting log:', err);
          toast.error('Failed to save sitting log: ' + (err.message || 'Unknown error'));
        },
      });

  const deleteMutation = useMutation({
        mutationFn: (logId) => {
          if (logType === 'sitting') {
            return base44.entities.SittingLog.delete(logId);
          }
          return base44.entities.HealthcareLog.delete(logId);
        },
        onSuccess: () => {
          if (logType === 'sitting') {
            queryClient.invalidateQueries({ queryKey: ['sittingLogs', serviceUser.id] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['healthcareLogs', serviceUser.id] });
          }
        },
      });

  const generateDailyLogMutation = useMutation({
      mutationFn: async () => {
        const today = new Date().toISOString().split('T')[0];
        const todaysLogs = logs.filter(log => 
          !log.is_daily_report && 
          new Date(log.visit_date).toISOString().split('T')[0] === today
        );

        const compiledNotes = todaysLogs
          .map(log => `[${visitTypeLabels[log.visit_type] || log.visit_type}]\n${log.notes}`)
          .join('\n\n---\n\n');

        const entity = logType === 'sitting' ? base44.entities.SittingLog : base44.entities.HealthcareLog;
        await entity.create({
          service_user_id: serviceUser.id,
          service_user_name: serviceUser.full_name,
          visit_type: 'daily_report',
          visitor_name: '',
          visit_date: new Date().toISOString(),
          notes: compiledNotes,
          recorded_by: currentUser.id,
          recorded_by_name: currentUser.full_name,
          is_daily_report: true,
          report_date: today
        });
      },
      onSuccess: () => {
        const queryKey = logType === 'sitting' ? 'sittingLogs' : 'healthcareLogs';
        queryClient.invalidateQueries({ queryKey: [queryKey, serviceUser.id] });
      },
    });

  const handleSubmit = () => {
          if (!formData.visit_date || !formData.notes.trim()) return;

          const logData = {
            service_user_id: serviceUser.id,
            service_user_name: serviceUser.full_name,
            visit_type: formData.visit_type,
            visitor_name: formData.visitor_name,
            visit_date: formData.visit_date,
            notes: formData.notes,
            recorded_by: currentUser.id,
            recorded_by_name: currentUser.full_name,
          };

          if (logType === 'sitting') {
            createSittingLogMutation.mutate(logData);
          } else {
            createMutation.mutate(logData);
          }
        };



  const handleViewPastLog = () => {
    if (!selectedPastDate) return;
    
    // Find the daily report for the selected date
    const pastReport = logs.find(log => log.is_daily_report && log.report_date === selectedPastDate);
    
    if (pastReport) {
      setSelectedReport(pastReport);
      setReportViewerOpen(true);
      setPastLogsOpen(false);
    }
  };



  const visitTypeLabels = logType === 'sitting' ? {
    food_drink: 'Food & Drink Log',
    mood: 'Mood Log',
    concerns: 'Concerns Log',
    compliments: 'Complements & Complaints Log',
    healthcare_visit: 'Healthcare Visit',
    social_care_call: 'Social Care Call',
    appointment: 'Appointment',
    social_care_outing: 'Social Care Outing',
  } : {
    healthcare_professional: 'Healthcare Professional',
    social_worker: 'Social Worker',
    other: 'Other'
  };

  return (
    <div className="flex justify-center md:justify-start">
      <div className="space-y-3 w-full max-w-md md:max-w-none">
      {!isAdding && (
        <>
          <Button onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {logType === 'sitting' ? 'Add Sitting Log' : 'Add Communication Log'}
          </Button>
          {logType === 'sitting' && (
            <>
              <Button 
                onClick={() => generateDailyLogMutation.mutate()}
                disabled={generateDailyLogMutation.isPending || !logs.some(log => !log.is_daily_report && new Date(log.visit_date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0])}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create End of Shift Report
              </Button>
              <Dialog open={pastLogsOpen} onOpenChange={setPastLogsOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold">
                    <History className="w-4 h-4 mr-2" />
                    Show Past Logs
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>View Past Daily Report</DialogTitle>
                    <DialogDescription>Select a date to view the daily report</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Select Date</label>
                      <Input
                        type="date"
                        value={selectedPastDate}
                        onChange={(e) => setSelectedPastDate(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleViewPastLog}
                      disabled={!selectedPastDate || !logs.find(log => log.is_daily_report && log.report_date === selectedPastDate)}
                      className="w-full"
                    >
                      View Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      )}

      {isAdding && (
        <Card className="p-4 space-y-3 border-teal-200 bg-teal-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">{logType === 'sitting' ? 'Entry Type' : 'Visit Type'}</label>
              <Select value={formData.visit_type} onValueChange={(value) => setFormData({...formData, visit_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logType === 'sitting' ? (
                    <>
                      <SelectItem value="food_drink">Food & Drink Log</SelectItem>
                      <SelectItem value="mood">Mood Log</SelectItem>
                      <SelectItem value="concerns">Concerns Log</SelectItem>
                      <SelectItem value="compliments">Complements & Complaints Log</SelectItem>
                      <SelectItem value="healthcare_visit">Healthcare Visit</SelectItem>
                      <SelectItem value="social_care_call">Social Care Call</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="social_care_outing">Social Care Outing</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
                      <SelectItem value="social_worker">Social Worker</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
               <label className="text-sm font-medium text-slate-700 mb-1 block">Staff Member</label>
               <Select value={formData.visitor_name} onValueChange={(value) => setFormData({...formData, visitor_name: value})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select staff member" />
                 </SelectTrigger>
                 <SelectContent>
                   {staffList.map(staff => (
                     <SelectItem key={staff.id} value={staff.full_name || staff.email}>
                       {staff.full_name || staff.email}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
          </div>
          <div className={logType === 'sitting' ? 'md:col-span-2' : ''}>
           <label className="text-sm font-medium text-slate-700 mb-1 block">{logType === 'sitting' ? 'Date & Time Of Log' : 'Visit Date'}</label>
           <Input
             type={logType === 'sitting' ? 'datetime-local' : 'date'}
             value={formData.visit_date}
             onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
           />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">{logType === 'sitting' ? 'Details' : 'Notes'}</label>
            <div className="flex gap-2">
              <Textarea
                placeholder={logType === 'sitting' ? "Enter details..." : "Communication notes..."}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="h-24 flex-1"
              />
              <div className="flex flex-col gap-2">
                <SpeechButton
                  onResult={(text) => setFormData(prev => ({ ...prev, notes: (prev.notes || '') + ' ' + text }))}
                  className="h-12 px-3"
                />
                <Button
                  type="button"
                  onClick={() => setFormData({...formData, notes: ''})}
                  className="h-10 px-3 bg-slate-400 hover:bg-slate-500 text-white"
                  title="Clear text"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={logType === 'sitting' ? createSittingLogMutation.isPending : createMutation.isPending} className="flex-1">
              {(logType === 'sitting' ? createSittingLogMutation.isPending : createMutation.isPending) ? 'Saving...' : logType === 'sitting' ? 'Save Sitting Log' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {logs.length === 0 ? (
       <p className="text-center text-slate-500 py-8">{logType === 'sitting' ? 'No Sitting Logs Yet' : 'No communication logs yet'}</p>
       ) : (
       (() => {
         // Get all daily report dates for this user
         const dailyReportDates = logs
           .filter(log => log.is_daily_report)
           .map(log => log.report_date);

         return logs
           .filter(log => {
             if (logType === 'sitting') {
               // If this is a daily report, always show it
               if (log.is_daily_report) return true;

               // If this is an individual sitting log, hide it if a report exists for that day
               if (log.visit_type !== 'healthcare_professional' && ['food_drink', 'mood', 'concerns', 'compliments', 'healthcare_visit', 'social_care_call', 'appointment', 'social_care_outing'].includes(log.visit_type)) {
                 const logDate = new Date(log.visit_date).toISOString().split('T')[0];
                 return !dailyReportDates.includes(logDate);
               }
               return false;
             }
             return !log.is_daily_report;
           })
           .map(log => (
             <Card 
               key={log.id} 
               className={`p-4 ${log.is_daily_report ? 'border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors' : ''}`}
               onClick={() => {
                 if (log.is_daily_report) {
                   setSelectedReport(log);
                   setReportViewerOpen(true);
                 }
               }}
             >
               <div className="flex items-start justify-between mb-3">
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                     <Badge className={log.is_daily_report ? 'bg-amber-200 text-amber-900' : 'bg-teal-100 text-teal-700'}>
                       {log.is_daily_report ? 'Daily Report' : (visitTypeLabels[log.visit_type] || log.visit_type)}
                     </Badge>
                     {log.visitor_name && !log.is_daily_report && (
                       <span className="text-sm text-slate-600 flex items-center gap-1">
                         <User className="w-3 h-3" />
                         {log.visitor_name}
                       </span>
                     )}
                   </div>
                   <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                     <Calendar className="w-3 h-3" />
                     {log.visit_date}
                   </div>
                   <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                 </div>
                 {isAdmin && (
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={(e) => {
                       e.stopPropagation();
                       setDeleteConfirmId(log.id);
                     }}
                     disabled={deleteMutation.isPending}
                     className="text-red-600 hover:text-red-700 hover:bg-red-50"
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 )}
               </div>
               <p className="text-xs text-slate-400">Recorded by {log.recorded_by_name}</p>
             </Card>
           ));
         })()
         )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {logs.find(l => l.id === deleteConfirmId)?.is_daily_report ? 'Daily Report' : 'Log'}?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            {logs.find(l => l.id === deleteConfirmId)?.is_daily_report ? (
              <>
                <p className="text-red-600 font-semibold">⚠️ Warning: You are about to delete a Daily Report.</p>
                <p>This action cannot be undone. Are you sure you want to permanently delete this daily sitting log report?</p>
              </>
            ) : (
              <p>Are you sure you want to delete this log? This action cannot be undone.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DailyReportViewer
        report={selectedReport}
        isOpen={reportViewerOpen}
        onClose={() => {
          setReportViewerOpen(false);
          setSelectedReport(null);
        }}
        serviceUser={serviceUser}
      />
            </div>
            </div>
            );
            }