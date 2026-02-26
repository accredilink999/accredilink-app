import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Download, Send, Check, MoreVertical, FileDown, ArrowRight, CheckCircle2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import InvoiceLineItemEditor from './InvoiceLineItemEditor';
import InvoiceCalculations from './InvoiceCalculations';
import DaySpecificItems from './DaySpecificItems';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Parse duration stored as minutes (45), decimal hours (0.5), or clock notation (0.45 = 45 mins)
const parseDurationToHours = (dur) => {
  const raw = parseFloat(dur) || 30;
  if (raw >= 10) return Math.round((raw / 60) * 100) / 100;
  const decMatch = String(dur || '').match(/\.(\d{2,})$/);
  if (decMatch) {
    const mins = parseInt(decMatch[1].slice(0, 2));
    if (mins > 0 && mins <= 59) return Math.round((Math.floor(raw) + mins / 60) * 100) / 100;
  }
  return raw;
};

export default function InvoiceManager({ invoices, clients, settings }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('draft');
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [recurringInvoiceData, setRecurringInvoiceData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [showImportAllDropdown, setShowImportAllDropdown] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [downloadChoiceInvoice, setDownloadChoiceInvoice] = useState(null);
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
    payment_terms: '30',
    period_from: '',
    period_to: '',
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
    onSuccess: async () => {
      // Fetch latest settings and increment atomically
      const { data: latest } = await supabase
        .from('invoicing_settings')
        .select('id, next_invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (latest) {
        await supabase
          .from('invoicing_settings')
          .update({ next_invoice_number: (latest.next_invoice_number || 2000) + 1 })
          .eq('id', latest.id);
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
      queryClient.invalidateQueries({ queryKey: ['invoicing-settings'] });
      handleCloseDialog();
      toast.success('Invoice created');
    },
    onError: (error) => {
      alert('Create invoice error: ' + error.message);
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

  const handleOpenDialog = async (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      const rawItems = typeof invoice.line_items === 'string' ? JSON.parse(invoice.line_items || '[]') : (invoice.line_items || []);
      const items = rawItems.map((item, idx) => ({
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
        payment_terms: invoice.payment_terms || '30',
        period_from: invoice.period_from || '',
        period_to: invoice.period_to || '',
      });
    } else {
      // Fetch latest settings fresh from DB to get current next_invoice_number
      const { data: freshSettings } = await supabase
        .from('invoicing_settings')
        .select('invoice_prefix, next_invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      const prefix = freshSettings?.invoice_prefix || invoicingSettings?.invoice_prefix || settings?.invoice_prefix || 'INV';
      const settingsNum = freshSettings?.next_invoice_number || invoicingSettings?.next_invoice_number || settings?.next_invoice_number || 2000;
      // Find highest existing number to avoid duplicates
      const existingNums = invoices
        .map(i => {
          const match = (i.invoice_number || '').match(new RegExp(`^${prefix}-(\\d+)$`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      const maxExisting = existingNums.length > 0 ? Math.max(...existingNums) : 0;
      const nextNumber = Math.max(settingsNum, maxExisting + 1);
      setLineItems([]);
      setUseManualEntry(false);
      setEntityType('client');
      const today = new Date().toISOString().split('T')[0];
      const defaultTerms = '30';
      const defaultDue = new Date(new Date().getTime() + 30 * 86400000).toISOString().split('T')[0];
      setFormData({
        invoice_number: `${prefix}-${nextNumber}`,
        client_id: '',
        service_user_id: '',
        invoice_date: today,
        due_date: defaultDue,
        notes: settings?.invoice_notes || '',
        discount_type: 'fixed',
        discount_value: 0,
        manual_name: '',
        manual_address: '',
        manual_city: '',
        manual_postcode: '',
        payment_terms: defaultTerms,
        period_from: '',
        period_to: '',
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
      const s = invoicingSettings; // shorthand
      const bc = s.brand_color || '#0f766e';
      const serviceUser = invoice.service_user_id ? serviceUsers.find(u => u.id === invoice.service_user_id) : null;
      const suName = getServiceUserName(invoice);
      const client = invoice.client_id ? clients.find(c => c.id === invoice.client_id) : null;

      // Build line items HTML
      let itemsHtml = '';
      if (invoice.repeating_days && invoice.repeating_days.length > 0 && invoice.day_items) {
        const dayItemsParsed = typeof invoice.day_items === 'string' ? JSON.parse(invoice.day_items || '{}') : invoice.day_items;
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        let daySubtotals = [];
        itemsHtml = invoice.repeating_days.sort((a,b)=>a-b).map(dayIdx => {
          const items = dayItemsParsed[dayIdx] || [];
          const dayTotal = items.reduce((sum,it) => sum + ((it.quantity||0)*(it.unit_price||0)*(it.double_handed?2:1)), 0);
          daySubtotals.push(dayTotal);
          return `
            <tr><td colspan="5" style="padding:10px 8px 4px;font-weight:bold;font-size:12px;color:${bc};border-bottom:2px solid ${bc};">${dayNames[dayIdx]}</td></tr>
            ${items.map(it => {
              const amt = (it.quantity||0)*(it.unit_price||0)*(it.double_handed?2:1);
              return `<tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:6px 8px;font-size:11px;">${it.service_user_name ? '<span style="color:#7c3aed;font-weight:600;">'+it.service_user_name+'</span> — ' : ''}${it.description||''}</td>
                <td style="padding:6px 8px;text-align:center;font-size:11px;">${it.quantity||0}h</td>
                <td style="padding:6px 8px;text-align:right;font-size:11px;">\u00a3${(it.unit_price||0).toFixed(2)}</td>
                <td style="padding:6px 8px;text-align:center;font-size:11px;">${it.double_handed?'x2':''}</td>
                <td style="padding:6px 8px;text-align:right;font-size:11px;font-weight:600;">\u00a3${amt.toFixed(2)}</td>
              </tr>`;
            }).join('')}
            <tr><td colspan="4" style="padding:4px 8px;text-align:right;font-size:11px;color:#6b7280;">${dayNames[dayIdx]} subtotal:</td>
            <td style="padding:4px 8px;text-align:right;font-size:11px;font-weight:700;border-bottom:1px solid #d1d5db;">\u00a3${dayTotal.toFixed(2)}</td></tr>
          `;
        }).join('');
      } else {
        const lineItemsParsed = typeof invoice.line_items === 'string' ? JSON.parse(invoice.line_items || '[]') : (invoice.line_items || []);
        itemsHtml = lineItemsParsed.map(it => {
          const amt = (it.quantity||0)*(it.unit_price||0);
          return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:8px;font-size:11px;">${it.description||''}</td>
            <td style="padding:8px;text-align:center;font-size:11px;">${it.quantity||0}</td>
            <td style="padding:8px;text-align:right;font-size:11px;">\u00a3${(it.unit_price||0).toFixed(2)}</td>
            <td style="padding:8px;text-align:center;font-size:11px;"></td>
            <td style="padding:8px;text-align:right;font-size:11px;font-weight:600;">\u00a3${amt.toFixed(2)}</td>
          </tr>`;
        }).join('');
      }

      // Build banking details section
      const hasBanking = s.bank_account_name || s.bank_sort_code || s.bank_account_number;
      const bankingHtml = hasBanking ? `
        <div style="margin-top:25px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
          <h3 style="margin:0 0 10px;font-size:11px;font-weight:bold;color:${bc};text-transform:uppercase;letter-spacing:0.05em;">Payment Details</h3>
          <table style="font-size:11px;color:#374151;">
            ${s.bank_account_name ? `<tr><td style="padding:2px 15px 2px 0;color:#6b7280;font-weight:600;">Account Name:</td><td style="padding:2px 0;">${s.bank_account_name}</td></tr>` : ''}
            ${s.bank_sort_code ? `<tr><td style="padding:2px 15px 2px 0;color:#6b7280;font-weight:600;">Sort Code:</td><td style="padding:2px 0;">${s.bank_sort_code}</td></tr>` : ''}
            ${s.bank_account_number ? `<tr><td style="padding:2px 15px 2px 0;color:#6b7280;font-weight:600;">Account Number:</td><td style="padding:2px 0;">${s.bank_account_number}</td></tr>` : ''}
            ${s.bank_iban ? `<tr><td style="padding:2px 15px 2px 0;color:#6b7280;font-weight:600;">IBAN:</td><td style="padding:2px 0;">${s.bank_iban}</td></tr>` : ''}
          </table>
          ${s.payment_terms ? `<p style="margin:8px 0 0;font-size:10px;color:#6b7280;">Payment Terms: ${s.payment_terms}</p>` : ''}
        </div>
      ` : '';

      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;background:white;';
      document.body.appendChild(container);

      container.innerHTML = `
        <div style="width:210mm;background:white;padding:18mm 20mm;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;box-sizing:border-box;">

          <!-- HEADER -->
          <table style="width:100%;margin-bottom:0;">
            <tr>
              <td style="vertical-align:top;width:60%;">
                ${s.logo_url ? `<img src="${s.logo_url}" alt="" style="height:55px;object-fit:contain;margin-bottom:8px;display:block;" />` : ''}
                <div style="font-size:20px;font-weight:800;color:${bc};margin-bottom:2px;">${s.company_name || 'Company'}</div>
                ${s.company_address ? `<div style="font-size:10px;color:#6b7280;">${s.company_address}</div>` : ''}
                ${s.company_city || s.company_postcode ? `<div style="font-size:10px;color:#6b7280;">${s.company_city || ''}${s.company_city && s.company_postcode ? ', ' : ''}${s.company_postcode || ''}</div>` : ''}
                ${s.company_phone ? `<div style="font-size:10px;color:#6b7280;">Tel: ${s.company_phone}</div>` : ''}
                ${s.company_email ? `<div style="font-size:10px;color:#6b7280;">${s.company_email}</div>` : ''}
                ${s.company_website ? `<div style="font-size:10px;color:#6b7280;">${s.company_website}</div>` : ''}
                ${s.vat_number ? `<div style="font-size:10px;color:#6b7280;margin-top:4px;">VAT: ${s.vat_number}</div>` : ''}
              </td>
              <td style="vertical-align:top;text-align:right;">
                <div style="font-size:36px;font-weight:900;color:${bc};letter-spacing:2px;margin-bottom:4px;">INVOICE</div>
                ${suName ? `<div style="font-size:14px;font-weight:700;color:#374151;margin-bottom:10px;">${suName}</div>` : ''}
                <table style="margin-left:auto;font-size:11px;">
                  <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:600;text-align:right;">Invoice No:</td><td style="padding:3px 0;font-weight:700;">${invoice.invoice_number}</td></tr>
                  ${invoice.period_from ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:600;text-align:right;">Period:</td><td style="padding:3px 0;">${new Date(invoice.period_from).toLocaleDateString('en-GB')} — ${invoice.period_to ? new Date(invoice.period_to).toLocaleDateString('en-GB') : ''}</td></tr>` : ''}
                  <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:600;text-align:right;">Date:</td><td style="padding:3px 0;">${new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</td></tr>
                  <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:600;text-align:right;">Due Date:</td><td style="padding:3px 0;">${new Date(invoice.due_date).toLocaleDateString('en-GB')}</td></tr>
                  <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:600;text-align:right;">Terms:</td><td style="padding:3px 0;">${invoice.payment_terms === '0' ? 'On Receipt' : invoice.payment_terms === 'custom' ? 'Custom' : (invoice.payment_terms || '30') + ' Days'}</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <div style="height:2px;background:${bc};margin:15px 0 20px;"></div>

          <!-- BILL TO / SERVICE USER -->
          <table style="width:100%;margin-bottom:20px;">
            <tr>
              <td style="vertical-align:top;width:50%;padding-right:20px;">
                <div style="font-size:9px;font-weight:700;color:${bc};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Bill To</div>
                <div style="font-size:14px;font-weight:700;margin-bottom:3px;">${invoice.client_name || ''}</div>
                ${client?.billing_address ? `<div style="font-size:11px;color:#4b5563;">${client.billing_address}</div>` : ''}
                ${client?.billing_city || client?.billing_postcode ? `<div style="font-size:11px;color:#4b5563;">${client.billing_city || ''}${client.billing_city && client.billing_postcode ? ', ' : ''}${client.billing_postcode || ''}</div>` : ''}
                ${client?.client_phone ? `<div style="font-size:11px;color:#4b5563;">Tel: ${client.client_phone}</div>` : ''}
                ${invoice.client_email ? `<div style="font-size:11px;color:#4b5563;">${invoice.client_email}</div>` : ''}
              </td>
              ${serviceUser ? `
                <td style="vertical-align:top;width:50%;">
                  <div style="font-size:9px;font-weight:700;color:${bc};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Service User</div>
                  <div style="font-size:14px;font-weight:700;margin-bottom:3px;">${serviceUser.full_name}</div>
                  ${serviceUser.address ? `<div style="font-size:11px;color:#4b5563;">${serviceUser.address}</div>` : ''}
                  ${serviceUser.postcode ? `<div style="font-size:11px;color:#4b5563;">${serviceUser.postcode}</div>` : ''}
                </td>
              ` : '<td></td>'}
            </tr>
          </table>

          <!-- LINE ITEMS TABLE -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:5px;">
            <thead>
              <tr style="background:${bc};">
                <th style="padding:8px;text-align:left;font-size:10px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
                <th style="padding:8px;text-align:center;font-size:10px;font-weight:700;color:white;text-transform:uppercase;width:55px;">Hours</th>
                <th style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:white;text-transform:uppercase;width:65px;">Rate</th>
                <th style="padding:8px;text-align:center;font-size:10px;font-weight:700;color:white;text-transform:uppercase;width:35px;">DH</th>
                <th style="padding:8px;text-align:right;font-size:10px;font-weight:700;color:white;text-transform:uppercase;width:70px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- TOTALS -->
          <table style="width:100%;margin-top:15px;">
            <tr>
              <td style="vertical-align:top;width:55%;">
                ${invoice.notes ? `
                  <div style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
                    <div style="font-size:9px;font-weight:700;color:${bc};text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">Notes</div>
                    <p style="margin:0;font-size:10px;color:#4b5563;white-space:pre-wrap;line-height:1.5;">${invoice.notes}</p>
                  </div>
                ` : ''}
              </td>
              <td style="vertical-align:top;width:45%;padding-left:20px;">
                <table style="width:100%;font-size:12px;">
                  <tr><td style="padding:6px 0;color:#6b7280;">Subtotal:</td><td style="padding:6px 0;text-align:right;font-weight:600;">\u00a3${(invoice.total_amount || 0).toFixed(2)}</td></tr>
                  ${invoice.tax_amount > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">VAT${s.default_tax_rate ? ' ('+s.default_tax_rate+'%)' : ''}:</td><td style="padding:6px 0;text-align:right;font-weight:600;">\u00a3${(invoice.tax_amount||0).toFixed(2)}</td></tr>` : ''}
                  ${invoice.discount_amount > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">Discount:</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#dc2626;">-\u00a3${(invoice.discount_amount||0).toFixed(2)}</td></tr>` : ''}
                  <tr>
                    <td colspan="2" style="padding:0;"><div style="height:2px;background:${bc};margin:6px 0;"></div></td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:16px;font-weight:800;color:${bc};">TOTAL DUE</td>
                    <td style="padding:8px 0;text-align:right;font-size:16px;font-weight:800;color:${bc};">\u00a3${(invoice.total_amount || 0).toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- BANKING DETAILS -->
          ${bankingHtml}

          <!-- FOOTER -->
          <div style="margin-top:30px;padding-top:12px;border-top:2px solid ${bc};text-align:center;">
            <p style="margin:0;font-size:9px;color:#6b7280;">
              ${s.company_name || ''}
              ${s.company_address ? ' | ' + s.company_address : ''}${s.company_city ? ', ' + s.company_city : ''}${s.company_postcode ? ' ' + s.company_postcode : ''}
              ${s.company_phone ? ' | Tel: ' + s.company_phone : ''}
              ${s.company_email ? ' | ' + s.company_email : ''}
            </p>
            ${s.vat_number ? `<p style="margin:3px 0 0;font-size:9px;color:#6b7280;">VAT Registration: ${s.vat_number}</p>` : ''}
            <p style="margin:6px 0 0;font-size:8px;color:#9ca3af;">Thank you for your business</p>
          </div>
        </div>
      `;

      // Wait for any images to load
      const images = container.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all([...images].map(img =>
          img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })
        ));
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight,
      });

      const doc = new jsPDF({
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

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${suName ? suName + ' - ' : ''}${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      document.body.removeChild(container);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Download failed: ' + error.message);
      console.error('Invoice download error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.invoice_number) {
      toast.error('Please enter an invoice number');
      return;
    }

    // Auto-calculate due_date from payment terms if not set
    if (!formData.due_date && formData.payment_terms !== 'custom') {
      const days = parseInt(formData.payment_terms) || 30;
      const from = formData.invoice_date ? new Date(formData.invoice_date) : new Date();
      formData.due_date = new Date(from.getTime() + days * 86400000).toISOString().split('T')[0];
    }
    if (!formData.invoice_date) {
      formData.invoice_date = new Date().toISOString().split('T')[0];
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
       payment_terms: formData.payment_terms,
       period_from: formData.period_from || null,
       period_to: formData.period_to || null,
       status: editingInvoice ? editingInvoice.status : 'draft',
       currency: settings?.currency || 'GBP',
       repeating_days: repeatingDays.length > 0 ? repeatingDays : null,
       day_items: repeatingDays.length > 0 ? dayItems : null,
     };

    if (editingInvoice) {
      try {
        const updateData = { ...invoiceData };
        // Don't update invoice_number if unchanged to avoid unique constraint
        if (updateData.invoice_number === editingInvoice.invoice_number) {
          delete updateData.invoice_number;
        }
        const { error } = await supabase
          .from('invoices')
          .update(updateData)
          .eq('id', editingInvoice.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        handleCloseDialog();
        toast.success('Invoice updated');
      } catch (error) {
        alert('Update invoice error: ' + error.message);
        toast.error('Failed: ' + error.message);
      }
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  const searchedInvoices = invoices
    .filter(i =>
      search === '' || (i.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.client_name || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));

  const createdInvoices = searchedInvoices.filter(i => !i.status || i.status === 'draft' || i.status === 'live');
  const sentInvoices = searchedInvoices.filter(i => i.status === 'sent' || i.status === 'viewed' || i.status === 'overdue');
  const paidInvoices = searchedInvoices.filter(i => i.status === 'paid');
  const recurringInvoices = searchedInvoices.filter(i => i.status === 'recurring' || i.is_recurring);

  const sections = [
    { key: 'draft', label: 'Draft', count: createdInvoices.length, invoices: createdInvoices },
    { key: 'sent', label: 'Sent', count: sentInvoices.length, invoices: sentInvoices },
    { key: 'paid', label: 'Paid', count: paidInvoices.length, invoices: paidInvoices },
    { key: 'recurring', label: 'Recurring', count: recurringInvoices.length, invoices: recurringInvoices },
  ];

  const getServiceUserName = (invoice) => {
    // 1. Look up from service_user_id
    if (invoice.service_user_id) {
      const su = serviceUsers.find(u => u.id === invoice.service_user_id);
      if (su) return su.full_name;
    }
    // 2. Extract from day_items (repeating invoices)
    if (invoice.day_items) {
      const di = typeof invoice.day_items === 'string' ? JSON.parse(invoice.day_items || '{}') : invoice.day_items;
      for (const items of Object.values(di)) {
        if (Array.isArray(items)) {
          const found = items.find(it => it.service_user_name);
          if (found) return found.service_user_name;
        }
      }
    }
    // 3. Extract from line_items
    if (invoice.line_items) {
      const li = typeof invoice.line_items === 'string' ? JSON.parse(invoice.line_items || '[]') : (invoice.line_items || []);
      const found = li.find(it => it.service_user_name);
      if (found) return found.service_user_name;
    }
    return null;
  };

  const renderInvoiceCard = (invoice) => {
    const suName = getServiceUserName(invoice);
    return (
    <Card key={invoice.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingInvoice(invoice)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-semibold text-slate-900">{suName ? suName + ' — ' : ''}{invoice.invoice_number}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
              invoice.status === 'sent' || invoice.status === 'viewed' ? 'bg-purple-100 text-purple-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {(invoice.status || 'draft').replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
            <span>Issued: {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</span>
            <span>Due: {new Date(invoice.due_date).toLocaleDateString('en-GB')}</span>
          </div>
        </div>
        <div className="text-right mr-4 shrink-0">
          <p className="text-xl font-bold text-slate-900">
            £{(invoice.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </DropdownMenuItem>
              {activeSection !== 'sent' && activeSection !== 'paid' && (
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  const inv = invoice;
                  setTimeout(async () => {
                    await handleDownloadInvoice(inv);
                    updateStatusMutation.mutate({ id: inv.id, status: 'sent', is_recurring: inv.is_recurring });
                  }, 0);
                }}>
                  <Send className="w-4 h-4 mr-2" /> Download & Mark as Sent
                </DropdownMenuItem>
              )}
              {activeSection !== 'sent' && (
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent', is_recurring: invoice.is_recurring })}>
                  <ArrowRight className="w-4 h-4 mr-2" /> Mark as Sent
                </DropdownMenuItem>
              )}
              {activeSection !== 'paid' && (
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid', is_recurring: invoice.is_recurring })}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Paid
                </DropdownMenuItem>
              )}
              {activeSection !== 'draft' && (
                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'draft', is_recurring: invoice.is_recurring })}>
                  <ArrowRight className="w-4 h-4 mr-2" /> Move to Draft
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleOpenDialog(invoice)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => { setPendingDeleteId(invoice.id); setConfirmOpen(true); }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {sections.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeSection === sec.key
                ? sec.key === 'draft' ? 'bg-white shadow text-amber-700'
                : sec.key === 'sent' ? 'bg-white shadow text-purple-700'
                : sec.key === 'recurring' ? 'bg-white shadow text-indigo-700'
                : 'bg-white shadow text-green-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {sec.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeSection === sec.key
                ? sec.key === 'draft' ? 'bg-amber-100 text-amber-700'
                : sec.key === 'sent' ? 'bg-purple-100 text-purple-700'
                : sec.key === 'recurring' ? 'bg-indigo-100 text-indigo-700'
                : 'bg-green-100 text-green-700'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {sec.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Section Invoice List */}
      <div className="space-y-3">
        {sections.find(s => s.key === activeSection)?.invoices.length === 0 ? (
          <Card className="p-8 text-center bg-slate-50">
            <p className="text-slate-500">No {activeSection} invoices</p>
          </Card>
        ) : (
          sections.find(s => s.key === activeSection)?.invoices.map(renderInvoiceCard)
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

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Payment Terms</label>
              <div className="flex gap-3">
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => {
                    const updated = { ...formData, payment_terms: value };
                    if (value !== 'custom' && value !== '0' && formData.invoice_date) {
                      const days = parseInt(value);
                      const from = new Date(formData.invoice_date);
                      const due = new Date(from.getTime() + days * 86400000);
                      updated.due_date = due.toISOString().split('T')[0];
                    } else if (value === '0') {
                      updated.due_date = formData.invoice_date;
                    }
                    setFormData(updated);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">On Receipt</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
                {formData.payment_terms === 'custom' && (
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="flex-1"
                  />
                )}
                {formData.payment_terms !== 'custom' && formData.due_date && (
                  <span className="text-sm text-slate-500 self-center">Due: {new Date(formData.due_date).toLocaleDateString('en-GB')}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Period From</label>
                <Input
                  type="date"
                  value={formData.period_from}
                  onChange={(e) => setFormData({ ...formData, period_from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Period To</label>
                <Input
                  type="date"
                  value={formData.period_to}
                  onChange={(e) => setFormData({ ...formData, period_to: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Date</label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => {
                    const updated = { ...formData, invoice_date: e.target.value };
                    if (formData.payment_terms !== 'custom' && e.target.value) {
                      const days = parseInt(formData.payment_terms) || 0;
                      const from = new Date(e.target.value);
                      const due = new Date(from.getTime() + days * 86400000);
                      updated.due_date = due.toISOString().split('T')[0];
                    }
                    setFormData(updated);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value, payment_terms: 'custom' })}
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
                      // Sort calls by time (earliest first)
                      const sorted = [...calls].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                      const newItems = { ...dayItems };
                      repeatingDays.forEach(dayIdx => {
                        if (!newItems[dayIdx]) newItems[dayIdx] = [];
                        sorted.forEach(call => {
                          const bestHours = parseDurationToHours(call.duration);
                          const callTime = call.time ? call.time.slice(0, 5) : '';
                          newItems[dayIdx].push({
                            id: Date.now() + Math.random(),
                            type: 'client_call',
                            description: `${call.type || 'Care Call'}${callTime ? ' (' + callTime + ')' : ''}`,
                            quantity: bestHours,
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

      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingInvoice && (() => {
            const inv = viewingInvoice;
            const s = invoicingSettings;
            const bc = s.brand_color || '#0f766e';
            const client = inv.client_id ? clients.find(c => c.id === inv.client_id) : null;
            const su = inv.service_user_id ? serviceUsers.find(u => u.id === inv.service_user_id) : null;
            const suName = getServiceUserName(inv);
            const dayItemsParsed = inv.day_items ? (typeof inv.day_items === 'string' ? JSON.parse(inv.day_items) : inv.day_items) : {};
            const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const termsLabel = inv.payment_terms === '0' ? 'On Receipt' : inv.payment_terms === 'custom' ? 'Custom' : (inv.payment_terms || '30') + ' Days';

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    {s.logo_url && <img src={s.logo_url} alt="" className="h-12 mb-2" />}
                    <h2 className="text-xl font-bold" style={{ color: bc }}>{s.company_name || 'Company'}</h2>
                    {s.company_address && <p className="text-xs text-slate-500">{s.company_address}</p>}
                    {(s.company_city || s.company_postcode) && <p className="text-xs text-slate-500">{s.company_city}{s.company_city && s.company_postcode ? ', ' : ''}{s.company_postcode}</p>}
                    {s.company_phone && <p className="text-xs text-slate-500">Tel: {s.company_phone}</p>}
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-black tracking-wide" style={{ color: bc }}>INVOICE</h1>
                    {suName && <p className="font-bold text-sm text-slate-800 mt-1">{suName}</p>}
                    <div className="mt-2 text-sm space-y-0.5">
                      <p><span className="text-slate-500">No:</span> <span className="font-bold">{inv.invoice_number}</span></p>
                      {inv.period_from && <p><span className="text-slate-500">Period:</span> {new Date(inv.period_from).toLocaleDateString('en-GB')} — {inv.period_to ? new Date(inv.period_to).toLocaleDateString('en-GB') : ''}</p>}
                      <p><span className="text-slate-500">Date:</span> {new Date(inv.invoice_date).toLocaleDateString('en-GB')}</p>
                      <p><span className="text-slate-500">Due:</span> {new Date(inv.due_date).toLocaleDateString('en-GB')}</p>
                      <p><span className="text-slate-500">Terms:</span> {termsLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="h-0.5 w-full" style={{ backgroundColor: bc }} />

                {/* Bill To / Service User */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: bc }}>Bill To</p>
                    <p className="font-bold">{inv.client_name}</p>
                    {client?.billing_address && <p className="text-sm text-slate-600">{client.billing_address}</p>}
                    {(client?.billing_city || client?.billing_postcode) && <p className="text-sm text-slate-600">{client.billing_city}{client.billing_city && client.billing_postcode ? ', ' : ''}{client.billing_postcode}</p>}
                    {inv.client_email && <p className="text-sm text-slate-600">{inv.client_email}</p>}
                  </div>
                  {su && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: bc }}>Service User</p>
                      <p className="font-bold">{su.full_name}</p>
                      {su.address && <p className="text-sm text-slate-600">{su.address}</p>}
                      {su.postcode && <p className="text-sm text-slate-600">{su.postcode}</p>}
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: bc }} className="text-white">
                        <th className="text-left p-2 font-semibold text-xs">Description</th>
                        <th className="text-center p-2 font-semibold text-xs w-16">Hours</th>
                        <th className="text-right p-2 font-semibold text-xs w-16">Rate</th>
                        <th className="text-center p-2 font-semibold text-xs w-10">DH</th>
                        <th className="text-right p-2 font-semibold text-xs w-20">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.repeating_days && inv.repeating_days.length > 0 ? (
                        inv.repeating_days.sort((a,b) => a-b).map(dayIdx => {
                          const items = dayItemsParsed[dayIdx] || [];
                          const dayTotal = items.reduce((sum, it) => sum + ((it.quantity||0)*(it.unit_price||0)*(it.double_handed?2:1)), 0);
                          return (
                            <React.Fragment key={dayIdx}>
                              <tr><td colSpan={5} className="px-2 pt-3 pb-1 font-bold text-xs" style={{ color: bc, borderBottom: `2px solid ${bc}` }}>{dayNames[dayIdx]}</td></tr>
                              {items.map((it, idx) => {
                                const amt = (it.quantity||0)*(it.unit_price||0)*(it.double_handed?2:1);
                                return (
                                  <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-2 text-xs">{it.service_user_name && <span className="text-purple-600 font-semibold">{it.service_user_name}</span>}{it.service_user_name ? ' — ' : ''}{it.description || ''}</td>
                                    <td className="p-2 text-center text-xs">{it.quantity||0}h</td>
                                    <td className="p-2 text-right text-xs">£{(it.unit_price||0).toFixed(2)}</td>
                                    <td className="p-2 text-center text-xs">{it.double_handed ? 'x2' : ''}</td>
                                    <td className="p-2 text-right text-xs font-semibold">£{amt.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                              <tr><td colSpan={4} className="px-2 py-1 text-right text-xs text-slate-500">{dayNames[dayIdx]} subtotal:</td><td className="px-2 py-1 text-right text-xs font-bold border-b border-slate-200">£{dayTotal.toFixed(2)}</td></tr>
                            </React.Fragment>
                          );
                        })
                      ) : (
                        (() => {
                          const lineItemsParsed = typeof inv.line_items === 'string' ? JSON.parse(inv.line_items || '[]') : (inv.line_items || []);
                          return lineItemsParsed.map((it, idx) => {
                            const amt = (it.quantity||0)*(it.unit_price||0);
                            return (
                              <tr key={idx} className="border-b border-slate-100">
                                <td className="p-2 text-xs">{it.description || ''}</td>
                                <td className="p-2 text-center text-xs">{it.quantity||0}</td>
                                <td className="p-2 text-right text-xs">£{(it.unit_price||0).toFixed(2)}</td>
                                <td className="p-2 text-center text-xs"></td>
                                <td className="p-2 text-right text-xs font-semibold">£{amt.toFixed(2)}</td>
                              </tr>
                            );
                          });
                        })()
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span className="font-semibold">£{(inv.total_amount || 0).toFixed(2)}</span></div>
                    {inv.tax_amount > 0 && <div className="flex justify-between"><span className="text-slate-500">VAT:</span><span className="font-semibold">£{(inv.tax_amount||0).toFixed(2)}</span></div>}
                    {inv.discount_amount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount:</span><span className="font-semibold text-red-600">-£{(inv.discount_amount||0).toFixed(2)}</span></div>}
                    <div className="h-0.5 w-full" style={{ backgroundColor: bc }} />
                    <div className="flex justify-between text-lg"><span className="font-bold" style={{ color: bc }}>TOTAL DUE</span><span className="font-bold" style={{ color: bc }}>£{(inv.total_amount || 0).toFixed(2)}</span></div>
                  </div>
                </div>

                {/* Notes */}
                {inv.notes && (
                  <div className="bg-slate-50 border rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: bc }}>Notes</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{inv.notes}</p>
                  </div>
                )}

                {/* Banking */}
                {(s.bank_account_name || s.bank_sort_code || s.bank_account_number) && (
                  <div className="bg-slate-50 border rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: bc }}>Payment Details</p>
                    <div className="text-xs space-y-0.5">
                      {s.bank_account_name && <p><span className="text-slate-500 font-semibold">Account Name:</span> {s.bank_account_name}</p>}
                      {s.bank_sort_code && <p><span className="text-slate-500 font-semibold">Sort Code:</span> {s.bank_sort_code}</p>}
                      {s.bank_account_number && <p><span className="text-slate-500 font-semibold">Account Number:</span> {s.bank_account_number}</p>}
                      {s.bank_iban && <p><span className="text-slate-500 font-semibold">IBAN:</span> {s.bank_iban}</p>}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 border-t">
                  <Button onClick={() => { setViewingInvoice(null); handleOpenDialog(inv); }} className="bg-teal-600 hover:bg-teal-700">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Invoice
                  </Button>
                  <Button variant="outline" onClick={() => {
                    if (inv.status === 'sent' || inv.status === 'paid') {
                      handleDownloadInvoice(inv);
                    } else {
                      setViewingInvoice(null);
                      setDownloadChoiceInvoice(inv);
                    }
                  }}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => { updateStatusMutation.mutate({ id: inv.id, status: 'sent', is_recurring: inv.is_recurring }); setViewingInvoice(null); }}>
                    <Send className="w-4 h-4 mr-2" /> Mark as Sent
                  </Button>
                </div>
              </div>
            );
          })()}
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

      {/* Download choice popup */}
      <Dialog open={!!downloadChoiceInvoice} onOpenChange={(open) => !open && setDownloadChoiceInvoice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Download Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Would you like to mark this invoice as sent?</p>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              className="w-full"
              onClick={async () => {
                const inv = downloadChoiceInvoice;
                setDownloadChoiceInvoice(null);
                await handleDownloadInvoice(inv);
                updateStatusMutation.mutate({ id: inv.id, status: 'sent', is_recurring: inv.is_recurring });
              }}
            >
              <Send className="w-4 h-4 mr-2" /> Download & Mark as Sent
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const inv = downloadChoiceInvoice;
                setDownloadChoiceInvoice(null);
                await handleDownloadInvoice(inv);
              }}
            >
              <Download className="w-4 h-4 mr-2" /> Download Only
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
