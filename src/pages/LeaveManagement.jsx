import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import LeaveBalance from '@/components/leave/LeaveBalance';
import LeaveRequests from '@/components/leave/LeaveRequests';
import RequestLeave from '@/components/leave/RequestLeave';
import { Calendar } from 'lucide-react';

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('balance');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager'].includes(user?.job_title);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Manage holidays, sickness, and time off"
      >
        <Calendar className="w-6 h-6 text-teal-600" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="balance">My Balance</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="all-requests">All Requests</TabsTrigger>}
        </TabsList>

        <TabsContent value="balance" className="mt-6">
          <LeaveBalance userId={user?.id} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            <RequestLeave userId={user?.id} userName={user?.full_name} />
            <LeaveRequests staffId={user?.id} isAdmin={false} />
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="all-requests" className="mt-6">
            <LeaveRequests isAdmin={true} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}