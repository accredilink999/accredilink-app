import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function SicknessManagement({ userId, isAdmin }) {
  const { data: records = [] } = useQuery({
    queryKey: ['sickness-records', userId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return base44.entities.SicknessRecord.list('-start_date', 200);
      }
      return base44.entities.SicknessRecord.filter({ staff_id: userId }, '-start_date', 100);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'returned': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-4">
      {records.length === 0 ? (
        <Card className="p-8 text-center">
          <HeartPulse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No sickness records</p>
        </Card>
      ) : (
        records.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isAdmin && <h4 className="font-semibold text-slate-900">{record.staff_name}</h4>}
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {record.reason.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  {format(parseISO(record.start_date), 'MMM d, yyyy')}
                  {record.end_date && ` - ${format(parseISO(record.end_date), 'MMM d, yyyy')}`}
                </p>
                <p className="text-sm text-slate-500">
                  {record.days_absent} day{record.days_absent !== 1 ? 's' : ''} absent
                </p>
                {record.description && (
                  <p className="text-sm text-slate-700 mt-2">{record.description}</p>
                )}
                {record.return_to_work_interview_completed && (
                  <Badge variant="outline" className="mt-2 bg-green-50">
                    RTW Interview Completed
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}