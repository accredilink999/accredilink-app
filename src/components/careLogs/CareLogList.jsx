import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import CareLogViewer from './CareLogViewer';

export default function CareLogList({ careLogs, serviceUserId }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const userLogs = careLogs.filter(log => log.service_user_id === serviceUserId);

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setViewerOpen(true);
  };

  if (userLogs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No care logs yet</p>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'submitted':
        return { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Submitted' };
      case 'overdue':
        return { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Overdue' };
      case 'pending':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
      default:
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  return (
    <div className="space-y-3">
      {userLogs.map(log => {
        const statusConfig = getStatusConfig(log.status);
        const StatusIcon = statusConfig.icon;

        return (
          <div 
            key={log.id}
            onClick={() => handleLogClick(log)}
            className="cursor-pointer"
          >
            <Card className="p-4 hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {format(new Date(log.visit_date), 'dd MMM yyyy')} • {log.visit_time}
                    </p>
                    <p className="text-sm text-slate-600">by {log.staff_name}</p>
                  </div>
                </div>
              </div>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-500">Mood</p>
                <p className="font-medium text-slate-900 capitalize">{log.mood || '—'}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-500">Food</p>
                <p className="font-medium text-slate-900 capitalize">{log.food_intake || '—'}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-500">Fluid</p>
                <p className="font-medium text-slate-900 capitalize">{log.fluid_intake || '—'}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-500">Duration</p>
                <p className="font-medium text-slate-900">{log.duration_minutes} mins</p>
              </div>
            </div>

            {log.medications_given && log.medications_given.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Medications Given</p>
                <div className="flex flex-wrap gap-1">
                  {log.medications_given.map((med, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{med}</Badge>
                  ))}
                </div>
              </div>
            )}

            {log.activities && log.activities.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Activities Completed</p>
                <div className="flex flex-wrap gap-1">
                  {log.activities.map((activity, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{activity.activity}</Badge>
                  ))}
                </div>
              </div>
            )}

            {log.health_observations && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-slate-600 mb-1">Health Observations</p>
                <p className="text-sm text-slate-700">{log.health_observations}</p>
              </div>
            )}

            {log.incidents && (
              <div className="mb-2 bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs font-semibold text-red-600 mb-1">⚠️ Incidents Reported</p>
                <p className="text-sm text-red-700">{log.incidents}</p>
              </div>
            )}

            {log.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{log.notes}</p>
              </div>
            )}

            {log.submitted_at && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                Submitted: {format(new Date(log.submitted_at), 'dd MMM yyyy • HH:mm')}
              </div>
            )}
            </Card>
            </div>
        );
      })}
      <CareLogViewer 
        careLog={selectedLog}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}