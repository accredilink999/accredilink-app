import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ClipboardCheck,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Eye,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

const SUPERVISION_SECTIONS = [
  { key: 'previous_actions_review', label: '1. Review of Previous Actions', placeholder: 'Review action points from last supervision. What was agreed? What progress has been made?', types: ['formal_1to1', 'group'] },
  { key: 'workload_discussion', label: '2. Workload & Caseload Discussion', placeholder: 'Current rota, service users, any concerns about workload or scheduling', types: ['formal_1to1', 'group'] },
  { key: 'care_quality', label: '3. Quality of Care & Practice', placeholder: 'Observations on care delivery, spot-check outcomes, standards of practice', types: ['formal_1to1', 'observed_practice', 'spot_check', 'group'] },
  { key: 'safeguarding', label: '4. Safeguarding', placeholder: 'Any safeguarding concerns? Awareness of procedures and escalation routes', types: ['formal_1to1', 'group'] },
  { key: 'medication', label: '5. Medication', placeholder: 'Any medication errors or concerns? MAR chart accuracy, competency', types: ['formal_1to1', 'spot_check'] },
  { key: 'health_wellbeing', label: '6. Health & Wellbeing', placeholder: 'How is the staff member coping? Work-life balance, any health concerns affecting work', types: ['formal_1to1'] },
  { key: 'training_development', label: '7. Training & Development', placeholder: 'Mandatory training status, recent training completed, future training needs, NVQ/QCF progress', types: ['formal_1to1'] },
  { key: 'policies_compliance', label: '8. Policies & Compliance', placeholder: 'Awareness of key policies (H&S, complaints, disciplinary), PPE, uniform, ID badge', types: ['formal_1to1', 'spot_check'] },
  { key: 'communication_teamwork', label: '9. Communication & Teamwork', placeholder: 'Relationships with colleagues, office communication, service user/family feedback', types: ['formal_1to1', 'group'] },
  { key: 'incidents_complaints', label: '10. Incidents / Complaints / Compliments', placeholder: 'Any incidents, complaints or compliments since last supervision', types: ['formal_1to1', 'group'] },
  { key: 'reflective_practice', label: '11. Reflective Practice', placeholder: 'What has gone well? What could be improved? Any difficult situations encountered?', types: ['formal_1to1', 'group'] },
  { key: 'agreed_actions', label: '12. Agreed Actions & Objectives', placeholder: 'SMART objectives, specific actions with ownership and deadlines', types: ['formal_1to1', 'observed_practice', 'spot_check', 'group'] },
  { key: 'any_other_business', label: '13. Any Other Business', placeholder: 'Anything else the supervisee or supervisor wishes to raise', types: ['formal_1to1', 'observed_practice', 'spot_check', 'group'] },
  // Observed Practice specific
  { key: 'observed_task', label: 'Task Observed', placeholder: 'What care task was observed? (e.g. personal care, medication round, moving & handling)', types: ['observed_practice'] },
  { key: 'observed_competency', label: 'Competency Assessment', placeholder: 'Was the task performed correctly and safely? Any areas for improvement?', types: ['observed_practice'] },
  { key: 'observed_feedback', label: 'Feedback Given', placeholder: 'What feedback was provided to the staff member?', types: ['observed_practice'] },
  // Spot Check specific
  { key: 'spot_punctuality', label: 'Punctuality & Attendance', placeholder: 'Did the carer arrive on time? Were they in correct uniform with ID?', types: ['spot_check'] },
  { key: 'spot_care_delivery', label: 'Care Delivery Observed', placeholder: 'How was care being delivered? Did it follow the care plan?', types: ['spot_check'] },
  { key: 'spot_documentation', label: 'Documentation Check', placeholder: 'Were care logs, MAR charts and daily records completed accurately?', types: ['spot_check'] },
  { key: 'spot_client_feedback', label: 'Client / Family Feedback', placeholder: 'What did the service user or family say about the care received?', types: ['spot_check'] },
  { key: 'spot_environment', label: 'Environment Check', placeholder: 'Was the environment safe and clean? Any hazards identified?', types: ['spot_check'] },
];

