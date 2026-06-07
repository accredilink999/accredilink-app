import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ClipboardCheck, Plus, ChevronRight, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CompetencyAssessmentView from '@/components/competencies/CompetencyAssessmentView';

function statusBadge(status) {
  if (status === 'completed')
    return <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">Completed</Badge>;
  if (status === 'awaiting_signoff')
    return <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">Awaiting Sign-Off</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">In Progress</Badge>;
}

function calcProgress(assessment, framework) {
  if (!framework) return 0;
  const sections = framework.sections || [];
  const responses = assessment.responses?.sections || {};
  let total = 0, done = 0;
  sections.forEach((s, si) => {
    s.items.forEach((_, ii) => {
      total++;
      if (responses[si]?.items?.[ii] === 'met') done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default function StaffCompetencyManagement({ staffId, staffName, isAdmin }) {
  const queryClient = useQueryClient();
  const [viewingId, setViewingId] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newForm, setNewForm] = useState({
    framework_id: '',
    mentor_name: '',
    second_mentor_id: '',
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['competencyAssessments', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!staffId,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['competencyFrameworks'],
    queryFn: async () => {
      const { data } = await supabase.from('competency_frameworks').select('*').eq('is_active', true);
      return data || [];
    },
  });

  // Fetch all admin/manager staff for second mentor dropdown
  const { data: adminStaff = [] } = useQuery({
    queryKey: ['adminStaffList'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getAllStaff', {});
        const list = response.staffList || response.data?.staffList || [];
        return list.filter(s =>
          ['admin', 'super_admin', 'manager', 'supervisor'].includes(s.role) ||
          ['admin', 'super_admin', 'manager', 'supervisor'].includes(s.job_title)
        );
      } catch {
        const profiles = await base44.entities.User.list();
        return profiles
          .filter(p => ['admin', 'super_admin', 'manager', 'supervisor'].includes(p.role))
          .map(p => ({ id: p.id, name: p.staff_full_name || p.full_name || p.email, role: p.role }));
      }
    },
    enabled: !!isAdmin,
  });

  const frameworkMap = Object.fromEntries(frameworks.map(f => [f.id, f]));
  const viewing = assessments.find(a => a.id === viewingId);
  const viewingFramework = viewing ? frameworkMap[viewing.framework_id] : null;

  const secondMentorStaff = adminStaff.filter(s => s.id !== currentUser?.id);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newForm.framework_id) throw new Error('Select a framework');
      const orgId = getCurrentOrgId();
      const secondMentor = secondMentorStaff.find(s => s.id === newForm.second_mentor_id);
      const { data, error } = await supabase.from('competency_assessments').insert({
        staff_id: staffId,
        staff_name: staffName,
        framework_id: newForm.framework_id,
        mentor_id: currentUser?.id,
        mentor_name: newForm.mentor_name || currentUser?.full_name || currentUser?.staff_full_name || 'Manager',
        second_mentor_id: secondMentor?.id || null,
        second_mentor_name: secondMentor ? (secondMentor.name || secondMentor.staff_full_name || secondMentor.full_name) : null,
        organization_id: orgId,
        status: 'in_progress',
        responses: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competencyAssessments', staffId] });
      setShowNewDialog(false);
      setNewForm({ framework_id: '', mentor_name: '', second_mentor_id: '' });
      toast.success('Assessment started.');
      setViewingId(data.id);
    },
    onError: (err) => toast.error(err.message || 'Failed to create assessment.'),
  });

  const openDialog = () => {
    setNewForm({
      framework_id: frameworks[0]?.id || '',
      mentor_name: currentUser?.full_name || currentUser?.staff_full_name || '',
      second_mentor_id: '',
    });
    setShowNewDialog(true);
  };

  if (viewingId && viewing && viewingFramework) {
    return (
      <CompetencyAssessmentView
        assessment={viewing}
        framework={viewingFramework}
        onBack={() => setViewingId(null)}
        readOnly={!isAdmin}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-slate-800">Probationary &amp; Skills Competencies</h3>
        </div>
        {isAdmin && (
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs" onClick={openDialog}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Assessment
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>
      ) : assessments.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 border-dashed">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium">No competency assessments yet</p>
          {isAdmin && (
            <p className="text-xs text-slate-400 mt-1">Start an assessment using the button above.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const fw = frameworkMap[a.framework_id];
            const pct = calcProgress(a, fw);
            return (
              <Card key={a.id} className="p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setViewingId(a.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {fw?.title || 'Competency Assessment'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {a.mentor_name}
                      </span>
                      {a.second_mentor_name && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-violet-400" /> {a.second_mentor_name}
                        </span>
                      )}
                      <span>· {format(new Date(a.created_at), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{pct}% met</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {statusBadge(a.status)}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Assessment Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="w-4 h-4 text-violet-600" />
              Start Competency Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Framework</Label>
              {frameworks.length === 0 ? (
                <p className="text-xs text-slate-500 mt-1 p-3 bg-amber-50 rounded border border-amber-200">
                  No active frameworks found.
                </p>
              ) : (
                <Select value={newForm.framework_id} onValueChange={v => setNewForm(f => ({ ...f, framework_id: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a framework…" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map(fw => (
                      <SelectItem key={fw.id} value={fw.id}>{fw.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-sm">Primary Mentor / Assessor</Label>
              <Input className="mt-1 text-sm" placeholder="Your name"
                value={newForm.mentor_name}
                onChange={e => setNewForm(f => ({ ...f, mentor_name: e.target.value }))} />
            </div>

            <div>
              <Label className="text-sm">
                Second Mentor <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Select
                value={newForm.second_mentor_id}
                onValueChange={v => setNewForm(f => ({ ...f, second_mentor_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a second mentor…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {secondMentorStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || s.staff_full_name || s.full_name || s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400 mt-1">
                The second mentor will have full access to view and edit this assessment.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700"
              disabled={!newForm.framework_id || createMutation.isPending}
              onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? 'Starting…' : 'Start Assessment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
