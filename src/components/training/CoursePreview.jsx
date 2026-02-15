import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, FileText, Clock, BarChart3, X } from 'lucide-react';

export default function CoursePreview({ isOpen, onClose, courseId }) {
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseId ? base44.entities.Course.get(courseId) : null,
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

  const { data: assessments = [] } = useQuery({
    queryKey: ['courseAssessments', courseId],
    queryFn: () => courseId ? base44.entities.Assessment.filter({ course_id: courseId }) : Promise.resolve([]),
    enabled: !!courseId
  });

  if (courseLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between">
            <span>{course?.title}</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Info */}
          <Card className="p-4 bg-gradient-to-r from-teal-50 to-blue-50">
            <p className="text-sm text-slate-700 mb-3">{course?.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Category</p>
                <p className="font-semibold text-slate-900 capitalize">{course?.category}</p>
              </div>
              <div>
                <p className="text-slate-500">Difficulty</p>
                <p className="font-semibold text-slate-900 capitalize">{course?.difficulty_level}</p>
              </div>
              <div>
                <p className="text-slate-500">Duration</p>
                <p className="font-semibold text-slate-900 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {course?.duration_minutes} min
                </p>
              </div>
              <div>
                <p className="text-slate-500">Pass Score</p>
                <p className="font-semibold text-slate-900">{course?.passing_score}%</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-3 mt-4">
              {modules.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No modules in this course</p>
              ) : (
                modules.map((module) => {
                  const moduleLessons = lessons.filter(l => l.module_id === module.id);
                  return (
                    <Card key={module.id} className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2">{module.title}</h3>
                      {module.description && <p className="text-sm text-slate-600 mb-3">{module.description}</p>}
                      <div className="space-y-2">
                        {moduleLessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded">
                            {lesson.content_type === 'video' && <Play className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                            {lesson.content_type === 'document' && <FileText className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />}
                            {lesson.content_type === 'text' && <div className="w-4 h-4 bg-slate-300 rounded mt-0.5 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{lesson.title}</p>
                              {lesson.description && <p className="text-xs text-slate-500">{lesson.description}</p>}
                              {lesson.video_url && (
                                <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  Watch video →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment" className="space-y-3 mt-4">
              {assessments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No assessment for this course</p>
              ) : (
                assessments.map((assessment) => {
                  const questions = assessment.questions ? JSON.parse(assessment.questions) : [];
                  return (
                    <Card key={assessment.id} className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2">{assessment.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{assessment.description}</p>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-slate-500">Type:</span> <Badge variant="outline" className="capitalize">{assessment.assessment_type}</Badge></div>
                        <div><span className="text-slate-500">Questions:</span> <span className="font-semibold">{questions.length}</span></div>
                        <div><span className="text-slate-500">Pass Score:</span> <span className="font-semibold">{assessment.passing_score}%</span></div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-4">
              <Card className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Modules:</span>
                    <span className="font-semibold">{modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Lessons:</span>
                    <span className="font-semibold">{lessons.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assessments:</span>
                    <span className="font-semibold">{assessments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Questions:</span>
                    <span className="font-semibold">
                      {assessments.reduce((sum, a) => {
                        const questions = a.questions ? JSON.parse(a.questions) : [];
                        return sum + questions.length;
                      }, 0)}
                    </span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}