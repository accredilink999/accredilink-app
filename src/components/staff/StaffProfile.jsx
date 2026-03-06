import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Avatar from '@/components/ui/Avatar';
import StaffBasicInfo from '@/components/staff/StaffBasicInfo';
import StaffEmployment from '@/components/staff/StaffEmployment';
import StaffDocuments from '@/components/staff/StaffDocuments';
import StaffPermissions from '@/components/staff/StaffPermissions';
import RotaAreaPermissions from '@/components/staff/RotaAreaPermissions';
import StaffHRManagement from '@/components/staff/StaffHRManagement';
import StaffLeaveBalance from '@/components/staff/StaffLeaveBalance';
import StaffSupervisions from '@/components/staff/StaffSupervisions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { ArrowLeft, Edit, Shield, MapPin, UserX, UserCheck, Trash2, Mail, Loader2, User, Briefcase, Calendar, FileText, ClipboardList, ChevronLeft, Palmtree } from 'lucide-react';

export default function StaffProfile({ staffId, onBack, isAdmin, currentUserId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [targetRole, setTargetRole] = useState(null);
  const { data: staff } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      const allStaff = await base44.entities.User.list();
      return allStaff.find(s => s.id === staffId);
    },
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const viewerIsSuperAdmin = currentUser?.role === 'super_admin';

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole) => {
      // Update BOTH users and profiles tables — me() reads profiles,
      // createStaffUser edge function also checks profiles for admin status
      await Promise.all([
        base44.entities.User.update(staffId, { role: newRole }),
        supabase.from('profiles').update({ role: newRole }).eq('id', staffId),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowRoleDialog(false);
    },
  });

  const updateAreaMutation = useMutation({
    mutationFn: async (areaId) => {
      return base44.entities.User.update(staffId, { area_id: areaId || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (activate) => {
      return base44.entities.User.update(staffId, {
        is_active: activate,
        employment_status: activate ? 'active' : 'terminated',
      });
    },
    onSuccess: (_, activate) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      setShowDeactivateDialog(false);
      toast.success(activate ? 'User reactivated' : 'User deactivated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.User.delete(staffId);
      // Also try to delete from profiles table
      try {
        const { supabase } = await import('@/api/supabaseClient');
        await supabase.from('profiles').delete().eq('id', staffId);
      } catch (e) {
        console.warn('Could not delete profile:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      setShowDeleteDialog(false);
      toast.success('User deleted');
      onBack();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const [resendingEmail, setResendingEmail] = useState(false);

  const handleResendOnboarding = async () => {
    if (!staff?.email) return;
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(staff.email, {
        redirectTo: 'https://care-call-ai-clone.vercel.app',
      });
      if (error) throw error;
      toast.success(`Password reset email sent to ${staff.email}`);
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('Failed to send: ' + error.message);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setTargetRole(newRole);
    setShowRoleDialog(true);
  };

  const staffArea = rotaAreas.find(a => a.id === staff?.area_id);

  const isOwnProfile = staffId === currentUserId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Staff Profile</h1>
          <p className="text-slate-500">View and manage employee details</p>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={staff?.full_name} src={staff?.photo_url} size="lg" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{staff?.full_name}</h2>
              <p className="text-slate-600 capitalize text-sm sm:text-base">{staff?.job_title?.replace(/_/g, ' ')}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={staff?.employment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                  {staff?.employment_status?.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline">{staff?.employment_type?.replace(/_/g, ' ')}</Badge>
                <Badge className={staff?.role === 'super_admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : staff?.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
                  {staff?.role === 'super_admin' ? 'super admin' : staff?.role}
                </Badge>
                {staffArea && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <MapPin className="w-3 h-3 mr-1" />
                    {staffArea.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {isAdmin && !isOwnProfile && (
           <div className="flex flex-col gap-2 w-full sm:w-auto">
             <div className="flex flex-col sm:flex-row gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handleRoleChange(staff?.role === 'admin' || staff?.role === 'super_admin' ? 'user' : 'admin')}
                 className="w-full sm:w-auto"
               >
                 <Shield className="w-4 h-4 mr-2" />
                 <span className="hidden sm:inline">{staff?.role === 'admin' || staff?.role === 'super_admin' ? 'Remove Admin' : 'Make Admin'}</span>
                 <span className="sm:hidden">{staff?.role === 'admin' || staff?.role === 'super_admin' ? 'Remove' : 'Make'}</span>
               </Button>
               <Select
                 value={staff?.area_id || ''}
                 onValueChange={(value) => updateAreaMutation.mutate(value === 'none' ? null : value)}
               >
                 <SelectTrigger className="w-full sm:w-48 h-9">
                   <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-slate-400" />
                     <SelectValue placeholder="Assign area..." />
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">No area</SelectItem>
                   {rotaAreas.map((area) => (
                     <SelectItem key={area.id} value={area.id}>
                       <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                         {area.name}
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="flex flex-col sm:flex-row gap-2">
               {staff?.is_active !== false ? (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowDeactivateDialog(true)}
                   className="w-full sm:w-auto text-amber-600 border-amber-300 hover:bg-amber-50"
                 >
                   <UserX className="w-4 h-4 mr-2" />
                   Deactivate
                 </Button>
               ) : (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => deactivateMutation.mutate(true)}
                   className="w-full sm:w-auto text-green-600 border-green-300 hover:bg-green-50"
                 >
                   <UserCheck className="w-4 h-4 mr-2" />
                   Reactivate
                 </Button>
               )}
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setShowDeleteDialog(true)}
                 className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50"
               >
                 <Trash2 className="w-4 h-4 mr-2" />
                 Delete User
               </Button>
             </div>
             <Button
               variant="outline"
               size="sm"
               onClick={handleResendOnboarding}
               disabled={resendingEmail}
               className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
             >
               {resendingEmail ? (
                 <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
               ) : (
                 <><Mail className="w-4 h-4 mr-2" /> Send Password Reset Email</>
               )}
             </Button>
           </div>
          )}
        </div>
      </Card>

      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {staff?.full_name}'s role to <strong>{targetRole === 'super_admin' ? 'Super Admin' : targetRole}</strong>?
              {targetRole === 'admin' && ' This will give them administrative access.'}
              {targetRole === 'user' && staff?.role === 'super_admin' && ' This will remove their Super Admin and admin access.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateRoleMutation.mutate(targetRole)}>
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {staff?.full_name}'s account. They will no longer be able to access the app or appear in active staff lists. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateMutation.mutate(false)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {staff?.full_name}'s account and all associated data. This action cannot be undone. Consider deactivating instead if you may need their records later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {activeTab ? (
        <div>
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Profile
          </button>

          {activeTab === 'overview' && <StaffBasicInfo staff={staff} isAdmin={isAdmin} isOwnProfile={isOwnProfile} />}
          {activeTab === 'employment' && <StaffEmployment staff={staff} isAdmin={isAdmin} />}
          {activeTab === 'permissions' && <StaffPermissions staff={staff} isAdmin={isAdmin} />}
          {activeTab === 'rota' && <RotaAreaPermissions staff={staff} isAdmin={isAdmin} />}
          {activeTab === 'leave' && <StaffLeaveBalance staffId={staffId} isAdmin={isAdmin} staffName={staff?.full_name} />}
          {activeTab === 'hr' && <StaffHRManagement staffId={staffId} isAdmin={isAdmin} isOwnProfile={isOwnProfile} />}
          {activeTab === 'supervision' && <StaffSupervisions staffId={staffId} isAdmin={isAdmin} staffName={staff?.full_name} />}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { value: 'overview', label: 'Overview', icon: User, bg: 'from-blue-400 to-blue-600', desc: 'Contact details & personal info' },
            { value: 'employment', label: 'Employment', icon: Briefcase, bg: 'from-teal-400 to-teal-600', desc: 'Job title, contract & pay' },
            { value: 'permissions', label: 'Permissions', icon: Shield, bg: 'from-purple-400 to-purple-600', desc: 'App access & role settings' },
            { value: 'rota', label: 'Rota Areas', icon: MapPin, bg: 'from-amber-400 to-amber-600', desc: 'Area assignments & availability' },
            { value: 'leave', label: 'Leave', icon: Palmtree, bg: 'from-green-400 to-green-600', desc: 'Holiday balance & requests' },
            { value: 'hr', label: 'HR & Docs', icon: FileText, bg: 'from-indigo-400 to-indigo-600', desc: 'Documents, DBS & training' },
            { value: 'supervision', label: 'Supervision', icon: ClipboardList, bg: 'from-rose-400 to-rose-600', desc: '12-weekly supervision records' },
          ].map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.value}
                onClick={() => setActiveTab(section.value)}
                className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
                  {section.label}
                </span>
                <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">
                  {section.desc}
                </span>
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}