import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2, Eye } from 'lucide-react';

const BUCKET = 'uploads';
const P60_FOLDER = 'p60';

const TAX_YEARS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
];

export default function StaffP60s({ user }) {
  const [loading, setLoading] = useState(null); // 'view-year' or 'download-year'

  // Check each tax year for this staff member's P60
  const { data: availableP60s = [], isLoading } = useQuery({
    queryKey: ['p60s-staff', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = [];
      for (const year of TAX_YEARS) {
        const path = `${P60_FOLDER}/${year}/${user.id}.pdf`;
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
        if (!error && data?.signedUrl) {
          results.push({ year, path });
        }
      }
      return results;
    },
    enabled: !!user?.id,
  });

  const staffName = (user?.staff_full_name || user?.full_name || 'P60').replace(/\s+/g, '_');

  // View — opens PDF in a new browser tab
  const handleView = async (year, path) => {
    setLoading(`view-${year}`);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) throw new Error('Could not get link');
      window.open(data.signedUrl, '_blank');
    } catch {
      alert('Could not open P60. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Download — forces the file to save to device
  const handleDownload = async (year, path) => {
    setLoading(`download-${year}`);
    try {
      const filename = `P60_${staffName}_${year}.pdf`;
      // Pass download option — Supabase adds Content-Disposition: attachment
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600, { download: filename });
      if (error || !data?.signedUrl) throw new Error('Could not get link');
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

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
            Your P60 will appear here once your employer has uploaded it after the tax year end (5 April).
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {availableP60s.map(({ year, path }) => (
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
                  {/* View button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(year, path)}
                    disabled={!!loading}
                    className="min-h-[36px] touch-manipulation"
                  >
                    {loading === `view-${year}`
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Eye className="w-4 h-4" />
                    }
                    <span className="hidden sm:inline ml-1">View</span>
                  </Button>
                  {/* Download button */}
                  <Button
                    size="sm"
                    onClick={() => handleDownload(year, path)}
                    disabled={!!loading}
                    className="bg-teal-600 hover:bg-teal-700 min-h-[36px] touch-manipulation"
                  >
                    {loading === `download-${year}`
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />
                    }
                    <span className="hidden sm:inline ml-1">Download</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center px-4">
        Your P60 shows your total pay and tax deducted for the tax year. Keep it safe — you may need it for tax returns or benefit claims.
      </p>
    </div>
  );
}
