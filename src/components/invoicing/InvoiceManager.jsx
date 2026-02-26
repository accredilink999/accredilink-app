import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Download, Send, Check, MoreVertical, FileDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import InvoiceLineItemEditor from './InvoiceLineItemEditor';
import InvoiceCalculations from './InvoiceCalculations';
import DaySpecificItems from './DaySpecificItems';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function InvoiceManager({ invoices, clients, settings }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [recurringInvoiceData, setRecurringInvoiceData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [showImportAllDropdown, setShowImportAllDropdown] = useState(false);
  const queryClient = useQueryClient();

  // Real-time invoice updates via Supabase
  useEffect(() => {
    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const [lineItems, setLineItems] = useState([]);
  const [entityType, setEntityType] = useState('client');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [confirmedClient, setConfirmedClient] = useState(null);
  const [confirmedServiceUser, setConfirmedServiceUser] = useState(null);
  const [repeatingDays, setRepeatingDays] = useState([]);
  const [dayItems, setDayItems] = useState({});
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    service_user_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: settings?.invoice_notes || '',
    discount_type: 'fixed',
    discount_value: 0,
    manual_name: '',
    manual_address: '',
    manual_city: '',
    manual_postcode: '',
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: invoicingSettings = {} } = useQuery({
    queryKey: ['invoicingSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoicing_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('invoices')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      handleCloseDialog();
      toast.success('Invoice created');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, is_recurring }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status, is_recurring })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: async ({ recurringData, originalInvoiceId }) => {
      // Update the original invoice status to recurring
      const { error: updateErr } = await supabase
        .from('invoices')
        .update({ status: 'recurring', is_recurring: true })
        .eq('id', originalInvoiceId);
      if (updateErr) throw updateErr;

      // Create the recurring invoice record
      const { data: result, error } = await supabase
        .from('recurring_invoices')
        .insert(recurringData)
        .select()
        .single();
      if (error) throw error;
      return { recurringInvoice: result, originalInvoiceId };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.refetchQueries({ queryKey: ['invoices'] });
      setShowRecurringDialog(false);
      setRecurringInvoiceData(null);
      toast.success('Recurring invoice created successfully');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      const items = JSON.parse(invoice.line_items || '[]').map((item, idx) => ({
        ...item,
        id: item.id || idx
      }));
      setLineItems(items);
      const isManual = !invoice.client_id || !clients.find(c => c.id === invoice.client_id);
      setUseManualEntry(isManual);

      if (invoice.service_user_id) {
        setEntityType('service_user');
      } else {
        setEntityType('client');
      }

      if (invoice.repeating_days && Array.isArray(invoice.repeating_days)) {
        setRepeatingDays(invoice.repeating_days);
      }

      if (invoice.day_items) {
        try {
          const parsedDayItems = typeof invoice.day_items === 'string'
            ? JSON.parse(invoice.day_items)
            : invoice.day_items;
          setDayItems(parsedDayItems);
        } catch (e) {
          setDayItems({});
        }
      }

      if (invoice.client_id && !isManual) {
        const client = clients.find(c => c.id === invoice.client_id);
        if (client) setConfirmedClient(client);
      }

      if (invoice.service_user_id) {
        const serviceUser = serviceUsers.find(u => u.id === invoice.service_user_id);
        if (serviceUser) setConfirmedServiceUser(serviceUser);
      }

      setFormData({
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id || '',
        service_user_id: invoice.service_user_id || '',
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        notes: invoice.notes,
        discount_type: invoice.discount_type || 'fixed',
        discount_value: invoice.discount_value || 0,
        manual_name: invoice.client_name || '',
        manual_address: '',
        manual_city: '',
        manual_postcode: '',
      });
    } else {
      const nextNumber = (settings?.next_invoice_number || 2000);
      setLineItems([]);
      setUseManualEntry(false);
      setEntityType('client');
      setFormData({
        invoice_number: `${settings?.invoice_prefix || 'INV'}-${nextNumber}`,
        client_id: '',
        service_user_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: settings?.invoice_notes || '',
        discount_type: 'fixed',
        discount_value: 0,
        manual_name: '',
        manual_address: '',
        manual_city: '',
        manual_postcode: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingInvoice(null);
    setConfirmedClient(null);
    setConfirmedServiceUser(null);
    setRepeatingDays([]);
    setDayItems({});
  };

  const handleConfirmClient = () => {
    if (formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id);
      setConfirmedClient(client);
    }
  };

  const handleConfirmServiceUser = () => {
    if (formData.service_user_id) {
      const user = serviceUsers.find(u => u.id === formData.service_user_id);
      setConfirmedServiceUser(user);
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas').then(m => m.default);

      const serviceUser = invoice.service_user_id ? serviceUsers.find(u => u.id === invoice.service_user_id) : null;

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);

      container.innerHTML = `
        <div style="width: 210mm; background: white; padding: 20mm; font-family: Arial, sans-serif; color: #1f2937;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid ${invoicingSettings.brand_color || '#0f766e'};">
            <div style="display: flex; align-items: center; gap: 15px;">
              ${invoicingSettings.logo_url ? `<img src="${invoicingSettings.logo_url}" alt="Logo" style="height: 60px; object-fit: contain;" />` : ''}
              <div>
                <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: ${invoicingSettings.brand_color || '#0f766e'};">
                  ${invoicingSettings.company_name || 'Company'}
                </h1>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 48px; font-weight: bold; color: #d1d5db;">INVOICE</h2>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; margin-top: 15px;">
            <div />
            <div style="text-align: right; font-size: 13px;">
              <div style="margin-bottom: 5px;">
                <span style="color: #6b7280; font-weight: bold;">Invoice #: </span>
                <span>${invoice.invoice_number}</span>
              </div>
              <div style="margin-bottom: 5px;">
                <span style="color: #6b7280; font-weight: bold;">Date: </span>
                <span>${new Date(invoice.invoice_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span style="color: #6b7280; font-weight: bold;">Due: </span>
                <span>${new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: ${invoicingSettings.brand_color || '#0f766e'}; text-transform: uppercase; letter-spacing: 0.05em;">
              Bill To
            </h3>
            <h2 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">
              ${invoice.client_name}
            </h2>
            ${invoice.client_email ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">Email: ${invoice.client_email}</p>` : ''}
          </div>

          ${invoice.service_user_id && serviceUser ? `
            <div style="margin-bottom: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: ${invoicingSettings.brand_color || '#0f766e'}; text-transform: uppercase; letter-spacing: 0.05em;">
                Service User
              </h3>
              <h2 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">
                ${serviceUser.full_name}
              </h2>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                ${serviceUser.address}
              </p>
              ${serviceUser.postcode ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${serviceUser.postcode}</p>` : ''}
            </div>
          ` : ''}

          <div style="margin-bottom: 25px; margin-top: 30px;">
            ${invoice.repeating_days && invoice.repeating_days.length > 0 && invoice.day_items ?
              (() => {
                const dayItemsParsed = typeof invoice.day_items === 'string' ? JSON.parse(invoice.day_items || '{}') : invoice.day_items;
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return invoice.repeating_days.map(dayIdx => `
                  <div style="margin-bottom: 20px;">
                    <div style="background-color: ${invoicingSettings.brand_color || '#0f766e'}; color: white; padding: 8px 12px; margin-bottom: 10px; font-size: 13px; font-weight: bold;">
                      ${dayNames[dayIdx]}
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                      ${(dayItemsParsed[dayIdx] || []).map((item) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 8px; text-align: left; flex: 1;">${item.description || ''}</td>
                          <td style="padding: 8px; text-align: center; width: 60px;">${item.quantity || 0}</td>
                          <td style="padding: 8px; text-align: right; width: 70px;">\u00a3${(item.unit_price || 0).toFixed(2)}</td>
                          ${item.double_handed ? '<td style="padding: 8px; text-align: center; width: 40px;">(x2)</td>' : ''}
                          <td style="padding: 8px; text-align: right; width: 70px; font-weight: bold;">
                            \u00a3${((item.quantity || 0) * (item.unit_price || 0) * (item.double_handed ? 2 : 1)).toFixed(2)}
                          </td>
                        </tr>
                      `).join('')}
                    </table>
                  </div>
                `).join('');
              })()
            :
              (() => {
                const lineItemsParsed = JSON.parse(invoice.line_items || '[]');
                return `
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                      <tr style="background-color: ${invoicingSettings.brand_color || '#0f766e'}; color: white;">
                        <th style="padding: 8px; text-align: left; font-weight: bold;">Description</th>
                        <th style="padding: 8px; text-align: center; font-weight: bold; width: 60px;">Qty</th>
                        <th style="padding: 8px; text-align: right; font-weight: bold; width: 70px;">Rate</th>
                        <th style="padding: 8px; text-align: right; font-weight: bold; width: 70px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${lineItemsParsed.map((item) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 8px; text-align: left;">${item.description || ''}</td>
                          <td style="padding: 8px; text-align: center;">${item.quantity || 0}</td>
                          <td style="padding: 8px; text-align: right;">\u00a3${(item.unit_price || 0).toFixed(2)}</td>
                          <td style="padding: 8px; text-align: right; font-weight: bold;">
                            \u00a3${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `;
              })()
            }
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 30px; gap: 80px;">
            <div style="font-size: 12px;">
              <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #d1d5db;">
                <span style="margin-right: 30px;">Subtotal:</span>
                <span style="font-weight: bold;">\u00a3${(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              ${invoice.tax_amount > 0 ? `
                <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #d1d5db;">
                  <span style="margin-right: 60px;">Tax:</span>
                  <span style="font-weight: bold;">\u00a3${(invoice.tax_amount || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              ${invoice.discount_amount > 0 ? `
                <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #d1d5db;">
                  <span style="margin-right: 40px;">Discount:</span>
                  <span style="font-weight: bold;">-\u00a3${(invoice.discount_amount || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="background-color: ${invoicingSettings.brand_color || '#0f766e'}; color: white; padding: 10px 15px; margin-top: 10px; font-size: 14px; font-weight: bold; text-align: right;">
                TOTAL: \u00a3${(invoice.total_amount || 0).toFixed(2)}
              </div>
            </div>
          </div>

          ${invoice.notes ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: ${invoicingSettings.brand_color || '#0f766e'}; text-transform: uppercase;">
                Notes
              </h3>
              <p style="margin: 0; font-size: 11px; color: #4b5563; white-space: pre-wrap;">
                ${invoice.notes}
              </p>
            </div>
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid ${invoicingSettings.brand_color || '#0f766e'}; font-size: 10px; color: #6b7280; text-align: center;">
            <p style="margin: 5px 0;">
              ${invoicingSettings.company_name}
              ${invoicingSettings.company_address ? ` | ${invoicingSettings.company_address}` : ''}
              ${invoicingSettings.company_city ? `, ${invoicingSettings.company_city}` : ''}
              ${invoicingSettings.company_postcode ? ` ${invoicingSettings.company_postcode}` : ''}
              ${invoicingSettings.company_phone ? ` | ${invoicingSettings.company_phone}` : ''}
            </p>
          </div>
        </div>
      `;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: container.scrollHeight
      });

      const doc = new jsPDF.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`${invoice.invoice_number}.pdf`);
      document.body.removeChild(container);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice: ' + error.message);
      console.error('Invoice download error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.invoice_number || !formData.invoice_date || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (useManualEntry && !formData.manual_name) {
      toast.error('Please enter recipient name');
      return;
    }

    if (!useManualEntry && !confirmedClient) {
       toast.error('Please confirm a client');
       return;
    }

    const allItems = repeatingDays.length > 0 ? Object.values(dayItems).flat() : lineItems;
    if (allItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    let recipientName = '';
    let recipientEmail = '';

    if (useManualEntry) {
      recipientName = formData.manual_name;
    } else {
      recipientName = confirmedClient?.client_name;
      recipientEmail = confirmedClient?.client_email || '';
    }

    const calculateLineItemTotal = (item) => {
      const subtotal = (item.quantity || 0) * (item.unit_price || 0);
      const afterDiscount = subtotal - (item.discount || 0);
      const tax = (afterDiscount * (item.tax_rate || 0)) / 100;
      return { subtotal: afterDiscount, tax };
    };

    const totals = allItems.reduce((acc, item) => {
      const { subtotal, tax } = calculateLineItemTotal(item);
      return {
        subtotal: acc.subtotal + subtotal,
        tax: acc.tax + tax
      };
    }, { subtotal: 0, tax: 0 });

    let finalDiscount = 0;
    if (formData.discount_type === 'percentage') {
      finalDiscount = (totals.subtotal * formData.discount_value) / 100;
    } else {
      finalDiscount = formData.discount_value;
    }

    let totalAmount = totals.subtotal + totals.tax - finalDiscount;

    if (repeatingDays.length > 0 && Object.keys(dayItems).length > 0) {
      const grandTotal = repeatingDays.reduce((sum, dayIdx) => {
        return sum + (dayItems[dayIdx] || []).reduce((daySum, item) => {
          return daySum + (((item.quantity || 0) * (item.unit_price || 0)) * (item.double_handed ? 2 : 1));
        }, 0);
      }, 0);
      totalAmount = grandTotal;
    }

    const invoiceData = {
       invoice_number: formData.invoice_number,
       client_id: confirmedClient?.id || null,
       service_user_id: confirmedServiceUser?.id || null,
       invoice_date: formData.invoice_date,
       due_date: formData.due_date,
       notes: formData.notes,
       discount_type: formData.discount_type,
       discount_value: formData.discount_value,
       client_name: recipientName,
       client_email: recipientEmail,
       line_items: allItems,
       subtotal: totals.subtotal,
       tax_amount: totals.tax,
       total_amount: Math.max(0, totalAmount),
       amount_due: Math.max(0, totalAmount),
       status: 'draft',
       currency: settings?.currency || 'GBP',
       repeating_days: repeatingDays.length > 0 ? repeatingDays : null,
       day_items: repeatingDays.length > 0 ? dayItems : null,
     };

    if (editingInvoice) {
      try {
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        handleCloseDialog();
        toast.success('Invoice updated');
      } catch (error) {
        toast.error('Failed: ' + error.message);
      }
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  const filteredInvoices = invoices
    .filter(i =>
      (search === '' || (i.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
       (i.client_name || '').toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === 'all' || i.status === statusFilter)
    )
    .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1 flex gap-2 max-w-md">
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <Card className="p-8 text-center bg-slate-50">
            <p className="text-slate-500">No invoices found</p>
          </Card>
        ) : (
          filteredInvoices.map(invoice => (
            <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{invoice.invoice_number}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      invoice.status === 'live' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'recurring' ? 'bg-indigo-100 text-indigo-800' :
                      invoice.status === 'sent' || invoice.status === 'viewed' ? 'bg-purple-100 text-purple-800' :
                      invoice.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {(invoice.status || '').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{invoice.client_name}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Issued: {new Date(invoice.invoice_date).toLocaleDateString()}</span>
                    <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-xl font-bold text-slate-900">
                    {settings?.currency || 'GBP'} {(invoice.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-600">
                    Due: {settings?.currency || 'GBP'} {(invoice.amount_due || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                         Download Invoice
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'live', is_recurring: invoice.is_recurring })}>
                         Make Invoice Live
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'draft', is_recurring: invoice.is_recurring })}>
                         Make Invoice Draft
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => {
                         setRecurringInvoiceData(invoice);
                         setShowRecurringDialog(true);
                       }}>
                         Make Invoice Recurring
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(invoice)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setPendingDeleteId(invoice.id);
                      setConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          </DialogHeader>

          {/* Company Header Preview */}
          <Card className="bg-white border-slate-200 mb-4">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-6">
                  {invoicingSettings.logo_url && (
                    <img
                      src={invoicingSettings.logo_url}
                      alt="Company Logo"
                      className="h-16 w-auto object-contain"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{invoicingSettings.company_name}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-slate-300">INVOICE</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Recipient Display */}
          {(confirmedClient || (useManualEntry && formData.manual_name)) && (
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bill To</p>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-slate-900">
                        {useManualEntry ? formData.manual_name : confirmedClient?.client_name}
                      </h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        {useManualEntry ? (
                          <>
                            {formData.manual_address && <p>{formData.manual_address}</p>}
                            {(formData.manual_city || formData.manual_postcode) && (
                              <p>
                                {formData.manual_city}
                                {formData.manual_postcode && `, ${formData.manual_postcode}`}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p>{confirmedClient?.billing_address}</p>
                            {confirmedClient?.billing_city && (
                              <p>
                                {confirmedClient.billing_city}
                                {confirmedClient.billing_postcode && `, ${confirmedClient.billing_postcode}`}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {confirmedServiceUser && (
                    <div className="border-t border-teal-200 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Service User</p>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-slate-900">
                          {confirmedServiceUser.full_name}
                        </h4>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>{confirmedServiceUser.address}</p>
                          {confirmedServiceUser.postcode && (
                            <p>{confirmedServiceUser.postcode}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {repeatingDays.length > 0 && (
                    <div className="border-t border-teal-200 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Repeating Days</p>
                      <div className="flex gap-2 flex-wrap">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                          repeatingDays.includes(idx) && (
                            <span key={idx} className="text-xs bg-teal-200 text-teal-800 px-2 py-1 rounded">
                              {day}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Number</label>
                <Input
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Recipient Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={entityType === 'client' ? "default" : "outline"}
                    onClick={() => {
                      setEntityType('client');
                      setUseManualEntry(false);
                      setFormData({ ...formData, client_id: '', service_user_id: '', manual_name: '', manual_address: '', manual_city: '', manual_postcode: '' });
                    }}
                    className="flex-1 text-xs"
                  >
                    Client
                  </Button>
                  <Button
                    variant={entityType === 'service_user' ? "default" : "outline"}
                    onClick={() => {
                      setEntityType('service_user');
                      setUseManualEntry(false);
                      setFormData({ ...formData, client_id: '', service_user_id: '', manual_name: '', manual_address: '', manual_city: '', manual_postcode: '' });
                    }}
                    className="flex-1 text-xs"
                  >
                    Service User
                  </Button>
                  <Button
                    variant={useManualEntry ? "default" : "outline"}
                    onClick={() => {
                      setUseManualEntry(true);
                      setFormData({ ...formData, client_id: '', service_user_id: '' });
                    }}
                    className="flex-1 text-xs"
                  >
                    Manual
                  </Button>
                </div>
              </div>
            </div>

            {/* Client Selection */}
            {!useManualEntry && !confirmedClient && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Bill To Client *</label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleConfirmClient}
                  disabled={!formData.client_id}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  size="sm"
                >
                  Confirm Client
                </Button>
              </div>
            )}

            {/* Service User Selection */}
            {!useManualEntry && entityType === 'service_user' && !confirmedServiceUser && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Service User</label>
                  <Select value={formData.service_user_id} onValueChange={(value) => setFormData({ ...formData, service_user_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a service user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleConfirmServiceUser}
                  disabled={!formData.service_user_id}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  size="sm"
                >
                  Confirm Service User
                </Button>
              </div>
            )}

            {/* Manual Entry */}
            {useManualEntry ? (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-900">Enter Recipient Details</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Name *</label>
                  <Input
                    value={formData.manual_name}
                    onChange={(e) => setFormData({ ...formData, manual_name: e.target.value })}
                    placeholder="Enter recipient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Address</label>
                  <Input
                    value={formData.manual_address}
                    onChange={(e) => setFormData({ ...formData, manual_address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">City</label>
                    <Input
                      value={formData.manual_city}
                      onChange={(e) => setFormData({ ...formData, manual_city: e.target.value })}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Postcode</label>
                    <Input
                      value={formData.manual_postcode}
                      onChange={(e) => setFormData({ ...formData, manual_postcode: e.target.value })}
                      placeholder="Enter postcode"
                    />
                  </div>
                </div>
              </div>
              ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Period From *</label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Period To *</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            {/* Repeating Days Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-900">Repeating Days</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allDays = [0, 1, 2, 3, 4, 5, 6];
                      if (repeatingDays.length === 7) {
                        setRepeatingDays([]);
                      } else {
                        setRepeatingDays(allDays);
                      }
                    }}
                    className="text-xs"
                  >
                    {repeatingDays.length === 7 ? 'Clear All' : 'Select All'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={repeatingDays.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRepeatingDays([...repeatingDays, idx]);
                          } else {
                            setRepeatingDays(repeatingDays.filter(d => d !== idx));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-700">{day}</span>
                    </label>
                  ))}
                </div>
                {repeatingDays.length > 0 && !showImportAllDropdown && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportAllDropdown(true)}
                    className="mt-4 w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Import All Calls
                  </Button>
                )}
                {repeatingDays.length > 0 && showImportAllDropdown && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
                    <label className="block text-xs font-medium text-slate-700">Select Care Client to Import</label>
                    <Select onValueChange={(suId) => {
                      const su = serviceUsers.find(s => s.id === suId);
                      if (!su) return;
                      const calls = su.call_times || [];
                      if (calls.length === 0) {
                        toast.error(`${su.full_name} has no scheduled calls`);
                        return;
                      }
                      const newItems = { ...dayItems };
                      repeatingDays.forEach(dayIdx => {
                        if (!newItems[dayIdx]) newItems[dayIdx] = [];
                        calls.forEach(call => {
                          const durationMins = parseFloat(call.duration) || 30;
                          const durationHours = durationMins / 60;
                          newItems[dayIdx].push({
                            id: Date.now() + Math.random(),
                            type: 'client_call',
                            description: call.type || 'Care Call',
                            quantity: durationHours,
                            unit_price: 0,
                            double_handed: false,
                            service_user_name: su.full_name,
                            service_user_id: su.id,
                          });
                        });
                      });
                      setDayItems(newItems);
                      // Auto-populate service user on the invoice
                      setFormData(prev => ({ ...prev, service_user_id: su.id }));
                      setConfirmedServiceUser(su);
                      setShowImportAllDropdown(false);
                      toast.success(`${calls.length} call${calls.length > 1 ? 's' : ''} imported for ${su.full_name} across ${repeatingDays.length} days`);
                    }}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Choose a care client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceUsers.filter(su => su.status === 'active').map(su => (
                          <SelectItem key={su.id} value={su.id}>
                            {su.full_name} ({(su.call_times || []).length} calls)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImportAllDropdown(false)}
                      className="w-full text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Day-Specific Items */}
            {repeatingDays.length > 0 && (
              <DaySpecificItems
                repeatingDays={repeatingDays}
                dayItems={dayItems}
                onDayItemsChange={setDayItems}
                callTypes={settings?.call_types || []}
                hoursOptions={settings?.hours_options || []}
                hourlyRates={
                  settings?.rates
                    ? settings.rates.map(r => typeof r === 'number' ? r : r.amount)
                    : (settings?.hourly_rates || [])
                }
                taxRate={settings?.default_tax_rate || 20}
              />
            )}

            {/* Line Items Editor */}
            {repeatingDays.length === 0 && (
              <InvoiceLineItemEditor
                items={lineItems}
                onItemsChange={setLineItems}
                taxRate={settings?.default_tax_rate || 20}
              />
            )}

            {/* Calculations Summary */}
            <InvoiceCalculations
              items={repeatingDays.length > 0 ? Object.values(dayItems).flat() : lineItems}
              discountAmount={0}
              discountType="fixed"
            />

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border rounded-md p-2 text-sm"
                rows="3"
                placeholder="Invoice terms, payment instructions, etc."
              />
            </div>
          </div>

          {/* Company Footer Preview */}
          <Card className="bg-slate-50 border-slate-200 mt-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-center gap-4 border-t border-slate-200 pt-3">
                {invoicingSettings.logo_url && (
                  <img
                    src={invoicingSettings.logo_url}
                    alt="Company Logo"
                    className="h-8 w-auto object-contain"
                  />
                )}
                <div className="text-center text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    {invoicingSettings.company_name}
                    {invoicingSettings.company_address && ` | ${invoicingSettings.company_address}`}
                    {invoicingSettings.company_city && `, ${invoicingSettings.company_city}`}
                    {invoicingSettings.company_postcode && ` ${invoicingSettings.company_postcode}`}
                    {invoicingSettings.company_phone && ` | Phone: ${invoicingSettings.company_phone}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Invoice'}
            </Button>
          </DialogFooter>
          </DialogContent>
          </Dialog>

      {/* Recurring Invoice Setup Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Up Recurring Invoice</DialogTitle>
          </DialogHeader>
          {recurringInvoiceData && (
            <RecurringInvoiceForm
              invoice={recurringInvoiceData}
              onSubmit={(data) => createRecurringMutation.mutate({
                recurringData: data,
                originalInvoiceId: recurringInvoiceData.id
              })}
              onCancel={() => setShowRecurringDialog(false)}
              isLoading={createRecurringMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this invoice?"
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

function RecurringInvoiceForm({ invoice, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    frequency: 'monthly',
    day_of_month: 1,
    day_of_week: 1,
    invoice_period_days: 30,
    start_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
    end_date: '',
    auto_send: true,
  });
  const [neverEnd, setNeverEnd] = useState(true);

  useEffect(() => {
    let days = 30;
    if (formData.frequency === 'weekly') days = 7;
    else if (formData.frequency === 'bi-weekly') days = 14;
    else if (formData.frequency === 'monthly') days = 30;
    else if (formData.frequency === 'quarterly') days = 90;
    else if (formData.frequency === 'annually') days = 365;
    setFormData(prev => ({ ...prev, invoice_period_days: days }));
  }, [formData.frequency]);

  const handleSubmit = () => {
    if (!formData.start_date) {
      toast.error('Please select a start date');
      return;
    }

    onSubmit({
      client_id: invoice.client_id,
      client_name: invoice.client_name,
      line_items: invoice.line_items,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      currency: invoice.currency,
      payment_terms: invoice.payment_terms,
      notes: invoice.notes,
      ...formData,
      next_invoice_date: formData.start_date,
    });
  };

  return (
    <div className="space-y-6 py-4">
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-slate-900 mb-2">{invoice.invoice_number}</h3>
          <p className="text-sm text-slate-600">{invoice.client_name}</p>
          <p className="text-lg font-bold text-teal-700 mt-2">
            {invoice.currency} {(invoice.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">How Often to Repeat?</label>
          <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-Weekly (Every 2 Weeks)</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly (Every 3 Months)</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(formData.frequency === 'weekly' || formData.frequency === 'bi-weekly') && (
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Day of Week to Create Invoice</label>
            <Select
              value={formData.day_of_week.toString()}
              onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
                <SelectItem value="0">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Period (Days)</label>
          <Input
            type="number"
            min="1"
            value={formData.invoice_period_days}
            onChange={(e) => setFormData({ ...formData, invoice_period_days: parseInt(e.target.value) || 1 })}
            placeholder="Number of days"
          />
          <p className="text-xs text-slate-500 mt-1">
            Each invoice will cover {formData.invoice_period_days} day{formData.invoice_period_days !== 1 ? 's' : ''} from the generation date
          </p>
        </div>

        {formData.frequency === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Day of Month to Create Invoice</label>
            <Select
              value={formData.day_of_month.toString()}
              onValueChange={(value) => setFormData({ ...formData, day_of_month: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Start Date *</label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">End Date</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="never_end"
              checked={neverEnd}
              onChange={(e) => {
                setNeverEnd(e.target.checked);
                if (e.target.checked) {
                  setFormData({ ...formData, end_date: '' });
                }
              }}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="never_end" className="text-sm text-slate-700">
              Never End
            </label>
          </div>
          {!neverEnd && (
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          )}
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>Summary:</strong> This invoice will be created{' '}
              {formData.frequency === 'weekly' ? `every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][formData.day_of_week]}` :
               formData.frequency === 'bi-weekly' ? `every 2 weeks on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][formData.day_of_week]}` :
               formData.frequency === 'monthly' ? `on the ${formData.day_of_month}${formData.day_of_month === 1 ? 'st' : formData.day_of_month === 2 ? 'nd' : formData.day_of_month === 3 ? 'rd' : 'th'} of each month` :
               formData.frequency === 'quarterly' ? 'every 3 months' :
               'every year'}
              {!neverEnd && formData.end_date ? ` until ${new Date(formData.end_date).toLocaleDateString()}` : ' indefinitely'}.
              {' '}Each invoice will cover a {formData.invoice_period_days}-day period.
            </p>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? 'Creating...' : 'Create Recurring Invoice'}
        </Button>
      </DialogFooter>
    </div>
  );
}
