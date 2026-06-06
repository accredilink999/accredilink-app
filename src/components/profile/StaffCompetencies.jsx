import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import CompetencyAssessmentView from '@/components/competencies/CompetencyAssessmentView';

function statusBadge(status) {
  if (status === 'completed') return <Badge className="bg-emerald-100 text-emerald-800 border-0">Completed</Badge>;
  if (status === 'awaiting_signoff') return <Badge className="bg-amber-100 text-amber-800 border-0">Awaiting Sign-Off</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-0">In Progress</Badge>;
}

function calcProgress(assessment, framework) {
  if (!framework) return 0;
  const sections = framework.sections || [];
  const responses = assessment.responses?.sections || {};
  let total = 0, done = 0;
  sections.forEach((s, si) => {
    s.items.forEach((_, ii) => {
      total++;
      if (responses[si]?.items?.[ii]) done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default function StaffCompetencies({ userId }) {
  const [viewingId, setViewingId] = useState(null);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['myCompetencyAssessments', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .eq('staff_id', userId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['competencyFrameworks'],
    queryFn: async () => {
      const { data } = await supabase.from('competency_frameworks').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const frameworkMap = Object.fromEntries(frameworks.map(f => [f.id, f]));
  const viewing = assessments.find(a => a.id === viewingId);
  const viewingFramework = viewing ? frameworkMap[viewing.framework_id] : null;

  if (viewingId && viewing && viewingFramework) {
    return (
      <CompetencyAssessmentView
        assessment={viewing}
        framework={viewingFramework}
        onBack={() => setViewingId(null)}
        readOnly
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardCheck className="w-5 h-5 text-violet-600" />
        <h3 className="font-semibold text-slate-800">Probationary &amp; Skills Competencies</h3>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>
      ) : assessments.length === 0 ? (
        <Card className="p-6 text-center text-slate-500 border-dashed">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium">Nothing completed as yet</p>
          <p className="text-xs text-slate-400 mt-1">Your mentor will start a competency assessment with you.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const fw = frameworkMap[a.framework_id];
            const pct = calcProgress(a, fw);
            return (
              <Card key={a.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {fw?.title || 'Competency Assessment'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mentor: {a.mentor_name} · Started {format(new Date(a.created_at), 'dd MMM yyyy')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {statusBadge(a.status)}
                    <Button size="sm" variant="ghost" className="text-violet-600 text-xs px-2 h-7"
                      onClick={() => setViewingId(a.id)}>
                      View <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
