import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Crown, UserCog } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffPermissions({ staff, isAdmin }) {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole) => {
      await base44.entities.User.update(staff.id, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staff.id] });
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
      toast.success('Role updated successfully');
    },
  });

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500">Only administrators can view role settings</p>
      </Card>
    );
  }

  const roleBadge = () => {
    if (staff?.role === 'super_admin') {
      return <Badge className="bg-amber-100 text-amber-800 border border-amber-300"><Crown className="w-3 h-3 mr-1" /> Super Admin</Badge>;
    }
    if (staff?.role === 'admin') {
      return <Badge className="bg-blue-100 text-blue-800"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-700"><UserCog className="w-3 h-3 mr-1" /> Staff</Badge>;
  };

  const roleDescription = () => {
    if (staff?.role === 'super_admin') {
      return 'Full access including payroll, payslips, and the ability to assign Super Admin to other staff.';
    }
    if (staff?.role === 'admin') {
      return 'Can manage staff, approve leave & expenses, view hours tracked, and access the admin panel. Cannot access payroll or payslips.';
    }
    return 'Standard staff access — can view their own rota, submit leave requests, clock in/out, and use assigned features.';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="w-5 h-5 text-teal-600" />
            Role & Access Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {roleBadge()}
          </div>
          <p className="text-sm text-slate-600">{roleDescription()}</p>
        </CardContent>
      </Card>

      {/* Super Admin toggle — only visible to super admins, only for admin staff */}
      {isSuperAdmin && staff?.role !== 'user' && currentUser?.id !== staff?.id && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Crown className="w-5 h-5 text-amber-600" />
              Super Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Grant Super Admin</p>
                <p className="text-xs text-slate-500">
                  Allows access to payroll, payslips, and assigning Super Admin to others.
                </p>
              </div>
              <Switch
                checked={staff?.role === 'super_admin'}
                onCheckedChange={(checked) => {
                  updateRoleMutation.mutate(checked ? 'super_admin' : 'admin');
                }}
                disabled={updateRoleMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
