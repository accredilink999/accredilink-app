import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StaffDirectory from '@/components/staff/StaffDirectory';
import StaffProfile from '@/components/staff/StaffProfile';
import TeamsManager from '@/components/staff/TeamsManager';
import BulkOnboardPanel from '@/components/staff/BulkOnboardPanel';
import { Users } from 'lucide-react';

export default function StaffManagement() {
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

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
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          {isAdmin && <TabsTrigger value="onboard">Onboard</TabsTrigger>}
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
      </Tabs>
    </div>
  );
}