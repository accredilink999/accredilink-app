import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import SpeechButton from '@/components/ui/SpeechButton';

function renderField(field, value, onChange) {
  const fieldValue = value ?? '';

  switch (field.type) {
    case 'text':
      return (
        <Input
          value={fieldValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || ''}
        />
      );

    case 'textarea':
      return (
        <div className="flex gap-2">
          <Textarea
            value={fieldValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            className="flex-1"
          />
          <SpeechButton
            onResult={(text) => onChange(field.id, (fieldValue || '') + ' ' + text)}
            className="h-12 px-3"
          />
        </div>
      );

    case 'yes_no':
      return (
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => onChange(field.id, 'yes')}
            className={fieldValue === 'yes' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
          >
            Yes
          </Button>
          <Button
            type="button"
            onClick={() => onChange(field.id, 'no')}
            className={fieldValue === 'no' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
          >
            No
          </Button>
        </div>
      );

    case 'select':
      return (
        <Select value={fieldValue} onValueChange={(val) => onChange(field.id, val)}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              return (
                <SelectItem key={optValue} value={optValue}>
                  {optLabel}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );

    case 'checkbox_group': {
      const checkedValues = Array.isArray(fieldValue) ? fieldValue : [];
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <div key={optValue} className="flex items-center gap-3">
                <Checkbox
                  id={`${field.id}-${optValue}`}
                  checked={checkedValues.includes(optValue)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange(field.id, [...checkedValues, optValue]);
                    } else {
                      onChange(field.id, checkedValues.filter((v) => v !== optValue));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${optValue}`} className="cursor-pointer text-sm">
                  {optLabel}
                </Label>
              </div>
            );
          })}
        </div>
      );
    }

    case 'radio': {
      return (
        <div className="space-y-2">
          {(field.options || []).map((option) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <div key={optValue} className="flex items-center gap-3">
                <input
                  type="radio"
                  id={`${field.id}-${optValue}`}
                  name={field.id}
                  value={optValue}
                  checked={fieldValue === optValue}
                  onChange={() => onChange(field.id, optValue)}
                  className="w-4 h-4"
                />
                <label htmlFor={`${field.id}-${optValue}`} className="cursor-pointer text-sm">
                  {optLabel}
                </label>
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return (
        <Input
          value={fieldValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || ''}
        />
      );
  }
}

export default function CustomSectionRenderer({ section, values, onChange }) {
  if (!section || !section.fields || section.fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">{section.label}</h3>
      {section.fields.map((field) => (
        <div key={field.id} className="space-y-3">
          <Label>
            {field.label}{field.required ? ' *' : ''}
          </Label>
          {renderField(field, values[field.id], onChange)}
        </div>
      ))}
    </div>
  );
}
