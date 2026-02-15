import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Save } from 'lucide-react';

const currencyOptions = {
  'GBP': { symbol: '£', label: 'British Pound' },
  'EUR': { symbol: '€', label: 'Euro' },
  'USD': { symbol: '$', label: 'US Dollar' },
  'AUD': { symbol: 'A$', label: 'Australian Dollar' }
};

export default function PayrollSettingsManager() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    currency: 'GBP',
    currency_symbol: '£',
    tax_id: '',
    ni_number: '',
    payroll_reference: '',
    company_name: '',
    auto_generate_wage_slips: true
  });

  const { data: settings } = useQuery({
    queryKey: ['payrollSettings'],
    queryFn: async () => {
      const result = await base44.entities.PayrollSettings.list('-created_date', 1);
      return result?.[0];
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => {
      if (settings?.id) {
        return base44.entities.PayrollSettings.update(settings.id, data);
      } else {
        return base44.entities.PayrollSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollSettings'] });
      setIsEditing(false);
    }
  });

  const handleCurrencyChange = (value) => {
    setFormData({
      ...formData,
      currency: value,
      currency_symbol: currencyOptions[value].symbol
    });
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <CardTitle>Payroll Settings</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit Settings
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Currency</p>
              <p className="text-lg font-semibold text-slate-900">{formData.currency} ({formData.currency_symbol})</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Auto Generate Wage Slips</p>
              <p className="text-lg font-semibold text-slate-900">{formData.auto_generate_wage_slips ? 'Enabled' : 'Disabled'}</p>
            </div>
            {formData.tax_id && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Tax/PAYE Reference</p>
                <p className="font-mono text-slate-900">{formData.tax_id}</p>
              </div>
            )}
            {formData.ni_number && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">NI Reference</p>
                <p className="font-mono text-slate-900">{formData.ni_number}</p>
              </div>
            )}
            {formData.payroll_reference && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Payroll Reference</p>
                <p className="font-mono text-slate-900">{formData.payroll_reference}</p>
              </div>
            )}
            {formData.company_name && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Company Name</p>
                <p className="font-semibold text-slate-900">{formData.company_name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Currency *</Label>
            <Select value={formData.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencyOptions).map(([code, { label }]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              placeholder="e.g., Accredi-Care Ltd"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tax/PAYE Reference Number</Label>
            <Input
              placeholder="e.g., 123/AB45678"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>NI Reference</Label>
            <Input
              placeholder="e.g., 12 345 678 A"
              value={formData.ni_number}
              onChange={(e) => setFormData({ ...formData, ni_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Payroll Reference</Label>
            <Input
              placeholder="e.g., PR-2024-001"
              value={formData.payroll_reference}
              onChange={(e) => setFormData({ ...formData, payroll_reference: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg">
          <Checkbox
            checked={formData.auto_generate_wage_slips}
            onCheckedChange={(checked) => setFormData({ ...formData, auto_generate_wage_slips: checked })}
          />
          <Label className="mb-0 cursor-pointer">Automatically generate wage slips when payroll is created</Label>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}