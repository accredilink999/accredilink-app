import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Play, BookOpen, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const EXAMPLE_PROMPTS = [
  'Create a safeguarding adults course for UK care workers',
  'Build a medication administration training for care staff',
  'Make a moving and handling course — intermediate level, 90 minutes',
  'Create a mental health awareness course for community care workers',
  'Build a fire safety and evacuation training for residential care',
];

// Phase 1 — skeleton only. Tiny JSON = never fails to parse.
const SKELETON_SCHEMA = `{"course":{"title":"string","description":"string","category":"mandatory|specialist|refresher|induction|compliance","difficulty_level":"beginner|intermediate|advanced","duration_minutes":60,"passing_score":70},"modules":[{"title":"string","description":"one sentence","order_index":0,"lessons":[{"title":"string","description":"one sentence","order_index":0}]}]}`;

// Phase 2 uses plain TEXT — no JSON at all, so no parse failures ever.
// Format per lesson (repeated for all 12):
// ##LESSON## Title
// OVERVIEW: sentence 1. sentence 2. sentence 3.
// POINTS: point1 | point2 | point3 | point4 | point5 | point6 | point7 | point8
// GUIDANCE: UK law sentence 1. Sentence 2.
// STEPS: step1 | step2 | step3 | step4 | step5 | step6
// ##END##
function parseContentText(text) {
  const lessons = [];
  const blocks = text.split('##LESSON##').slice(1);
  for (const block of blocks) {
    const endIdx = block.indexOf('##END##');
    const content = (endIdx >= 0 ? block.slice(0, endIdx) : block).trim();
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const lesson = { title: lines[0], overview: [], key_points: [], uk_guidance: [], in_practice: [] };
    for (const line of lines.slice(1)) {
      if (line.startsWith('OVERVIEW: '))  lesson.overview     = [line.slice(10).trim()];
      else if (line.startsWith('POINTS: '))   lesson.key_points  = line.slice(8).split('|').map(s => s.trim()).filter(Boolean);
      else if (line.startsWith('GUIDANCE: ')) lesson.uk_guidance = [line.slice(10).trim()];
      else if (line.startsWith('STEPS: '))    lesson.in_practice = line.slice(7).split('|').map(s => s.trim()).filter(Boolean);
    }
    lessons.push(lesson);
  }
  return lessons;
}

// Phase 3 — enhance. Only small safe fields: video URLs, richer assessment, and credits.
// No prose content in JSON strings → always reliable.
const ENHANCE_SCHEMA = `{"video_urls":{"exact lesson title":"https://www.youtube.com/embed/REAL_VIDEO_ID or null"},"assessment":{"title":"string","passing_score":80,"questions":[{"question":"string","options":["option A text","option B text","option C text","option D text"],"correct_answer":"option A text"}]},"credits":["Organisation Name — what was sourced from them (one line per source)"]}`;

