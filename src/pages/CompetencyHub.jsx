import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import {
  ClipboardCheck, Plus, Search, ChevronRight, CheckCircle2,
  Clock, BookOpen, User, Award, Users, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CompetencyAssessmentView from '@/components/competencies/CompetencyAssessmentView';

function StatusBadge({ status }) {
  if (status === 'completed')       return <Badge className="bg-emerald-100 text-emerald-800 border-0">Completed</Badge>;
  if (status === 'awaiting_signoff') return <Badge className="bg-amber-100 text-amber-800 border-0">Awaiting Sign-Off</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-0">In Progress</Badge>;
}

function calcProgress(assessment, framework) {
  if (!framework) return 0;
  const sections = framework.sections || [];
  let total = 0, done = 0;
  sections.forEach((s, si) => {
    s.items.forEach((_, ii) => {
      total++;
      const val = assessment.responses?.sections?.[si]?.items?.[ii];
      const status = typeof val === 'string' ? val : val?.status;
      if (status === 'met') done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default function CompetencyHub() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const [newAssessment, setNewAssessment] = useState({ framework_id: '', staff_id: '', mentor_id: '' });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['competencyFrameworks'],
    queryFn: async () => {
      const { data } = await supabase.from('competency_frameworks').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staffProfiles'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId();
      if (!orgId) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, staff_full_name, full_name, role')
        .eq('organization_id', orgId)
        .order('staff_full_name');
      return data || [];
    },
  });

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['competencyAssessments'],
    queryFn: async () => {
      const orgId = await getCurrentOrgId();
      if (!orgId) return [];
      const { data } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const frameworkMap = Object.fromEntries(frameworks.map(f => [f.id, f]));
  const staffName = (p) => p.staff_full_name || p.full_name || 'Unknown';
  const adminStaff = staffList.filter(p => ['admin', 'super_admin', 'manager'].includes(p.role));

  const startMutation = useMutation({
    mutationFn: async () => {
      const orgId = await getCurrentOrgId();
      const staff = staffList.find(p => p.id === newAssessment.staff_id);
      const mentor = staffList.find(p => p.id === newAssessment.mentor_id);
      const { error } = await supabase.from('competency_assessments').insert({
        organization_id: orgId,
        framework_id: newAssessment.framework_id,
        staff_id: newAssessment.staff_id,
        staff_name: staffName(staff || {}),
        mentor_id: newAssessment.mentor_id,
        mentor_name: staffName(mentor || {}),
        status: 'in_progress',
        responses: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competencyAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['myCompetencyAssessments'] });
      setShowStartDialog(false);
      setNewAssessment({ framework_id: '', staff_id: '', mentor_id: '' });
      toast.success('Assessment started.');
    },
    onError: (e) => toast.error('Failed to start: ' + e.message),
  });

  const filtered = assessments.filter(a => {
    const matchSearch =
      !search ||
      a.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.mentor_name?.toLowerCase().includes(search.toLowerCase()) ||
      frameworkMap[a.framework_id]?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const viewing = assessments.find(a => a.id === viewingId);
  const viewingFramework = viewing ? frameworkMap[viewing.framework_id] : null;

  if (viewingId && viewing && viewingFramework) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <CompetencyAssessmentView
          assessment={viewing}
          framework={viewingFramework}
          onBack={() => setViewingId(null)}
          readOnly={false}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <PageHeader
        title="Competency Hub"
        subtitle="Manage probationary assessments and skills competency sign-offs"
        icon={<ClipboardCheck className="w-6 h-6 text-violet-600" />}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: assessments.length, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'In Progress', value: assessments.filter(a => a.status === 'in_progress').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Awaiting Sign-Off', value: assessments.filter(a => a.status === 'awaiting_signoff').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: assessments.filter(a => a.status === 'completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <Card key={s.label} className={`p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search staff, mentor or framework…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="awaiting_signoff">Awaiting Sign-Off</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
          onClick={() => setShowStartDialog(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Start Assessment
        </Button>
      </div>

      {/* Assessment list */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No assessments yet</p>
          <p className="text-sm text-slate-400 mt-1">Start one by clicking "Start Assessment" above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const fw = frameworkMap[a.framework_id];
            const pct = calcProgress(a, fw);
            return (
              <Card key={a.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setViewingId(a.id)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{fw?.title || 'Assessment'}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.staff_name}</span>
                          <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Mentor: {a.mentor_name}</span>
                          <span>{format(new Date(a.created_at), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status} />
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{pct}% met</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Start Assessment dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-violet-600" /> Start Competency Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm">Framework / Competency Checklist</Label>
              <Select value={newAssessment.framework_id}
                onValueChange={v => setNewAssessment(p => ({ ...p, framework_id: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a framework…" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <div>
                        <div className="font-medium text-sm">{f.title}</div>
                        {f.region && <div className="text-xs text-slate-400">{f.region} · {f.category}</div>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Staff Member (being assessed)</Label>
              <Select value={newAssessment.staff_id}
                onValueChange={v => setNewAssessment(p => ({ ...p, staff_id: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select staff member…" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{staffName(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Mentor / Assessor</Label>
              <Select value={newAssessment.mentor_id}
                onValueChange={v => setNewAssessment(p => ({ ...p, mentor_id: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select mentor…" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{staffName(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400 mt-1">Any admin or manager can act as mentor/assessor.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowStartDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={!newAssessment.framework_id || !newAssessment.staff_id || !newAssessment.mentor_id || startMutation.isPending}
                onClick={() => startMutation.mutate()}>
                {startMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…</> : 'Start Assessment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
