import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CARE_LOG_FORM_CONFIG, BUILTIN_SECTIONS } from '@/constants/careLogFormDefaults';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Plus, Trash2, Pencil, Save, Loader2, Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import CareLogCustomSectionEditor from './CareLogCustomSectionEditor';
import CareLogFormPreview from './CareLogFormPreview';

const BUILTIN_IDS = new Set(BUILTIN_SECTIONS.map((s) => s.id));

export default function CareLogFormBuilder({ open, onClose }) {
  const queryClient = useQueryClient();

  const [sections, setSections] = useState([]);
  const [customEditorOpen, setCustomEditorOpen] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing config from system_settings
  const { data: existingSettings } = useQuery({
    queryKey: ['careLogFormConfig'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.filter({ setting_key: 'care_log_form_config' });
      return settings[0] || null;
    },
    enabled: open,
  });

  // Initialize local sections state from loaded config or defaults
  useEffect(() => {
    if (!open) return;
    if (existingSettings?.setting_value?.sections) {
      setSections(existingSettings.setting_value.sections.map((s) => ({ ...s })));
    } else {
      setSections(DEFAULT_CARE_LOG_FORM_CONFIG.sections.map((s) => ({ ...s })));
    }
  }, [open, existingSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (config) => {
      const payload = { setting_value: config };
      if (existingSettings) {
        return base44.entities.SystemSettings.update(existingSettings.id, payload);
      } else {
        return base44.entities.SystemSettings.create({
          setting_key: 'care_log_form_config',
          setting_value: config,
          description: 'Care log form builder configuration',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfig'] });
      toast.success('Form configuration saved');
      onClose();
    },
  });

  // Sort sections by order for display
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // --- Section operations ---

  const handleToggle = (sectionId) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleMoveUp = (sectionId) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    if (index <= 0) return;

    const currentOrder = sorted[index].order;
    const prevOrder = sorted[index - 1].order;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) return { ...s, order: prevOrder };
        if (s.id === sorted[index - 1].id) return { ...s, order: currentOrder };
        return s;
      })
    );
  };

  const handleMoveDown = (sectionId) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === sectionId);
    if (index < 0 || index >= sorted.length - 1) return;

    const currentOrder = sorted[index].order;
    const nextOrder = sorted[index + 1].order;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) return { ...s, order: nextOrder };
        if (s.id === sorted[index + 1].id) return { ...s, order: currentOrder };
        return s;
      })
    );
  };

  const handleDeleteCustom = (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this custom section? This cannot be undone.')) return;
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const handleEditCustom = (section) => {
    setEditingCustomSection(section);
    setCustomEditorOpen(true);
  };

  const handleAddCustom = () => {
    setEditingCustomSection(null);
    setCustomEditorOpen(true);
  };

  const handleCustomSectionSave = (sectionData) => {
    setSections((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === sectionData.id);
      if (existingIndex >= 0) {
        // Update existing custom section
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          label: sectionData.name,
          name: sectionData.name,
          fields: sectionData.fields,
        };
        return updated;
      } else {
        // Add new custom section
        const maxOrder = prev.reduce((max, s) => Math.max(max, s.order), -1);
        return [
          ...prev,
          {
            id: sectionData.id,
            label: sectionData.name,
            name: sectionData.name,
            type: 'custom',
            enabled: true,
            order: maxOrder + 1,
            fields: sectionData.fields,
          },
        ];
      }
    });
    setCustomEditorOpen(false);
    setEditingCustomSection(null);
  };

  // --- Save handler ---

  const handleSave = () => {
    // Reassign clean order values based on current sort
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const cleanSections = sorted.map((s, i) => ({ ...s, order: i }));
    const config = { version: 1, sections: cleanSections };
    saveMutation.mutate(config);
  };

  const isBuiltin = (section) => BUILTIN_IDS.has(section.id) || section.type === 'builtin';

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-600" />
              <DialogTitle className="text-slate-900">Care Log Form Builder</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="text-slate-600"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </DialogHeader>

          {/* Section list (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {sortedSections.map((section, index) => {
              const builtin = isBuiltin(section);
              return (
                <div
                  key={section.id}
                  className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white hover:border-slate-300 transition-colors"
                >
                  {/* Toggle switch */}
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={() => handleToggle(section.id)}
                    className="data-[state=checked]:bg-teal-600 shrink-0"
                  />

                  {/* Section label + badge */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {section.label || section.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        builtin
                          ? 'bg-slate-100 text-slate-600 shrink-0'
                          : 'bg-teal-100 text-teal-700 shrink-0'
                      }
                    >
                      {builtin ? 'Built-in' : 'Custom'}
                    </Badge>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(section.id)}
                      disabled={index === 0}
                      className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(section.id)}
                      disabled={index === sortedSections.length - 1}
                      className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>

                    {!builtin && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCustom(section)}
                          className="h-8 w-8 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCustom(section.id)}
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCustom}
              className="w-full border-dashed border-slate-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Section
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom section editor dialog */}
      <CareLogCustomSectionEditor
        open={customEditorOpen}
        onClose={() => {
          setCustomEditorOpen(false);
          setEditingCustomSection(null);
        }}
        section={editingCustomSection}
        onSave={handleCustomSectionSave}
      />

      {/* Form preview dialog */}
      <CareLogFormPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sections={sortedSections}
      />
    </>
  );
}