function buildLessonContent(lesson) {
  if (!lesson) return '';
  const parts = [];
  if (lesson.overview?.length) {
    parts.push(Array.isArray(lesson.overview) ? lesson.overview.join(' ') : lesson.overview);
  }
  if (lesson.key_points?.length) {
    parts.push('## Key Learning Points\n' + lesson.key_points.map(p => `- ${p}`).join('\n'));
  }
  if (lesson.uk_guidance?.length) {
    const g = Array.isArray(lesson.uk_guidance) ? lesson.uk_guidance.join(' ') : lesson.uk_guidance;
    parts.push('## UK Law & Guidance\n' + g);
  }
  if (lesson.in_practice?.length) {
    parts.push('## In Practice\n' + lesson.in_practice.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  }
  return parts.join('\n\n');
}

async function saveCourse({ skeleton, contentLessons, enhanceData }) {
  // Index content by lesson title (lowercased) for fast lookup
  const contentByTitle = {};
  (contentLessons || []).forEach(l => {
    contentByTitle[l.title?.toLowerCase().trim()] = l;
  });
  const videoByTitle = enhanceData?.video_urls || {};

  const course = await base44.entities.Course.create({
    title:                    skeleton.course.title,
    description:              skeleton.course.description,
    category:                 skeleton.course.category,
    difficulty_level:         skeleton.course.difficulty_level,
    duration_minutes:         skeleton.course.duration_minutes,
    passing_score:            skeleton.course.passing_score || 70,
    is_active:                true,
    assessment_title:         enhanceData?.assessment?.title || null,
    assessment_questions:     enhanceData?.assessment?.questions || [],
    assessment_passing_score: enhanceData?.assessment?.passing_score || 80,
    credits:                  enhanceData?.credits || [],
  });

  for (let mi = 0; mi < skeleton.modules.length; mi++) {
    const skelMod = skeleton.modules[mi];
    const mod = await base44.entities.Module.create({
      course_id:   course.id,
      title:       skelMod.title,
      description: skelMod.description,
      order_index: mi,
    });
    for (let li = 0; li < skelMod.lessons.length; li++) {
      const skelLesson = skelMod.lessons[li];
      const key = skelLesson.title?.toLowerCase().trim();
      const enriched = contentByTitle[key] || {};
      // video_url: check enhance data by exact title, then by lowercase match
      const videoUrl = videoByTitle[skelLesson.title] || videoByTitle[key] ||
        Object.entries(videoByTitle).find(([k]) => k.toLowerCase().trim() === key)?.[1] || null;
      await base44.entities.Lesson.create({
        course_id:    course.id,
        module_id:    mod.id,
        title:        skelLesson.title,
        description:  skelLesson.description,
        content:      buildLessonContent(enriched),
        content_type: 'text',
        video_url:    videoUrl || null,
        order_index:  li,
      });
    }
  }

  return course;
}

export default function AICourseBuilder({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);       // 1=prompt+loading, 2=done
  const [phase, setPhase] = useState(null);  // null | 'structure' | 'content' | 'enhance' | 'saving'
  const [userPrompt, setUserPrompt] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const isLoading = phase !== null;

  const handleGenerate = async () => {
    if (!userPrompt.trim()) { setError('Please describe the course you want to create.'); return; }
    setError(null);
    setResult(null);

    // ── Phase 1: skeleton ──────────────────────────────────────────────────
    setPhase('structure');
    let skeleton;
    try {
      skeleton = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a training course skeleton for UK community care staff: "${userPrompt.trim()}"
4 modules, 3 lessons each. Infer category, difficulty_level, duration_minutes from the topic. One-sentence descriptions — no lesson content.
Output ONLY raw JSON: ${SKELETON_SCHEMA}`,
        systemPrompt: 'Output only raw valid JSON. No prose, no code fences.',
        response_json_schema: { type: 'object' },
        temperature: 0,
        max_tokens: 1500,
      });
    } catch (err) {
      setError('Step 1 failed — could not build structure. Please try again.');
      setPhase(null);
      return;
    }
    if (!skeleton?.course || !skeleton?.modules?.length) {
      setError('Step 1 returned an incomplete response — please try again.');
      setPhase(null);
      return;
    }

    // ── Phase 2: lesson content (plain text — no JSON, no parse failures) ──
    setPhase('content');
    const allLessons = skeleton.modules.flatMap(m => m.lessons);
    const lessonList = allLessons.map(l => `- ${l.title}`).join('\n');

    let contentLessons = [];
    try {
      const rawText = await base44.integrations.Core.InvokeLLM({
        prompt: `Write training content for each lesson in this UK care staff course.

Course: ${skeleton.course.title}
Topic: "${userPrompt.trim()}"

Lessons to cover:
${lessonList}

For EACH lesson output this exact block (repeat for all ${allLessons.length} lessons):

##LESSON## [exact lesson title]
OVERVIEW: [3-4 sentences introducing the topic — all on ONE line]
POINTS: [point 1] | [point 2] | [point 3] | [point 4] | [point 5] | [point 6] | [point 7] | [point 8]
GUIDANCE: [1-2 sentences citing specific UK legislation or HSE/CQC/Skills for Care guidance — all on ONE line]
STEPS: [step 1 for care staff] | [step 2] | [step 3] | [step 4] | [step 5] | [step 6]
##END##

Rules:
- OVERVIEW, GUIDANCE must each be a single line (no line breaks within them)
- POINTS and STEPS use | as separator between items
- Points and steps should be specific and detailed, not vague
- UK legislation references must be real (e.g. Health and Safety at Work Act 1974, Care Act 2014)
- Output ALL ${allLessons.length} lessons in order`,
        systemPrompt: 'You are a UK care staff training content writer. Follow the exact format specified.',
        temperature: 0,
        max_tokens: 8000,
      });
      contentLessons = parseContentText(rawText || '');
    } catch (err) {
      setError('Step 2 failed — could not generate lesson content. Please try again.');
      setPhase(null);
      return;
    }
    if (!contentLessons.length) {
      setError('Step 2 returned no content — please try again.');
      setPhase(null);
      return;
    }

    // ── Phase 3: enhance — videos, deep assessment, credits ────────────────
    setPhase('enhance');
    const lessonTitles = skeleton.modules.flatMap(m => m.lessons.map(l => `"${l.title}"`)).join(', ');
    let enhanceData = null;
    try {
      enhanceData = await base44.integrations.Core.InvokeLLM({
        prompt: `You are enhancing a UK care staff training course: "${skeleton.course.title}"

Lesson titles: ${lessonTitles}

Task 1 — VIDEO URLS: For every 3rd lesson (lessons 3, 6, 9, 12) provide a REAL YouTube embed URL (https://www.youtube.com/embed/VIDEO_ID) from a reputable UK training channel. Use videos you know exist from: Skills for Care, NHS England, HSE UK, SCIE, St John Ambulance, British Red Cross, Age UK. Set null for other lessons.

Task 2 — ASSESSMENT: Create 15 varied assessment questions that test real knowledge from across the course. Each correct_answer must be the EXACT text of one of the 4 options.

Task 3 — CREDITS: List every organisation whose guidance, legislation, or materials were referenced in this course. Format each as "Organisation Name — what was sourced". Include all relevant UK bodies (HSE, CQC, Skills for Care, NHS, relevant Acts of Parliament, etc).

Output ONLY raw JSON: ${ENHANCE_SCHEMA}`,
        systemPrompt: 'Output only raw valid JSON. No prose, no code fences.',
        response_json_schema: { type: 'object' },
        temperature: 0,
        max_tokens: 4000,
      });
    } catch (err) {
      // Enhance is best-effort — course still saves with Phase 2 content
      console.warn('Enhance step failed, proceeding without it:', err.message);
    }

    // ── Phase 4: save ──────────────────────────────────────────────────────
    setPhase('saving');
    let savedCourse;
    try {
      savedCourse = await saveCourse({ skeleton, contentLessons, enhanceData });
    } catch (err) {
      setError('Step 4 failed — could not save to library: ' + (err.message || 'Unknown error'));
      setPhase(null);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['courses'] });
    setResult({ skeleton, contentLessons, enhanceData, savedCourse });
    setPhase(null);
    setStep(2);
    setTimeout(() => onSuccess?.(savedCourse), 1500);
  };

  const handleClose = () => {
    if (isLoading) return;
    setStep(1);
    setUserPrompt('');
    setResult(null);
    setError(null);
    setPhase(null);
    onClose();
  };

  // Track which phases are complete for the progress UI
  const done = {
    structure: ['content', 'enhance', 'saving'].includes(phase) || step === 2,
    content:   ['enhance', 'saving'].includes(phase) || step === 2,
    enhance:   phase === 'saving' || step === 2,
    saving:    step === 2,
  };

  const PhaseRow = ({ id, label, sublabel }) => {
    const active = phase === id;
    const isDone = done[id];
    return (
      <div className="flex items-center gap-3">
        {active ? (
          <Loader2 className="w-5 h-5 animate-spin text-amber-500 flex-shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
        )}
        <div>
          <p className={`text-sm font-medium ${active ? 'text-slate-900' : isDone ? 'text-slate-600' : 'text-slate-300'}`}>{label}</p>
          <p className={`text-xs ${active || isDone ? 'text-slate-400' : 'text-slate-300'}`}>{sublabel}</p>
        </div>
      </div>
    );
  };

  const { skeleton, enhanceData } = result || {};
  const videoCount    = Object.values(enhanceData?.video_urls || {}).filter(Boolean).length;
  const questionCount = enhanceData?.assessment?.questions?.length || 0;
  const creditCount   = enhanceData?.credits?.length || 0;
  const totalLessons  = skeleton?.modules?.reduce((s, m) => s + m.lessons.length, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Course Builder
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: prompt + progress ────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {!isLoading ? (
              <>
                <p className="text-sm text-slate-600">
                  Describe the course you want — AI builds the full structure, rich lesson content, embedded videos, deep assessment, and legal credits in four steps.
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
                      <button key={ex} onClick={() => setUserPrompt(ex)}
                        className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4 space-y-5">
                <PhaseRow id="structure" label="Step 1 — Building course structure"   sublabel="Modules, lesson titles, course metadata" />
                <PhaseRow id="content"   label="Step 2 — Writing lesson content"      sublabel="Key points, UK guidance, in-practice steps" />
                <PhaseRow id="enhance"   label="Step 3 — Enhancing"                   sublabel="Training videos, deep assessment, content credits" />
                <PhaseRow id="saving"    label="Step 4 — Saving to library"           sublabel="Writing course to your training library" />
                <p className="text-xs text-slate-400 text-center pt-1">Please wait — this takes 90–120 seconds</p>
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

        {/* ── Step 2: done ─────────────────────────────────────────────────── */}
        {step === 2 && skeleton && (
          <div className="space-y-4">
            <div className="space-y-3 pb-1">
              <PhaseRow id="structure" label="Step 1 — Building course structure"   sublabel="Modules, lesson titles, course metadata" />
              <PhaseRow id="content"   label="Step 2 — Writing lesson content"      sublabel="Key points, UK guidance, in-practice steps" />
              <PhaseRow id="enhance"   label="Step 3 — Enhancing"                   sublabel="Training videos, deep assessment, content credits" />
              <PhaseRow id="saving"    label="Step 4 — Saving to library"           sublabel="Writing course to your training library" />
            </div>

            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-emerald-900">Course Created!</p>
              </div>
              <p className="text-sm font-medium text-slate-800 mb-1">{skeleton.course?.title}</p>
              <p className="text-xs text-slate-500 mb-3">{skeleton.course?.description}</p>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full capitalize">{skeleton.course?.category}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full capitalize">{skeleton.course?.difficulty_level}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">{skeleton.course?.duration_minutes} min</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-emerald-700 border-t border-emerald-200 pt-2">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{skeleton.modules?.length} modules · {totalLessons} lessons</span>
                <span className="flex items-center gap-1 text-red-600"><Play className="w-3 h-3" />{videoCount} videos</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{questionCount} questions</span>
                {creditCount > 0 && <span className="flex items-center gap-1">✓ {creditCount} credits</span>}
              </div>
            </Card>

            <p className="text-xs text-slate-500">
              Course is live in your library. Open it in the Course Editor to review or adjust any content.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 && !isLoading && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={!userPrompt.trim()} className="bg-amber-600 hover:bg-amber-700">
                <Sparkles className="w-4 h-4 mr-2" />Build Course
              </Button>
            </>
          )}
          {step === 2 && (
            <Button variant="outline" onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
