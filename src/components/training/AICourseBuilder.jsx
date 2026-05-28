import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Play, BookOpen, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const EXAMPLE_PROMPTS = [
  'Create a safeguarding adults course for UK care workers',
  'Build a medication administration training for care staff',
  'Make a moving and handling course — intermediate level, 90 minutes',
  'Create a mental health awareness course for community care workers',
  'Build a fire safety and evacuation training for residential care',
];

// Phase 1 — skeleton only (titles + descriptions, no content).
// Small response = reliable JSON.
const SKELETON_SCHEMA = `{"course":{"title":"string","description":"string","category":"mandatory|specialist|refresher|induction|compliance","difficulty_level":"beginner|intermediate|advanced","duration_minutes":60,"passing_score":70},"modules":[{"title":"string","description":"one sentence","order_index":0,"lessons":[{"title":"string","description":"one sentence","order_index":0}]}]}`;

// Phase 2 — content per lesson, still structured arrays to avoid multiline JSON issues.
// video_url uses real embed format from known UK channels.
const CONTENT_SCHEMA = `{"modules":[{"title":"string","lessons":[{"title":"string","overview":"3-4 sentence plain text intro — no newlines","key_points":["full sentence with real detail 1","full sentence 2","full sentence 3","full sentence 4","full sentence 5","full sentence 6","full sentence 7"],"uk_guidance":"2-3 sentences citing specific UK legislation or HSE/CQC/Skills for Care guidance — no newlines","in_practice":["concrete numbered step 1 for care staff","step 2","step 3","step 4","step 5"],"video_url":"https://www.youtube.com/embed/REAL_VIDEO_ID or null"}]}],"assessment":{"title":"string","passing_score":80,"questions":[{"question":"string","options":["option A","option B","option C","option D"],"correct_answer":"option A"}]}}`;

