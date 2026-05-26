import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Loader2, Eye } from 'lucide-react';

const BUCKET = 'uploads';
const P60_FOLDER = 'p60';

const TAX_YEARS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
];

export default function StaffP60s({ user }) {
  const [viewing, setViewing] = useState(null); // { year, url, downloadUrl }
  const staffName = (user?.staff_full_name || user?.full_name || 'P60').replace(/\s+/g, '_');

  // Pre-fetch signed URLs for each available tax year
  const { data: availableP60s = [], isLoading } = useQuery({
    queryKey: ['p60s-staff', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = [];
      for (const year of TAX_YEARS) {
        const path = `${P60_FOLDER}/${year}/${user.id}.pdf`;
        // View URL — no download header, displays inline
        const { data: viewData, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 3600);
        if (error || !viewData?.signedUrl) continue;

        // Download URL — Content-Disposition: attachment
        const { data: dlData } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 3600, { download: `P60_${staffName}_${year}.pdf` });

        results.push({
          year,
          viewUrl: viewData.signedUrl,
          downloadUrl: dlData?.signedUrl || viewData.signedUrl,
        });
      }
      return results;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">P60 — Tax Year End Documents</p>
            <p className="text-xs text-slate-500">Your annual P60 certificates</p>
          </div>
        </div>
      </Card>

      {availableP60s.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No P60s available yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Your P60 will appear here once your employer uploads it after the tax year end (5 April).
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {availableP60s.map(({ year, viewUrl, downloadUrl }) => (
            <Card key={year} className="p-4 border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">P60 — Tax Year {year}</p>
                  <p className="text-xs text-slate-500">End of year certificate • PDF</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className="bg-green-100 text-green-700 hidden sm:flex">Available</Badge>

                  {/* View — opens PDF modal in-app */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewing({ year, viewUrl, downloadUrl })}
                    className="min-h-[36px] touch-manipulation"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">View</span>
                  </Button>

                  {/* Download — forces save via Supabase Content-Disposition header */}
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors min-h-[36px] touch-manipulation"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center px-4">
        Your P60 shows your total pay and tax deducted for the tax year. Keep it safe — you may need it for tax returns or benefit claims.
      </p>

      {/* PDF Viewer Modal */}
      {viewing && (
        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-[95vw] w-[850px] p-4" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle>P60 — Tax Year {viewing.year}</DialogTitle>
                <a
                  href={viewing.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              </div>
            </DialogHeader>
            <div className="flex-1 mt-3 rounded-lg overflow-hidden border border-slate-200" style={{ minHeight: '70vh' }}>
              <iframe
                src={viewing.viewUrl}
                className="w-full h-full"
                style={{ minHeight: '70vh', border: 'none' }}
                title={`P60 Tax Year ${viewing.year}`}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
