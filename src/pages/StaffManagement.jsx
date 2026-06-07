import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StaffDirectory from '@/components/staff/StaffDirectory';
import StaffProfile from '@/components/staff/StaffProfile';
import TeamsManager from '@/components/staff/TeamsManager';
import BulkOnboardPanel from '@/components/staff/BulkOnboardPanel';
import StaffMatrix from '@/components/staff/StaffMatrix';
import { Users } from 'lucide-react';
import HelpTip from '@/components/ui/HelpTip';

export default function StaffManagement() {
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);
  const isSuperAdmin = user?.role === 'super_admin';

  if (selectedStaffId) {
    return (
      <StaffProfile
        staffId={selectedStaffId}
        onBack={() => setSelectedStaffId(null)}
        isAdmin={isAdmin}
        currentUserId={user?.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        subtitle="Manage employee profiles, contracts, and employment details"
        icon={Users}
        className="[&_h1]:text-slate-900 [&_svg]:text-blue-600 [&_svg]:fill-blue-600"
      />

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <TabsTrigger value="staff" className="text-xs sm:text-sm">Staff<HelpTip tip="Browse all staff members. Tap a name to view their full profile, contracts, and training." inline /></TabsTrigger>
          <TabsTrigger value="teams" className="text-xs sm:text-sm">Teams<HelpTip tip="Organise staff into teams for easier rota and communication management." inline /></TabsTrigger>
          {isAdmin && <TabsTrigger value="onboard" className="text-xs sm:text-sm">Onboard<HelpTip tip="Quickly add multiple new staff members at once with bulk onboarding." inline /></TabsTrigger>}
          {isAdmin && <TabsTrigger value="matrix" className="text-xs sm:text-sm">Staff Matrix<HelpTip tip="Visual compliance matrix for onboarding, training and compliance documents across all staff." inline /></TabsTrigger>}
        </TabsList>

        <TabsContent value="staff" className="mt-6">
          <StaffDirectory
            onSelectStaff={setSelectedStaffId}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          {isAdmin ? (
            <TeamsManager />
          ) : (
            <div className="p-8 text-center text-slate-500">
              Only administrators can manage teams
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="onboard" className="mt-6">
            <BulkOnboardPanel />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="matrix" className="mt-6">
            <StaffMatrix isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}