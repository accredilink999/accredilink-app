import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { usePullToRefresh } from '@/components/hooks/usePullToRefresh';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Plus, 
  Search, 
  AlertTriangle,
  Calendar,
  Clock,
  User,
  FileText,
  Eye,
  Filter
} from 'lucide-react';

const typeLabels = {
  fall: 'Fall',
  medication_error: 'Medication Error',
  injury: 'Injury',
  near_miss: 'Near Miss',
  safeguarding: 'Safeguarding',
  complaint: 'Complaint',
  equipment_failure: 'Equipment Failure',
  other: 'Other'
};

const typeColors = {
  fall: 'bg-orange-100 text-orange-700',
  medication_error: 'bg-red-100 text-red-700',
  injury: 'bg-red-100 text-red-700',
  near_miss: 'bg-amber-100 text-amber-700',
  safeguarding: 'bg-purple-100 text-purple-700',
  complaint: 'bg-blue-100 text-blue-700',
  equipment_failure: 'bg-slate-100 text-slate-700',
  other: 'bg-slate-100 text-slate-700'
};

export default function Incidents() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [viewMode, setViewMode] = useState('form');
  const [formData, setFormData] = useState({
    title: '',
    type: 'other',
    severity: 'medium',
    service_user_id: '',
    incident_date: format(new Date(), 'yyyy-MM-dd'),
    incident_time: format(new Date(), 'HH:mm'),
    location: '',
    description: '',
    immediate_action_taken: '',
    witnesses: '',
    injuries_sustained: '',
    medical_attention_required: false,
    family_notified: false,
    gp_notified: false,
    cqc_notifiable: false,
    follow_up_actions: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-incident_date', 100),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setIsDialogOpen(false);
      setSelectedIncident(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'other',
      severity: 'medium',
      service_user_id: '',
      incident_date: format(new Date(), 'yyyy-MM-dd'),
      incident_time: format(new Date(), 'HH:mm'),
      location: '',
      description: '',
      immediate_action_taken: '',
      witnesses: '',
      injuries_sustained: '',
      medical_attention_required: false,
      family_notified: false,
      gp_notified: false,
      cqc_notifiable: false,
      follow_up_actions: ''
    });
  };

  const handleAddNew = () => {
    setSelectedIncident(null);
    resetForm();
    setViewMode('form');
    setIsDialogOpen(true);
  };

  const handleView = (incident) => {
    setSelectedIncident(incident);
    setViewMode('view');
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const serviceUser = serviceUsers.find(s => s.id === formData.service_user_id);
    
    createMutation.mutate({
      ...formData,
      service_user_name: serviceUser?.full_name,
      reported_by: user?.id,
      reported_by_name: user?.full_name,
      status: 'open'
    });
  };

  const handleStatusChange = (status) => {
    if (selectedIncident) {
      updateMutation.mutate({
        id: selectedIncident.id,
        data: { status }
      });
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inc.service_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { containerRef } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
  });

  return (
    <div ref={containerRef} className="space-y-6" style={{ overscrollBehavior: 'none' }}>
      <PageHeader 
        title="Incidents" 
        subtitle="Report and track incidents and safeguarding concerns"
      >
        <Button onClick={handleAddNew} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-sm">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row">
           <div className="relative flex-1 min-w-0">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input
               placeholder="Search incidents..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 text-xs sm:text-sm py-2 sm:py-3"
             />
           </div>
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Incidents List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents found"
          description="No incidents have been reported yet."
        />
      ) : (
        <div className="space-y-2 sm:space-y-3">
           {filteredIncidents.map((incident) => (
             <Card 
               key={incident.id}
               className="p-3 sm:p-4 bg-gradient-to-r from-white to-red-50 border-red-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
               onClick={() => handleView(incident)}
             >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                 <div className="flex items-start gap-2 sm:gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    incident.severity === 'critical' ? 'bg-red-100' :
                    incident.severity === 'high' ? 'bg-orange-100' :
                    incident.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      incident.severity === 'critical' ? 'text-red-600' :
                      incident.severity === 'high' ? 'text-orange-600' :
                      incident.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[incident.type]}`}>
                        {typeLabels[incident.type]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {incident.service_user_name && `${incident.service_user_name} • `}
                      {format(new Date(incident.incident_date), 'dd MMM yyyy')} at {incident.incident_time}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{incident.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={incident.status} />
                  <StatusBadge status={incident.severity} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'view' ? selectedIncident?.title : 'Report Incident'}
            </DialogTitle>
          </DialogHeader>

          {viewMode === 'view' && selectedIncident ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <StatusBadge status={selectedIncident.status} />
                <StatusBadge status={selectedIncident.severity} />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[selectedIncident.type]}`}>
                  {typeLabels[selectedIncident.type]}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500">Date & Time</Label>
                  <p className="font-medium">{format(new Date(selectedIncident.incident_date), 'dd MMMM yyyy')} at {selectedIncident.incident_time}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500">Service User</Label>
                  <p className="font-medium">{selectedIncident.service_user_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500">Location</Label>
                  <p className="font-medium">{selectedIncident.location || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500">Reported By</Label>
                  <p className="font-medium">{selectedIncident.reported_by_name}</p>
                </div>
              </div>

              <div>
                <Label className="text-slate-500">Description</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>

              {selectedIncident.immediate_action_taken && (
                <div>
                  <Label className="text-slate-500">Immediate Action Taken</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedIncident.immediate_action_taken}</p>
                </div>
              )}

              {selectedIncident.injuries_sustained && (
                <div>
                  <Label className="text-slate-500">Injuries Sustained</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedIncident.injuries_sustained}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {selectedIncident.medical_attention_required && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">Medical attention required</span>
                )}
                {selectedIncident.family_notified && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">Family notified</span>
                )}
                {selectedIncident.gp_notified && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">GP notified</span>
                )}
                {selectedIncident.cqc_notifiable && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">CQC notifiable</span>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                {selectedIncident.status === 'open' && (
                  <Button onClick={() => handleStatusChange('investigating')} variant="outline">
                    Mark as Investigating
                  </Button>
                )}
                {selectedIncident.status === 'investigating' && (
                  <Button onClick={() => handleStatusChange('resolved')} className="bg-emerald-600 hover:bg-emerald-700">
                    Mark as Resolved
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Brief description of incident"
                  />
                </div>

                <div>
                  <Label>Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Severity</Label>
                  <Select 
                    value={formData.severity} 
                    onValueChange={(value) => setFormData({...formData, severity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Service User</Label>
                  <Select 
                    value={formData.service_user_id} 
                    onValueChange={(value) => setFormData({...formData, service_user_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceUsers.map(su => (
                        <SelectItem key={su.id} value={su.id}>{su.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.incident_time}
                    onChange={(e) => setFormData({...formData, incident_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of what happened..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label>Immediate Action Taken</Label>
                <Textarea
                  value={formData.immediate_action_taken}
                  onChange={(e) => setFormData({...formData, immediate_action_taken: e.target.value})}
                />
              </div>

              <div>
                <Label>Injuries Sustained</Label>
                <Textarea
                  value={formData.injuries_sustained}
                  onChange={(e) => setFormData({...formData, injuries_sustained: e.target.value})}
                />
              </div>

              <div>
                <Label>Witnesses</Label>
                <Input
                  value={formData.witnesses}
                  onChange={(e) => setFormData({...formData, witnesses: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.medical_attention_required}
                    onCheckedChange={(checked) => setFormData({...formData, medical_attention_required: checked})}
                  />
                  <Label>Medical attention required</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.family_notified}
                    onCheckedChange={(checked) => setFormData({...formData, family_notified: checked})}
                  />
                  <Label>Family notified</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.gp_notified}
                    onCheckedChange={(checked) => setFormData({...formData, gp_notified: checked})}
                  />
                  <Label>GP notified</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={formData.cqc_notifiable}
                    onCheckedChange={(checked) => setFormData({...formData, cqc_notifiable: checked})}
                  />
                  <Label>CQC notifiable</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.description || createMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
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