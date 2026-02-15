import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Briefcase } from 'lucide-react';

export default function StaffEmployment({ staff, isAdmin }) {
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