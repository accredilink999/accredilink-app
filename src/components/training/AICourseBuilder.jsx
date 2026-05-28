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

// Phase 1 — skeleton only. Small JSON = never fails to parse.
const SKELETON_SCHEMA = `{"course":{"title":"string","description":"string","category":"mandatory|specialist|refresher|induction|compliance","difficulty_level":"beginner|intermediate|advanced","duration_minutes":60,"passing_score":70},"modules":[{"title":"string","description":"one sentence","order_index":0,"lessons":[{"title":"string","description":"one sentence","order_index":0}]}]}`;

// Phase 2 — content. Every prose field is an ARRAY of short strings (never a long paragraph).
// Arrays of short strings cannot contain newlines → JSON parse never fails.
const CONTENT_SCHEMA = `{"lessons":[{"title":"matches skeleton lesson title exactly","overview":["sentence 1","sentence 2","sentence 3","sentence 4"],"key_points":["full informative sentence 1","sentence 2","sentence 3","sentence 4","sentence 5","sentence 6","sentence 7"],"uk_guidance":["sentence citing specific UK law or HSE/CQC/Skills for Care guidance","second sentence adding detail"],"in_practice":["concrete action step 1 for care staff","step 2","step 3","step 4","step 5"],"video_url":"https://www.youtube.com/embed/REAL_VIDEO_ID or null"}],"assessment":{"title":"string","passing_score":80,"questions":[{"question":"string","options":["option A text","option B text","option C text","option D text"],"correct_answer":"option A text"}]}}`;

// Converts the structured arrays from Phase 2 into rich markdown for the DB.
function buildLessonContent(lesson) {
  const parts = [];
  if (lesson.overview?.length) {
    parts.push(Array.isArray(lesson.overview) ? lesson.overview.join(' ') : lesson.overview);
  }
  if (lesson.key_points?.length) {
    parts.push('## Key Learning Points\n' + lesson.key_points.map(p => `- ${p}`).join('\n'));
  }
  if (lesson.uk_guidance?.length) {
    const guidance = Array.isArray(lesson.uk_guidance) ? lesson.uk_guidance.join(' ') : lesson.uk_guidance;
    parts.push('## UK Law & Guidance\n' + guidance);
  }
  if (lesson.in_practice?.length) {
    parts.push('## In Practice\n' + lesson.in_practice.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  }
  return parts.join('\n\n');
}

// Saves the full merged course to Supabase.
async function saveCourse({ skeleton, contentData }) {
  const course = await base44.entities.Course.create({
    title:                    skeleton.course.title,
    description:              skeleton.course.description,
    category:                 skeleton.course.category,
    difficulty_level:         skeleton.course.difficulty_level,
    duration_minutes:         skeleton.course.duration_minutes,
    passing_score:            skeleton.course.passing_score || 70,
    is_active:                true,
    assessment_title:         contentData.assessment?.title || null,
    assessment_questions:     contentData.assessment?.questions || [],
    assessment_passing_score: contentData.assessment?.passing_score || 80,
  });

  // Flatten all lessons from content data for lookup by title
  const contentByTitle = {};
  (contentData.lessons || []).forEach(l => { contentByTitle[l.title?.toLowerCase().trim()] = l; });

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
      const enriched = contentByTitle[skelLesson.title?.toLowerCase().trim()] || {};
      await base44.entities.Lesson.create({
        course_id:    course.id,
        module_id:    mod.id,
        title:        skelLesson.title,
        description:  skelLesson.description,
        content:      buildLessonContent(enriched),
        content_type: 'text',
        video_url:    enriched.video_url || null,
        order_index:  li,
      });
    }
  }

  return course;
}

