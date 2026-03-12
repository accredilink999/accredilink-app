import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { TAX_CODES, NI_CATEGORIES } from '@/config/ukPayroll';

export default function StaffEmployment({ staff, isAdmin }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ field, value }) => base44.entities.User.update(staff.id, { [field]: value }),
    onSuccess: (_, { field }) => {
      queryClient.invalidateQueries({ queryKey: ['staff', staff.id] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`${field === 'tax_code' ? 'Tax code' : 'NI category'} updated`);
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">You don't have permission to view employment details</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Employment Type:</span>
            <Badge variant="outline" className="capitalize">
              {staff?.employment_type?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Status:</span>
            <Badge className={staff?.employment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
              {staff?.employment_status?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">NI Number:</span>
            <span className="text-slate-900">{staff?.ni_number || 'Not provided'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Tax Code:</span>
            <Select
              value={staff?.tax_code || '1257L'}
              onValueChange={(v) => updateMutation.mutate({ field: 'tax_code', value: v })}
            >
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_CODES.map(tc => (
                  <SelectItem key={tc.value} value={tc.value} className="text-xs">
                    {tc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">NI Category:</span>
            <Select
              value={staff?.ni_category || 'A'}
              onValueChange={(v) => updateMutation.mutate({ field: 'ni_category', value: v })}
            >
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NI_CATEGORIES.map(nc => (
                  <SelectItem key={nc.value} value={nc.value} className="text-xs">
                    {nc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compensation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {staff?.hourly_rate && (
            <div className="flex justify-between">
              <span className="text-slate-600">Hourly Rate:</span>
              <span className="font-semibold text-slate-900">£{staff.hourly_rate}/hour</span>
            </div>
          )}
          {staff?.salary && (
            <div className="flex justify-between">
              <span className="text-slate-600">Annual Salary:</span>
              <span className="font-semibold text-slate-900">£{staff.salary.toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">View Payroll:</span>
            <Badge variant={staff?.permissions?.can_view_payroll ? 'default' : 'outline'}>
              {staff?.permissions?.can_view_payroll ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Manage Staff:</span>
            <Badge variant={staff?.permissions?.can_manage_staff ? 'default' : 'outline'}>
              {staff?.permissions?.can_manage_staff ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Approve Leave:</span>
            <Badge variant={staff?.permissions?.can_approve_leave ? 'default' : 'outline'}>
              {staff?.permissions?.can_approve_leave ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Sick Days Taken:</span>
            <span className="text-slate-900">{staff?.sick_days_taken || 0} days</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
