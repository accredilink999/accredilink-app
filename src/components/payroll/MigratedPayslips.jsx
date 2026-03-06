import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { UploadFile } from '@/api/storage';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import EmptyState from '@/components/ui/EmptyState';
import { Upload, FileText, Download, Trash2, Loader2, CalendarDays, AlertCircle, Users } from 'lucide-react';

export default function MigratedPayslips({ user }) {
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [filterStaff, setFilterStaff] = useState('all');
  const [monthEnding, setMonthEnding] = useState('');
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Fetch staff list (admin only)
  const { data: staffList = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.User.list('full_name', 500),
    enabled: isSuperAdmin,
  });

  // Fetch payslips — RLS handles visibility (super_admin sees all, staff sees own)
  const { data: payslips = [], isLoading, error: payslipError } = useQuery({
    queryKey: ['migratedPayslips'],
    queryFn: async () => {
      const data = await base44.entities.MigratedPayslip.list('-month_ending', 500);
      console.log('[MigratedPayslips] fetched:', data?.length, 'payslips');
      return data;
    },
  });

  if (payslipError) console.error('[MigratedPayslips] query error:', payslipError);

  // Filter payslips by selected staff (admin only)
  const filteredPayslips = isSuperAdmin && filterStaff !== 'all'
    ? payslips.filter(p => p.staff_id === filterStaff)
    : payslips;

  // Group payslips by month for display
  const grouped = filteredPayslips.reduce((acc, p) => {
    const key = p.month_ending;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Get unique staff who have payslips (for filter dropdown)
  const staffWithPayslips = isSuperAdmin
    ? [...new Map(payslips.map(p => [p.staff_id, { id: p.staff_id, name: p.staff_name }])).values()]
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    : [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStaff || !monthEnding || !file) throw new Error('All fields required');

      setUploading(true);
      setUploadError('');
      const staffMember = staffList.find(s => s.id === selectedStaff);
      const { url } = await UploadFile({ file });

      await base44.entities.MigratedPayslip.create({
        staff_id: selectedStaff,
        staff_name: staffMember?.full_name || 'Unknown',
        month_ending: monthEnding,
        file_url: url,
        file_name: file.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migratedPayslips'] });
      setShowUpload(false);
      setSelectedStaff('');
      setMonthEnding('');
      setFile(null);
      setUploading(false);
      setUploadError('');
    },
    onError: (err) => {
      setUploading(false);
      setUploadError(err?.message || 'Upload failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MigratedPayslip.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['migratedPayslips'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {isSuperAdmin ? 'Migrated Payslips' : 'My Payslips'}
          </h3>
          <p className="text-sm text-slate-500">
            {isSuperAdmin
              ? 'Upload payslips migrated from your previous system'
              : 'Download your payslips from the previous system'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowUpload(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload Payslip
          </Button>
        )}
      </div>

      {isSuperAdmin && staffWithPayslips.length > 0 && (
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-slate-400" />
          <Select value={filterStaff} onValueChange={setFilterStaff}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by staff member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff ({payslips.length} payslips)</SelectItem>
              {staffWithPayslips.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterStaff !== 'all' && (
            <Button size="sm" variant="ghost" onClick={() => setFilterStaff('all')} className="text-slate-500">
              Clear
            </Button>
          )}
        </div>
      )}

      {payslipError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Error loading payslips: {payslipError?.message || 'Unknown error'}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredPayslips.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filterStaff !== 'all' ? "No payslips for this staff member" : "No migrated payslips"}
          description={filterStaff !== 'all' ? "Upload a payslip for this staff member using the button above." : isSuperAdmin ? "Upload payslips from your previous system for staff to download." : "No payslips have been uploaded for you yet."}
        />
      ) : (
        <div className="space-y-6">
          {sortedMonths.map(month => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-700">
                  Month Ending: {format(new Date(month + 'T00:00:00'), 'dd MMMM yyyy')}
                </h4>
                <span className="text-xs text-slate-400">({grouped[month].length} payslip{grouped[month].length > 1 ? 's' : ''})</span>
              </div>
              <div className="grid gap-2">
                {grouped[month].map(payslip => (
                  <Card key={payslip.id} className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isSuperAdmin && (
                        <p className="text-sm font-semibold text-slate-900 truncate">{payslip.staff_name}</p>
                      )}
                      <p className="text-xs text-slate-500 truncate">{payslip.file_name || 'Payslip.pdf'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={payslip.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </a>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Delete this payslip?')) deleteMutation.mutate(payslip.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Migrated Payslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {staffList
                    .filter(s => s.full_name)
                    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month Ending Date</Label>
              <Input
                type="date"
                value={monthEnding}
                onChange={e => setMonthEnding(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">The last date of the pay period this payslip covers</p>
            </div>
            <div>
              <Label>Payslip PDF</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!selectedStaff || !monthEnding || !file || uploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
