import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, BarChart3, Users, Receipt, DollarSign, FileText, ChevronLeft, LayoutDashboard, CreditCard } from 'lucide-react';
import InvoicingSetupWizard from '@/components/invoicing/InvoicingSetupWizard.jsx';
import InvoiceDashboard from '@/components/invoicing/InvoiceDashboard.jsx';
import InvoiceManager from '@/components/invoicing/InvoiceManager.jsx';
import ClientManager from '@/components/invoicing/ClientManager.jsx';
import PaymentTracker from '@/components/invoicing/PaymentTracker.jsx';
import FinancialReports from '@/components/invoicing/FinancialReports.jsx';
import InvoicingSettings from '@/components/invoicing/InvoicingSettings.jsx';

export default function Invoicing() {
  const [activeTab, setActiveTab] = useState(null);
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['invoicingSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoicing_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });


  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate KPIs
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const outstandingAmount = invoices
    .filter(i => !i.status || ['draft', 'live', 'sent', 'viewed', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.amount_due || i.total_amount || 0), 0);

  const overdueInvoices = invoices.filter(i => {
    if (i.status === 'overdue') return true;
    if (i.status === 'paid') return false;
    if (i.due_date && new Date(i.due_date) < new Date()) return true;
    return false;
  });
  const overduAmount = overdueInvoices.reduce((sum, i) => sum + (i.amount_due || i.total_amount || 0), 0);

  // Show setup wizard if not completed
  if (!settingsLoading && !settings?.is_configured) {
    return <InvoicingSetupWizard />;
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Loading invoicing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Invoicing & Financials"
          subtitle="Manage invoices, clients, and track payments"
          icon={FileText}
          tutorialKey="Invoicing"
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
                <p className="text-xs text-slate-500 mt-2">{invoices.filter(i => !i.status || ['draft', 'live', 'sent', 'viewed', 'partial', 'overdue'].includes(i.status)).length} invoices</p>
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
                <p className="text-xs text-slate-500 mt-2">{overdueInvoices.length} overdue invoices</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab ? (
        <div>
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Invoicing
          </button>

          {activeTab === 'dashboard' && <InvoiceDashboard invoices={invoices} clients={clients} payments={payments} settings={settings} />}
          {activeTab === 'invoices' && <InvoiceManager invoices={invoices} clients={clients} settings={settings} />}
          {activeTab === 'clients' && <ClientManager clients={clients} invoices={invoices} />}
          {activeTab === 'payments' && <PaymentTracker payments={payments} invoices={invoices} clients={clients} />}
          {activeTab === 'reports' && <FinancialReports invoices={invoices} payments={payments} clients={clients} settings={settings} />}
          {activeTab === 'settings' && <InvoicingSettings settings={settings} />}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, bg: 'from-blue-400 to-blue-600', desc: 'Revenue overview & KPIs' },
            { value: 'invoices', label: 'Invoices', icon: FileText, bg: 'from-teal-400 to-teal-600', desc: 'Create & manage invoices' },
            { value: 'clients', label: 'Clients', icon: Users, bg: 'from-green-400 to-green-600', desc: 'Client billing profiles' },
            { value: 'payments', label: 'Payments', icon: CreditCard, bg: 'from-purple-400 to-purple-600', desc: 'Track payments received' },
            { value: 'reports', label: 'Reports', icon: BarChart3, bg: 'from-amber-400 to-amber-600', desc: 'Financial analytics' },
            { value: 'settings', label: 'Settings', icon: Settings, bg: 'from-slate-400 to-slate-600', desc: 'Invoice templates & config' },
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
