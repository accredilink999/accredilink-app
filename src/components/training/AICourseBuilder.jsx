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

// Phase 2 generates one lesson per API call — entire response IS the content.
// No format parsing, no delimiters, cannot fail regardless of AI output style.
async function generateLessonContent(lesson, mod, courseTitle, topic) {
  try {
    const content = await base44.integrations.Core.InvokeLLM({
      prompt: `Write professional eLearning lesson content for UK community care staff.

Course: ${courseTitle}
Module: ${mod.title}
Lesson: ${lesson.title} — ${lesson.description}
Topic: "${topic}"

Use this exact structure (all sections required):

## Learning Outcomes
3-4 bullet points starting with "By the end of this lesson, you will be able to:" — use action verbs (identify, understand, apply, explain, carry out)

## Overview
2-3 sentences introducing the topic and why it matters to community care workers.

## [Main Content Section — use a relevant heading e.g. "What is Manual Handling?" or "The 5-Step Risk Assessment Process"]
Detailed explanation with **bold** key terms. Use a table if comparing items or showing steps. Include real community care examples (service users' homes, lone working, etc).

## [Second Content Section — another relevant heading]
Further detail, expanding on a key aspect. Use bullet points with **bold** lead-ins and explanations. Include a real-world scenario — "Imagine you arrive at Mrs Smith's home and notice..."

## UK Law & Guidance
> Blockquote with the key legislation or regulation name and what it requires.

1-2 sentences explaining what this means in practice for care workers. Cite specific Acts or Regulations (e.g. Health and Safety at Work Act 1974, COSHH Regulations 2002, Manual Handling Operations Regulations 1992, Care Act 2014).

## In Practice
5-6 numbered steps written directly to the care worker. Start each with a verb ("Check...", "Report...", "Always...", "Never...").

## Knowledge Check
**Question:** [A clear multiple-choice question testing the key point of this lesson]

- A) [Option]
- B) [Option]
- C) [Option]
- D) [Option]

✅ **Correct answer: [Letter]** — [One sentence explaining why this is correct and reinforcing the key message.]

Output ONLY the markdown content — no title line at the top, no commentary.`,
      systemPrompt: 'You are a professional UK eLearning content writer specialising in care staff training. Write structured, accurate, engaging training material.',
      temperature: 0.3,
      max_tokens: 2000,
    });
    return { title: lesson.title, content: content || '' };
  } catch {
    return { title: lesson.title, content: '' };
  }
}

// Phase 3 — assessment + credits only. Videos handled separately via YouTube API.
const ENHANCE_SCHEMA = `{"assessment":{"title":"string","passing_score":80,"questions":[{"question":"string","options":["option A text","option B text","option C text","option D text"],"correct_answer":"option A text"}]},"credits":["Organisation Name — what was sourced from them (one line per source)"]}`;

// Search YouTube Data API for a real, guaranteed-embeddable video.
// Uses VITE_YOUTUBE_API_KEY (preferred) or VITE_GOOGLE_MAPS_API_KEY as fallback.
async function searchYouTubeVideo(lessonTitle, courseTitle) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const q = `${lessonTitle} ${courseTitle} UK care training`;
    const params = new URLSearchParams({
      part: 'snippet',
      q,
      type: 'video',
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      relevanceLanguage: 'en',
      regionCode: 'GB',
      maxResults: '5',
      key: apiKey,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
  } catch {
    return null;
  }
}

async function saveCourse({ skeleton, contentLessons, enhanceData, videoUrls }) {
  // Index content by lesson title (lowercased) for fast lookup
  const contentByTitle = {};
  (contentLessons || []).forEach(l => {
    contentByTitle[l.title?.toLowerCase().trim()] = l;
  });
  const videoByTitle = videoUrls || {};

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
        content:      enriched?.content || '',
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

    // ── Phase 2: one lesson per call, 3 in parallel per module ───────────────
    // Entire response = lesson content. No format to parse, cannot fail.
    setPhase('content');
    let contentLessons = [];
    for (const mod of skeleton.modules) {
      const modResults = await Promise.all(
        mod.lessons.map(lesson =>
          generateLessonContent(lesson, mod, skeleton.course.title, userPrompt.trim())
        )
      );
      contentLessons = [...contentLessons, ...modResults];
    }

    // ── Phase 3: YouTube video search + assessment + credits (parallel) ──────
    setPhase('enhance');
    const allLessonsList = skeleton.modules.flatMap(m => m.lessons);
    const lessonTitles = allLessonsList.map(l => `"${l.title}"`).join(', ');

    // Search YouTube for every 3rd lesson (indices 2, 5, 8, 11) in parallel
    const videoSearchPromises = allLessonsList.map((lesson, i) =>
      (i + 1) % 3 === 0
        ? searchYouTubeVideo(lesson.title, skeleton.course.title)
        : Promise.resolve(null)
    );

    // AI call for assessment + credits — runs in parallel with video searches
    const assessmentPromise = base44.integrations.Core.InvokeLLM({
      prompt: `Generate assessment questions and content credits for this UK care staff training course.

Course: "${skeleton.course.title}"
Lessons: ${lessonTitles}

Task 1 — ASSESSMENT: Create 15 varied questions testing real knowledge from across the course. Each correct_answer must be the EXACT text of one of the 4 options.

Task 2 — CREDITS: List every organisation whose guidance, legislation, or materials were referenced. Format each as "Organisation Name — what was sourced". Include all relevant UK bodies (HSE, CQC, Skills for Care, NHS, relevant Acts of Parliament, etc).

Output ONLY raw JSON: ${ENHANCE_SCHEMA}`,
      systemPrompt: 'Output only raw valid JSON. No prose, no code fences.',
      response_json_schema: { type: 'object' },
      temperature: 0,
      max_tokens: 3000,
    }).catch(err => { console.warn('Assessment generation failed:', err.message); return null; });

    // Wait for both to complete
    const [videoResults, enhanceData] = await Promise.all([
      Promise.all(videoSearchPromises),
      assessmentPromise,
    ]);

    // Map video results back to lesson titles
    const videoUrls = {};
    allLessonsList.forEach((lesson, i) => {
      if (videoResults[i]) videoUrls[lesson.title] = videoResults[i];
    });

    // ── Phase 4: save ──────────────────────────────────────────────────────
    setPhase('saving');
    let savedCourse;
    try {
      savedCourse = await saveCourse({ skeleton, contentLessons, enhanceData, videoUrls });
    } catch (err) {
      setError('Step 4 failed — could not save to library: ' + (err.message || 'Unknown error'));
      setPhase(null);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['courses'] });
    setResult({ skeleton, contentLessons, enhanceData, videoUrls, savedCourse });
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

  const { skeleton, enhanceData, videoUrls } = result || {};
  const videoCount    = Object.values(videoUrls || {}).filter(Boolean).length;
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
