import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from 'lucide-react';
import FormElementSidebar from './FormElementSidebar';
import FormCanvas from './FormCanvas';
import FormSettingsPanel from './FormSettingsPanel';
import FormBuilderSettings from './FormBuilderSettings';
import DevicePreview from './DevicePreview';

const ELEMENT_TYPES = [
  { id: 'company-header', label: 'Company Header', icon: '🏢' },
  { id: 'text', label: 'Text Input', icon: '📝' },
  { id: 'name', label: 'Name', icon: '👤' },
  { id: 'staffname', label: 'Staff Member Name', icon: '👨‍💼' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'phone', label: 'Phone', icon: '📱' },
  { id: 'doorcode', label: 'Door Code', icon: '🔐' },
  { id: 'number', label: 'Number', icon: '🔢' },
  { id: 'address', label: 'Address', icon: '📍' },
  { id: 'textarea', label: 'Textarea', icon: '📄' },
  { id: 'select', label: 'Dropdown', icon: '📋' },
  { id: 'radio', label: 'Radio Buttons', icon: '⭕' },
  { id: 'checkbox', label: 'Checkbox', icon: '✓' },
  { id: 'date', label: 'Date Picker', icon: '📅' },
  { id: 'file', label: 'File Upload', icon: '📎' },
  { id: 'photo', label: 'Photo', icon: '📸' },
  { id: 'nextofkin', label: 'Next of Kin', icon: '👥' },
  { id: 'section', label: 'Section Header', icon: '📌' },
];

export default function FormBuilderEditor({ form, onBack, subCabinets = [] }) {
  const [fields, setFields] = useState(JSON.parse(form.schema || '[]'));
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [formTitle, setFormTitle] = useState(form.title);
  const [formDesc, setFormDesc] = useState(form.description || '');
  const [draggedType, setDraggedType] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [selectedSubCabinet, setSelectedSubCabinet] = useState('');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Form.update(form.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });

  const handleDragStart = (e, type) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (!draggedType) return;

    const newField = {
      id: `field-${Date.now()}`,
      type: draggedType,
      label: draggedType.charAt(0).toUpperCase() + draggedType.slice(1),
      placeholder: '',
      required: false,
      options: draggedType === 'select' || draggedType === 'radio' ? ['Option 1', 'Option 2'] : [],
    };

    const newFields = [...fields];
    newFields.splice(index, 0, newField);
    setFields(newFields);
    setDraggedType(null);
    setSelectedFieldId(newField.id);
  };

  const handleUpdateField = (fieldId, updates) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleDeleteField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
    setSelectedFieldId(null);
  };

  const handleReorderFields = (fromIndex, toIndex) => {
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    setFields(newFields);
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: formTitle,
      description: formDesc,
      schema: JSON.stringify(fields),
    });
  };

  const handleDeploy = () => {
    handleSave();
    const deployData = {
      title: formTitle,
      description: formDesc,
      schema: JSON.stringify(fields),
      is_published: true,
      main_cabinet: 'Blank Deployable Forms',
      sub_cabinet: selectedSubCabinet || 'General'
    };
    updateMutation.mutate(deployData);
    setShowDeployDialog(false);
    setSelectedSubCabinet('');
    setTimeout(() => onBack(), 500);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 bg-slate-50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="text-lg font-semibold border-0 bg-transparent"
            placeholder="Form title"
          />
        </div>
        <div className="flex gap-2">
          <Button
             onClick={handleSave}
             disabled={updateMutation.isPending}
             className="bg-teal-600 hover:bg-teal-700"
           >
             <Save className="w-4 h-4 mr-2" />
             {updateMutation.isPending ? 'Saving...' : 'Save Form'}
           </Button>
          <FormBuilderSettings
            selectedFieldId={selectedFieldId}
            onDeleteField={handleDeleteField}
            onPreview={() => setShowPreview(true)}
            onDeploy={() => setShowDeployDialog(true)}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>

      {/* Sidebar */}
      <FormElementSidebar 
        elements={ELEMENT_TYPES}
        onDragStart={handleDragStart}
      />

      {/* Canvas */}
      <FormCanvas
        fields={fields}
        selectedFieldId={selectedFieldId}
        onFieldSelect={setSelectedFieldId}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDeleteField={handleDeleteField}
        onReorderFields={handleReorderFields}
        onUpdateField={handleUpdateField}
      />

      {/* Settings Panel */}
      {selectedField && (
        <FormSettingsPanel
          field={selectedField}
          allFields={fields}
          onUpdate={(updates) => handleUpdateField(selectedFieldId, updates)}
          onDelete={() => handleDeleteField(selectedFieldId)}
        />
      )}

      {/* Device Preview Modal */}
      {showPreview && (
        <DevicePreview form={{ ...form, schema: JSON.stringify(fields) }} onClose={() => setShowPreview(false)} />
      )}



      {/* Deploy Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy & File Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Main Cabinet</label>
              <div className="px-3 py-2 bg-slate-100 rounded-md text-sm text-slate-600">
                Blank Deployable Forms
              </div>
            </div>
            {subCabinets.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Sub-Cabinet (Optional)</label>
                <Select value={selectedSubCabinet} onValueChange={setSelectedSubCabinet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-cabinet or leave empty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>General (No Sub-Cabinet)</SelectItem>
                    {subCabinets.map((sub) => (
                      <SelectItem key={sub.id} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeployDialog(false)}>Cancel</Button>
            <Button onClick={handleDeploy} className="bg-amber-600 hover:bg-amber-700">
              Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      );
      }