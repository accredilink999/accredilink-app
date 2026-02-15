import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoicingSettings({ settings }) {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '');

  // Update logoUrl when settings change
  React.useEffect(() => {
    if (settings?.logo_url) {
      setLogoUrl(settings.logo_url);
    }
  }, [settings?.logo_url]);

  const [formData, setFormData] = useState({
    company_name: settings?.company_name || '',
    company_email: settings?.company_email || '',
    company_phone: settings?.company_phone || '',
    company_website: settings?.company_website || '',
    company_address: settings?.company_address || '',
    company_city: settings?.company_city || '',
    company_postcode: settings?.company_postcode || '',
    company_country: settings?.company_country || 'United Kingdom',
    tax_id: settings?.tax_id || '',
    currency: settings?.currency || 'GBP',
    tax_rate: settings?.tax_rate || 20,
    invoice_prefix: settings?.invoice_prefix || 'INV',
    brand_color: settings?.brand_color || '#0f766e',
    invoice_notes: settings?.invoice_notes || '',
    bank_account_name: settings?.bank_account_name || '',
    bank_account_number: settings?.bank_account_number || '',
    bank_sort_code: settings?.bank_sort_code || '',
    bank_iban: settings?.bank_iban || '',
    call_types: settings?.call_types || ['Early Call', 'Morning Call', 'Lunch Call', 'Tea Call', 'Bed Call', 'Social Care Call'],
    hours_options: settings?.hours_options || [0.5, 1, 1.5, 2, 2.5, 3, 4],
    hourly_rates: settings?.hourly_rates || [15, 20, 25, 30, 40],
  });
  const [newCallType, setNewCallType] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newRate, setNewRate] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.InvoicingSettings.update(settings.id, {
      ...data,
      logo_url: logoUrl,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
      toast.success('Settings updated successfully');
    },
  });

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(response.file_url);
      
      // Auto-save logo after upload
      await base44.entities.InvoicingSettings.update(settings.id, {
        logo_url: response.file_url,
      });
      queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    }
  };

  const handleAddCallType = () => {
    if (!newCallType.trim()) {
      toast.error('Enter a call type name');
      return;
    }
    if (formData.call_types.includes(newCallType)) {
      toast.error('This call type already exists');
      return;
    }
    setFormData({
      ...formData,
      call_types: [...formData.call_types, newCallType]
    });
    setNewCallType('');
  };

  const handleRemoveCallType = (type) => {
    setFormData({
      ...formData,
      call_types: formData.call_types.filter(t => t !== type)
    });
  };

  const handleAddHours = () => {
    const hoursValue = parseFloat(newHours);
    if (!newHours || isNaN(hoursValue)) {
      toast.error('Enter a valid hour value');
      return;
    }
    if (formData.hours_options.includes(hoursValue)) {
      toast.error('This hour value already exists');
      return;
    }
    setFormData({
      ...formData,
      hours_options: [...formData.hours_options, hoursValue].sort((a, b) => a - b)
    });
    setNewHours('');
  };

  const handleRemoveHours = (hours) => {
    setFormData({
      ...formData,
      hours_options: formData.hours_options.filter(h => h !== hours)
    });
  };

  const handleAddRate = () => {
    const rateValue = parseFloat(newRate);
    if (!newRate || isNaN(rateValue)) {
      toast.error('Enter a valid hourly rate');
      return;
    }
    if (formData.hourly_rates.includes(rateValue)) {
      toast.error('This rate already exists');
      return;
    }
    setFormData({
      ...formData,
      hourly_rates: [...formData.hourly_rates, rateValue].sort((a, b) => a - b)
    });
    setNewRate('');
  };

  const handleRemoveRate = (rate) => {
    setFormData({
      ...formData,
      hourly_rates: formData.hourly_rates.filter(r => r !== rate)
    });
  };

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  if (!settings) {
    return (
      <Card className="p-8 text-center bg-slate-50">
        <p className="text-slate-500">Loading settings...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="tax">Tax & Invoicing</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="call-types">Call Types</TabsTrigger>
          <TabsTrigger value="hours">Hours Options</TabsTrigger>
          <TabsTrigger value="rates">Hourly Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Company Name</label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Phone</label>
                <Input
                  value={formData.company_phone}
                  onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Website</label>
                <Input
                  value={formData.company_website}
                  onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Address</label>
                <Input
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">City</label>
                  <Input
                    value={formData.company_city}
                    onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Postcode</label>
                  <Input
                    value={formData.company_postcode}
                    onChange={(e) => setFormData({ ...formData, company_postcode: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Invoice Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Company Logo</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Click to upload new logo</p>
                    <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                  </label>
                </div>
                {logoUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <img src={logoUrl} alt="Company logo" className="h-12 rounded" />
                    <p className="text-sm text-green-600">Logo set</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.brand_color}
                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.brand_color}
                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Default Invoice Notes</label>
                <Textarea
                  value={formData.invoice_notes}
                  onChange={(e) => setFormData({ ...formData, invoice_notes: e.target.value })}
                  rows={4}
                  placeholder="e.g., Thank you for your business! Payment due within 30 days."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Invoicing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Tax/VAT ID</label>
                <Input
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="GB123456789"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Currency</label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Default Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Prefix</label>
                <Input
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                  placeholder="INV"
                />
                <p className="text-xs text-slate-500 mt-1">Invoices will be numbered like: {formData.invoice_prefix}-1001, {formData.invoice_prefix}-1002, etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Account Name</label>
                <Input
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Account Number</label>
                <Input
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Sort Code</label>
                <Input
                  value={formData.bank_sort_code}
                  onChange={(e) => setFormData({ ...formData, bank_sort_code: e.target.value })}
                  placeholder="12-34-56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">IBAN (International)</label>
                <Input
                  value={formData.bank_iban}
                  onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="call-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Call Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Manage the call types available when creating invoices</p>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newCallType}
                    onChange={(e) => setNewCallType(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCallType()}
                    placeholder="Enter new call type"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCallType}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {formData.call_types.map((type, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-900 font-medium">{type}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCallType(type)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hours Options for Day-Specific Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Manage the hour options available when adding items to specific days</p>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHours()}
                    placeholder="e.g., 0.5, 1, 2.5"
                  />
                  <Button
                    type="button"
                    onClick={handleAddHours}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {formData.hours_options.map((hours, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-900 font-medium">{hours}h</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHours(hours)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Manage hourly rates available for day-specific items</p>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRate()}
                    placeholder="e.g., 15, 20, 25"
                  />
                  <Button
                    type="button"
                    onClick={handleAddRate}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {formData.hourly_rates.map((rate, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-900 font-medium">£{rate}/hour</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRate(rate)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}