import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Eye, Pencil, CheckCircle, Trash2, MoreVertical, ArrowRight, Loader } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PayslipView from './PayslipView';
import PrintablePayslip from './PrintablePayslip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PayrollRecords() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewMode, setViewMode] = useState('edit');
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['payroll-records'],
    queryFn: () => base44.entities.PayrollRecord.list('-period_end', 500),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  // Build staff lookup for area info
  const staffMap = useMemo(() => {
    const map = {};
    staff.forEach(s => { map[s.id] = s; });
    return map;
  }, [staff]);

  // Get unique areas from staff
  const areas = useMemo(() => {
    const areaSet = new Set();
    staff.forEach(s => {
      if (s.rota_area_id) areaSet.add(s.rota_area_id);
    });
    return [...areaSet].sort();
  }, [staff]);

  const filteredRecords = payrollRecords.filter(record => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesStaff = filterStaff === 'all' || record.staff_id === filterStaff;
    const staffMember = staffMap[record.staff_id];
    const matchesArea = filterArea === 'all' || staffMember?.rota_area_id === filterArea;
    return matchesStatus && matchesStaff && matchesArea;
  });

  // Group by period
  const groupedRecords = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      const key = `${r.period_start}|${r.period_end}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, records]) => {
        const [start, end] = key.split('|');
        return {
          key,
          periodStart: start,
          periodEnd: end,
          records,
          totalGross: records.reduce((s, r) => s + (r.gross_pay || 0), 0),
          totalNet: records.reduce((s, r) => s + (r.net_pay || 0), 0),
          draftCount: records.filter(r => r.status === 'draft').length,
          approvedCount: records.filter(r => r.status === 'approved').length,
          paidCount: records.filter(r => r.status === 'paid').length,
        };
      });
  }, [filteredRecords]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleGroupSelect = (records) => {
    const ids = records.map(r => r.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getNextStatus = (status) => {
    if (status === 'draft') return { label: 'Approve', next: 'approved', color: 'text-blue-600' };
    if (status === 'approved') return { label: 'Mark Paid', next: 'paid', color: 'text-green-600' };
    return null;
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }) => {
      await Promise.all(ids.map(id => base44.entities.PayrollRecord.update(id, { status })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      setSelectedIds([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.PayrollRecord.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      setSelectedIds([]);
    },
  });

  // Determine batch action based on selected records' statuses
  const selectedRecordObjects = payrollRecords.filter(r => selectedIds.includes(r.id));
  const allSelectedDraft = selectedRecordObjects.length > 0 && selectedRecordObjects.every(r => r.status === 'draft');
  const allSelectedApproved = selectedRecordObjects.length > 0 && selectedRecordObjects.every(r => r.status === 'approved');
  const anyDrafts = selectedRecordObjects.some(r => r.status === 'draft');
  const anyApproved = selectedRecordObjects.some(r => r.status === 'approved');

  return (
    <div className="space-y-4">
      {/* Filters & Batch Actions */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        {areas.length > 0 && (
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Staff Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staff
              .filter(s => filterArea === 'all' || s.rota_area_id === filterArea)
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
          </SelectContent>
        </Select>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 ml-auto flex-wrap">
            {anyDrafts && (
              <Button size="sm" variant="outline"
                onClick={() => {
                  const draftIds = selectedRecordObjects.filter(r => r.status === 'draft').map(r => r.id);
                  updateStatusMutation.mutate({ ids: draftIds, status: 'approved' });
                }}>
                <CheckCircle className="w-4 h-4 mr-1 text-blue-600" /> Approve{allSelectedDraft ? ` (${selectedIds.length})` : ` Drafts (${selectedRecordObjects.filter(r => r.status === 'draft').length})`}
              </Button>
            )}
            {anyApproved && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const approvedIds = selectedRecordObjects.filter(r => r.status === 'approved').map(r => r.id);
                  updateStatusMutation.mutate({ ids: approvedIds, status: 'paid' });
                }}>
                <CheckCircle className="w-4 h-4 mr-1" /> Mark Paid{allSelectedApproved ? ` (${selectedIds.length})` : ` (${selectedRecordObjects.filter(r => r.status === 'approved').length})`}
              </Button>
            )}
            <Button size="sm" variant="destructive"
              onClick={() => { if (confirm(`Delete ${selectedIds.length} payroll records?`)) deleteMutation.mutate(selectedIds); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      {/* Grouped Records */}
      <div className="space-y-6">
        {groupedRecords.map((group) => (
          <div key={group.key}>
            {/* Period Header */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={group.records.every(r => selectedIds.includes(r.id))}
                  onCheckedChange={() => toggleGroupSelect(group.records)}
                />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                  {new Date(group.periodStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(group.periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </h3>
                <Badge variant="outline">{group.records.length} payslips</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-slate-500">Gross: <strong className="text-slate-900">£{group.totalGross.toFixed(2)}</strong></span>
                <span className="text-slate-500">Net: <strong className="text-green-700">£{group.totalNet.toFixed(2)}</strong></span>
                {/* Quick group actions */}
                {group.draftCount > 0 && (
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => {
                      const draftIds = group.records.filter(r => r.status === 'draft').map(r => r.id);
                      updateStatusMutation.mutate({ ids: draftIds, status: 'approved' });
                    }}>
                    Approve All ({group.draftCount})
                  </Button>
                )}
                {group.approvedCount > 0 && (
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => {
                      const approvedIds = group.records.filter(r => r.status === 'approved').map(r => r.id);
                      updateStatusMutation.mutate({ ids: approvedIds, status: 'paid' });
                    }}>
                    Mark All Paid ({group.approvedCount})
                  </Button>
                )}
              </div>
            </div>

            {/* Records */}
            <div className="space-y-2">
              {group.records.map((record) => {
                const nextAction = getNextStatus(record.status);
                const staffMember = staffMap[record.staff_id];

                return (
                  <Card key={record.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={selectedIds.includes(record.id)} onCheckedChange={() => toggleSelect(record.id)} />
                        <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">{record.staff_name}</h4>
                            {staffMember?.rota_area_id && (
                              <Badge variant="outline" className="text-xs py-0 shrink-0">{staffMember.rota_area_id}</Badge>
                            )}
                          </div>
                          <div className="flex gap-2 text-xs text-slate-500 flex-wrap">
                            <span>{record.regular_hours || 0}h</span>
                            {record.overtime_hours > 0 && <span>+{record.overtime_hours}h OT</span>}
                            <span>@ £{record.hourly_rate || 0}/hr</span>
                            {record.tax_code && <Badge variant="outline" className="text-xs py-0">{record.tax_code}</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-500">Gross: £{(record.gross_pay || 0).toFixed(2)}</p>
                          <p className="text-sm font-semibold text-green-700">Net: £{(record.net_pay || 0).toFixed(2)}</p>
                        </div>
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>

                        {/* Next status action button */}
                        {nextAction && (
                          <Button size="sm" variant="outline" className="h-8 text-xs hidden sm:flex"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ ids: [record.id], status: nextAction.next })}>
                            <ArrowRight className={`w-3 h-3 mr-1 ${nextAction.color}`} />
                            {nextAction.label}
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedRecord(record); setViewMode('edit'); }}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit Payslip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedRecord(record); setViewMode('readonly'); }}>
                              <Eye className="w-4 h-4 mr-2" /> Quick View
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {record.status === 'draft' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ ids: [record.id], status: 'approved' })}>
                                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" /> Approve
                              </DropdownMenuItem>
                            )}
                            {record.status === 'approved' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ ids: [record.id], status: 'paid' })}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Mark Paid
                              </DropdownMenuItem>
                            )}
                            {record.status === 'paid' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ ids: [record.id], status: 'approved' })}>
                                <ArrowRight className="w-4 h-4 mr-2 text-amber-600 rotate-180" /> Revert to Approved
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600"
                              onClick={() => { if (confirm('Delete this payroll record?')) deleteMutation.mutate([record.id]); }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No payroll records found</p>
          <p className="text-sm text-slate-400">Generate payroll from the Generate tab</p>
        </Card>
      )}

      {/* Payslip View/Edit Dialog */}
      {selectedRecord && (
        <PayslipView
          record={selectedRecord}
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          readOnly={viewMode === 'readonly'}
        />
      )}
    </div>
  );
}
