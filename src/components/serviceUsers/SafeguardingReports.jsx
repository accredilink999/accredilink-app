import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import DraftRecoveryPrompt from '@/components/ui/DraftRecoveryPrompt';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import StatusBadge from '@/components/ui/StatusBadge';
import BodyMap from '@/components/careLogs/BodyMap';
import {
  Shield,
  Plus,
  AlertTriangle,
  Calendar,
  Eye,
  Clock,
} from 'lucide-react';

const abuseTypeLabels = {
  physical: 'Physical',
  emotional: 'Emotional / Psychological',
  financial: 'Financial',
  neglect: 'Neglect',
  sexual: 'Sexual',
  institutional: 'Institutional',
  self_neglect: 'Self-Neglect',
  other: 'Other',
};

const abuseTypeColors = {
  physical: 'bg-red-100 text-red-700',
  emotional: 'bg-purple-100 text-purple-700',
  financial: 'bg-amber-100 text-amber-700',
  neglect: 'bg-orange-100 text-orange-700',
  sexual: 'bg-red-100 text-red-700',
  institutional: 'bg-slate-100 text-slate-700',
  self_neglect: 'bg-blue-100 text-blue-700',
  other: 'bg-slate-100 text-slate-700',
};

const riskLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const riskColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const initialFormData = {
  incident_date: '',
  incident_time: '',
  abuse_type: '',
  description: '',
  evidence: '',
  injuries: '',
  body_map_markers: [],
  _show_body_map: false,
  person_safe: null,
  immediate_actions: '',
  family_notified: false,
  gp_notified: false,
  social_services_notified: false,
  police_notified: false,
  local_authority_referral_date: '',
  alleged_perpetrator: '',
  risk_of_repeat: '',
  follow_up_actions: '',
};

