import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Loader2, ChevronRight, ChevronLeft, Play, FileText, BookOpen, Menu, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function CoursePlayer({ isOpen, onClose, courseId }) {
  const queryClient = useQueryClient();
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    mutationFn: async () => {
      const completionData = {
        course_id: courseId,
        staff_id: user.id,
        staff_name: user.staff_full_name || user.full_name,
        status: 'completed',
        progress_percent: 100,
        completed_date: new Date().toISOString()
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
    
    // Check if this is the last lesson
    const isLastLesson = currentModuleIdx === modules.length - 1 && currentLessonIdx === moduleLessons.length - 1;
    
    // If this was the last lesson and we've now completed all lessons, trigger completion
    if (isLastLesson && updatedCompleted.size === totalLessons) {
      completeMutation.mutate();
      return;
    }
    
    // Otherwise, navigate to next lesson
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
            {currentLesson ? (
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

                  {/* Content */}
                  {currentLesson.video_url && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <a
                        href={currentLesson.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 hover:bg-slate-100 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{currentLesson.title}</p>
                          <p className="text-xs text-slate-500">Watch on YouTube</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      </a>
                      <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-500">This video is hosted externally by its creator. CareCall AI does not own or control external content.</p>
                      </div>
                    </div>
                  )}

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