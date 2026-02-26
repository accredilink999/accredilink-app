import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ClientManager({ clients, invoices }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_name: '',
    client_type: 'invoice',
    client_email: '',
    client_phone: '',
    billing_address: '',
    billing_city: '',
    billing_postcode: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('clients')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      handleCloseDialog();
      toast.success('Client saved');
    },
    onError: (error) => {
      handleCloseDialog();
      toast.error('Failed to create client: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      handleCloseDialog();
      toast.success('Client updated');
    },
    onError: (error) => {
      handleCloseDialog();
      toast.error('Failed to update client: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        client_name: client.client_name,
        client_type: client.client_type || 'invoice',
        client_email: client.client_email,
        client_phone: client.client_phone || '',
        billing_address: client.billing_address || '',
        billing_city: client.billing_city || '',
        billing_postcode: client.billing_postcode || '',
      });
    } else {
      setFormData({
        client_name: '',
        client_type: 'invoice',
        client_email: '',
        client_phone: '',
        billing_address: '',
        billing_city: '',
        billing_postcode: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingClient(null);
  };

  const handleSubmit = () => {
    if (!formData.client_name || !formData.client_email) {
      toast.error('Please fill in required fields');
      return;
    }
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredClients = (clients || []).filter(c =>
    (c.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.client_email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-between items-center">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const clientInvoices = invoices.filter(i => i.client_id === client.id);
          const totalInvoiced = clientInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
          const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);

          return (
            <Card key={client.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{client.client_name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      client.client_type === 'local_authority' ? 'bg-blue-100 text-blue-700' :
                      client.client_type === 'direct_payment' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {client.client_type === 'local_authority' ? 'Local Authority' :
                       client.client_type === 'direct_payment' ? 'Direct Payment' : 'Invoice'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{client.client_email}</p>
                  {client.client_phone && <p className="text-sm text-slate-600">{client.client_phone}</p>}
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Invoices:</span>
                    <span className="font-semibold text-slate-900">{clientInvoices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Invoiced:</span>
                    <span className="font-semibold text-slate-900">£{totalInvoiced.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Paid:</span>
                    <span className="font-semibold text-green-600">£{totalPaid.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(client)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setPendingDeleteId(client.id);
                      setConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Client Name *</label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Client Type *</label>
              <Select value={formData.client_type} onValueChange={(value) => setFormData({ ...formData, client_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local_authority">Local Authority</SelectItem>
                  <SelectItem value="direct_payment">Direct Payment</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Email *</label>
              <Input
                type="email"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Phone</label>
              <Input
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Address</label>
              <Input
                value={formData.billing_address}
                onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">City</label>
                <Input
                  value={formData.billing_city}
                  onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Postcode</label>
                <Input
                  value={formData.billing_postcode}
                  onChange={(e) => setFormData({ ...formData, billing_postcode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pb-6 sm:pb-0">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this client?"
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
