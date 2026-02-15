import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO } from 'date-fns';
import { Clock, Users } from 'lucide-react';

export default function ClientCallsDisplay({ date }) {
  const { data: clientCalls = [] } = useQuery({
    queryKey: ['clientCalls', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const calls = await base44.entities.ClientCall.list('-scheduled_time', 500);
      return calls.filter(call => isSameDay(parseISO(call.date), date));
    },
  });

  if (clientCalls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-blue-700 mb-2">Client Calls</h3>
      {clientCalls.map((call) => (
        <Card key={call.id} className="p-2 bg-blue-50 border-blue-200">
          <p className="text-sm font-medium text-slate-900">{call.service_user_name}</p>
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {call.scheduled_time} ({call.duration_minutes}min)
          </p>
          {call.assigned_staff_names?.length > 0 && (
            <p className="text-xs text-teal-600 flex items-center gap-1 mt-1">
              <Users className="w-3 h-3" />
              {call.assigned_staff_names.join(', ')}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}