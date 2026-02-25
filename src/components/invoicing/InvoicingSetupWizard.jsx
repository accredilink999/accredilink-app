import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Upload, Check, Save } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'invoicing_setup_draft';

const STEPS = [
  { id: 1, title: 'Company Info' },
  { id: 2, title: 'Address & Tax' },
  { id: 3, title: 'Branding' },
  { id: 4, title: 'Banking Details' },
];

const DEFAULT_FORM = {
  company_name: '',
  company_email: '',
  company_phone: '',
  company_website: '',
  company_address: '',
  company_city: '',
  company_postcode: '',
  tax_id: '',
  currency: 'GBP',
  tax_rate: 20,
  invoice_prefix: 'INV',
  brand_color: '#0f766e',
  invoice_notes: '',
  bank_account_name: '',
  bank_account_number: '',
  bank_sort_code: '',
  bank_iban: '',
};

export default function InvoicingSetupWizard() {
  const queryClient = useQueryClient();

  // Load saved draft from localStorage
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved?.step || 1;
    } catch { return 1; }
  });

  const [formData, setFormData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...DEFAULT_FORM, ...(saved?.data || {}) };
    } catch { return { ...DEFAULT_FORM }; }
  });

  const [logoUrl, setLogoUrl] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved?.logoUrl || '';
    } catch { return ''; }
  });

  // Auto-save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data: formData,
      step: currentStep,
      logoUrl,
    }));
  }, [formData, currentStep, logoUrl]);

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data: formData,
      step: currentStep,
      logoUrl,
    }));
    toast.success('Draft saved! Your details are safe.');
  };

  const createSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        company_name: data.company_name,
        company_email: data.company_email,
        company_phone: data.company_phone,
        company_website: data.company_website || null,
        company_address: data.company_address,
        company_city: data.company_city,
        company_postcode: data.company_postcode,
        logo_url: logoUrl || null,
        brand_color: data.brand_color,
        currency: data.currency,
        default_tax_rate: data.tax_rate || 0,
        vat_number: data.tax_id || null,
        payment_terms: 'Net 30',
        invoice_prefix: data.invoice_prefix || 'INV',
        invoice_notes: data.invoice_notes || null,
        bank_account_name: data.bank_account_name || null,
        bank_account_number: data.bank_account_number || null,
        bank_sort_code: data.bank_sort_code || null,
        bank_iban: data.bank_iban || null,
        is_configured: true,
      };

      // Check if a settings row already exists
      const { data: existing } = await supabase
        .from('invoicing_settings')
        .select('id')
        .limit(1)
        .single();

      let result, error;
      if (existing?.id) {
        // Update existing row
        ({ data: result, error } = await supabase
          .from('invoicing_settings')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single());
      } else {
        // Insert new row
        ({ data: result, error } = await supabase
          .from('invoicing_settings')
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw new Error(error.message + (error.details ? ': ' + error.details : '') + (error.hint ? ' — ' + error.hint : ''));
      if (!result) throw new Error('No data returned — check RLS policies on invoicing_settings table');
      return result;
    },
    onSuccess: async () => {
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Invoicing setup complete!');
      await queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
      await queryClient.refetchQueries({ queryKey: ['invoicingSettings'] });
    },
    onError: (err) => {
      console.error('Setup failed:', err);
      toast.error('Setup failed: ' + err.message);
    },
  });

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `logos/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      setLogoUrl(urlData.publicUrl);
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Logo upload failed — you can skip this and add it later in settings');
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!formData.company_name || !formData.company_email) {
      toast.error('Company Name and Email are required (Step 1)');
      setCurrentStep(1);
      return;
    }
    createSettingsMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 flex items-center justify-center cursor-pointer ${step.id <= currentStep ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold transition-all ${
                  step.id < currentStep ? 'bg-green-500 text-white' :
                  step.id === currentStep ? 'bg-teal-500 text-white' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>
                {step.id < STEPS.length && (
                  <div className={`flex-1 h-1 mx-1 sm:mx-2 ${step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Setup Your Invoicing System</h1>
            <p className="text-slate-400 text-sm">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</p>
            <p className="text-slate-500 text-xs mt-1">Your progress is auto-saved</p>
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-white shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
            <CardTitle className="text-xl sm:text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Company Name *</label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Your Business Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Email *</label>
                  <Input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Phone</label>
                  <Input
                    value={formData.company_phone}
                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                    placeholder="+44 (0) 1234 567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Website</label>
                  <Input
                    value={formData.company_website}
                    onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                    placeholder="www.company.com"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Address</label>
                  <Input
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    placeholder="123 Business Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">City</label>
                    <Input
                      value={formData.company_city}
                      onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                      placeholder="Denbigh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Postcode</label>
                    <Input
                      value={formData.company_postcode}
                      onChange={(e) => setFormData({ ...formData, company_postcode: e.target.value })}
                      placeholder="LL16 3AA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Tax/VAT ID</label>
                  <Input
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="GB123456789 (leave blank if not VAT registered)"
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
                    <label className="block text-sm font-medium text-slate-900 mb-2">Tax Rate (%)</label>
                    <Input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Company Logo (optional)</label>
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
                      <p className="text-sm font-medium text-slate-600">Click to upload logo</p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 5MB — you can add this later</p>
                    </label>
                  </div>
                  {logoUrl && (
                    <div className="mt-4 flex flex-col items-center">
                      <img src={logoUrl} alt="Logo preview" className="h-24 object-contain mb-2" />
                      <p className="text-sm text-green-600">Logo uploaded</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Brand Colour</label>
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
                  <label className="block text-sm font-medium text-slate-900 mb-2">Invoice Prefix</label>
                  <Input
                    value={formData.invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                    placeholder="INV"
                  />
                  <p className="text-xs text-slate-500 mt-1">Invoices will be numbered like: INV-1001, INV-1002, etc.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Default Invoice Notes</label>
                  <Textarea
                    value={formData.invoice_notes}
                    onChange={(e) => setFormData({ ...formData, invoice_notes: e.target.value })}
                    placeholder="e.g., Thank you for your business! Payment due within 30 days."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Account Name</label>
                  <Input
                    value={formData.bank_account_name}
                    onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                    placeholder="Your Name or Business Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Account Number</label>
                  <Input
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="12345678"
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
                  <label className="block text-sm font-medium text-slate-900 mb-2">IBAN (optional)</label>
                  <Input
                    value={formData.bank_iban}
                    onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                    placeholder="GB82 WEST 1234 5698 7654 32"
                  />
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <div className="border-t bg-slate-50 px-4 sm:px-6 py-4 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={saveDraft}
                className="text-slate-500 text-xs sm:text-sm"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
              {currentStep < STEPS.length && (
                <Button
                  onClick={handleNext}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {currentStep === STEPS.length && (
                <Button
                  onClick={handleSubmit}
                  disabled={createSettingsMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createSettingsMutation.isPending ? 'Setting up...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
