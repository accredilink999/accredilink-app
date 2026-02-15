import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, AlertTriangle, Receipt } from 'lucide-react';

export default function InvoiceDashboard({ invoices, clients, payments, settings }) {
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayInvoices = invoices.filter(i => i.invoice_date === date);
      const dayPayments = payments.filter(p => p.payment_date === date);
      
      return {
        date: new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        invoices: dayInvoices.length,
        revenue: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      };
    });
  }, [invoices, payments]);

  const statusBreakdown = useMemo(() => {
    return {
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
    };
  }, [invoices]);

  const COLORS = ['#f3f4f6', '#fbbf24', '#10b981', '#ef4444'];

  const avgPaymentTime = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status === 'paid' && i.viewed_date && i.sent_date);
    if (paidInvoices.length === 0) return 0;
    
    const totalDays = paidInvoices.reduce((sum, inv) => {
      const sent = new Date(inv.sent_date);
      const viewed = new Date(inv.viewed_date);
      return sum + ((viewed - sent) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return Math.round(totalDays / paidInvoices.length);
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Additional KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Total Clients</p>
                <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Total Invoices</p>
                <p className="text-3xl font-bold text-purple-600">{invoices.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Avg Payment Time</p>
                <p className="text-3xl font-bold text-orange-600">{avgPaymentTime} days</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Overdue Invoices</p>
                <p className="text-3xl font-bold text-red-600">{statusBreakdown.overdue}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Invoices Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (£)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Draft', value: statusBreakdown.draft },
                    { name: 'Sent', value: statusBreakdown.sent },
                    { name: 'Paid', value: statusBreakdown.paid },
                    { name: 'Overdue', value: statusBreakdown.overdue },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-600">{invoice.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {settings?.currency || 'GBP'} {(invoice.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}