import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Avatar from '@/components/ui/Avatar';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { format } from 'date-fns';

export default function AnnouncementAcknowledgementModal({ announcement, announcements = [], user, onAcknowledge, onDismiss }) {
  const queryClient = useQueryClient();
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());
  const [dismissed, setDismissed] = useState(false);
  const announcementList = announcements.length > 0 ? announcements : [announcement];

  if (dismissed) return null;

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      
      // Acknowledge only checked announcements
      for (const ann of announcementList) {
        if (acknowledgedIds.has(ann.id)) {
          await base44.entities.AnnouncementAcknowledgement.create({
            announcement_id: ann.id,
            staff_id: user.id,
            staff_name: user.staff_full_name || user.full_name,
            acknowledged_at: now,
            read_at: now
          });

          await base44.entities.Message.update(ann.id, {
            read_by: [...(ann.read_by || []), user.id]
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unacknowledgedAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      onAcknowledge?.();
    },
  });

  const toggleAnnouncement = (id) => {
    const newSet = new Set(acknowledgedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setAcknowledgedIds(newSet);
  };

  const allAcknowledged = announcementList.length === acknowledgedIds.size;

  const handleAcknowledge = () => {
    acknowledgeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Important Team Announcement{announcementList.length > 1 ? 's' : ''}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {announcementList.length > 1
                  ? `${announcementList.length} announcements require your acknowledgement to continue`
                  : 'This message requires your acknowledgement to continue'}
              </p>
            </div>
          </div>

          {/* Announcements List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {announcementList.map((ann) => (
              <div key={ann.id} className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                acknowledgedIds.has(ann.id)
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-slate-200'
              }`} onClick={() => toggleAnnouncement(ann.id)}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={acknowledgedIds.has(ann.id)}
                    onCheckedChange={() => toggleAnnouncement(ann.id)}
                    className="w-5 h-5 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{ann.title || 'Untitled'}</p>
                        <p className="text-xs text-slate-500">
                          {ann.sender_name} • {format(new Date(ann.created_date), 'dd MMM HH:mm')}
                        </p>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                        ann.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : ann.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ann.priority === 'urgent' ? 'URGENT' : ann.priority === 'high' ? 'HIGH' : 'NORMAL'}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{ann.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Access Blocked</p>
              <p className="text-sm text-red-700 mt-1">
                You cannot access any other part of the app until you acknowledge all announcements.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-200">
            <Button
              onClick={handleAcknowledge}
              disabled={!allAcknowledged || acknowledgeMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3"
              size="lg"
            >
              {acknowledgeMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Acknowledging...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Acknowledge All & Continue
                </>
              )}
            </Button>
          </div>

          {/* Dismiss and auto-acknowledge */}
          <button
            onClick={async () => {
              // Auto-acknowledge all so the modal doesn't keep reappearing
              const now = new Date().toISOString();
              for (const ann of announcementList) {
                try {
                  await base44.entities.AnnouncementAcknowledgement.create({
                    announcement_id: ann.id,
                    staff_id: user.id,
                    staff_name: user.staff_full_name || user.full_name,
                    acknowledged_at: now,
                    read_at: now
                  });
                  await base44.entities.Message.update(ann.id, {
                    read_by: [...(ann.read_by || []), user.id]
                  });
                } catch (e) { /* ignore duplicates */ }
              }
              queryClient.invalidateQueries({ queryKey: ['unacknowledgedAnnouncements'] });
              queryClient.invalidateQueries({ queryKey: ['messages'] });
              setDismissed(true);
              onDismiss?.();
            }}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2"
          >
            Dismiss
          </button>

          {/* Note */}
          <p className="text-xs text-slate-500 text-center">
            Your acknowledgements will be recorded and timestamped
          </p>
        </div>
      </Card>
    </div>
  );
}