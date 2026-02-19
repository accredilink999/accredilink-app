import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialReports({ invoices, payments, clients, settings }) {
  const [timePeriod, setTimePeriod] = useState('month');

  const monthlyData = useMemo(() => {
    const data = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((month, index) => {
      data[index + 1] = { month, revenue: 0, expenses: 0, invoiced: 0 };
    });

    invoices.filter(i => i.status === 'paid').forEach(invoice => {
      const month = new Date(invoice.invoice_date).getMonth() + 1;
      data[month].revenue += invoice.total_amount || 0;
      data[month].invoiced += 1;
    });

    return Object.values(data);
  }, [invoices]);

  const profitLossReport = useMemo(() => {
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    const totalTax = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.tax_amount || 0), 0);

    const outstanding = invoices
      .filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + (i.amount_due || 0), 0);

    return {
      totalRevenue,
      totalTax,
      netRevenue: totalRevenue - totalTax,
      outstanding,
    };
  }, [invoices]);

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const handleExportCSV = () => {
    const csv = [
      ['Invoice Number', 'Client', 'Amount', 'Status', 'Date'],
      ...invoices.map(i => [
        i.invoice_number,
        i.client_name,
        i.total_amount,
        i.status,
        i.invoice_date
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* P&L Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {settings?.currency || 'GBP'} {profitLossReport.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-slate-600 mb-1">Total Tax</p>
              <p className="text-2xl font-bold text-red-600">
                {settings?.currency || 'GBP'} {profitLossReport.totalTax.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-slate-600 mb-1">Net Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                {settings?.currency || 'GBP'} {profitLossReport.netRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm text-slate-600 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-amber-600">
                {settings?.currency || 'GBP'} {profitLossReport.outstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200">
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="client-breakdown">Client Breakdown</TabsTrigger>
          <TabsTrigger value="tax-summary">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue by Month</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clients
                  .map(client => {
                    const clientInvoices = invoices.filter(i => i.client_id === client.id && i.status === 'paid');
                    const totalRevenue = clientInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
                    return { ...client, totalRevenue, invoiceCount: clientInvoices.length };
                  })
                  .filter(c => c.totalRevenue > 0)
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .slice(0, 10)
                  .map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{client.client_name}</p>
                          <p className="text-xs text-slate-600">{client.invoiceCount} invoices</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {settings?.currency || 'GBP'} {client.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax-summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Total Taxable Amount</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {settings?.currency || 'GBP'} {profitLossReport.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Tax Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{settings?.tax_rate}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-slate-600 mb-2">Total Tax Due</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {settings?.currency || 'GBP'} {profitLossReport.totalTax.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3">Monthly Tax Breakdown</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {monthlyData.map((month, index) => {
                      const tax = month.revenue * (settings?.tax_rate || 20) / 100;
                      return (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-slate-200">
                          <span className="text-slate-600">{month.month}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {settings?.currency || 'GBP'} {tax.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}