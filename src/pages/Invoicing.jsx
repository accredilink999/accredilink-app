import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, BarChart3, Users, Receipt, DollarSign, FileText } from 'lucide-react';
import InvoicingSetupWizard from '@/components/invoicing/InvoicingSetupWizard.jsx';
import InvoiceDashboard from '@/components/invoicing/InvoiceDashboard.jsx';
import InvoiceManager from '@/components/invoicing/InvoiceManager.jsx';
import ClientManager from '@/components/invoicing/ClientManager.jsx';
import PaymentTracker from '@/components/invoicing/PaymentTracker.jsx';
import FinancialReports from '@/components/invoicing/FinancialReports.jsx';
import InvoicingSettings from '@/components/invoicing/InvoicingSettings.jsx';

export default function Invoicing() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings } = useQuery({
    queryKey: ['invoicingSettings'],
    queryFn: async () => {
      const data = await base44.entities.InvoicingSettings.list('-created_date', 1);
      return data?.[0];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
  });

  // Calculate KPIs
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const outstandingAmount = invoices
    .filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.amount_due || 0), 0);

  const overduAmount = invoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + (i.amount_due || 0), 0);

  // Show setup wizard if not completed
  if (!settings?.setup_completed) {
    return <InvoicingSetupWizard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Invoicing & Financials"
          subtitle="Manage invoices, clients, and track payments"
          icon={FileText}
        />
        <Button
          onClick={() => setActiveTab('settings')}
          variant="outline"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  {settings?.currency || 'GBP'} {totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-2">{invoices.filter(i => i.status === 'paid').length} paid invoices</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Outstanding</p>
                <p className="text-3xl font-bold text-amber-600">
                  {settings?.currency || 'GBP'} {outstandingAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-2">{invoices.filter(i => ['sent', 'viewed', 'partial'].includes(i.status)).length} invoices</p>
              </div>
              <Receipt className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {settings?.currency || 'GBP'} {overduAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-2">{invoices.filter(i => i.status === 'overdue').length} overdue invoices</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 w-full flex flex-wrap">
          <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices" className="text-sm">Invoices</TabsTrigger>
          <TabsTrigger value="clients" className="text-sm">Clients</TabsTrigger>
          <TabsTrigger value="payments" className="text-sm">Payments</TabsTrigger>
          <TabsTrigger value="reports" className="text-sm">Reports</TabsTrigger>
          <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <InvoiceDashboard invoices={invoices} clients={clients} payments={payments} settings={settings} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoiceManager invoices={invoices} clients={clients} settings={settings} />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientManager clients={clients} invoices={invoices} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentTracker payments={payments} invoices={invoices} clients={clients} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports invoices={invoices} payments={payments} clients={clients} settings={settings} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <InvoicingSettings settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}