export default function AICourseBuilder({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);         // 1=prompt, 2=preview, 3=done
  const [phase, setPhase] = useState(null);    // null | 'structure' | 'content' | 'saving'
  const [userPrompt, setUserPrompt] = useState('');
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null); // { skeleton, contentData, savedCourse }

  const isLoading = phase !== null;

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!userPrompt.trim()) { setError('Please describe the course you want to create.'); return; }
    setError(null);
    setCourseData(null);

    // ── Phase 1: skeleton ──────────────────────────────────────────────────
    setPhase('structure');
    let skeleton;
    try {
      skeleton = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a training course skeleton for UK community care staff: "${userPrompt.trim()}"
Rules: 4 modules, 3 lessons each. Infer category, difficulty_level, duration_minutes. One-sentence descriptions only — no lesson content.
Output ONLY raw JSON, no prose, no code fences: ${SKELETON_SCHEMA}`,
        systemPrompt: 'Output only raw valid JSON.',
        response_json_schema: { type: 'object' },
        temperature: 0,
        max_tokens: 1500,
      });
    } catch (err) {
      setError('Step 1 failed — could not build course structure. Please try again.');
      setPhase(null);
      return;
    }

    if (!skeleton?.course || !skeleton?.modules?.length) {
      setError('Step 1 returned an incomplete structure — please try again.');
      setPhase(null);
      return;
    }

    // ── Phase 2: lesson content ────────────────────────────────────────────
    setPhase('content');
    const lessonList = skeleton.modules.flatMap(m => m.lessons.map(l => `- "${l.title}" (${l.description})`)).join('\n');

    let contentData;
    try {
      contentData = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate rich training content for each lesson in this UK care staff course.

Course: ${skeleton.course.title}
Topic: "${userPrompt.trim()}"

Lessons to fill (in order):
${lessonList}

Rules:
- Return content for ALL ${skeleton.modules.flatMap(m => m.lessons).length} lessons in the lessons array
- overview: array of 4 plain sentences — no newlines inside any string
- key_points: array of 7 full informative sentences — real detail, no vague phrases
- uk_guidance: array of 2 sentences citing SPECIFIC UK legislation, HSE/CQC/Skills for Care guidance
- in_practice: array of 5 concrete action steps a care worker should follow
- video_url: for every 3rd lesson provide a real https://www.youtube.com/embed/VIDEO_ID from a known UK training channel (Skills for Care, NHS England, HSE, SCIE, St John Ambulance, British Red Cross). Set null for others.
- Every string in every array must be a single sentence with NO newline characters
- 10 assessment questions, correct_answer must be the EXACT text of one of the 4 options

Output ONLY raw JSON, no prose, no code fences: ${CONTENT_SCHEMA}`,
        systemPrompt: 'Output only raw valid JSON. Every string value must be single-line with no newline characters.',
        response_json_schema: { type: 'object' },
        temperature: 0,
        max_tokens: 8000,
      });
    } catch (err) {
      setError('Step 2 failed — could not generate lesson content. Please try again.');
      setPhase(null);
      return;
    }

    if (!contentData?.lessons?.length) {
      setError('Step 2 returned incomplete content — please try again.');
      setPhase(null);
      return;
    }

    // ── Phase 3: save to DB ────────────────────────────────────────────────
    setPhase('saving');
    let savedCourse;
    try {
      savedCourse = await saveCourse({ skeleton, contentData });
    } catch (err) {
      setError('Step 3 failed — could not save course: ' + (err.message || 'Unknown error'));
      setPhase(null);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['courses'] });
    setCourseData({ skeleton, contentData, savedCourse });
    setPhase(null);
    setStep(3);
    setTimeout(() => onSuccess?.(savedCourse), 1500);
  };

  // ── Reset / close ───────────────────────────────────────────────────────────
  const handleClose = () => {
    if (isLoading) return; // don't close mid-generation
    setStep(1);
    setUserPrompt('');
    setCourseData(null);
    setError(null);
    setPhase(null);
    onClose();
  };

  const { skeleton, contentData } = courseData || {};
  const totalLessons  = skeleton?.modules?.reduce((s, m) => s + m.lessons.length, 0) || 0;
  const videoLessons  = (contentData?.lessons || []).filter(l => l.video_url).length;
  const questionCount = contentData?.assessment?.questions?.length || 0;

  const phasesDone = { structure: false, content: false, saving: false };
  if (phase === 'content')  phasesDone.structure = true;
  if (phase === 'saving')   { phasesDone.structure = true; phasesDone.content = true; }
  if (step === 3)           { phasesDone.structure = true; phasesDone.content = true; phasesDone.saving = true; }

  const PhaseRow = ({ id, label, sublabel }) => {
    const active = phase === id;
    const done   = phasesDone[id];
    return (
      <div className="flex items-center gap-3">
        {active ? (
          <Loader2 className="w-5 h-5 animate-spin text-amber-500 flex-shrink-0" />
        ) : done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
        )}
        <div>
          <p className={`text-sm font-medium ${active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-300'}`}>{label}</p>
          <p className={`text-xs ${active || done ? 'text-slate-400' : 'text-slate-300'}`}>{sublabel}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Course Builder
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: prompt + loading ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {!isLoading ? (
              <>
                <p className="text-sm text-slate-600">
                  Describe the course you want — AI builds the full structure, rich lesson content, embedded videos, and assessment in three steps.
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
                <PhaseRow id="saving"    label="Step 3 — Enhancing &amp; saving"      sublabel="Adding videos, assessment, saving to library" />
                <p className="text-xs text-slate-400 text-center pt-1">Please wait — this takes 60–120 seconds</p>
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

        {/* ── Step 3: done ─────────────────────────────────────────────────── */}
        {step === 3 && skeleton && (
          <div className="space-y-4">
            {/* All phases complete */}
            <div className="space-y-3 mb-2">
              <PhaseRow id="structure" label="Step 1 — Building course structure"   sublabel="Modules, lesson titles, course metadata" />
              <PhaseRow id="content"   label="Step 2 — Writing lesson content"      sublabel="Key points, UK guidance, in-practice steps" />
              <PhaseRow id="saving"    label="Step 3 — Enhancing &amp; saving"      sublabel="Adding videos, assessment, saving to library" />
            </div>

            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-emerald-900">Course Created!</p>
              </div>
              <p className="text-sm font-medium text-slate-800 mb-1">{skeleton.course?.title}</p>
              <p className="text-xs text-slate-500 mb-3">{skeleton.course?.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full capitalize">{skeleton.course?.category}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full capitalize">{skeleton.course?.difficulty_level}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">{skeleton.course?.duration_minutes} min</span>
              </div>
              <div className="flex gap-4 text-xs text-emerald-700 border-t border-emerald-200 pt-2 mt-3">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{skeleton.modules?.length} modules · {totalLessons} lessons</span>
                <span className="flex items-center gap-1 text-red-600"><Play className="w-3 h-3" />{videoLessons} videos</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{questionCount} questions</span>
              </div>
            </Card>

            <p className="text-xs text-slate-500">
              Course is live in your library. Open it in the Course Editor to review content or swap any video links.
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
          {step === 3 && (
            <Button variant="outline" onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
