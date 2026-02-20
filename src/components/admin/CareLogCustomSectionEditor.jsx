import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, X, Save, GripVertical } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', color: 'bg-teal-100 text-teal-800' },
  { value: 'textarea', label: 'Textarea', color: 'bg-teal-100 text-teal-800' },
  { value: 'yes_no', label: 'Yes / No', color: 'bg-blue-100 text-blue-800' },
  { value: 'select', label: 'Select', color: 'bg-purple-100 text-purple-800' },
  { value: 'checkbox_group', label: 'Checkbox Group', color: 'bg-amber-100 text-amber-800' },
  { value: 'radio', label: 'Radio', color: 'bg-rose-100 text-rose-800' },
];

const TYPES_WITH_PLACEHOLDER = ['text', 'textarea'];
const TYPES_WITH_OPTIONS = ['select', 'checkbox_group', 'radio'];

function getTypeBadgeColor(type) {
  const found = FIELD_TYPES.find((t) => t.value === type);
  return found ? found.color : 'bg-slate-100 text-slate-700';
}

function getTypeLabel(type) {
  const found = FIELD_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

const emptyField = () => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type: 'text',
  label: '',
  placeholder: '',
  required: false,
  options: [],
});

export default function CareLogCustomSectionEditor({ open, onClose, section, onSave }) {
  const isEdit = !!section;

  const [sectionName, setSectionName] = useState('');
  const [fields, setFields] = useState([]);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [errors, setErrors] = useState({});

  // Reset state when dialog opens or section prop changes
  useEffect(() => {
    if (open) {
      if (section) {
        setSectionName(section.name || '');
        setFields(section.fields ? section.fields.map((f) => ({ ...f })) : []);
      } else {
        setSectionName('');
        setFields([]);
      }
      setEditingFieldIndex(null);
      setEditingField(null);
      setErrors({});
    }
  }, [open, section]);

  // --- Field list management ---

  const handleAddField = () => {
    const newField = emptyField();
    setFields((prev) => [...prev, newField]);
    setEditingFieldIndex(fields.length);
    setEditingField({ ...newField });
  };

  const handleEditField = (index) => {
    setEditingFieldIndex(index);
    setEditingField({ ...fields[index] });
  };

  const handleDeleteField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
    if (editingFieldIndex === index) {
      setEditingFieldIndex(null);
      setEditingField(null);
    } else if (editingFieldIndex !== null && editingFieldIndex > index) {
      setEditingFieldIndex(editingFieldIndex - 1);
    }
  };

  const handleSaveField = () => {
    if (!editingField || !editingField.label.trim()) return;
    setFields((prev) => {
      const updated = [...prev];
      updated[editingFieldIndex] = { ...editingField };
      return updated;
    });
    setEditingFieldIndex(null);
    setEditingField(null);
  };

  const handleCancelFieldEdit = () => {
    // If the field at editingFieldIndex has no label (was newly added), remove it
    if (editingFieldIndex !== null && !fields[editingFieldIndex]?.label?.trim()) {
      setFields((prev) => prev.filter((_, i) => i !== editingFieldIndex));
    }
    setEditingFieldIndex(null);
    setEditingField(null);
  };

  // --- Options management (for select, checkbox_group, radio) ---

  const handleAddOption = () => {
    setEditingField((prev) => ({
      ...prev,
      options: [...(prev.options || []), ''],
    }));
  };

  const handleChangeOption = (optIndex, value) => {
    setEditingField((prev) => {
      const opts = [...prev.options];
      opts[optIndex] = value;
      return { ...prev, options: opts };
    });
  };

  const handleDeleteOption = (optIndex) => {
    setEditingField((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== optIndex),
    }));
  };

  // --- Save section ---

  const handleSave = () => {
    const newErrors = {};
    if (!sectionName.trim()) {
      newErrors.sectionName = 'Section name is required';
    }
    if (fields.length === 0) {
      newErrors.fields = 'At least one field is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const sectionData = {
      id: section?.id || `custom_${Date.now()}`,
      name: sectionName.trim(),
      fields: fields.map((f, idx) => ({
        ...f,
        id: f.id || `field_${Date.now()}_${idx}`,
      })),
    };

    onSave(sectionData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {isEdit ? 'Edit Custom Section' : 'Add Custom Section'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Section name */}
          <div className="space-y-2">
            <Label htmlFor="section-name" className="text-slate-700 font-medium">
              Section Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="section-name"
              value={sectionName}
              onChange={(e) => {
                setSectionName(e.target.value);
                if (errors.sectionName) setErrors((prev) => ({ ...prev, sectionName: undefined }));
              }}
              placeholder="e.g. Medication Administration"
              className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
            />
            {errors.sectionName && (
              <p className="text-sm text-red-500">{errors.sectionName}</p>
            )}
          </div>

          {/* Field list */}
          <div className="space-y-3">
            <Label className="text-slate-700 font-medium">Fields</Label>

            {fields.length === 0 && !editingFieldIndex && editingFieldIndex !== 0 && (
              <div className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg p-6 text-center">
                No fields added yet. Click "Add Field" to get started.
              </div>
            )}

            {errors.fields && fields.length === 0 && (
              <p className="text-sm text-red-500">{errors.fields}</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id || index}>
                {editingFieldIndex === index ? (
                  /* --- Inline field editor --- */
                  <div className="border-2 border-teal-300 bg-teal-50/50 rounded-lg p-4 space-y-4">
                    {/* Field type */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-700 text-sm">Field Type</Label>
                      <Select
                        value={editingField.type}
                        onValueChange={(val) => setEditingField((prev) => ({ ...prev, type: val }))}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((ft) => (
                            <SelectItem key={ft.value} value={ft.value}>
                              {ft.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Field label */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-700 text-sm">
                        Label <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={editingField.label}
                        onChange={(e) => setEditingField((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Field label"
                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>

                    {/* Placeholder (text / textarea only) */}
                    {TYPES_WITH_PLACEHOLDER.includes(editingField.type) && (
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-sm">Placeholder</Label>
                        <Input
                          value={editingField.placeholder || ''}
                          onChange={(e) => setEditingField((prev) => ({ ...prev, placeholder: e.target.value }))}
                          placeholder="Placeholder text (optional)"
                          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                    )}

                    {/* Required toggle */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`req-${index}`}
                        checked={editingField.required}
                        onCheckedChange={(checked) =>
                          setEditingField((prev) => ({ ...prev, required: !!checked }))
                        }
                        className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                      />
                      <Label htmlFor={`req-${index}`} className="text-slate-700 text-sm cursor-pointer">
                        Required field
                      </Label>
                    </div>

                    {/* Options list (select, checkbox_group, radio) */}
                    {TYPES_WITH_OPTIONS.includes(editingField.type) && (
                      <div className="space-y-2">
                        <Label className="text-slate-700 text-sm">Options</Label>
                        {(editingField.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => handleChangeOption(optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="border-slate-300 focus:border-teal-500 focus:ring-teal-500 flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOption(optIdx)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                          className="text-teal-600 border-teal-300 hover:bg-teal-50"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    )}

                    {/* Field editor actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-teal-200">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveField}
                        disabled={!editingField.label.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Done
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelFieldEdit}
                        className="text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* --- Field display card --- */
                  <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white hover:border-slate-300 transition-colors group">
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    <Badge className={`${getTypeBadgeColor(field.type)} text-xs shrink-0`}>
                      {getTypeLabel(field.type)}
                    </Badge>
                    <span className="text-sm text-slate-800 font-medium truncate flex-1">
                      {field.label || <span className="italic text-slate-400">Untitled field</span>}
                    </span>
                    {field.required && (
                      <span className="text-xs text-red-500 font-medium shrink-0">Required</span>
                    )}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditField(index)}
                        className="h-7 w-7 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteField(index)}
                        className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add field button */}
            {editingFieldIndex === null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddField}
                className="w-full border-dashed border-slate-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-slate-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={editingFieldIndex !== null}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Save Changes' : 'Add Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
