import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from 'lucide-react';

export default function PayrollRecords() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['payroll-records'],
    queryFn: () => base44.entities.PayrollRecord.list('-period_end', 500),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredRecords = payrollRecords.filter(record => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesStaff = filterStaff === 'all' || record.staff_id === filterStaff;
    return matchesStatus && matchesStaff;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Staff Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{record.staff_name}</h4>
                  <p className="text-sm text-slate-500">
                    {new Date(record.period_start).toLocaleDateString()} - {new Date(record.period_end).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-slate-600">{record.regular_hours || 0}h regular</span>
                    {record.overtime_hours > 0 && (
                      <span className="text-xs text-slate-600">{record.overtime_hours}h overtime</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Net Pay</p>
                  <p className="text-lg font-semibold text-slate-900">£{record.net_pay?.toLocaleString()}</p>
                </div>
                <Badge className={getStatusColor(record.status)}>
                  {record.status}
                </Badge>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No payroll records found</p>
        </Card>
      )}
    </div>
  );
}