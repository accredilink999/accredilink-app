import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock, MessageSquare, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffPermissions({ staff, isAdmin }) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState(staff?.permissions || {});
  const [pageAccess, setPageAccess] = useState(staff?.page_access || {});
  const [hasChanges, setHasChanges] = useState(false);

  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.User.update(staff.id, {
        permissions,
        page_access: pageAccess
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staff.id] });
      setHasChanges(false);
      toast.success('Permissions updated successfully');
    },
  });

  const handlePermissionChange = (key, value) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handlePageAccessChange = (key, value) => {
    setPageAccess(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const permissionGroups = {
    'Staff & HR': [
      { key: 'can_manage_staff', label: 'Manage Staff Profiles' },
      { key: 'can_view_hr_docs', label: 'View HR Documents' },
      { key: 'can_approve_leave', label: 'Approve Leave Requests' },
      { key: 'can_view_payroll', label: 'View Payroll' },
      { key: 'can_manage_teams', label: 'Manage Teams' },
    ],
    'Rota & Shifts': [
      { key: 'can_view_all_shifts', label: 'View All Shifts' },
      { key: 'can_manage_rota', label: 'Manage Rota' },
    ],
    'Client Care': [
      { key: 'can_manage_clients', label: 'Manage Client Profiles' },
      { key: 'can_view_care_logs', label: 'View Care Logs' },
      { key: 'can_manage_care_logs', label: 'Manage Care Logs' },
      { key: 'can_view_medications', label: 'View Medications' },
      { key: 'can_manage_medications', label: 'Manage Medications' },
    ],
    'Incidents & Safety': [
      { key: 'can_view_incidents', label: 'View Incidents' },
      { key: 'can_manage_incidents', label: 'Manage Incidents' },
    ],
    'Communications': [
      { key: 'can_send_announcements', label: 'Send Announcements' },
      { key: 'can_view_all_chats', label: 'View All Chats' },
      { key: 'can_create_group_chats', label: 'Create Group Chats' },
      { key: 'can_message_anyone', label: 'Message Anyone' },
    ],
    'Documents & Training': [
      { key: 'can_view_documents', label: 'View Documents' },
      { key: 'can_manage_documents', label: 'Manage Documents' },
      { key: 'can_view_training', label: 'View Training' },
      { key: 'can_manage_training', label: 'Manage Training' },
    ],
    'Financial': [
      { key: 'can_approve_expenses', label: 'Approve Expenses' },
      { key: 'can_view_reports', label: 'View Reports' },
    ],
  };

  const pageAccessGroups = {
    'Core Pages': [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'messages', label: 'Messages' },
      { key: 'ai_assistant', label: 'AI Assistant' },
    ],
    'Scheduling': [
      { key: 'rota', label: 'Rota' },
      { key: 'clock_in_out', label: 'Clock In/Out' },
      { key: 'work_calendar', label: 'Work Calendar' },
    ],
    'Client Management': [
      { key: 'clients', label: 'Client Management' },
      { key: 'care_logs', label: 'Care Logs' },
    ],
    'Staff & HR': [
      { key: 'staff_management', label: 'Staff Management' },
      { key: 'training', label: 'Training' },
      { key: 'leave', label: 'Leave Requests' },
      { key: 'expenses', label: 'Expenses' },
    ],
    'Administration': [
      { key: 'admin', label: 'Admin Panel' },
      { key: 'hr_management', label: 'HR Management' },
      { key: 'payroll', label: 'Payroll' },
      { key: 'reports', label: 'Reports' },
      { key: 'documents', label: 'Documents' },
      { key: 'incidents', label: 'Incidents' },
    ],
  };

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500">Only administrators can manage permissions</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-amber-800">You have unsaved changes</p>
            <Button
              onClick={() => updatePermissionsMutation.mutate()}
              disabled={updatePermissionsMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="w-5 h-5 text-teal-600" />
            System Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {Object.entries(permissionGroups).map(([groupName, items]) => (
            <div key={groupName} className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-slate-900 text-xs sm:text-sm uppercase tracking-wide">{groupName}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pl-0 sm:pl-4">
                {items.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer" onClick={() => handlePermissionChange(key, !permissions[key])}>
                    <Checkbox
                      checked={permissions[key] || false}
                      onCheckedChange={(checked) => handlePermissionChange(key, checked)}
                    />
                    <label className="text-xs sm:text-sm text-slate-700 cursor-pointer flex-1">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="w-5 h-5 text-teal-600" />
            Page Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {Object.entries(pageAccessGroups).map(([groupName, items]) => (
            <div key={groupName} className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-slate-900 text-xs sm:text-sm uppercase tracking-wide">{groupName}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pl-0 sm:pl-4">
                {items.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer" onClick={() => handlePageAccessChange(key, !pageAccess[key])}>
                    <Checkbox
                      checked={pageAccess[key] !== false}
                      onCheckedChange={(checked) => handlePageAccessChange(key, checked)}
                    />
                    <label className="text-xs sm:text-sm text-slate-700 cursor-pointer flex-1">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}