export default function SafeguardingReports({ serviceUser }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('form');

  const draftKey = `draft:safeguarding:${serviceUser?.id}`;
  const { formData, setFormData, hasDraft, restoreDraft, discardDraft, clearDraft } =
    useFormPersistence(draftKey, {
      ...initialFormData,
      incident_date: format(new Date(), 'yyyy-MM-dd'),
      incident_time: format(new Date(), 'HH:mm'),
    });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['safeguardingReports', serviceUser?.id],
    queryFn: () =>
      base44.entities.SafeguardingReport.filter(
        { service_user_id: serviceUser.id },
        '-incident_date'
      ),
    enabled: !!serviceUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SafeguardingReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safeguardingReports', serviceUser?.id] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SafeguardingReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safeguardingReports', serviceUser?.id] });
      setIsDialogOpen(false);
      setSelectedReport(null);
    },
  });

  const resetForm = () => {
    clearDraft();
    setFormData({
      ...initialFormData,
      incident_date: format(new Date(), 'yyyy-MM-dd'),
      incident_time: format(new Date(), 'HH:mm'),
    });
  };

  const handleAddNew = () => {
    setSelectedReport(null);
    resetForm();
    setViewMode('form');
    setIsDialogOpen(true);
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setViewMode('view');
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const { _show_body_map, body_map_markers, ...rest } = formData;

    const submitData = {
      ...rest,
      service_user_id: serviceUser.id,
      service_user_name: serviceUser.full_name,
      reported_by: user?.id,
      reported_by_name: user?.full_name,
      status: 'open',
    };

    if (body_map_markers && body_map_markers.length > 0) {
      submitData.body_map_markers = body_map_markers;
    }

    createMutation.mutate(submitData);
  };

  const handleStatusChange = (status) => {
    if (selectedReport) {
      updateMutation.mutate({
        id: selectedReport.id,
        data: { status },
      });
    }
  };

  if (!serviceUser) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Safeguarding Reports</h3>
          {reports.length > 0 && (
            <Badge className="bg-purple-100 text-purple-700">{reports.length}</Badge>
          )}
        </div>
        <Button onClick={handleAddNew} size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-3 h-3 mr-1" />
          New Report
        </Button>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 h-20 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No safeguarding reports</p>
          <p className="text-sm text-slate-400 mt-1">
            Click "New Report" to create a safeguarding report for this client
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="p-3 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-400"
              onClick={() => handleView(report)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {report.abuse_type && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${abuseTypeColors[report.abuse_type]}`}>
                        {abuseTypeLabels[report.abuse_type]}
                      </span>
                    )}
                    {report.risk_of_repeat && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[report.risk_of_repeat]}`}>
                        Risk: {riskLabels[report.risk_of_repeat]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.incident_date}
                    </span>
                    {report.reported_by_name && <span>By: {report.reported_by_name}</span>}
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <DraftRecoveryPrompt
        open={isDialogOpen && viewMode === 'form' && hasDraft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
      />

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'view' ? 'Safeguarding Report' : 'New Safeguarding Report'}
            </DialogTitle>
          </DialogHeader>

          {viewMode === 'view' && selectedReport ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={selectedReport.status} />
                {selectedReport.abuse_type && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${abuseTypeColors[selectedReport.abuse_type]}`}>
                    {abuseTypeLabels[selectedReport.abuse_type]}
                  </span>
                )}
                {selectedReport.risk_of_repeat && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColors[selectedReport.risk_of_repeat]}`}>
                    Risk: {riskLabels[selectedReport.risk_of_repeat]}
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500 text-xs">Date & Time</Label>
                  <p className="font-medium text-sm">
                    {selectedReport.incident_date}
                    {selectedReport.incident_time && ` at ${selectedReport.incident_time}`}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500 text-xs">Reported By</Label>
                  <p className="font-medium text-sm">{selectedReport.reported_by_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500 text-xs">Person Currently Safe?</Label>
                  <p className="font-medium text-sm">
                    {selectedReport.person_safe === true ? 'Yes' : selectedReport.person_safe === false ? 'No' : 'Unknown'}
                  </p>
                </div>
                {selectedReport.local_authority_referral_date && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <Label className="text-slate-500 text-xs">LA Referral Date</Label>
                    <p className="font-medium text-sm">{selectedReport.local_authority_referral_date}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-slate-500 text-xs">Description</Label>
                <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {selectedReport.evidence && (
                <div>
                  <Label className="text-slate-500 text-xs">Evidence / Supporting Information</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.evidence}</p>
                </div>
              )}

              {selectedReport.injuries && (
                <div>
                  <Label className="text-slate-500 text-xs">Injuries</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.injuries}</p>
                </div>
              )}

              {selectedReport.body_map_markers && selectedReport.body_map_markers.length > 0 && (
                <div>
                  <Label className="text-slate-500 text-xs">Body Map</Label>
                  <div className="mt-2">
                    <BodyMap markers={selectedReport.body_map_markers} readOnly />
                  </div>
                </div>
              )}

              {selectedReport.immediate_actions && (
                <div>
                  <Label className="text-slate-500 text-xs">Immediate Actions Taken</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.immediate_actions}</p>
                </div>
              )}

              {selectedReport.alleged_perpetrator && (
                <div>
                  <Label className="text-slate-500 text-xs">Alleged Perpetrator</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.alleged_perpetrator}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedReport.family_notified && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">Family notified</span>
                )}
                {selectedReport.gp_notified && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">GP notified</span>
                )}
                {selectedReport.social_services_notified && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">Social Services notified</span>
                )}
                {selectedReport.police_notified && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">Police notified</span>
                )}
              </div>

              {selectedReport.follow_up_actions && (
                <div>
                  <Label className="text-slate-500 text-xs">Follow-up Actions</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.follow_up_actions}</p>
                </div>
              )}

              {selectedReport.outcome && (
                <div>
                  <Label className="text-slate-500 text-xs">Outcome</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedReport.outcome}</p>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                {selectedReport.status === 'open' && (
                  <Button onClick={() => handleStatusChange('investigating')} variant="outline">
                    Mark as Investigating
                  </Button>
                )}
                {selectedReport.status === 'investigating' && (
                  <Button onClick={() => handleStatusChange('referred')} className="bg-blue-600 hover:bg-blue-700">
                    Mark as Referred
                  </Button>
                )}
                {selectedReport.status === 'referred' && (
                  <Button onClick={() => handleStatusChange('closed')} className="bg-emerald-600 hover:bg-emerald-700">
                    Mark as Closed
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-700">
                  <strong>Safeguarding Report</strong> for {serviceUser.full_name}. Complete all required fields marked with *.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Incident Date *</Label>
                  <Input
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Incident Time</Label>
                  <Input
                    type="time"
                    value={formData.incident_time}
                    onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Type of Abuse / Concern *</Label>
                  <Select
                    value={formData.abuse_type}
                    onValueChange={(v) => setFormData({ ...formData, abuse_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(abuseTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Risk of Repeat *</Label>
                  <Select
                    value={formData.risk_of_repeat}
                    onValueChange={(v) => setFormData({ ...formData, risk_of_repeat: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description of Concern *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the safeguarding concern..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label>Evidence / Supporting Information</Label>
                <Textarea
                  value={formData.evidence}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  placeholder="Any evidence, witness accounts, or supporting information..."
                />
              </div>

              <div>
                <Label>Injuries Sustained</Label>
                <Textarea
                  value={formData.injuries}
                  onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                  placeholder="Description of any injuries..."
                />
              </div>

              {/* Body Map */}
              <div className="space-y-3">
                <Label>Add a body map?</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, _show_body_map: true })}
                    className={formData._show_body_map === true ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, _show_body_map: false, body_map_markers: [] })}
                    className={formData._show_body_map === false ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                  >
                    No
                  </Button>
                </div>
                {formData._show_body_map && (
                  <BodyMap
                    markers={formData.body_map_markers || []}
                    onChange={(markers) => setFormData({ ...formData, body_map_markers: markers })}
                  />
                )}
              </div>

              <div>
                <Label>Is the person currently safe? *</Label>
                <div className="flex gap-3 mt-1">
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, person_safe: true })}
                    className={formData.person_safe === true ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, person_safe: false })}
                    className={formData.person_safe === false ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                  >
                    No
                  </Button>
                </div>
              </div>

              <div>
                <Label>Immediate Actions Taken *</Label>
                <Textarea
                  value={formData.immediate_actions}
                  onChange={(e) => setFormData({ ...formData, immediate_actions: e.target.value })}
                  placeholder="What immediate steps were taken to safeguard the individual..."
                />
              </div>

              <div>
                <Label>Alleged Perpetrator (if known)</Label>
                <Textarea
                  value={formData.alleged_perpetrator}
                  onChange={(e) => setFormData({ ...formData, alleged_perpetrator: e.target.value })}
                  placeholder="Name, relationship, current whereabouts if known..."
                />
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                <Label className="font-semibold">Who has been notified?</Label>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.family_notified}
                    onCheckedChange={(checked) => setFormData({ ...formData, family_notified: checked })}
                  />
                  <Label>Family / Next of Kin</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.gp_notified}
                    onCheckedChange={(checked) => setFormData({ ...formData, gp_notified: checked })}
                  />
                  <Label>GP</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.social_services_notified}
                    onCheckedChange={(checked) => setFormData({ ...formData, social_services_notified: checked })}
                  />
                  <Label>Social Services / Local Authority</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.police_notified}
                    onCheckedChange={(checked) => setFormData({ ...formData, police_notified: checked })}
                  />
                  <Label>Police</Label>
                </div>
              </div>

              <div>
                <Label>Local Authority Referral Date</Label>
                <Input
                  type="date"
                  value={formData.local_authority_referral_date}
                  onChange={(e) => setFormData({ ...formData, local_authority_referral_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Follow-up Actions</Label>
                <Textarea
                  value={formData.follow_up_actions}
                  onChange={(e) => setFormData({ ...formData, follow_up_actions: e.target.value })}
                  placeholder="Planned follow-up actions, investigation steps, review dates..."
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.description ||
                    !formData.abuse_type ||
                    !formData.incident_date ||
                    formData.person_safe === null ||
                    createMutation.isPending
                  }
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Report'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
