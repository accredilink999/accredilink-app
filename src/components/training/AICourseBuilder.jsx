import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Play, FileText, BookOpen } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const EXAMPLE_PROMPTS = [
  'Create a safeguarding adults course for UK care workers',
  'Build a medication administration training for care staff',
  'Make a moving and handling course — intermediate level, 90 minutes',
  'Create a mental health awareness course for community care workers',
  'Build a fire safety and evacuation training for residential care',
];

// Deliberately no "content" field — keeps the response small and reliable.
// Lesson body text is added later via the Course Editor.
const JSON_SCHEMA = `{"course":{"title":"string","description":"string","category":"mandatory|specialist|refresher|induction|compliance","difficulty_level":"beginner|intermediate|advanced","duration_minutes":60,"passing_score":70},"modules":[{"title":"string","description":"one sentence","order_index":0,"lessons":[{"title":"string","description":"one sentence","content_type":"text|video","video_url":"https://www.youtube.com/watch?v=ID or null","order_index":0}]}],"assessment":{"title":"string","passing_score":70,"questions":[{"question":"string","options":["option A","option B","option C","option D"],"correct_answer":"option A"}]}}`;

export default function AICourseBuilder({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1=prompt, 2=preview, 3=complete
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCourse, setGeneratedCourse] = useState(null);

  // ── Save to DB ──────────────────────────────────────────────────────────────
  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      const { modules_data, ...courseFields } = courseData;

      const course = await base44.entities.Course.create(courseFields);

      if (modules_data) {
        for (const moduleData of modules_data) {
          const { lessons_data, ...moduleFields } = moduleData;
          const module = await base44.entities.Module.create({
            course_id: course.id,
            ...moduleFields,
          });
          if (lessons_data) {
            for (const lessonData of lessons_data) {
              await base44.entities.Lesson.create({
                course_id: course.id,
                module_id: module.id,
                ...lessonData,
              });
            }
          }
        }
      }

      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setStep(3);
      setGeneratedCourse(course);
      setTimeout(() => onSuccess?.(course), 2000);
    },
    onError: (err) => {
      setError('Failed to save course: ' + (err.message || 'Unknown error'));
      setStep(2);
    },
  });

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError('Please describe the course you want to create.');
      return;
    }
    setLoading(true);
    setError(null);

    const prompt = `Create a training course for UK community care staff: "${userPrompt.trim()}"

Rules:
- 4-5 modules, 2-3 lessons each
- No lesson body text — titles and one-sentence descriptions only
- 6 assessment questions, 4 options each, correct_answer is the exact option text
- Add a YouTube video_url (official UK care channel) in roughly 1 in 3 lessons; null for the rest
- Infer category, difficulty, duration from the request

Output ONLY this JSON (no text before or after):
${JSON_SCHEMA}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        systemPrompt: 'You are a JSON API for generating training courses. Output only raw valid JSON. Never include prose, explanation, or markdown formatting of any kind.',
        response_json_schema: { type: 'object' },
      });

      if (!result?.course || !result?.modules) {
        throw new Error('AI returned an incomplete course structure — please try again.');
      }

      setGeneratedCourse(result);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to generate course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!generatedCourse) return;

    createCourseMutation.mutate({
      title:                      generatedCourse.course.title,
      description:                generatedCourse.course.description,
      category:                   generatedCourse.course.category,
      difficulty_level:           generatedCourse.course.difficulty_level,
      duration_minutes:           generatedCourse.course.duration_minutes,
      passing_score:              generatedCourse.course.passing_score || 70,
      is_active:                  true,
      assessment_title:           generatedCourse.assessment?.title || null,
      assessment_questions:       generatedCourse.assessment?.questions || [],
      assessment_passing_score:   generatedCourse.assessment?.passing_score || 70,
      modules_data: generatedCourse.modules?.map((m, idx) => ({
        title:       m.title,
        description: m.description,
        order_index: idx,
        lessons_data: m.lessons?.map((l, lidx) => ({
          title:        l.title,
          description:  l.description,
          content:      l.content,
          content_type: l.content_type || 'text',
          video_url:    l.video_url || null,
          order_index:  lidx,
        })) || [],
      })) || [],
    });
  };

  // ── Reset / close ───────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setUserPrompt('');
    setGeneratedCourse(null);
    setError(null);
    onClose();
  };

  // ── Derived counts for preview ──────────────────────────────────────────────
  const totalLessons   = generatedCourse?.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
  const videoLessons   = generatedCourse?.modules?.reduce((s, m) => s + (m.lessons?.filter(l => l.video_url && l.content_type === 'video').length || 0), 0) || 0;
  const questionCount  = generatedCourse?.assessment?.questions?.length || 0;

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
            <p className="text-sm text-slate-600">
              Describe the course you want — the AI will build the full structure, lessons, videos, and assessment automatically.
            </p>

            <Textarea
              rows={4}
              placeholder="e.g. Create a safeguarding adults course for UK care workers, beginner level, covering types of abuse, reporting procedures, and legal duties"
              value={userPrompt}
              onChange={e => { setUserPrompt(e.target.value); setError(null); }}
              className="text-sm resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && userPrompt.trim()) handleGenerate();
              }}
            />

            {/* Example chips */}
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: preview ──────────────────────────────────────────────── */}
        {step === 2 && generatedCourse && (
          <div className="space-y-4">
            <Card className="p-4 bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-amber-900 text-base mb-0.5">
                {generatedCourse.course?.title}
              </h3>
              <p className="text-xs text-amber-600 mb-3">{generatedCourse.course?.description}</p>

              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full capitalize">
                  {generatedCourse.course?.category}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full capitalize">
                  {generatedCourse.course?.difficulty_level}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  {generatedCourse.course?.duration_minutes} min
                </span>
              </div>

              <div className="flex gap-4 text-xs text-amber-700 border-t border-amber-200 pt-2">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {generatedCourse.modules?.length} modules · {totalLessons} lessons
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

            {/* Module list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {generatedCourse.modules?.map((m, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700">{i + 1}. {m.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.lessons?.map((l, j) => (
                      <span key={j} className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${l.content_type === 'video' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {l.content_type === 'video' ? <Play className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                        {l.title}
                      </span>
                    ))}
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
              Happy with the structure? Click "Save to Library" — you can edit content inside the course editor afterwards.
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
                "{generatedCourse?.title}" is now in your Course Library.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Open it in the Course Editor to add detailed lesson content.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 3 && (
            <Button variant="outline" onClick={step === 2 ? () => setStep(1) : handleClose}>
              {step === 2 ? '← Edit Prompt' : 'Cancel'}
            </Button>
          )}
          {step === 3 && (
            <Button variant="outline" onClick={handleClose}>Close</Button>
          )}
          {step === 1 && (
            <Button
              onClick={handleGenerate}
              disabled={loading || !userPrompt.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building course… (30–60s)</>
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
