import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Company Info', icon: '🏢' },
  { id: 2, title: 'Address & Tax', icon: '📍' },
  { id: 3, title: 'Branding', icon: '🎨' },
  { id: 4, title: 'Banking Details', icon: '🏦' },
];

export default function InvoicingSetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    company_address: '',
    company_city: '',
    company_postcode: '',
    company_country: 'United Kingdom',
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
  });

  const createSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.InvoicingSettings.create({
      ...data,
      logo_url: logoUrl,
      setup_completed: true
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoicingSettings'] });
      await queryClient.refetchQueries({ queryKey: ['invoicingSettings'] });
    },
  });

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(response.file_url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
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
      toast.error('Please fill in required fields');
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
                className={`flex-1 flex items-center justify-center ${step.id < currentStep ? 'opacity-100' : step.id === currentStep ? 'opacity-100' : 'opacity-50'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  step.id < currentStep ? 'bg-green-500 text-white' :
                  step.id === currentStep ? 'bg-teal-500 text-white' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {step.id < currentStep ? <Check className="w-6 h-6" /> : step.id}
                </div>
                {step.id < STEPS.length && (
                  <div className={`flex-1 h-1 mx-2 ${step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Setup Your Invoicing System</h1>
            <p className="text-slate-400">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</p>
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-white shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
            <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
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
                      placeholder="London"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Postcode</label>
                    <Input
                      value={formData.company_postcode}
                      onChange={(e) => setFormData({ ...formData, company_postcode: e.target.value })}
                      placeholder="SW1A 1AA"
                    />
                  </div>
                </div>
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
                    <label className="block text-sm font-medium text-slate-900 mb-2">Tax Rate (%)</label>
                    <Input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
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
                      <p className="text-sm font-medium text-slate-600">Click to upload logo</p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                  {logoUrl && (
                    <div className="mt-4 flex flex-col items-center">
                      <img src={logoUrl} alt="Logo preview" className="h-24 object-contain mb-2" />
                      <p className="text-sm text-green-600">✓ Logo uploaded successfully</p>
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
                    placeholder="Your Name"
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
                  <label className="block text-sm font-medium text-slate-900 mb-2">IBAN (International)</label>
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
          <div className="border-t bg-slate-50 px-6 py-4 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <div className="flex gap-2">
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