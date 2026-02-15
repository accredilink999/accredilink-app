import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';

export default function StaffDocuments({ staffId, isAdmin, isOwnProfile }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['hr-documents', staffId],
    queryFn: async () => {
      const allDocs = await base44.entities.HRDocument.filter({ staff_id: staffId });
      if (isAdmin || isOwnProfile) {
        return isOwnProfile ? allDocs.filter(doc => doc.viewable_by_staff) : allDocs;
      }
      return [];
    },
  });

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    if (isBefore(expiry, now)) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (isBefore(expiry, thirtyDaysFromNow)) {
      return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Valid', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No documents available</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const expiryStatus = getExpiryStatus(doc.expiry_date);
            return (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                        <p className="text-sm text-slate-500 capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                        {doc.description && (
                          <p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {doc.issue_date && (
                            <Badge variant="outline" className="text-xs">
                              Issued: {format(parseISO(doc.issue_date), 'MMM d, yyyy')}
                            </Badge>
                          )}
                          {doc.expiry_date && expiryStatus && (
                            <Badge className={`${expiryStatus.color} text-xs`}>
                              {expiryStatus.label} - {format(parseISO(doc.expiry_date), 'MMM d, yyyy')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}