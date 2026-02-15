import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react';

export default function ClientCallDetailModal({ call, open, onOpenChange }) {
  if (!call) return null;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    missed: 'bg-red-100 text-red-800',
    rescheduled: 'bg-purple-100 text-purple-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Client Call Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{call.service_user_name}</h3>
            {call.service_user_address && (
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {call.service_user_address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Date</p>
                <p className="text-sm font-medium text-slate-900">{call.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Time</p>
                <p className="text-sm font-medium text-slate-900">{call.scheduled_time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Duration</p>
                <p className="text-sm font-medium text-slate-900">{call.duration_minutes} minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge className={statusColors[call.status] || 'bg-slate-100 text-slate-800'}>
                {call.status}
              </Badge>
            </div>
          </div>

          {call.notes && (
            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium mb-1">Notes</p>
                  <p className="text-sm text-slate-600">{call.notes}</p>
                </div>
              </div>
            </div>
          )}

          {(call.clock_in_time || call.clock_out_time) && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-slate-500 font-medium">Clock Times</p>
              {call.clock_in_time && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Clocked in:</span> {call.clock_in_time}
                </p>
              )}
              {call.clock_out_time && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Clocked out:</span> {call.clock_out_time}
                </p>
              )}
            </div>
          )}

          {call.assigned_staff_names && call.assigned_staff_names.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs text-slate-500 font-medium mb-2">Assigned Staff</p>
              <div className="flex flex-wrap gap-2">
                {call.assigned_staff_names.map((name, idx) => (
                  <Badge key={idx} variant="outline" className="bg-slate-50">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}