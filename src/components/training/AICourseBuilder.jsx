import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AICourseBuilder({ isOpen, onClose, onSuccess, editCourse = null }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1=questions, 2=preview, 3=complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [questions, setQuestions] = useState({
    title: editCourse?.title || '',
    description: editCourse?.description || '',
    category: editCourse?.category || 'mandatory',
    difficulty: editCourse?.difficulty_level || 'beginner',
    duration: editCourse?.duration_minutes || '',
    courseContent: '',
    assessmentType: 'multiple_choice'
  });

  const [generatedCourse, setGeneratedCourse] = useState(null);

  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      // Create Course
      const course = await base44.entities.Course.create(courseData);
      
      // Create Modules
      if (courseData.modules_data) {
        for (const moduleData of courseData.modules_data) {
          const module = await base44.entities.Module.create({
            course_id: course.id,
            ...moduleData
          });

          // Create Lessons
          if (moduleData.lessons_data) {
            for (const lessonData of moduleData.lessons_data) {
              await base44.entities.Lesson.create({
                course_id: course.id,
                module_id: module.id,
                ...lessonData
              });
            }
          }
        }
      }

      // Create Assessment if needed
      if (courseData.assessment_data) {
        await base44.entities.Assessment.create({
          course_id: course.id,
          ...courseData.assessment_data
        });
      }

      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setStep(3);
      setGeneratedCourse(course);
      setTimeout(() => {
        onSuccess?.(course);
      }, 2000);
    }
  });

  const handleGenerateWithAI = async () => {
    if (!questions.title || !questions.description) {
      setError('Please fill in course title and description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hasContentToParse = questions.courseContent && questions.courseContent.trim().length > 100;
      
      const prompt = hasContentToParse 
        ? `Analyze and structure the following course content into a comprehensive training course:

Title: ${questions.title}
Description: ${questions.description}
Category: ${questions.category}
Difficulty Level: ${questions.difficulty}

COURSE CONTENT TO ORGANIZE:
${questions.courseContent}

CRITICAL: Extensively search the internet for additional content to enrich this course:
- Research latest industry standards, best practices, and regulations
- Find authoritative articles, guides, and case studies
- Locate relevant YouTube training videos from OFFICIAL UK care sector channels only:
  * Skills for Care, NHS England, CQC, Social Care Institute for Excellence (SCIE)
  * Health Education England, Royal College of Nursing, Care Forum Wales
  * Other verified official/educational channels
- Include real-world examples and scenarios from trusted sources
- Add expert tips and professional insights from healthcare/care industry
- Include downloadable resources and reference materials

Your task:
- Parse the content and organize it into 8-15 logical modules
- Create 3-5 lessons per module, enriched with internet research
- Each lesson should have substantial content (300-500 words minimum)
- Include YouTube video URLs from official/reputable channels where relevant (these will open externally, not embed)
- Always include the channel name in the lesson description for attribution
- Generate 15-20 practical assessment questions based on real scenarios
- Add references to authoritative sources and materials

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "course": {
    "title": "...",
    "description": "...",
    "category": "...",
    "difficulty_level": "...",
    "duration_minutes": ...,
    "passing_score": 70
  },
  "modules": [
    {
      "title": "...",
      "description": "...",
      "lessons": [
        {
          "title": "...",
          "description": "...",
          "content": "...",
          "content_type": "text|video|document",
          "video_url": "https://www.youtube.com/watch?v=VIDEO_ID" (if video - use full YouTube URLs),
          "document_url": "https://..." (if document)
        }
      ]
    }
  ],
  "assessment": {
    "title": "Course Assessment",
    "description": "...",
    "assessment_type": "...",
    "passing_score": 70,
    "questions": [
      {
        "question": "...",
        "options": ["..."],
        "correct_answer": "..."
      }
    ]
  }
}`
        : `Create a comprehensive training course based on these specifications:

Title: ${questions.title}
Description: ${questions.description}
Category: ${questions.category}
Difficulty Level: ${questions.difficulty}

CRITICAL: Extensively research the internet to create rich, professional training content:
- Search for the latest industry standards, regulations, and best practices
- Find authoritative training materials, guides, and resources
- Locate relevant YouTube training videos from OFFICIAL UK care sector channels only:
  * Skills for Care, NHS England, CQC, Social Care Institute for Excellence (SCIE)
  * Health Education England, Royal College of Nursing, Care Forum Wales
  * Other verified official/educational channels
- Research real-world case studies and practical examples
- Include expert insights from healthcare/care professionals
- Find downloadable resources, templates, and reference materials

Generate a complete course with:
- 8-15 modules covering all key topics comprehensively
- 3-5 lessons per module with detailed, research-backed content (300-500 words each)
- Video resources from official/reputable channels (these will open externally, not embed) — include channel name for attribution
- Mix of text, video, and document resources
- 15-20 practical assessment questions based on real scenarios
- References to authoritative sources throughout

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "course": {
    "title": "...",
    "description": "...",
    "category": "...",
    "difficulty_level": "...",
    "duration_minutes": ...,
    "passing_score": 70
  },
  "modules": [
    {
      "title": "...",
      "description": "...",
      "lessons": [
        {
          "title": "...",
          "description": "...",
          "content": "...",
          "content_type": "text|video|document",
          "video_url": "https://www.youtube.com/watch?v=VIDEO_ID" (if video - use full YouTube URLs),
          "document_url": "https://..." (if document)
        }
      ]
    }
  ],
  "assessment": {
    "title": "Course Assessment",
    "description": "...",
    "assessment_type": "...",
    "passing_score": 70,
    "questions": [
      {
        "question": "...",
        "options": ["..."],
        "correct_answer": "..."
      }
    ]
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            course: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                difficulty_level: { type: 'string' },
                duration_minutes: { type: 'number' },
                passing_score: { type: 'number' }
              }
            },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true
              }
            },
            assessment: {
              type: 'object',
              additionalProperties: true
            }
          }
        }
      });

      setGeneratedCourse(result);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!generatedCourse) return;

    const courseData = {
    title: generatedCourse.course.title,
    description: generatedCourse.course.description,
    category: generatedCourse.course.category,
    difficulty_level: generatedCourse.course.difficulty_level,
    duration_minutes: generatedCourse.course.duration_minutes,
    passing_score: generatedCourse.course.passing_score || 70,
    is_active: true,
    modules_data: generatedCourse.modules?.map((m, idx) => ({
     title: m.title,
     description: m.description,
     order_index: idx,
     lessons_data: m.lessons?.map((l, lidx) => ({
       title: l.title,
       description: l.description,
       content: l.content,
       content_type: l.content_type || 'text',
       video_url: l.video_url || undefined,
       document_url: l.document_url || undefined,
       order_index: lidx
     })) || []
    })) || [],
    assessment_data: generatedCourse.assessment ? {
     title: generatedCourse.assessment.title,
     description: generatedCourse.assessment.description,
     assessment_type: generatedCourse.assessment.assessment_type,
     questions: JSON.stringify(generatedCourse.assessment.questions || []),
     passing_score: generatedCourse.assessment.passing_score || 70
    } : null
    };

    createCourseMutation.mutate(courseData);
  };

  const handleClose = () => {
    if (!editCourse) {
      setStep(1);
      setQuestions({
        title: '',
        description: '',
        category: 'mandatory',
        difficulty: 'beginner',
        duration: '',
        courseContent: '',
        assessmentType: 'multiple_choice'
      });
      setGeneratedCourse(null);
      setError(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {editCourse ? 'Regenerate Course with AI' : 'AI Course Builder'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-slate-600">Answer a few questions and AI will create your complete course structure.</p>
              
              <div className="space-y-4">
                <div>
                  <Label>Course Title *</Label>
                  <Input
                    placeholder="e.g., Advanced Moving & Handling"
                    value={questions.title}
                    onChange={(e) => setQuestions({ ...questions, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Course Description *</Label>
                  <Textarea
                    placeholder="Describe what this course teaches and key topics"
                    value={questions.description}
                    onChange={(e) => setQuestions({ ...questions, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={questions.category} onValueChange={(value) => setQuestions({ ...questions, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mandatory">Mandatory</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                        <SelectItem value="refresher">Refresher</SelectItem>
                        <SelectItem value="induction">Induction</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty Level</Label>
                    <Select value={questions.difficulty} onValueChange={(value) => setQuestions({ ...questions, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 120"
                    value={questions.duration}
                    onChange={(e) => setQuestions({ ...questions, duration: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Full Course Content (Optional)</Label>
                  <Textarea
                    placeholder="Paste your full course content here and AI will organize it into modules and lessons. Leave empty to let AI generate from scratch."
                    value={questions.courseContent}
                    onChange={(e) => setQuestions({ ...questions, courseContent: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Paste course text, outlines, or materials. AI will structure it into organized modules and lessons.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === 2 && generatedCourse && (
            <>
              <Card className="p-4 bg-amber-50 border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">AI Generated Course Preview</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-amber-700 font-medium">{generatedCourse.course?.title}</p>
                    <p className="text-amber-600">{generatedCourse.course?.description}</p>
                  </div>
                  <div className="pt-2 border-t border-amber-200">
                    <p className="text-amber-700 font-medium">{generatedCourse.modules?.length || 0} Modules</p>
                    {generatedCourse.modules?.slice(0, 3).map((m, i) => (
                      <div key={i} className="ml-2 text-amber-600">
                        • {m.title} ({m.lessons?.length || 0} lessons)
                      </div>
                    ))}
                    {(generatedCourse.modules?.length || 0) > 3 && (
                      <p className="ml-2 text-amber-600 text-xs">+ {(generatedCourse.modules?.length || 0) - 3} more</p>
                    )}
                  </div>
                </div>
              </Card>

              <p className="text-sm text-slate-600">Review the AI-generated structure above. Click "Create Course" to save it to your library.</p>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="font-semibold text-slate-900">Course Created Successfully!</p>
                <p className="text-sm text-slate-600">"{generatedCourse?.title}" is now in your course library.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === 3 ? 'Close' : 'Cancel'}
          </Button>
          {step === 1 && (
            <Button 
              onClick={handleGenerateWithAI}
              disabled={loading || !questions.title}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          )}
          {step === 2 && (
            <Button 
              onClick={handleCreateCourse}
              disabled={createCourseMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}