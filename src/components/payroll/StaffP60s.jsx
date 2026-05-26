import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from 'lucide-react';

const BUCKET = 'uploads';
const P60_FOLDER = 'p60';

const TAX_YEARS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
];

export default function StaffP60s({ user }) {
  // Check each tax year for this staff member's P60
  const { data: availableP60s = [], isLoading } = useQuery({
    queryKey: ['p60s-staff', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const results = [];
      for (const year of TAX_YEARS) {
        const path = `${P60_FOLDER}/${year}/${user.id}.pdf`;
        // Try to create a signed URL — if it fails, the file doesn't exist
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
        if (!error && data?.signedUrl) {
          results.push({ year, path });
        }
      }
      return results;
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (year, path) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) { alert('Could not get download link. Please try again.'); return; }
    const name = user?.staff_full_name || user?.full_name || 'staff';
    const res = await fetch(data.signedUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `P60_${name.replace(/\s+/g, '_')}_${year}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
            <p className="text-xs text-slate-500">Your annual P60 certificates for download</p>
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
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">Available</Badge>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(year, path)}
                    className="bg-teal-600 hover:bg-teal-700 min-h-[36px] touch-manipulation"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
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
