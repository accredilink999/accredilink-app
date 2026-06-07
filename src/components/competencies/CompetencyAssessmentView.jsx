import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft, ChevronRight, Save, CheckCircle2, Clock, BookOpen,
  User, Users, CalendarDays, Award, Download, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SECTION_ICONS = ['🏅','👤','💬','🛡️','⚠️','💊','🛁','🥗','🏋️','🧴','📝','💚','🧠','📚'];

// Item status: null | 'met' | 'deferred' | 'development'
// Items are stored as { status, signed_by, signed_at, observation_date }
// Legacy string values ('met' etc.) are handled gracefully.
const STATUS_OPTIONS = [
  { value: 'met',         label: 'Competency Met',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, active: 'bg-emerald-100 border-emerald-400 text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'deferred',    label: 'Deferred',          icon: <Clock className="w-3.5 h-3.5" />,        active: 'bg-amber-100 border-amber-400 text-amber-800',   dot: 'bg-amber-500'   },
  { value: 'development', label: 'Development Plan',  icon: <BookOpen className="w-3.5 h-3.5" />,    active: 'bg-blue-100 border-blue-400 text-blue-800',      dot: 'bg-blue-500'    },
];

// Safely read the status string from either legacy string or new object format
function getItemStatus(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : val?.status || null;
}

// Read attribution metadata (returns {} for legacy strings)
function getItemMeta(val) {
  if (!val || typeof val === 'string') return {};
  return {
    signed_by: val.signed_by,
    signed_at: val.signed_at,
    observation_date: val.observation_date,
  };
}

function ItemStatusPicker({ value, onChange, readOnly }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUS_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value}
            disabled={readOnly}
            onClick={() => onChange(active ? null : opt.value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
              active ? opt.active + ' border' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
            {opt.icon} {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function calcProgress(responses, framework) {
  const sections = framework?.sections || [];
  let total = 0, done = 0;
  sections.forEach((s, si) => {
    s.items.forEach((_, ii) => {
      total++;
      if (getItemStatus(responses?.sections?.[si]?.items?.[ii]) === 'met') done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default function CompetencyAssessmentView({ assessment, framework, onBack, readOnly = false }) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');
  const [responses, setResponses] = useState(assessment.responses || {});
  const [dirty, setDirty] = useState(false);
  const [certGenerating, setCertGenerating] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const sections     = framework?.sections || [];
  const obsAreas     = framework?.observation_areas || [];
  const finalItems   = framework?.final_review_items || [];
  const pct          = calcProgress(responses, framework);

  const currentUserName = currentUser?.staff_full_name || currentUser?.full_name || assessment.mentor_name;

  const setItemStatus = useCallback((si, ii, statusVal) => {
    if (readOnly) return;
    setResponses(prev => {
      const existing = prev?.sections?.[si]?.items?.[ii];
      const existingMeta = (existing && typeof existing === 'object') ? existing : {};
      return {
        ...prev,
        sections: {
          ...prev?.sections,
          [si]: {
            ...prev?.sections?.[si],
            items: {
              ...(prev?.sections?.[si]?.items || {}),
              [ii]: statusVal ? {
                status: statusVal,
                // Preserve existing attribution if user is just changing the status
                signed_by: existingMeta.signed_by || currentUserName,
                signed_at: existingMeta.signed_at || new Date().toISOString(),
                observation_date: existingMeta.observation_date || new Date().toISOString().split('T')[0],
              } : null,
            }
          }
        }
      };
    });
    setDirty(true);
  }, [readOnly, currentUserName]);

  const setItemObservationDate = useCallback((si, ii, date) => {
    if (readOnly) return;
    setResponses(prev => {
      const existing = prev?.sections?.[si]?.items?.[ii];
      if (!existing) return prev;
      const base = typeof existing === 'string'
        ? { status: existing, signed_by: currentUserName, signed_at: new Date().toISOString() }
        : existing;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [si]: {
            ...prev.sections?.[si],
            items: { ...prev.sections?.[si]?.items, [ii]: { ...base, observation_date: date } }
          }
        }
      };
    });
    setDirty(true);
  }, [readOnly, currentUserName]);

  const setSectionNote = useCallback((si, note) => {
    if (readOnly) return;
    setResponses(prev => ({
      ...prev,
      sections: { ...prev?.sections, [si]: { ...prev?.sections?.[si], notes: note } }
    }));
    setDirty(true);
  }, [readOnly]);

  const setObservation = useCallback((ai, field, value) => {
    if (readOnly) return;
    setResponses(prev => ({
      ...prev,
      observations: { ...prev?.observations, [ai]: { ...(prev?.observations?.[ai] || {}), [field]: value } }
    }));
    setDirty(true);
  }, [readOnly]);

  const setFinalItem = useCallback((ii, value) => {
    if (readOnly) return;
    setResponses(prev => ({
      ...prev,
      final_review: { ...prev?.final_review, items: { ...(prev?.final_review?.items || {}), [ii]: value } }
    }));
    setDirty(true);
  }, [readOnly]);

  const setFinalField = useCallback((field, value) => {
    if (readOnly) return;
    setResponses(prev => ({ ...prev, final_review: { ...prev?.final_review, [field]: value } }));
    setDirty(true);
  }, [readOnly]);

  const saveMutation = useMutation({
    mutationFn: async ({ newStatus, snapshot }) => {
      const { error } = await supabase
        .from('competency_assessments')
        .update({ responses: snapshot, status: newStatus || assessment.status, updated_at: new Date().toISOString() })
        .eq('id', assessment.id);
      if (error) throw error;
    },
    onSuccess: async (_, { snapshot }) => {
      queryClient.invalidateQueries({ queryKey: ['competencyAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['myCompetencyAssessments'] });
      setDirty(false);
      toast.success('Progress saved.');

      // Check for sections that just became fully met without a certificate
      const secs = framework?.sections || [];
      const newlyComplete = secs
        .map((sec, si) => {
          if (snapshot?.sections?.[si]?.certificate_url) return null;
          const items = snapshot?.sections?.[si]?.items || {};
          const allMet = sec.items.length > 0 && sec.items.every((_, ii) => getItemStatus(items[ii]) === 'met');
          return allMet ? si : null;
        })
        .filter(si => si !== null);

      if (newlyComplete.length > 0) {
        setCertGenerating(true);
        try {
          const results = await Promise.all(
            newlyComplete.map(si =>
              base44.functions.invoke('generateCompetencyCertificate', {
                assessmentId: assessment.id,
                sectionIndex: si,
              }).then(res => ({ si, url: res?.certificate_url })).catch(() => ({ si, url: null }))
            )
          );
          const valid = results.filter(r => r.url);
          if (valid.length > 0) {
            setResponses(prev => {
              const updated = { ...prev, sections: { ...(prev?.sections || {}) } };
              valid.forEach(({ si, url }) => {
                updated.sections[si] = { ...(updated.sections[si] || {}), certificate_url: url };
              });
              return updated;
            });
            toast.success(`Certificate${valid.length > 1 ? 's' : ''} issued for completed section${valid.length > 1 ? 's' : ''}!`);
            queryClient.invalidateQueries({ queryKey: ['competencyAssessments'] });
            queryClient.invalidateQueries({ queryKey: ['myCompetencyAssessments'] });
            queryClient.invalidateQueries({ queryKey: ['staff-matrix'] });
          }
        } catch {
          // cert generation is best-effort; don't block the user
        } finally {
          setCertGenerating(false);
        }
      }
    },
    onError: () => toast.error('Failed to save.'),
  });

  const signOffMutation = useMutation({
    mutationFn: async ({ field, name }) => {
      const res = await supabase.from('competency_assessments')
        .select('mentor_signature,staff_signature,staff_id,mentor_id,second_mentor_id').eq('id', assessment.id).single();
      const current = res.data || {};
      const bothSigned =
        (field === 'mentor_signature' && current.staff_signature) ||
        (field === 'staff_signature'  && current.mentor_signature);
      const { error } = await supabase.from('competency_assessments').update({
        [field]: name,
        [`${field === 'mentor_signature' ? 'mentor_signed_at' : 'staff_signed_at'}`]: new Date().toISOString(),
        status: bothSigned ? 'completed' : 'awaiting_signoff',
        ...(bothSigned ? { completed_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', assessment.id);
      if (error) throw error;
      return { bothSigned, staffId: current.staff_id, mentorId: current.mentor_id, secondMentorId: current.second_mentor_id };
    },
    onSuccess: ({ bothSigned, staffId, mentorId, secondMentorId }) => {
      queryClient.invalidateQueries({ queryKey: ['competencyAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['myCompetencyAssessments'] });
      if (bothSigned) {
        toast.success('Assessment completed and signed off!');
        base44.functions.invoke('createNotification', {
          recipient_ids: [staffId, mentorId, secondMentorId].filter(Boolean),
          type: 'competency_completed',
          title: '✅ Competency Assessment Completed',
          message: `${assessment.staff_name}'s "${framework?.title}" has been fully signed off.`,
          action_url: '/Competencies',
          send_push: true,
        }).catch(() => {});
      } else {
        toast.success('Signed successfully — awaiting countersignature.');
      }
    },
  });

  const navSections = [
    { key: 'overview', label: 'Overview', icon: '📋' },
    ...sections.map((s, i) => ({ key: `section-${i}`, label: s.title, icon: SECTION_ICONS[i] || '📌' })),
    { key: 'observations', label: 'Practical Observations', icon: '👁️' },
    { key: 'final', label: 'Final Review & Sign-Off', icon: '✍️' },
  ];

  const currentIdx = navSections.findIndex(n => n.key === activeSection);

  const sectionSummary = (si) => {
    const sec = sections[si];
    if (!sec) return { met: 0, deferred: 0, development: 0, total: sec?.items?.length || 0 };
    const items = responses?.sections?.[si]?.items || {};
    return {
      total: sec.items.length,
      met:         sec.items.filter((_, ii) => getItemStatus(items[ii]) === 'met').length,
      deferred:    sec.items.filter((_, ii) => getItemStatus(items[ii]) === 'deferred').length,
      development: sec.items.filter((_, ii) => getItemStatus(items[ii]) === 'development').length,
    };
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-600">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Header card */}
      <Card className="p-4 bg-violet-50 border-violet-200">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-violet-900">{framework?.title}</h2>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-violet-700">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Staff: <strong>{assessment.staff_name}</strong></span>
              <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Mentor: <strong>{assessment.mentor_name}</strong></span>
              {assessment.second_mentor_name && (
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 2nd Mentor: <strong>{assessment.second_mentor_name}</strong></span>
              )}
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {format(new Date(assessment.created_at), 'dd MMM yyyy')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-violet-700">{pct}%</div>
            <div className="text-xs text-violet-500">met</div>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {['met','deferred','development'].map((s, i) => {
            const colors = ['bg-emerald-400','bg-amber-400','bg-blue-400'];
            const counts = sections.reduce((acc, sec, si) => {
              const items = responses?.sections?.[si]?.items || {};
              sec.items.forEach((_, ii) => { if (getItemStatus(items[ii]) === s) acc++; });
              return acc;
            }, 0);
            const total = sections.reduce((a, sec) => a + sec.items.length, 0);
            const w = total > 0 ? (counts / total) * 100 : 0;
            return w > 0 ? <div key={i} className={`${colors[i]} h-2 rounded-full`} style={{ width: `${w}%` }} /> : null;
          })}
          <div className="bg-slate-200 h-2 rounded-full flex-1" />
        </div>
        <div className="flex gap-4 mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" /> Met</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block" /> Deferred</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full inline-block" /> Development Plan</span>
        </div>
      </Card>

      <div className="flex gap-4 flex-col lg:flex-row lg:items-start">
        {/* Nav */}
        <div className="lg:w-56 flex-shrink-0">
          <Card className="p-2">
            <div className="space-y-0.5 max-h-[65vh] overflow-y-auto">
              {navSections.map(nav => {
                const active = activeSection === nav.key;
                let bgClass = active ? 'bg-violet-100 text-violet-800 font-semibold' : 'text-slate-600 hover:bg-slate-50';
                let indicator = null;

                if (nav.key.startsWith('section-')) {
                  const si = parseInt(nav.key.replace('section-', ''));
                  const { met, total } = sectionSummary(si);
                  const anyAnswered = Object.values(responses?.sections?.[si]?.items || {}).some(v => getItemStatus(v));
                  if (met === total && total > 0) {
                    bgClass = active ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
                    indicator = <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />;
                  } else if (anyAnswered) {
                    bgClass = active ? 'bg-amber-100 text-amber-900 font-semibold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100';
                  }
                }

                return (
                  <button key={nav.key} onClick={() => setActiveSection(nav.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${bgClass}`}>
                    <span className="flex-shrink-0">{nav.icon}</span>
                    <span className="flex-1 truncate leading-tight">{nav.label}</span>
                    {indicator}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Main content */}
        <Card className="flex-1 min-w-0 p-5">
          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-lg">Assessment Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sections.map((s, si) => {
                  const { met, deferred, development, total } = sectionSummary(si);
                  return (
                    <button key={si} onClick={() => setActiveSection(`section-${si}`)}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-colors">
                      <p className="text-xs font-medium text-slate-700 truncate">{s.title}</p>
                      <div className="mt-1.5 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-emerald-400 h-full" style={{ width: `${(met/total)*100}%` }} />
                        <div className="bg-amber-400 h-full" style={{ width: `${(deferred/total)*100}%` }} />
                        <div className="bg-blue-400 h-full" style={{ width: `${(development/total)*100}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {met} met · {deferred} deferred · {development} dev plan · {total - met - deferred - development} pending
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section */}
          {activeSection.startsWith('section-') && (() => {
            const si = parseInt(activeSection.replace('section-', ''));
            const section = sections[si];
            if (!section) return null;
            const { met, total } = sectionSummary(si);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl">{SECTION_ICONS[si]}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{section.title}</h3>
                    <p className="text-xs text-slate-500">{met}/{total} competencies met</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {met === total && total > 0 && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">✓ All Met</Badge>}
                    {responses?.sections?.[si]?.certificate_url ? (
                      <a
                        href={responses.sections[si].certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-violet-300 bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download className="w-3 h-3" /> Certificate
                      </a>
                    ) : certGenerating && met === total && total > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating…
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  {section.items.map((item, ii) => {
                    const rawVal = responses?.sections?.[si]?.items?.[ii] ?? null;
                    const status = getItemStatus(rawVal);
                    const meta = getItemMeta(rawVal);
                    const opt = STATUS_OPTIONS.find(o => o.value === status);
                    return (
                      <div key={ii} className={`p-3 rounded-lg border transition-colors ${opt ? opt.active : 'bg-white border-slate-200'}`}>
                        <p className={`text-sm mb-2 ${opt ? '' : 'text-slate-700'}`}>{item}</p>
                        <ItemStatusPicker value={status} onChange={v => setItemStatus(si, ii, v)} readOnly={readOnly} />

                        {/* Attribution row — shown once an item has a status */}
                        {status && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-1 border-t border-black/5 pt-2">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="text-[10px] text-slate-500">Observed:</span>
                              {readOnly ? (
                                <span className="text-[11px] font-medium text-slate-700">{meta.observation_date || '—'}</span>
                              ) : (
                                <input
                                  type="date"
                                  className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-300"
                                  value={meta.observation_date || ''}
                                  onChange={e => setItemObservationDate(si, ii, e.target.value)}
                                />
                              )}
                            </div>
                            {meta.signed_by && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="text-[10px] text-slate-500">Signed by:</span>
                                <span className="text-[11px] font-medium text-slate-700">{meta.signed_by}</span>
                                {meta.signed_at && (
                                  <span className="text-[10px] text-slate-400">
                                    · {format(new Date(meta.signed_at), 'dd MMM yyyy, HH:mm')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!readOnly && (
                  <div>
                    <Label className="text-xs text-slate-600">Mentor Notes / Appraisal for this section</Label>
                    <Textarea className="mt-1 text-sm resize-none" rows={3}
                      placeholder="Add observations, notes, or appraisal comments…"
                      value={responses?.sections?.[si]?.notes || ''}
                      onChange={e => setSectionNote(si, e.target.value)} />
                  </div>
                )}
                {readOnly && responses?.sections?.[si]?.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm border">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Mentor Notes</p>
                    {responses.sections[si].notes}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Practical Observations */}
          {activeSection === 'observations' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Practical Observation Sign-Off</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 font-semibold text-slate-700 border border-slate-200">Competency Area</th>
                      <th className="text-center p-3 font-semibold text-emerald-700 border border-slate-200 w-24">Observed</th>
                      <th className="text-center p-3 font-semibold text-emerald-700 border border-slate-200 w-24">Competent</th>
                      <th className="text-center p-3 font-semibold text-amber-700 border border-slate-200 w-36">Further Support Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obsAreas.map((area, ai) => (
                      <tr key={ai} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800 border border-slate-200">{area}</td>
                        {['observed','competent','further_support'].map(field => (
                          <td key={field} className="text-center p-3 border border-slate-200">
                            <Checkbox
                              checked={!!responses?.observations?.[ai]?.[field]}
                              onCheckedChange={v => setObservation(ai, field, v)}
                              disabled={readOnly}
                              className={field === 'further_support'
                                ? 'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500'
                                : 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!readOnly && (
                <div>
                  <Label className="text-xs text-slate-600">Observation Notes</Label>
                  <Textarea className="mt-1 text-sm resize-none" rows={3}
                    placeholder="Overall observation notes…"
                    value={responses?.observations?.notes || ''}
                    onChange={e => setResponses(prev => ({ ...prev, observations: { ...prev?.observations, notes: e.target.value } }))} />
                </div>
              )}
            </div>
          )}

          {/* Final Review */}
          {activeSection === 'final' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-slate-900">Final Probation Review</h3>
              <div className="space-y-2">
                {finalItems.map((item, ii) => {
                  const checked = !!responses?.final_review?.items?.[ii];
                  return (
                    <label key={ii} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                    } ${readOnly ? 'cursor-default' : ''}`}>
                      <Checkbox checked={checked} onCheckedChange={v => setFinalItem(ii, v)} disabled={readOnly}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                      <span className={`text-sm ${checked ? 'text-emerald-800 font-medium' : 'text-slate-700'}`}>{item}</span>
                    </label>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <Label className="text-xs text-slate-600">Review Date</Label>
                  <Input type="date" className="mt-1 text-sm"
                    value={responses?.final_review?.review_date || ''}
                    onChange={e => setFinalField('review_date', e.target.value)}
                    disabled={readOnly} />
                </div>
              </div>

              {!readOnly && (
                <div>
                  <Label className="text-xs text-slate-600">Overall Appraisal Notes</Label>
                  <Textarea className="mt-1 text-sm resize-none" rows={4}
                    placeholder="Overall summary, additional observations, recommendations…"
                    value={responses?.final_review?.notes || ''}
                    onChange={e => setFinalField('notes', e.target.value)} />
                </div>
              )}
              {readOnly && responses?.final_review?.notes && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm border">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Appraisal Notes</p>
                  {responses.final_review.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Signatures</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Manager / Mentor Signature', field: 'mentor_signature', sigField: 'mentor_sig_draft', signed: assessment.mentor_signature, signedAt: assessment.mentor_signed_at, action: 'Sign as Manager' },
                    { label: 'Employee Signature', field: 'staff_signature', sigField: 'staff_sig_draft', signed: assessment.staff_signature, signedAt: assessment.staff_signed_at, action: 'Sign as Employee' },
                  ].map(sig => (
                    <Card key={sig.field} className="p-4 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-600 mb-2">{sig.label}</p>
                      {sig.signed ? (
                        <div>
                          <p className="font-medium text-slate-800 italic">"{sig.signed}"</p>
                          <p className="text-xs text-slate-400 mt-1">{sig.signedAt ? format(new Date(sig.signedAt), 'dd MMM yyyy HH:mm') : ''}</p>
                        </div>
                      ) : !readOnly ? (
                        <div className="space-y-2">
                          <Input placeholder="Type full name to sign" className="text-sm"
                            value={responses?.final_review?.[sig.sigField] || ''}
                            onChange={e => setFinalField(sig.sigField, e.target.value)} />
                          <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-xs"
                            disabled={!responses?.final_review?.[sig.sigField]?.trim() || signOffMutation.isPending}
                            onClick={() => signOffMutation.mutate({ field: sig.field, name: responses.final_review[sig.sigField] })}>
                            {sig.action}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Not yet signed</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-5 mt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={currentIdx === 0}
              onClick={() => setActiveSection(navSections[currentIdx - 1].key)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="flex gap-2">
              {!readOnly && dirty && (
                <Button size="sm" variant="outline" className="border-violet-300 text-violet-700"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ newStatus: null, snapshot: responses })}>
                  <Save className="w-4 h-4 mr-1" /> Save Progress
                </Button>
              )}
              {currentIdx < navSections.length - 1 ? (
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700"
                  onClick={() => { if (dirty && !readOnly) saveMutation.mutate({ newStatus: null, snapshot: responses }); setActiveSection(navSections[currentIdx + 1].key); }}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : !readOnly && assessment.status !== 'completed' ? (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ newStatus: 'awaiting_signoff', snapshot: responses })}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Save & Submit for Sign-Off
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