function buildLessonContent(lesson) {
  const parts = [];
  if (lesson.overview) parts.push(lesson.overview);
  if (lesson.key_points?.length) {
    parts.push('## Key Learning Points\n' + lesson.key_points.map(p => `- ${p}`).join('\n'));
  }
  if (lesson.uk_guidance) {
    parts.push('## UK Law & Guidance\n' + lesson.uk_guidance);
  }
  if (lesson.in_practice?.length) {
    parts.push('## In Practice\n' + lesson.in_practice.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  }
  return parts.join('\n\n');
}

export default function AICourseBuilder({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1=prompt, 2=preview, 3=complete
  const [loadingPhase, setLoadingPhase] = useState(null); // null | 'structure' | 'content'
  const [userPrompt, setUserPrompt] = useState('');
  const [error, setError] = useState(null);
  const [generatedCourse, setGeneratedCourse] = useState(null); // holds skeleton + enriched data

  // ── Save to DB ──────────────────────────────────────────────────────────────
  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      const { modules_data, ...courseFields } = courseData;
      const course = await base44.entities.Course.create(courseFields);

      if (modules_data) {
        for (const moduleData of modules_data) {
          const { lessons_data, ...moduleFields } = moduleData;
          const mod = await base44.entities.Module.create({ course_id: course.id, ...moduleFields });
          if (lessons_data) {
            for (const lessonData of lessons_data) {
              await base44.entities.Lesson.create({ course_id: course.id, module_id: mod.id, ...lessonData });
            }
          }
        }
      }
      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setStep(3);
      setGeneratedCourse(prev => ({ ...prev, savedCourse: course }));
      setTimeout(() => onSuccess?.(course), 2000);
    },
    onError: (err) => {
      setError('Failed to save course: ' + (err.message || 'Unknown error'));
    },
  });

  // ── Two-phase generation ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!userPrompt.trim()) { setError('Please describe the course you want to create.'); return; }
    setError(null);

    // ── Phase 1: skeleton ──────────────────────────────────────────────────
    setLoadingPhase('structure');
    let skeleton;
    try {
      skeleton = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a training course skeleton for UK community care staff: "${userPrompt.trim()}"
Rules: 4 modules, 3 lessons each. Infer category, difficulty_level, duration_minutes. Titles and one-sentence descriptions only — no content.
Output ONLY raw JSON: ${SKELETON_SCHEMA}`,
        systemPrompt: 'You are a JSON API. Output only raw valid JSON with no prose, explanation, or code fences.',
        response_json_schema: { type: 'object' },
        temperature: 0,
        max_tokens: 1500,
      });
    } catch (err) {
      setError('Failed to build course structure — please try again.');
      setLoadingPhase(null);
      return;
    }

    if (!skeleton?.course || !skeleton?.modules?.length) {
      setError('AI returned an incomplete structure — please try again.');
      setLoadingPhase(null);
      return;
    }

    // ── Phase 2: rich content + videos ─────────────────────────────────────
    setLoadingPhase('content');
    const structureSummary = skeleton.modules.map(m =>
      `Module: ${m.title}\n` + m.lessons.map(l => `  - Lesson: ${l.title} — ${l.description}`).join('\n')
    ).join('\n\n');

    let enriched;
    try {
      enriched = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate detailed training content for this UK care staff course:

Topic: "${userPrompt.trim()}"
Course title: ${skeleton.course.title}

EXACT STRUCTURE TO FILL (keep same module/lesson order and titles):
${structureSummary}

Requirements:
- overview: 3-4 sentence plain text (no newlines inside the string)
- key_points: 7 items, each a full informative sentence — real detail, not just a phrase
- uk_guidance: 2-3 sentences citing specific UK law/HSE/CQC/Skills for Care guidance (no newlines inside the string)
- in_practice: 5 concrete action steps for care staff (no newlines inside any string)
- video_url: for every 3rd lesson, provide a REAL YouTube embed URL (https://www.youtube.com/embed/VIDEO_ID) from a reputable UK training channel (Skills for Care, NHS England, HSE, SCIE, St John Ambulance, British Red Cross, Age UK). Set null for the other 2 in 3.
- 10 assessment questions, correct_answer must be the exact text of one of the 4 options
- All string values MUST be single-line — absolutely no \\n or newline characters inside any string value

Output ONLY raw JSON: ${CONTENT_SCHEMA}`,
        systemPrompt: 'You are a JSON API generating UK care staff training content. Output only raw valid JSON. No prose, no code fences, no newlines inside string values.',
        response_json_schema: { type: 'object' },
        temperature: 0,
        max_tokens: 8000,
      });
    } catch (err) {
      setError('Failed to generate lesson content — please try again.');
      setLoadingPhase(null);
      return;
    }

    if (!enriched?.modules?.length) {
      setError('AI returned incomplete content — please try again.');
      setLoadingPhase(null);
      return;
    }

    setLoadingPhase(null);
    setGeneratedCourse({ skeleton, enriched });
    setStep(2);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!generatedCourse) return;
    const { skeleton, enriched } = generatedCourse;

    // Merge skeleton titles with enriched content
    const modules_data = skeleton.modules.map((skelMod, mi) => {
      const enrichedMod = enriched.modules?.[mi] || {};
      return {
        title:       skelMod.title,
        description: skelMod.description,
        order_index: mi,
        lessons_data: skelMod.lessons.map((skelLesson, li) => {
          const enrichedLesson = enrichedMod.lessons?.[li] || {};
          return {
            title:        skelLesson.title,
            description:  skelLesson.description,
            content:      buildLessonContent(enrichedLesson),
            content_type: 'text',
            video_url:    enrichedLesson.video_url || null,
            order_index:  li,
          };
        }),
      };
    });

    createCourseMutation.mutate({
      title:                    skeleton.course.title,
      description:              skeleton.course.description,
      category:                 skeleton.course.category,
      difficulty_level:         skeleton.course.difficulty_level,
      duration_minutes:         skeleton.course.duration_minutes,
      passing_score:            skeleton.course.passing_score || 70,
      is_active:                true,
      assessment_title:         enriched.assessment?.title || null,
      assessment_questions:     enriched.assessment?.questions || [],
      assessment_passing_score: enriched.assessment?.passing_score || 80,
      modules_data,
    });
  };

  // ── Reset / close ───────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setUserPrompt('');
    setGeneratedCourse(null);
    setError(null);
    setLoadingPhase(null);
    onClose();
  };

  const isLoading = loadingPhase !== null;
  const { skeleton, enriched } = generatedCourse || {};
  const totalLessons  = skeleton?.modules?.reduce((s, m) => s + m.lessons.length, 0) || 0;
  const videoLessons  = enriched?.modules?.reduce((s, m) => s + (m.lessons?.filter(l => l.video_url).length || 0), 0) || 0;
  const questionCount = enriched?.assessment?.questions?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Course Builder
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: prompt ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {!isLoading && (
              <>
                <p className="text-sm text-slate-600">
                  Describe the course you want — the AI builds the full structure, rich lesson content, embedded videos, and assessment in two steps.
                </p>
                <Textarea
                  rows={4}
                  placeholder="e.g. Health and safety in the workplace for UK care staff, covering risk assessments, COSHH, manual handling, and reporting"
                  value={userPrompt}
                  onChange={e => { setUserPrompt(e.target.value); setError(null); }}
                  className="text-sm resize-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && userPrompt.trim()) handleGenerate();
                  }}
                />
                <div>
                  <p className="text-xs text-slate-400 mb-2">Examples — click to use:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLE_PROMPTS.map(ex => (
                      <button
                        key={ex}
                        onClick={() => setUserPrompt(ex)}
                        className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isLoading && (
              <div className="py-6 space-y-5">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  {loadingPhase === 'structure' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${loadingPhase === 'structure' ? 'text-slate-900' : 'text-slate-400'}`}>
                      Step 1 — Building course structure
                    </p>
                    <p className="text-xs text-slate-400">Modules, lesson titles, and course metadata</p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  {loadingPhase === 'content' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500 flex-shrink-0" />
                  ) : loadingPhase === null && step === 2 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${loadingPhase === 'content' ? 'text-slate-900' : 'text-slate-400'}`}>
                      Step 2 — Generating lesson content &amp; videos
                    </p>
                    <p className="text-xs text-slate-400">Rich content, UK guidance references, embedded training videos</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center pt-2">This takes 60–120 seconds — please wait</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: preview ──────────────────────────────────────────────── */}
        {step === 2 && skeleton && (
          <div className="space-y-4">
            <Card className="p-4 bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-amber-900 text-base mb-0.5">{skeleton.course?.title}</h3>
              <p className="text-xs text-amber-600 mb-3">{skeleton.course?.description}</p>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full capitalize">{skeleton.course?.category}</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full capitalize">{skeleton.course?.difficulty_level}</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{skeleton.course?.duration_minutes} min</span>
              </div>
              <div className="flex gap-4 text-xs text-amber-700 border-t border-amber-200 pt-2">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {skeleton.modules?.length} modules · {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <Play className="w-3 h-3" />
                  {videoLessons} videos
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {questionCount} questions
                </span>
              </div>
            </Card>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {skeleton.modules?.map((m, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700">{i + 1}. {m.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.lessons?.map((l, j) => {
                      const hasVideo = !!enriched?.modules?.[i]?.lessons?.[j]?.video_url;
                      return (
                        <span key={j} className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${hasVideo ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          {hasVideo ? <Play className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                          {l.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Happy with the structure? Save it — you can refine content and swap video links in the Course Editor.
            </p>
          </div>
        )}

        {/* ── Step 3: done ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <div>
              <p className="font-semibold text-slate-900 text-lg">Course Created!</p>
              <p className="text-sm text-slate-500 mt-1">
                "{skeleton?.course?.title}" is now in your Course Library.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Open it in the Course Editor to review or adjust any content.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 && !isLoading && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
          {step === 2 && (
            <Button variant="outline" onClick={() => { setStep(1); setGeneratedCourse(null); setError(null); }}>
              ← Edit Prompt
            </Button>
          )}
          {step === 3 && (
            <Button variant="outline" onClick={handleClose}>Close</Button>
          )}
          {step === 1 && (
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !userPrompt.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Build Course</>
              )}
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={handleSave}
              disabled={createCourseMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createCourseMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                : '✓ Save to Library'
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
