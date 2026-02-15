import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays } from 'date-fns';

export default function RequestLeave({ userId, userName }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'annual_leave',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setFormData({
        type: 'annual_leave',
        start_date: '',
        end_date: '',
        reason: ''
      });
      toast.success('Leave request submitted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createRequestMutation.mutate({
      staff_id: userId,
      staff_name: userName,
      type: formData.type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      status: 'pending'
    });
  };

  const daysDiff = formData.start_date && formData.end_date
    ? differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Time Off</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual_leave">Annual Leave</SelectItem>
                <SelectItem value="sick_leave">Sick Leave</SelectItem>
                <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                <SelectItem value="maternity">Maternity</SelectItem>
                <SelectItem value="paternity">Paternity</SelectItem>
                <SelectItem value="compassionate">Compassionate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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

          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="Provide details about your leave request..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={!formData.start_date || !formData.end_date || createRequestMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}