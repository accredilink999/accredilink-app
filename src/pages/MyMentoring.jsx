import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import {
  Users, ClipboardCheck, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Award, User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CompetencyAssessmentView from '@/components/competencies/CompetencyAssessmentView';

function getItemStatus(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : val?.status || null;
}

function calcProgress(assessment, framework) {
  if (!framework) return 0;
  const sections = framework.sections || [];
  const responses = assessment.responses?.sections || {};
  let total = 0, done = 0;
  sections.forEach((s, si) => {
    (s.items || []).forEach((_, ii) => {
      total++;
      if (getItemStatus(responses[si]?.items?.[ii]) === 'met') done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function StatusBadge({ status }) {
  if (status === 'completed')
    return <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">Completed</Badge>;
  if (status === 'awaiting_signoff')
    return <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">Awaiting Sign-Off</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">In Progress</Badge>;
}

function ActionBadge({ status }) {
  if (status === 'awaiting_signoff')
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Needs sign-off
      </span>
    );
  if (status === 'in_progress')
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" /> In progress
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Complete
    </span>
  );
}

export default function MyMentoring({ embedded = false }) {
  const [viewingId, setViewingId] = useState(null);
  const orgId = getCurrentOrgId();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['competency-frameworks-mentoring'],
    queryFn: async () => {
      const { data } = await supabase.from('competency_frameworks').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['my-mentoring-assessments', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('competency_assessments')
        .select('*')
        .or(`mentor_id.eq.${currentUser.id},second_mentor_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  const frameworkMap = Object.fromEntries(frameworks.map(f => [f.id, f]));
  const viewing = assessments.find(a => a.id === viewingId);
  const viewingFramework = viewing ? frameworkMap[viewing.framework_id] : null;

  if (viewingId && viewing && viewingFramework) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <PageHeader title="My Mentoring" subtitle="Managing your mentees" icon={Users} />
        )}
        <CompetencyAssessmentView
          assessment={viewing}
          framework={viewingFramework}
          onBack={() => setViewingId(null)}
          readOnly={false}
        />
      </div>
    );
  }

  const needsAction = assessments.filter(a => a.status === 'awaiting_signoff');
  const inProgress  = assessments.filter(a => a.status === 'in_progress');
  const completed   = assessments.filter(a => a.status === 'completed');

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title="My Mentoring"
          subtitle="All staff you are mentoring — sign off, review, and track progress"
          icon={Users}
        />
      )}

      {/* Summary strip */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Mentees', value: assessments.length, icon: Users, color: 'text-violet-600 bg-violet-50 border-violet-200' },
            { label: 'Needs Sign-Off', value: needsAction.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`p-3 border ${color.split(' ').slice(1).join(' ')}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 flex-shrink-0 ${color.split(' ')[0]}`} />
                <div>
                  <p className={`text-lg font-bold leading-none ${color.split(' ')[0]}`}>{value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading your mentoring assignments…</div>
      ) : assessments.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No mentoring assignments yet</p>
          <p className="text-sm text-slate-400 mt-1">
            When you are assigned as a primary or second mentor on a competency assessment, it will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Needs action first */}
          {needsAction.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Awaiting Your Sign-Off ({needsAction.length})
              </h3>
              <div className="space-y-2">
                {needsAction.map(a => (
                  <AssessmentCard key={a.id} assessment={a} framework={frameworkMap[a.framework_id]} currentUserId={currentUser?.id} onClick={() => setViewingId(a.id)} />
                ))}
              </div>
            </section>
          )}

          {inProgress.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Clock className="w-4 h-4" /> In Progress ({inProgress.length})
              </h3>
              <div className="space-y-2">
                {inProgress.map(a => (
                  <AssessmentCard key={a.id} assessment={a} framework={frameworkMap[a.framework_id]} currentUserId={currentUser?.id} onClick={() => setViewingId(a.id)} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Completed ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map(a => (
                  <AssessmentCard key={a.id} assessment={a} framework={frameworkMap[a.framework_id]} currentUserId={currentUser?.id} onClick={() => setViewingId(a.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function AssessmentCard({ assessment: a, framework: fw, currentUserId, onClick }) {
  const pct = calcProgress(a, fw);
  const isPrimary = a.mentor_id === currentUserId;

  return (
    <Card
      className="p-4 hover:shadow-sm transition-shadow cursor-pointer border-slate-200"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: `hsl(${(a.staff_name?.charCodeAt(0) || 65) * 47 % 360}, 55%, 60%)` }}
        >
          {(a.staff_name || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 text-sm">{a.staff_name}</p>
            <StatusBadge status={a.status} />
            <ActionBadge status={a.status} />
          </div>

          <p className="text-xs text-slate-500 mt-0.5 truncate">{fw?.title || 'Competency Assessment'}</p>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-1 min-w-32">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-violet-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 flex-shrink-0">{pct}% met</span>
            </div>

            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              {isPrimary
                ? <><Award className="w-3 h-3 text-violet-400" /> Primary Mentor</>
                : <><Users className="w-3 h-3 text-violet-300" /> 2nd Mentor</>
              }
            </span>

            <span className="text-[11px] text-slate-400">
              {a.completed_at
                ? `Completed ${format(new Date(a.completed_at), 'dd MMM yyyy')}`
                : `Assigned ${format(new Date(a.created_at), 'dd MMM yyyy')}`
              }
            </span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 self-center" />
      </div>
    </Card>
  );
}
