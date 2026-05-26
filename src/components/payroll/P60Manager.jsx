import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, CheckCircle2, Loader2, FileText, Trash2, Users } from 'lucide-react';

const TAX_YEARS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
];

const BUCKET = 'uploads';
const P60_FOLDER = 'p60';

function p60Path(taxYear, staffId) {
  return `${P60_FOLDER}/${taxYear}/${staffId}.pdf`;
}

export default function P60Manager() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [uploading, setUploading] = useState(null); // staffId currently uploading
  const [deleting, setDeleting] = useState(null);
  const fileInputRefs = useRef({});

  // Fetch all staff
  const { data: staffList = [] } = useQuery({
    queryKey: ['all-staff-p60'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, staff_full_name')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return (data || []).filter(s => s.id);
    },
  });

  // Fetch existing P60s for selected year
  const { data: existingP60s = [], isLoading: loadingP60s } = useQuery({
    queryKey: ['p60s-admin', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(`${P60_FOLDER}/${selectedYear}`, { limit: 500 });
      if (error) return [];
      return (data || []).map(f => f.name.replace('.pdf', ''));
    },
  });

  const handleUpload = async (staff, file) => {
    if (!file) return;
    setUploading(staff.id);
    try {
      const path = p60Path(selectedYear, staff.id);
      // Remove existing first (upsert)
      await supabase.storage.from(BUCKET).remove([path]);
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['p60s-admin', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['p60s-staff'] });
    } catch (err) {
      console.error('P60 upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (staffId) => {
    if (!confirm('Remove this P60?')) return;
    setDeleting(staffId);
    try {
      await supabase.storage.from(BUCKET).remove([p60Path(selectedYear, staffId)]);
      queryClient.invalidateQueries({ queryKey: ['p60s-admin', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['p60s-staff'] });
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (staffId, staffName) => {
    const path = p60Path(selectedYear, staffId);
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) { alert('Could not get download link'); return; }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = `P60_${(staffName || staffId).replace(/\s+/g, '_')}_${selectedYear}.pdf`;
    a.click();
  };

  const uploaded = new Set(existingP60s);
  const uploadedCount = staffList.filter(s => uploaded.has(s.id)).length;

  return (
    <div className="space-y-4">
      {/* Year selector + stats */}
      <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">P60 Tax Year End Documents</p>
              <p className="text-xs text-slate-500">Upload P60s for each staff member</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-36 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_YEARS.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className="bg-blue-100 text-blue-700 whitespace-nowrap">
              {uploadedCount}/{staffList.length} uploaded
            </Badge>
          </div>
        </div>
      </Card>

      {/* Staff list */}
      {loadingP60s ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : staffList.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No staff found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {staffList.map(staff => {
            const name = staff.staff_full_name || staff.full_name || staff.email;
            const hasP60 = uploaded.has(staff.id);
            const isUploading = uploading === staff.id;
            const isDeleting = deleting === staff.id;

            return (
              <Card key={staff.id} className="p-3 sm:p-4 border-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${hasP60 ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {hasP60
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : <FileText className="w-5 h-5 text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{staff.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasP60 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(staff.id, name)}
                          className="min-h-[36px] touch-manipulation"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(staff.id)}
                          disabled={isDeleting}
                          className="min-h-[36px] text-red-500 hover:text-red-600 hover:bg-red-50 touch-manipulation"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={el => fileInputRefs.current[staff.id] = el}
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(staff, file);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => fileInputRefs.current[staff.id]?.click()}
                      disabled={isUploading}
                      className={`min-h-[36px] touch-manipulation ${hasP60 ? 'bg-slate-600 hover:bg-slate-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                    >
                      {isUploading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Upload className="w-4 h-4" />
                      }
                      <span className="hidden sm:inline ml-1">
                        {isUploading ? 'Uploading...' : hasP60 ? 'Replace' : 'Upload P60'}
                      </span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
