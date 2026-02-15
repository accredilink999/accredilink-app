import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function StaffBasicInfo({ staff, isAdmin, isOwnProfile }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Email:</span>
            <span className="text-slate-900">{staff?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Phone:</span>
            <span className="text-slate-900">{staff?.phone || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Address:</span>
            <span className="text-slate-900">{staff?.address || 'Not provided'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Name:</span>
            <span className="text-slate-900">{staff?.emergency_contact_name || 'Not provided'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Phone:</span>
            <span className="text-slate-900">{staff?.emergency_contact_phone || 'Not provided'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Start Date:</span>
            <span className="text-slate-900">
              {staff?.start_date ? format(parseISO(staff.start_date), 'MMM d, yyyy') : 'Not set'}
            </span>
          </div>
          {staff?.end_date && (
            <div className="flex justify-between">
              <span className="text-slate-600">End Date:</span>
              <span className="text-slate-900">{format(parseISO(staff.end_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Holiday Allowance:</span>
            <span className="text-slate-900">{staff?.holiday_allowance_days || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Used:</span>
            <span className="text-slate-900">{staff?.holiday_used_days || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Remaining:</span>
            <span className="font-semibold text-teal-600">
              {(staff?.holiday_allowance_days || 0) - (staff?.holiday_used_days || 0)} days
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}