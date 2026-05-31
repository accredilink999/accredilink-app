import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Loader2, ChevronRight, ChevronLeft, Play, FileText, BookOpen, Menu, CheckCircle2, ExternalLink, Info, Award, ClipboardCheck, XCircle, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!m) return null;
  return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
}

// Known UK training organisations → their websites
const ORG_URLS = {
  'health and safety executive': 'https://www.hse.gov.uk',
  'hse': 'https://www.hse.gov.uk',
  'care quality commission': 'https://www.cqc.org.uk',
  'cqc': 'https://www.cqc.org.uk',
  'skills for care': 'https://www.skillsforcare.org.uk',
  'nhs england': 'https://www.england.nhs.uk',
  'nhs': 'https://www.nhs.uk',
  'social care institute for excellence': 'https://www.scie.org.uk',
  'scie': 'https://www.scie.org.uk',
  'st john ambulance': 'https://www.sja.org.uk',
  'british red cross': 'https://www.redcross.org.uk',
  'age uk': 'https://www.ageuk.org.uk',
  'nice': 'https://www.nice.org.uk',
  'department of health': 'https://www.gov.uk/government/organisations/department-of-health-and-social-care',
  'dhsc': 'https://www.gov.uk/government/organisations/department-of-health-and-social-care',
  'resuscitation council': 'https://www.resus.org.uk',
  'uk resuscitation council': 'https://www.resus.org.uk',
  'mencap': 'https://www.mencap.org.uk',
  'mind': 'https://www.mind.org.uk',
};

