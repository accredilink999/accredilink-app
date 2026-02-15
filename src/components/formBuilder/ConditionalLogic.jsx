import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from 'lucide-react';

export default function ConditionalLogic({ field, allFields, onUpdate }) {
  const conditions = field.conditions || [];

  const handleAddCondition = () => {
    const newConditions = [...conditions, { fieldId: '', operator: 'equals', value: '', action: 'show' }];
    onUpdate({ conditions: newConditions });
  };

  const handleUpdateCondition = (index, updates) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate({ conditions: newConditions });
  };

  const handleDeleteCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onUpdate({ conditions: newConditions });
  };

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
  ];

  const actions = [
    { value: 'show', label: 'Show this field' },
    { value: 'hide', label: 'Hide this field' },
    { value: 'require', label: 'Make required' },
    { value: 'unrequire', label: 'Make optional' },
  ];

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Conditional Logic</h4>
        <Button variant="outline" size="sm" onClick={handleAddCondition}>
          <Plus className="w-3 h-3 mr-1" />
          Add Condition
        </Button>
      </div>

      {conditions.length === 0 ? (
        <p className="text-xs text-slate-500">No conditions yet</p>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <Card key={index} className="p-3 bg-slate-50">
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">If</Label>
                  <Select value={condition.fieldId} onValueChange={(value) => handleUpdateCondition(index, { fieldId: value })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFields.filter(f => f.id !== field.id).map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Condition</Label>
                  <Select value={condition.operator} onValueChange={(value) => handleUpdateCondition(index, { operator: value })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map(op => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Enter value"
                  />
                </div>

                <div>
                  <Label className="text-xs">Then</Label>
                  <Select value={condition.action} onValueChange={(value) => handleUpdateCondition(index, { action: value })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map(action => (
                        <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCondition(index)}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}