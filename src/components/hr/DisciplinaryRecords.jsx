import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function DisciplinaryRecords() {
  const { data: records = [] } = useQuery({
    queryKey: ['disciplinary-records'],
    queryFn: () => base44.entities.DisciplinaryRecord.list('-date', 200),
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeColor = (type) => {
    if (type === 'commendation') return 'bg-green-100 text-green-800';
    if (type === 'note') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {records.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No disciplinary records</p>
        </Card>
      ) : (
        records.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-900">{record.staff_name}</h4>
                  <Badge className={getTypeColor(record.record_type)}>
                    {record.record_type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge className={getSeverityColor(record.severity)}>
                    {record.severity}
                  </Badge>
                  <Badge variant="outline" className={record.status === 'active' ? 'border-red-200' : ''}>
                    {record.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-2">{format(parseISO(record.date), 'MMM d, yyyy')}</p>
                <p className="text-sm text-slate-700 mb-2">{record.incident_description}</p>
                {record.action_taken && (
                  <p className="text-sm text-slate-600"><strong>Action:</strong> {record.action_taken}</p>
                )}
                {record.issued_by_name && (
                  <p className="text-xs text-slate-500 mt-2">Issued by: {record.issued_by_name}</p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}