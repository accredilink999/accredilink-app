import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from 'lucide-react';
import ConditionalLogic from './ConditionalLogic';

export default function FormSettingsPanel({ field, onUpdate, onDelete, allFields = [] }) {
  return (
    <div className="w-64 bg-white border-l border-slate-200 p-4 overflow-y-auto mt-20">
      <h3 className="font-semibold text-slate-900 mb-4">Field Settings</h3>
      
      <div className="space-y-4">
        <div>
          <Label className="text-sm">Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="mt-1"
          />
        </div>

        {(field.type !== 'section' && field.type !== 'checkbox') && (
          <div>
            <Label className="text-sm">Placeholder</Label>
            <Input
              value={field.placeholder}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="mt-1"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label className="text-sm">Required</Label>
          <Switch
            checked={field.required || false}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
        </div>

        {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
          <div>
            <Label className="text-sm">Options (one per line)</Label>
            <Textarea
              value={(field.options || []).join('\n')}
              onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o) })}
              className="mt-1 h-24"
            />
          </div>
        )}

        {field.type === 'number' && (
          <>
            <div>
              <Label className="text-sm">Min Value</Label>
              <Input
                type="number"
                value={field.min || ''}
                onChange={(e) => onUpdate({ min: e.target.value ? Number(e.target.value) : undefined })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Max Value</Label>
              <Input
                type="number"
                value={field.max || ''}
                onChange={(e) => onUpdate({ max: e.target.value ? Number(e.target.value) : undefined })}
                className="mt-1"
              />
            </div>
          </>
        )}

        {field.type === 'email' && (
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            Automatic email validation enabled
          </div>
        )}

        <ConditionalLogic field={field} allFields={allFields} onUpdate={onUpdate} />

        <div className="pt-4 border-t border-slate-200">
          <Button
            onClick={onDelete}
            variant="destructive"
            className="w-full"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Field
          </Button>
        </div>
      </div>
    </div>
  );
}