function resolveOrgUrl(creditLine) {
  const lower = creditLine.toLowerCase();
  for (const [key, url] of Object.entries(ORG_URLS)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

export default function CoursePlayer({ isOpen, onClose, courseId }) {
  const queryClient = useQueryClient();
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});  // index → chosen option
  const [assessmentIdx, setAssessmentIdx] = useState(0);           // current question
  const [assessmentResult, setAssessmentResult] = useState(null);  // { score, passed }

  // Reset all navigation state when a different course is opened
  useEffect(() => {
    setCurrentModuleIdx(0);
    setCurrentLessonIdx(0);
    setCompletedLessons(new Set());
    setShowCredits(false);
    setShowAssessment(false);
    setAssessmentQuestions([]);
    setAssessmentAnswers({});
    setAssessmentIdx(0);
    setAssessmentResult(null);
  }, [courseId]);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseId ? base44.entities.Course.read(courseId) : null,
    enabled: !!courseId
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => courseId ? base44.entities.Module.filter({ course_id: courseId }, 'order_index') : Promise.resolve([]),
    enabled: !!courseId
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: () => courseId ? base44.entities.Lesson.filter({ course_id: courseId }, 'order_index') : Promise.resolve([]),
    enabled: !!courseId
  });

  const { data: assessment } = useQuery({
    queryKey: ['courseAssessment', courseId],
    queryFn: () => courseId ? base44.entities.Assessment.filter({ course_id: courseId }).then(a => a[0]) : null,
    enabled: !!courseId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingCompletion } = useQuery({
    queryKey: ['courseCompletion', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return null;
      const completions = await base44.entities.CourseCompletion.filter({ 
        course_id: courseId,
        staff_id: user.id 
      });
      return completions[0] || null;
    },
    enabled: !!courseId && !!user?.id
  });

  const { data: assignment } = useQuery({
    queryKey: ['courseAssignment', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return null;
      const assignments = await base44.entities.CourseAssignment.filter({
        course_id: courseId,
        target_id: user.id
      });
      return assignments[0] || null;
    },
    enabled: !!courseId && !!user?.id
  });

  const completeMutation = useMutation({
    mutationFn: async (score = null) => {
      const completionData = {
        course_id: courseId,
        staff_id: user.id,
        staff_name: user.staff_full_name || user.full_name,
        status: 'completed',
        progress_percent: 100,
        completed_date: new Date().toISOString(),
        ...(score !== null && { score }),
      };

      let completionId;
      if (existingCompletion) {
        await base44.entities.CourseCompletion.update(existingCompletion.id, completionData);
        completionId = existingCompletion.id;
      } else {
        const newCompletion = await base44.entities.CourseCompletion.create(completionData);
        completionId = newCompletion.id;
      }

      if (assignment) {
        await base44.entities.CourseAssignment.update(assignment.id, {
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      }

      // Generate certificate
      await base44.functions.invoke('generateCertificate', { courseCompletionId: completionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseCompletion'] });
      queryClient.invalidateQueries({ queryKey: ['courseAssignment'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['myCourses'] });
      toast.success('Course completed! Certificate generated. 🎉');
      setTimeout(() => onClose(), 500);
    }
  });

  if (courseLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentModule = modules[currentModuleIdx];
  const moduleLessons = currentModule ? lessons.filter(l => l.module_id === currentModule.id) : [];
  const currentLesson = moduleLessons[currentLessonIdx];

  const handleNextLesson = () => {
    const updatedCompleted = new Set([...completedLessons, currentLesson?.id]);
    setCompletedLessons(updatedCompleted);

    const isLastLesson = currentModuleIdx === modules.length - 1 && currentLessonIdx === moduleLessons.length - 1;

    if (isLastLesson && updatedCompleted.size === totalLessons) {
      // Show assessment before certificate — must pass to complete
      const allQuestions = course?.assessment_questions || [];
      if (allQuestions.length > 0) {
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        setAssessmentQuestions(shuffled.slice(0, Math.min(10, shuffled.length)));
        setAssessmentAnswers({});
        setAssessmentIdx(0);
        setAssessmentResult(null);
        setShowAssessment(true);
      } else {
        // No questions — go straight to credits
        setShowCredits(true);
      }
      return;
    }

    if (currentLessonIdx < moduleLessons.length - 1) {
      setCurrentLessonIdx(currentLessonIdx + 1);
    } else if (currentModuleIdx < modules.length - 1) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentLessonIdx(0);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIdx > 0) {
      setCurrentLessonIdx(currentLessonIdx - 1);
    } else if (currentModuleIdx > 0) {
      setCurrentModuleIdx(currentModuleIdx - 1);
      const prevModuleLessons = lessons.filter(l => l.module_id === modules[currentModuleIdx - 1].id);
      setCurrentLessonIdx(prevModuleLessons.length - 1);
    }
  };

  const totalLessons = lessons.length;
  // Check if we're on the last lesson and it's been marked complete
  const isOnLastLesson = currentModuleIdx === modules.length - 1 && currentLessonIdx === moduleLessons.length - 1;
  const allPreviousComplete = completedLessons.size === totalLessons - 1;
  const isFullyCompleted = (completedLessons.size === totalLessons && totalLessons > 0) || (isOnLastLesson && allPreviousComplete && completedLessons.has(currentLesson?.id));
  const currentProgress = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  const handleSelectModule = (modIdx) => {
    setCurrentModuleIdx(modIdx);
    setCurrentLessonIdx(0);
  };

  const handleSelectLesson = (modIdx, lesIdx) => {
    setCurrentModuleIdx(modIdx);
    setCurrentLessonIdx(lesIdx);
    setSidebarOpen(false);
  };

  const handleMarkComplete = () => {
    if (isFullyCompleted) {
      completeMutation.mutate();
    }
  };

  const SidebarContent = () => (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Course Progress</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">{completedLessons.size}/{totalLessons}</span>
            <span className="font-semibold text-teal-600">{currentProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all" 
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">Modules</h3>
        <div className="space-y-2">
          {modules.map((mod, modIdx) => {
            const modLessons = lessons.filter(l => l.module_id === mod.id);
            const isActive = currentModuleIdx === modIdx;
            const modCompleted = modLessons.every(l => completedLessons.has(l.id));

            return (
              <div key={mod.id}>
                <button
                  onClick={() => handleSelectModule(modIdx)}
                  className={`w-full text-left p-2 rounded text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mod.title}
                </button>
                
                {isActive && (
                  <div className="ml-2 mt-1 space-y-1">
                    {modLessons.map((lesson, lesIdx) => {
                      const isCurrentLesson = currentLessonIdx === lesIdx;
                      const isCompleted = completedLessons.has(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(modIdx, lesIdx)}
                          className={`w-full text-left p-2 rounded text-xs flex items-center gap-2 transition-colors ${
                            isCurrentLesson
                              ? 'bg-teal-50 text-teal-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {lesson.content_type === 'video' && <Play className="w-3 h-3 flex-shrink-0" />}
                          {lesson.content_type === 'document' && <FileText className="w-3 h-3 flex-shrink-0" />}
                          {lesson.content_type === 'text' && <BookOpen className="w-3 h-3 flex-shrink-0" />}
                          <span className="truncate flex-1">{lesson.title}</span>
                          {isCompleted && <span className="text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="border-b p-3 sm:p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <DialogTitle className="text-sm sm:text-base">{course?.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block w-64 border-r bg-slate-50 overflow-y-auto">
            <SidebarContent />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto flex flex-col p-3 sm:p-6">

            {/* ── Assessment screen ───────────────────────────────────────── */}
            {showAssessment && !showCredits ? (
              <div className="flex-1 space-y-6 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-8 h-8 text-teal-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Final Assessment</h2>
                    <p className="text-sm text-slate-500">Answer all {assessmentQuestions.length} questions — you need 80% to pass and receive your certificate.</p>
                  </div>
                </div>

                {!assessmentResult ? (
                  /* ── Question view ── */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Question {assessmentIdx + 1} of {assessmentQuestions.length}</span>
                      <span>{Object.keys(assessmentAnswers).length} answered</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${((assessmentIdx + 1) / assessmentQuestions.length) * 100}%` }} />
                    </div>

                    {assessmentQuestions[assessmentIdx] && (
                      <Card className="p-5 bg-slate-50">
                        <p className="font-semibold text-slate-900 text-base mb-4">
                          {assessmentQuestions[assessmentIdx].question}
                        </p>
                        <div className="space-y-2">
                          {assessmentQuestions[assessmentIdx].options?.map((opt, oi) => (
                            <button key={oi} onClick={() => setAssessmentAnswers(prev => ({ ...prev, [assessmentIdx]: opt }))}
                              className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                                assessmentAnswers[assessmentIdx] === opt
                                  ? 'border-teal-500 bg-teal-50 text-teal-800 font-medium'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              }`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </Card>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setAssessmentIdx(i => Math.max(0, i - 1))}
                        disabled={assessmentIdx === 0}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                      </Button>

                      {assessmentIdx < assessmentQuestions.length - 1 ? (
                        <Button onClick={() => setAssessmentIdx(i => i + 1)}
                          disabled={!assessmentAnswers[assessmentIdx]}
                          className="bg-teal-600 hover:bg-teal-700">
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          disabled={Object.keys(assessmentAnswers).length < assessmentQuestions.length || completeMutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={() => {
                            const correct = assessmentQuestions.filter((q, i) =>
                              assessmentAnswers[i] === q.correct_answer
                            ).length;
                            const score = Math.round((correct / assessmentQuestions.length) * 100);
                            const passed = score >= 80;
                            setAssessmentResult({ score, passed, correct });
                            if (passed) completeMutation.mutate(score);
                          }}>
                          {completeMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : 'Submit Assessment'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── Result view ── */
                  <Card className={`p-6 text-center ${assessmentResult.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    {assessmentResult.passed ? (
                      <>
                        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-emerald-800 mb-1">{assessmentResult.score}% — Pass!</p>
                        <p className="text-sm text-emerald-600 mb-4">
                          You answered {assessmentResult.correct} out of {assessmentQuestions.length} questions correctly.
                        </p>
                        <p className="text-sm text-emerald-700 mb-4">Your certificate is being generated.</p>
                        <Button onClick={() => setShowCredits(true)} className="bg-emerald-600 hover:bg-emerald-700">
                          <Award className="w-4 h-4 mr-2" /> View Credits & Complete
                        </Button>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
                        <p className="text-2xl font-bold text-red-700 mb-1">{assessmentResult.score}% — Not Passed</p>
                        <p className="text-sm text-red-600 mb-2">
                          You need 80% to pass. You answered {assessmentResult.correct} out of {assessmentQuestions.length} correctly.
                        </p>
                        <p className="text-sm text-red-500 mb-4">Review the course material and try again.</p>
                        <Button variant="outline" className="border-red-300 text-red-700"
                          onClick={() => {
                            const shuffled = [...(course?.assessment_questions || [])].sort(() => Math.random() - 0.5);
                            setAssessmentQuestions(shuffled.slice(0, Math.min(10, shuffled.length)));
                            setAssessmentAnswers({});
                            setAssessmentIdx(0);
                            setAssessmentResult(null);
                          }}>
                          <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                        </Button>
                      </>
                    )}
                  </Card>
                )}
              </div>
            ) : null}

            {/* ── Credits screen ─────────────────────────────────────────── */}
            {showCredits ? (
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-teal-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Sources &amp; Acknowledgements</h2>
                    <p className="text-sm text-slate-500">Thank you to the following organisations whose guidance and materials informed this course.</p>
                  </div>
                </div>

                <Card className="p-5 bg-slate-50 border-slate-200">
                  {course?.credits?.length > 0 ? (
                    <ul className="space-y-3">
                      {course.credits.map((credit, i) => {
                        // Extract URL embedded in credit string e.g. "HSE — guidance (hse.gov.uk)"
                        const embeddedUrl = credit.match(/\(([a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)]*)?)\)/i);
                        const resolvedUrl = embeddedUrl
                          ? `https://${embeddedUrl[1]}`
                          : resolveOrgUrl(credit);
                        // Split on em-dash, en-dash, or " - "
                        const parts = credit.split(/\s*[—–-]\s(.+)/s);
                        const name = parts[0]?.trim();
                        const description = parts[1]?.trim();
                        return (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                            <div>
                              {resolvedUrl ? (
                                <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
                                  className="font-semibold text-teal-700 hover:underline inline-flex items-center gap-1">
                                  {name} <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="font-semibold text-slate-800">{name}</span>
                              )}
                              {description && (
                                <p className="text-slate-500 text-xs mt-0.5">{description.replace(/\s*\([a-z0-9.-]+\.[a-z]{2,}[^)]*\)/gi, '').trim()}</p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No specific credits recorded for this course.</p>
                  )}
                </Card>

                <p className="text-xs text-slate-400">
                  This course was created using guidance from UK regulatory bodies and professional organisations. Content is for training purposes only. Always refer to current legislation and your organisation's policies.
                </p>

                <div className="pt-2">
                  <Button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                  >
                    {completeMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Completing…</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" />I acknowledge these sources — Complete Course</>
                    )}
                  </Button>
                </div>
              </div>
            ) : !showAssessment && currentLesson ? (
              <>
                <div className="flex-1 space-y-4 sm:space-y-6">
                  {/* Lesson Header */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      Module: {currentModule?.title} • Lesson {currentLessonIdx + 1} of {moduleLessons.length}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{currentLesson.title}</h2>
                    {currentLesson.description && (
                      <p className="text-sm sm:text-base text-slate-600">{currentLesson.description}</p>
                    )}
                  </div>

                  {/* Video content */}
                  {currentLesson.video_url && (() => {
                    const embedUrl = getYouTubeEmbedUrl(currentLesson.video_url);
                    // Build a direct watch URL from any YouTube URL format
                    const videoIdMatch = currentLesson.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    const watchUrl = videoIdMatch
                      ? `https://www.youtube.com/watch?v=${videoIdMatch[1]}`
                      : currentLesson.video_url;
                    const isYouTube = !!videoIdMatch;

                    return (
                      <div className="space-y-2">
                        {embedUrl ? (
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-black aspect-video">
                            <iframe
                              src={embedUrl}
                              title={currentLesson.title}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        ) : null}

                        {/* Always show a Watch on YouTube button — works even if embed has Error 153 */}
                        <a
                          href={watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900">
                              {embedUrl ? 'Also available on YouTube' : 'Watch on YouTube'}
                            </p>
                            <p className="text-xs text-red-600">Opens in a new tab</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-red-400 flex-shrink-0" />
                        </a>
                      </div>
                    );
                  })()}

                  {currentLesson.content_type === 'document' && currentLesson.document_url && (
                    <div className="border rounded-lg overflow-hidden aspect-video">
                      <iframe
                        src={currentLesson.document_url}
                        title={currentLesson.title}
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  {currentLesson.content && (
                   <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                     <div className="prose prose-sm max-w-none text-sm sm:text-base">
                       <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
                     </div>
                   </Card>
                  )}

                  {currentLesson.has_assessment && (
                    <Card className="p-4 border-amber-200 bg-amber-50">
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">📋 Assessment:</span> There's an assessment for this lesson
                      </p>
                    </Card>
                  )}
                </div>

                {/* Navigation */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t space-y-3">
                  {isFullyCompleted && (
                    <div className="flex flex-col items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-center">
                        <p className="text-emerald-700 font-semibold flex items-center gap-2 justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                          All lessons completed!
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">Mark this course as complete to track your progress</p>
                      </div>
                      <Button
                        onClick={handleMarkComplete}
                        disabled={completeMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                      >
                        {completeMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrevLesson}
                      disabled={currentModuleIdx === 0 && currentLessonIdx === 0}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    <div className="text-xs sm:text-sm text-slate-500 text-center">
                      <span className="font-medium">Progress: {currentProgress}%</span>
                      <span className="mx-2 hidden sm:inline">•</span>
                      <span className="block sm:inline">{completedLessons.size}/{totalLessons} lessons</span>
                    </div>

                    <Button
                      onClick={handleNextLesson}
                      className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                    >
                      {currentModuleIdx === modules.length - 1 && currentLessonIdx === moduleLessons.length - 1 ? 'Complete Lesson' : 'Next'}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No lessons available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}