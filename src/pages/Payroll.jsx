import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import PayrollDashboard from '@/components/payroll/PayrollDashboard';
import PayrollRecords from '@/components/payroll/PayrollRecords';
import GeneratePayroll from '@/components/payroll/GeneratePayroll';
import MigratedPayslips from '@/components/payroll/MigratedPayslips';
import PayPeriodManager from '@/components/approvals/PayPeriodManager';
import PayrollSettingsManager from '@/components/payroll/PayrollSettingsManager';
import { DollarSign } from 'lucide-react';

export default function Payroll() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payPeriod } = useQuery({
    queryKey: ['payPeriod'],
    queryFn: () => base44.entities.PayPeriod?.list('-created_date', 1).then(data => data?.[0]),
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState('dashboard');

  // Non-admin staff only see their own migrated payslips
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Payslips"
          subtitle="Download your payslips"
          icon={DollarSign}
        />
        <MigratedPayslips user={user} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Manage staff payments, hours, and payroll processing"
        icon={DollarSign}
      />

      <PayPeriodManager
        payPeriod={payPeriod}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['payPeriod'] })}
      />

      <PayrollSettingsManager />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="migrated">Migrated</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <PayrollDashboard />
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <PayrollRecords />
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <GeneratePayroll />
        </TabsContent>

        <TabsContent value="migrated" className="mt-6">
          <MigratedPayslips user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
