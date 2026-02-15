import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FormFieldRenderer({ field, value, onChange, preview }) {
  const [userCompanyData, setUserCompanyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field.type === 'company-header' && !preview) {
      setLoading(true);
      base44.auth.me().then(user => {
        setUserCompanyData(user);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [field.type, preview]);

  const label = (
    <Label className="text-sm font-medium text-slate-900">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  if (preview) {
    // Preview mode - just show the label and placeholder
    // Except for company-header which needs to load real data
    if (field.type === 'company-header') {
      if (loading) {
        return <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />;
      }
      return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-8 py-6 text-white mb-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-shrink-0">
              {userCompanyData?.company_logo_url ? (
                <img 
                  src={userCompanyData.company_logo_url} 
                  alt="Company Logo" 
                  className="h-24 w-auto object-contain bg-white rounded-lg p-2"
                />
              ) : (
                <div className="h-24 w-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white text-sm">
                  No logo
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{userCompanyData?.company_name || 'Company Name'}</h2>
              <p className="text-blue-100 text-lg mt-2">{userCompanyData?.company_contact_number || 'Contact Number'}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {label}
        <div className="text-sm text-slate-500">
          {field.placeholder || `[${field.type} field]`}
        </div>
      </div>
    );
  }

  // Form submission mode
  switch (field.type) {
    case 'name':
      return (
        <div className="space-y-2">
          {label}
          <Input
            type="text"
            placeholder={field.placeholder || 'Full name'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case 'staffname':
      return (
        <div className="space-y-2">
          {label}
          <Input
            type="text"
            placeholder={field.placeholder || 'Staff member name'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case 'photo':
      return (
        <div className="space-y-2">
          {label}
          <div className="flex flex-col gap-3">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => onChange(reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id={field.id}
                required={field.required}
              />
              <label htmlFor={field.id} className="cursor-pointer block">
                <div className="text-3xl mb-2">📸</div>
                <div className="text-sm font-medium text-slate-900">Take or upload photo</div>
                <div className="text-xs text-slate-500 mt-1">Click to select from device or take a photo</div>
              </label>
            </div>
            {value && (
              <div className="relative inline-block">
                <img src={value} alt="Preview" className="max-w-xs max-h-64 rounded-lg border border-slate-300" />
                <button
                  onClick={() => onChange(null)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      );

    case 'text':
    case 'email':
    case 'number':
    case 'phone':
    case 'doorcode':
      return (
        <div className="space-y-2">
          {label}
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder || (field.type === 'doorcode' ? 'Enter door code' : undefined)}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            min={field.type === 'number' ? field.min : undefined}
            max={field.type === 'number' ? field.max : undefined}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          {label}
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            rows={4}
          />
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          {label}
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case 'file':
      return (
        <div className="space-y-2">
          {label}
          <Input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0]?.name || '')}
            required={field.required}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          {label}
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {label}
          <RadioGroup value={value || ''} onValueChange={onChange}>
            {(field.options || []).map(option => (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="font-normal cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={onChange}
              id={field.id}
            />
            <Label htmlFor={field.id} className="font-normal cursor-pointer">{field.label}</Label>
            {field.required && <span className="text-red-500">*</span>}
          </div>
        </div>
      );

    case 'address':
      const mapsUrl = value ? `https://www.google.com/maps/search/${encodeURIComponent(value)}` : null;
      return (
        <div className="space-y-2">
          {label}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={field.placeholder || 'Enter address'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              required={field.required}
            />
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                title="View on Google Maps"
              >
                <MapPin className="w-5 h-5 text-teal-600" />
              </a>
            )}
          </div>
        </div>
      );

    case 'nextofkin':
      return (
        <div className="space-y-2">
          {label}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Name"
              value={value?.name || ''}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              required={field.required}
            />
            <Input
              type="tel"
              placeholder="Phone number"
              value={value?.phone || ''}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              required={field.required}
            />
          </div>
        </div>
      );

    case 'section':
      return <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-4">{field.label}</h3>;

    case 'company-header':
      if (loading) {
        return <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />;
      }
      return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-8 py-6 text-white mb-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-shrink-0">
              {userCompanyData?.company_logo_url ? (
                <img 
                  src={userCompanyData.company_logo_url} 
                  alt="Company Logo" 
                  className="h-24 w-auto object-contain bg-white rounded-lg p-2"
                />
              ) : (
                <div className="h-24 w-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white text-sm">
                  No logo
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{userCompanyData?.company_name || 'Company Name'}</h2>
              <p className="text-blue-100 text-lg mt-2">{userCompanyData?.company_contact_number || 'Contact Number'}</p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}