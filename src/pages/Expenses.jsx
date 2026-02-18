import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import ExpenseList from '@/components/expenses/ExpenseList';
import SubmitExpense from '@/components/expenses/SubmitExpense';
import WeeklyMileageClaims from '@/components/expenses/WeeklyMileageClaims';
import { Receipt } from 'lucide-react';

export default function Expenses() {
  const [activeTab, setActiveTab] = useState('weekly-mileage');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager'].includes(user?.job_title);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management"
        subtitle="Submit and manage mileage, fuel, and expense claims"
      >
        <Receipt className="w-6 h-6 text-teal-600" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full max-w-lg ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="weekly-mileage">Weekly Mileage</TabsTrigger>
          <TabsTrigger value="my-expenses">My Expenses</TabsTrigger>
          <TabsTrigger value="submit">Submit New</TabsTrigger>
          {isAdmin && <TabsTrigger value="all">All Expenses</TabsTrigger>}
        </TabsList>

        <TabsContent value="weekly-mileage" className="mt-6">
          <WeeklyMileageClaims userId={user?.id} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="my-expenses" className="mt-6">
          <ExpenseList staffId={user?.id} isAdmin={false} />
        </TabsContent>

        <TabsContent value="submit" className="mt-6">
          <SubmitExpense userId={user?.id} userName={user?.full_name} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="all" className="mt-6">
            <ExpenseList isAdmin={true} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
