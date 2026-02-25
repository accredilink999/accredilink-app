import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function PaymentTracker({ payments, invoices, clients }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('payments')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      handleCloseDialog();
      toast.success('Payment recorded');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment deleted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        invoice_id: payment.invoice_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        reference: payment.reference || '',
        notes: payment.notes || '',
      });
    } else {
      setFormData({
        invoice_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference: '',
        notes: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingPayment(null);
  };

  const handleSubmit = () => {
    if (!formData.invoice_id || !formData.amount || !formData.payment_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const invoice = invoices.find(i => i.id === formData.invoice_id);
    const client = clients.find(c => c.id === invoice?.client_id);

    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      client_id: invoice?.client_id,
      client_name: client?.client_name || invoice?.client_name,
      status: 'completed',
    });
  };

  // Aging report
  const agingReport = {
    current: payments.filter(p => {
      const daysOld = (new Date() - new Date(p.payment_date)) / (1000 * 60 * 60 * 24);
      return daysOld <= 30;
    }),
    '30-60': payments.filter(p => {
      const daysOld = (new Date() - new Date(p.payment_date)) / (1000 * 60 * 60 * 24);
      return daysOld > 30 && daysOld <= 60;
    }),
    '60-90': payments.filter(p => {
      const daysOld = (new Date() - new Date(p.payment_date)) / (1000 * 60 * 60 * 24);
      return daysOld > 60 && daysOld <= 90;
    }),
    'over90': payments.filter(p => {
      const daysOld = (new Date() - new Date(p.payment_date)) / (1000 * 60 * 60 * 24);
      return daysOld > 90;
    }),
  };

  const filteredPayments = payments.filter(p => {
    const invoice = invoices.find(i => i.id === p.invoice_id);
    return search === '' ||
           p.reference?.toLowerCase().includes(search.toLowerCase()) ||
           invoice?.invoice_number?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Aging Report */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Current (0-30 days)</p>
              <p className="text-3xl font-bold text-green-600">{agingReport.current.length}</p>
              <p className="text-sm text-slate-600 mt-2">
                £{agingReport.current.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">30-60 Days</p>
              <p className="text-3xl font-bold text-amber-600">{agingReport['30-60'].length}</p>
              <p className="text-sm text-slate-600 mt-2">
                £{agingReport['30-60'].reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">60-90 Days</p>
              <p className="text-3xl font-bold text-red-600">{agingReport['60-90'].length}</p>
              <p className="text-sm text-slate-600 mt-2">
                £{agingReport['60-90'].reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Over 90 Days</p>
              <p className="text-3xl font-bold text-rose-600">{agingReport.over90.length}</p>
              <p className="text-sm text-slate-600 mt-2">
                £{agingReport.over90.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        <div className="flex gap-4 justify-between items-center">
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <Card className="p-8 text-center bg-slate-50">
              <p className="text-slate-500">No payments recorded</p>
            </Card>
          ) : (
            filteredPayments.map(payment => {
              const invoice = invoices.find(i => i.id === payment.invoice_id);
              return (
                <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{invoice?.invoice_number}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{payment.client_name}</p>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>Date: {new Date(payment.payment_date).toLocaleDateString()}</span>
                        <span>Method: {(payment.payment_method || '').replace('_', ' ').toUpperCase()}</span>
                        {payment.reference && <span>Ref: {payment.reference}</span>}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-xl font-bold text-green-600">
                        £{(payment.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(payment)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setPendingDeleteId(payment.id);
                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Invoice *</label>
              <Select value={formData.invoice_id} onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice..." />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(i => i.status !== 'paid').map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Amount (£) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Payment Date *</label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Method</label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Reference</label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border rounded-md p-2 text-sm"
                rows="3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this payment?"
        description="This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteMutation.mutate(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
}
