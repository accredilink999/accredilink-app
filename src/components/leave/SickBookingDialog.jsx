import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Phone, AlertTriangle, CalendarOff } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function SickBookingDialog({ open, onOpenChange, userId, userName }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState('ask'); // ask | form | callPrompt
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    start_date: today,
    end_date: today,
    reason: '',
  });

  // Fetch sick phone number
  const { data: sickPhoneSettings = [] } = useQuery({
    queryKey: ['companySickPhone'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'company_sick_phone' }),
  });
  const sickPhone = sickPhoneSettings[0]?.setting_value || '';

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Sick leave submitted for approval');
      setStep('callPrompt');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleSubmitSick = () => {
    createRequestMutation.mutate({
      staff_id: userId,
      staff_name: userName,
      type: 'sick_leave',
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      status: 'pending',
    });
  };

  const handleClose = () => {
    setStep('ask');
    setFormData({ start_date: today, end_date: today, reason: '' });
    onOpenChange(false);
  };

  const handleNo = () => {
    handleClose();
    navigate(createPageUrl('LeaveManagement'));
  };

  const daysDiff = formData.start_date && formData.end_date
    ? differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        {/* Step 1: Are you booking sick? */}
        {step === 'ask' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Are You Booking Sick?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600 mt-2">
              If you need to report sick, we'll help you submit your request quickly.
              Otherwise, you'll be taken to the Leave Management page.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setStep('form')}
                className="flex-1 bg-red-600 hover:bg-red-700 min-h-[48px] text-base"
              >
                Yes, I'm Sick
              </Button>
              <Button
                variant="outline"
                onClick={handleNo}
                className="flex-1 min-h-[48px] text-base"
              >
                No, View Leave
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Sick leave form */}
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-red-500" />
                Report Sick Leave
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>

              {daysDiff > 0 && (
                <p className="text-sm text-slate-600">
                  Total: {daysDiff} day{daysDiff !== 1 ? 's' : ''}
                </p>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm">Reason / Details</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Briefly describe what's wrong..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitSick}
                  disabled={!formData.start_date || !formData.end_date || createRequestMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 min-h-[48px]"
                >
                  {createRequestMutation.isPending ? 'Submitting...' : 'Submit Sick Leave'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="min-h-[48px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Call prompt */}
        {step === 'callPrompt' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <Phone className="w-5 h-5" />
                Sick Leave Submitted
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Your sick leave has been submitted for approval.
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You must call the number below immediately to speak to someone.
                </p>
              </div>

              {sickPhone ? (
                <a
                  href={`tel:${sickPhone.replace(/\s/g, '')}`}
                  className="block text-center bg-slate-50 border-2 border-slate-200 rounded-xl p-5 hover:bg-slate-100 transition-colors"
                >
                  <Phone className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900 tracking-wide">{sickPhone}</p>
                  <p className="text-xs text-slate-500 mt-1">Tap to call</p>
                </a>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No sick line number has been set. Please contact your manager directly.
                </p>
              )}

              <div className="flex gap-3">
                {sickPhone && (
                  <a
                    href={`tel:${sickPhone.replace(/\s/g, '')}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 min-h-[48px] text-base">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className={`min-h-[48px] ${sickPhone ? '' : 'flex-1'}`}
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
