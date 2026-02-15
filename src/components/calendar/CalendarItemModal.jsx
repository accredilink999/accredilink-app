import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parse } from 'date-fns';

const statusBadgeStyles = {
  overdue: 'bg-red-100 text-red-700',
  due_soon: 'bg-orange-100 text-orange-700',
  upcoming: 'bg-blue-100 text-blue-700'
};

export default function CalendarItemModal({ item, open, onOpenChange }) {
  if (!item) return null;

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const formatDate = (dateStr) => {
    try {
      const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(parsed, 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2">
            <div className="flex-1">{item.title}</div>
            <Badge className={statusBadgeStyles[item.status] || 'bg-slate-100 text-slate-700'}>
              {getStatusLabel(item.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Date</p>
            <p className="text-slate-900">{formatDate(item.date)}</p>
          </div>

          {/* Type */}
          {item.type && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Type</p>
              <p className="text-slate-900 capitalize">{item.type.replace(/_/g, ' ')}</p>
            </div>
          )}

          {/* Staff/Client */}
          {item.staff && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">
                {item.type === 'care_plan' ? 'Service User' : 'Staff'}
              </p>
              <p className="text-slate-900">{item.staff}</p>
            </div>
          )}

          {/* Status message */}
          <div className="pt-2 border-t">
            {item.status === 'overdue' && (
              <p className="text-sm text-red-600 font-medium">This item is overdue and requires immediate attention.</p>
            )}
            {item.status === 'due_soon' && (
              <p className="text-sm text-orange-600 font-medium">This item is due within 30 days.</p>
            )}
            {item.status === 'upcoming' && (
              <p className="text-sm text-blue-600 font-medium">This item is upcoming.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}