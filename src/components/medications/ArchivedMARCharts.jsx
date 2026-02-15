import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Calendar, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function ArchivedMARCharts({ serviceUserId, open, onOpenChange }) {
  const [downloadingId, setDownloadingId] = useState(null);

  const { data: archivedCharts = [], isLoading } = useQuery({
    queryKey: ['archivedMARCharts', serviceUserId],
    queryFn: () => base44.entities.ArchivedMARChart.filter({
      service_user_id: serviceUserId
    }, '-week_start_date'),
    enabled: !!serviceUserId && open,
  });

  const handleDownload = async (archivedChart) => {
    try {
      setDownloadingId(archivedChart.id);
      
      // Get signed URL
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: archivedChart.file_uri,
        expires_in: 300
      });

      // Download PDF
      const link = document.createElement('a');
      link.href = signed_url;
      link.download = `MAR_Chart_${archivedChart.week_start_date}_to_${archivedChart.week_end_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('Download error:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Past MAR Charts</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : archivedCharts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-500">No archived MAR charts available yet</p>
            <p className="text-xs text-slate-400 mt-2">Charts will be generated every Saturday at 11:55 PM</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {archivedCharts.map((chart) => (
              <Card key={chart.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {format(parseISO(chart.week_start_date), 'MMM d')} - {format(parseISO(chart.week_end_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-slate-500">
                          Generated: {format(parseISO(chart.generated_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(chart)}
                      disabled={downloadingId === chart.id}
                      className="gap-2"
                    >
                      {downloadingId === chart.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}