const SUPERVISION_TYPES = [
  { value: 'formal_1to1', label: 'Formal 1:1' },
  { value: 'observed_practice', label: 'Observed Practice' },
  { value: 'group', label: 'Group Supervision' },
  { value: 'spot_check', label: 'Spot Check' },
];

// ── Supervision Form Dialog ──────────────────────────────────────────────────

function SupervisionForm({ staffId, staffName, staffList, user, onClose, onSubmit, isPending }) {
  const [formData, setFormData] = useState({
    staff_id: staffId || '',
    staff_name: staffName || '',
    supervisor_name: user?.full_name || '',
    supervisor_id: user?.id || '',
    supervision_date: format(new Date(), 'yyyy-MM-dd'),
    supervision_type: 'formal_1to1',
    next_supervision_date: format(addDays(new Date(), 84), 'yyyy-MM-dd'),
    supervisee_agreed: true,
    additional_comments: '',
  });

  const handleStaffChange = (staffId) => {
    const staff = staffList.find(s => s.id === staffId);
    setFormData(prev => ({
      ...prev,
      staff_id: staffId,
      staff_name: staff?.name || staff?.full_name || '',
    }));
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const canSubmit = formData.staff_id && formData.supervision_date;

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Staff Member *</Label>
          {staffId ? (
            <Input value={staffName} disabled className="mt-1 bg-slate-50" />
          ) : (
            <Select value={formData.staff_id} onValueChange={handleStaffChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name || s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium">Supervisor</Label>
          <Input
            value={formData.supervisor_name}
            onChange={(e) => handleFieldChange('supervisor_name', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Supervision Date *</Label>
          <Input
            type="date"
            value={formData.supervision_date}
            onChange={(e) => handleFieldChange('supervision_date', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Type</Label>
          <Select value={formData.supervision_type} onValueChange={(v) => handleFieldChange('supervision_type', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPERVISION_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Next Due Date</Label>
          <Input
            type="date"
            value={formData.next_supervision_date}
            onChange={(e) => handleFieldChange('next_supervision_date', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Supervision Discussion</p>
      </div>

      {/* Pre-populated agenda sections — filtered by supervision type */}
      {SUPERVISION_SECTIONS
        .filter(section => !section.types || section.types.includes(formData.supervision_type))
        .map((section, idx) => (
        <div key={section.key}>
          <Label className="text-sm font-medium text-slate-700">{idx + 1}. {section.label.replace(/^\d+\.\s*/, '')}</Label>
          <Textarea
            value={formData[section.key] || ''}
            onChange={(e) => handleFieldChange(section.key, e.target.value)}
            placeholder={section.placeholder}
            className="mt-1 min-h-[70px]"
          />
        </div>
      ))}

      {/* Sign-off */}
      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="supervisee_agreed"
            checked={formData.supervisee_agreed}
            onCheckedChange={(checked) => handleFieldChange('supervisee_agreed', checked)}
          />
          <Label htmlFor="supervisee_agreed" className="text-sm">Supervisee agrees with this record</Label>
        </div>
        <div>
          <Label className="text-sm font-medium">Additional Comments</Label>
          <Textarea
            value={formData.additional_comments}
            onChange={(e) => handleFieldChange('additional_comments', e.target.value)}
            placeholder="Any disagreements or additional notes"
            className="mt-1"
          />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isPending ? 'Saving...' : 'Save Supervision'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Supervision Record Viewer ────────────────────────────────────────────────

function SupervisionViewer({ record }) {
  const typeLabel = SUPERVISION_TYPES.find(t => t.value === record.supervision_type)?.label || record.supervision_type;

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Staff Member</span>
          <p className="font-medium">{record.staff_name}</p>
        </div>
        <div>
          <span className="text-slate-500">Supervisor</span>
          <p className="font-medium">{record.supervisor_name || 'N/A'}</p>
        </div>
        <div>
          <span className="text-slate-500">Date</span>
          <p className="font-medium">{record.supervision_date}</p>
        </div>
        <div>
          <span className="text-slate-500">Type</span>
          <p className="font-medium">{typeLabel}</p>
        </div>
      </div>

      {SUPERVISION_SECTIONS.map(section => {
        const value = record[section.key];
        if (!value) return null;
        return (
          <div key={section.key}>
            <Label className="text-sm font-semibold text-slate-700">{section.label}</Label>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap bg-slate-50 rounded p-3">{value}</p>
          </div>
        );
      })}

      {record.next_supervision_date && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <p className="text-sm text-teal-800">
            <strong>Next supervision due:</strong> {record.next_supervision_date}
          </p>
        </div>
      )}

      {record.additional_comments && (
        <div>
          <Label className="text-sm font-semibold text-slate-700">Additional Comments</Label>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap bg-slate-50 rounded p-3">{record.additional_comments}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-500">
        {record.supervisee_agreed ? (
          <Badge className="bg-green-100 text-green-700">Supervisee Agreed</Badge>
        ) : (
          <Badge className="bg-orange-100 text-orange-700">Supervisee Disagreed</Badge>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function StaffSupervisions({ staffId, isAdmin, staffName }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: supervisions = [], isLoading } = useQuery({
    queryKey: ['supervisions', staffId],
    queryFn: () => base44.entities.SupervisionRecord.filter({ staff_id: staffId }, '-supervision_date'),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staffMembers'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getAllStaff', {});
        return response.staffList || response.data?.staffList || [];
      } catch {
        const profiles = await base44.entities.User.list();
        return profiles.map(p => ({ id: p.id, name: p.staff_full_name || p.full_name || p.email }));
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupervisionRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisions', staffId] });
      queryClient.invalidateQueries({ queryKey: ['allSupervisions'] });
      setShowForm(false);
    },
  });

  // Calculate supervision number
  const nextNumber = supervisions.length + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-900">Supervision Records</h3>
          <Badge className="bg-slate-100 text-slate-600">{supervisions.length}</Badge>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Supervision
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="p-3 bg-gradient-to-r from-slate-50 to-teal-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          Staff supervisions are required every <strong>12 weeks</strong> under CIW Regulation 36 / CQC Regulation 18.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : supervisions.length === 0 ? (
        <Card className="p-6 text-center text-slate-500">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p>No supervision records yet.</p>
          {isAdmin && <p className="text-sm mt-1">Click "New Supervision" to create the first one.</p>}
        </Card>
      ) : (
        <div className="space-y-2">
          {supervisions.map((record, idx) => {
            const typeLabel = SUPERVISION_TYPES.find(t => t.value === record.supervision_type)?.label || record.supervision_type;
            const isExpanded = expandedId === record.id;
            const supervisionNum = supervisions.length - idx;

            return (
              <Card key={record.id} className="border border-slate-200">
                <div
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                      #{supervisionNum}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {record.supervision_date} — {typeLabel}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        Supervisor: {record.supervisor_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); setViewingRecord(record); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-slate-100 pt-2 space-y-2">
                    {SUPERVISION_SECTIONS.slice(0, 4).map(section => {
                      const value = record[section.key];
                      if (!value) return null;
                      return (
                        <div key={section.key}>
                          <p className="text-xs font-medium text-slate-500">{section.label}</p>
                          <p className="text-sm text-slate-700 line-clamp-2">{value}</p>
                        </div>
                      );
                    })}
                    {record.agreed_actions && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">12. Agreed Actions</p>
                        <p className="text-sm text-slate-700 line-clamp-2">{record.agreed_actions}</p>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => setViewingRecord(record)}
                    >
                      View Full Record
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Supervision Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              New Supervision — #{nextNumber}
            </DialogTitle>
          </DialogHeader>
          <SupervisionForm
            staffId={staffId}
            staffName={staffName}
            staffList={staffList}
            user={user}
            onClose={() => setShowForm(false)}
            onSubmit={(data) => createMutation.mutate({ ...data, supervision_number: nextNumber })}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              Supervision Record
            </DialogTitle>
          </DialogHeader>
          {viewingRecord && <SupervisionViewer record={viewingRecord} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
