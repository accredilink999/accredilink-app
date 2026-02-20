import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CARE_LOG_FORM_CONFIG, BUILTIN_SECTIONS } from '@/constants/careLogFormDefaults';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronUp, ChevronDown, Plus, Trash2, Pencil, Save, Loader2, Settings, Eye, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import CareLogCustomSectionEditor from './CareLogCustomSectionEditor';
import CareLogFormPreview from './CareLogFormPreview';

const BUILTIN_IDS = new Set(BUILTIN_SECTIONS.map((s) => s.id));

export default function CareLogFormBuilder({ open, onClose }) {
  const queryClient = useQueryClient();

  // ── Mode state ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState('list'); // 'list' | 'edit'
  const [editingConfig, setEditingConfig] = useState(null); // null = new, object = editing

  // ── Edit-mode fields ────────────────────────────────────────────────────
  const [configName, setConfigName] = useState('');
  const [scope, setScope] = useState('global');
  const [scopeIds, setScopeIds] = useState([]);
  const [sections, setSections] = useState([]);

  // ── Sub-dialogs ─────────────────────────────────────────────────────────
  const [customEditorOpen, setCustomEditorOpen] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // ── Client search ───────────────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState('');

  // ── Queries ─────────────────────────────────────────────────────────────

  // All form configs
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['careLogFormConfigs'],
    queryFn: () => base44.entities.CareLogFormConfig.list('-created_at'),
    enabled: open,
  });

  // Teams (for scope selector)
  const { data: teams = [] } = useQuery({
    queryKey: ['careTeams'],
    queryFn: () => base44.entities.CareTeam.list('name'),
    enabled: open,
  });

  // Service users (for client scope selector)
  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list('full_name'),
    enabled: open,
  });

  // ── Reset to list mode when dialog opens ────────────────────────────────
  useEffect(() => {
    if (open) {
      setMode('list');
      setEditingConfig(null);
    }
  }, [open]);

  // ── Filtered clients for search ─────────────────────────────────────────
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return serviceUsers;
    const q = clientSearch.toLowerCase();
    return serviceUsers.filter((su) =>
      su.full_name?.toLowerCase().includes(q)
    );
  }, [serviceUsers, clientSearch]);

  // ── Helper: get team name by ID ─────────────────────────────────────────
  const getTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.name || 'Unknown';
  };

  // ── Scope badge renderer ────────────────────────────────────────────────
  const renderScopeBadge = (config) => {
    switch (config.scope) {
      case 'team': {
        const teamName = config.scope_ids?.length
          ? getTeamName(config.scope_ids[0])
          : 'No team';
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0">
            Team: {teamName}
          </Badge>
        );
      }
      case 'clients': {
        const count = config.scope_ids?.length || 0;
        return (
          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 shrink-0">
            Clients: {count} selected
          </Badge>
        );
      }
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 shrink-0">
            Global
          </Badge>
        );
    }
  };

  // ── Mutations ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CareLogFormConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfig'] });
      toast.success('Form configuration created');
      setMode('list');
    },
    onError: (err) => {
      toast.error('Failed to create form config: ' + (err.message || 'Unknown error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CareLogFormConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfig'] });
      toast.success('Form configuration saved');
      setMode('list');
    },
    onError: (err) => {
      toast.error('Failed to save form config: ' + (err.message || 'Unknown error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CareLogFormConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['careLogFormConfig'] });
      toast.success('Form configuration deleted');
    },
    onError: (err) => {
      toast.error('Failed to delete form config: ' + (err.message || 'Unknown error'));
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── List mode actions ───────────────────────────────────────────────────

  const handleCreateNew = () => {
    setEditingConfig(null);
    setConfigName('');
    setScope('global');
    setScopeIds([]);
    setSections(DEFAULT_CARE_LOG_FORM_CONFIG.sections.map((s) => ({ ...s })));
    setClientSearch('');
    setMode('edit');
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setConfigName(config.name || '');
    setScope(config.scope || 'global');
    setScopeIds(config.scope_ids || []);
    setSections(
      config.config?.sections
        ? config.config.sections.map((s) => ({ ...s }))
        : DEFAULT_CARE_LOG_FORM_CONFIG.sections.map((s) => ({ ...s }))
    );
    setClientSearch('');
    setMode('edit');
  };

  const handleDeleteConfig = (config) => {
    if (config.is_default) return;
    if (!window.confirm(`Are you sure you want to delete "${config.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(config.id);
  };

  const handleBack = () => {
    setMode('list');
    setEditingConfig(null);
  };

  // ── Section operations (preserved from original) ────────────────────────

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

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

  // ── Save handler (edit mode) ────────────────────────────────────────────

  const handleSave = () => {
    if (!configName.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    // Reassign clean order values based on current sort
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const cleanSections = sorted.map((s, i) => ({ ...s, order: i }));
    const configPayload = { version: 1, sections: cleanSections };

    const payload = {
      name: configName.trim(),
      scope,
      scope_ids: scope === 'global' ? [] : scopeIds,
      config: configPayload,
    };

    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data: payload });
    } else {
      createMutation.mutate({ ...payload, is_default: false });
    }
  };

  const isBuiltin = (section) => BUILTIN_IDS.has(section.id) || section.type === 'builtin';

  // ── Client toggle handler ───────────────────────────────────────────────
  const handleClientToggle = (clientId) => {
    setScopeIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">

          {/* ── LIST MODE ───────────────────────────────────────────────── */}
          {mode === 'list' && (
            <>
              {/* Header */}
              <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600" />
                  <DialogTitle className="text-slate-900">Care Log Form Configs</DialogTitle>
                </div>
              </DialogHeader>

              {/* Config list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {configsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  </div>
                ) : configs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-sm">No form configurations yet.</p>
                    <p className="text-sm mt-1">Create one to get started.</p>
                  </div>
                ) : (
                  configs.map((config) => (
                    <div
                      key={config.id}
                      className="border border-slate-200 rounded-lg p-3 flex items-center gap-3 bg-white hover:border-slate-300 transition-colors"
                    >
                      {/* Name + badges */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {config.name || 'Untitled'}
                        </span>
                        {config.is_default && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0 text-xs">
                            Default
                          </Badge>
                        )}
                        {renderScopeBadge(config)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditConfig(config)}
                          className="h-8 w-8 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!config.is_default && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteConfig(config)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateNew}
                  className="w-full border-dashed border-slate-300 text-teal-600 hover:bg-teal-50 hover:border-teal-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Form
                </Button>
              </div>
            </>
          )}

          {/* ── EDIT MODE ───────────────────────────────────────────────── */}
          {mode === 'edit' && (
            <>
              {/* Header */}
              <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    className="text-slate-600 hover:text-slate-900 -ml-2 mr-1 px-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
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
                    disabled={isSaving}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </DialogHeader>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                {/* ── Form name ─────────────────────────────────────────── */}
                <div className="space-y-2">
                  <Label htmlFor="config-name" className="text-sm font-medium text-slate-700">
                    Form Name
                  </Label>
                  <Input
                    id="config-name"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g. Default, Night Shift, Mrs Jones Custom"
                    className="border-slate-300"
                  />
                </div>

                {/* ── Scope selector ────────────────────────────────────── */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Scope</Label>
                  <Select value={scope} onValueChange={(val) => { setScope(val); setScopeIds([]); }}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="clients">Specific Clients</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {scope === 'global' && 'Applies to all clients unless overridden by a more specific config.'}
                    {scope === 'team' && 'Applies to clients assigned to the selected team.'}
                    {scope === 'clients' && 'Applies only to the individually selected clients.'}
                  </p>
                </div>

                {/* ── Team selector (scope = 'team') ────────────────────── */}
                {scope === 'team' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Team</Label>
                    <Select
                      value={scopeIds[0] || ''}
                      onValueChange={(val) => setScopeIds([val])}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* ── Client checkboxes (scope = 'clients') ─────────────── */}
                {scope === 'clients' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Select Clients</Label>
                      <span className="text-xs text-teal-600 font-medium">
                        {scopeIds.length} selected
                      </span>
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search clients..."
                        className="pl-9 border-slate-300"
                      />
                    </div>
                    {/* Checkbox list */}
                    <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No clients found</p>
                      ) : (
                        filteredClients.map((su) => (
                          <label
                            key={su.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            <Checkbox
                              checked={scopeIds.includes(su.id)}
                              onCheckedChange={() => handleClientToggle(su.id)}
                              className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                            />
                            <span className="text-sm text-slate-800">
                              {su.full_name || 'Unnamed Client'}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ── Divider ───────────────────────────────────────────── */}
                <div className="border-t border-slate-200" />

                {/* ── Section list ──────────────────────────────────────── */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Sections</Label>
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
              </div>

              {/* Footer — Add Custom Section */}
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
            </>
          )}
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
