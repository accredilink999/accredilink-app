import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, X, Edit2, Trash2, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function CourseEditor({ isOpen, onClose, courseId, onSuccess }) {
  const queryClient = useQueryClient();
  const [courseData, setCourseData] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonData, setNewLessonData] = useState({ moduleId: null, title: '', content_type: 'text', video_url: '' });
  const [enhancing, setEnhancing] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseId ? base44.entities.Course.get(courseId) : null,
    enabled: !!courseId
  });

  const { data: fetchedModules = [] } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => courseId ? base44.entities.Module.filter({ course_id: courseId }) : Promise.resolve([]),
    enabled: !!courseId
  });

  const { data: fetchedLessons = [] } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: () => courseId ? base44.entities.Lesson.filter({ course_id: courseId }) : Promise.resolve([]),
    enabled: !!courseId
  });

  useEffect(() => {
    if (course) {
      setCourseData(course);
    }
  }, [course]);

  useEffect(() => {
    setModules(fetchedModules);
  }, [fetchedModules]);

  useEffect(() => {
    setLessons(fetchedLessons);
  }, [fetchedLessons]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Course.update(courseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      onSuccess?.();
      onClose();
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ moduleId, data }) => {
      await base44.entities.Module.update(moduleId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId) => {
      await base44.entities.Module.delete(moduleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Module.create({
        course_id: courseId,
        title: newModuleTitle || 'New Module',
        order_index: modules.length
      });
    },
    onSuccess: () => {
      setNewModuleTitle('');
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
    }
  });

  const createLessonMutation = useMutation({
    mutationFn: async () => {
      if (!newLessonData.moduleId || !newLessonData.title) return;
      await base44.entities.Lesson.create({
        course_id: courseId,
        module_id: newLessonData.moduleId,
        title: newLessonData.title,
        content_type: newLessonData.content_type,
        video_url: newLessonData.video_url || undefined,
        order_index: lessons.filter(l => l.module_id === newLessonData.moduleId).length
      });
    },
    onSuccess: () => {
      setNewLessonData({ moduleId: null, title: '', content_type: 'text', video_url: '' });
      queryClient.invalidateQueries({ queryKey: ['courseLessons', courseId] });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, data }) => {
      await base44.entities.Lesson.update(lessonId, data);
    },
    onSuccess: () => {
      setEditingLessonId(null);
      queryClient.invalidateQueries({ queryKey: ['courseLessons', courseId] });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId) => {
      await base44.entities.Lesson.delete(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseLessons', courseId] });
    }
  });

  const handleSaveCourse = () => {
    if (!courseData) return;
    updateMutation.mutate({
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      difficulty_level: courseData.difficulty_level,
      duration_minutes: courseData.duration_minutes,
      passing_score: courseData.passing_score
    });
  };

  const handleEnhance = async () => {
    if (!confirm('This will enhance the course with AI-generated content from the internet. Continue?')) {
      return;
    }

    setEnhancing(true);
    toast.info('Enhancing course with AI...');

    try {
      const fullContent = modules.map(m => {
        const moduleLessons = lessons.filter(l => l.module_id === m.id);
        const lessonsDetail = moduleLessons.map(l => 
          `  - ${l.title}: ${l.content?.substring(0, 300) || l.description || 'No content'}`
        ).join('\n');
        return `Module: ${m.title}
Description: ${m.description || 'No description'}
Lessons:
${lessonsDetail}`;
      }).join('\n\n');

      const prompt = `Enhance this training course with extensive internet research:

Title: ${courseData.title}
Description: ${courseData.description}
Category: ${courseData.category}
Difficulty: ${courseData.difficulty_level}

EXISTING CONTENT:
${fullContent}

CRITICAL: Search the internet extensively for:
- Latest training materials, articles, and professional resources
- Real YouTube training videos (full URLs: https://www.youtube.com/watch?v=ID)
- Industry best practices and regulations
- Real-world case studies and examples

Generate COMPLETE course with:
- Keep existing modules but expand content to 300-500 words per lesson
- Add 2-4 NEW modules to fill gaps
- Include YouTube videos for each module
- Create 20+ assessment questions

Return ONLY valid JSON with this exact structure:
{
  "course": {
    "title": "${courseData.title}",
    "description": "...",
    "category": "${courseData.category}",
    "difficulty_level": "${courseData.difficulty_level}",
    "duration_minutes": 120,
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
          "content": "detailed 300-500 word content",
          "content_type": "text|video",
          "video_url": "https://www.youtube.com/watch?v=..."
        }
      ]
    }
  ],
  "assessment": {
    "title": "Course Assessment",
    "description": "...",
    "assessment_type": "multiple_choice",
    "passing_score": 70,
    "questions": [
      {"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A"}
    ]
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            course: { type: 'object', additionalProperties: true },
            modules: { type: 'array', items: { type: 'object', additionalProperties: true } },
            assessment: { type: 'object', additionalProperties: true }
          }
        }
      });

      await base44.entities.Course.update(courseId, {
        description: result.course.description,
        duration_minutes: result.course.duration_minutes
      });

      for (const oldModule of modules) {
        const oldLessons = lessons.filter(l => l.module_id === oldModule.id);
        for (const oldLesson of oldLessons) {
          await base44.entities.Lesson.delete(oldLesson.id);
        }
        await base44.entities.Module.delete(oldModule.id);
      }

      if (result.modules) {
        for (let i = 0; i < result.modules.length; i++) {
          const moduleData = result.modules[i];
          const module = await base44.entities.Module.create({
            course_id: courseId,
            title: moduleData.title,
            description: moduleData.description,
            order_index: i
          });

          if (moduleData.lessons) {
            for (let j = 0; j < moduleData.lessons.length; j++) {
              const lessonData = moduleData.lessons[j];
              await base44.entities.Lesson.create({
                course_id: courseId,
                module_id: module.id,
                title: lessonData.title,
                description: lessonData.description || '',
                content: lessonData.content,
                content_type: lessonData.content_type || 'text',
                video_url: lessonData.video_url || undefined,
                order_index: j
              });
            }
          }
        }
      }

      if (result.assessment) {
        const existingAssessment = await base44.entities.Assessment.filter({ course_id: courseId });
        if (existingAssessment.length > 0) {
          await base44.entities.Assessment.update(existingAssessment[0].id, {
            questions: JSON.stringify(result.assessment.questions || [])
          });
        } else {
          await base44.entities.Assessment.create({
            course_id: courseId,
            title: result.assessment.title,
            description: result.assessment.description,
            assessment_type: result.assessment.assessment_type || 'multiple_choice',
            questions: JSON.stringify(result.assessment.questions || []),
            passing_score: result.assessment.passing_score || 70
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseLessons', courseId] });
      toast.success('Course enhanced successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to enhance course: ' + error.message);
    } finally {
      setEnhancing(false);
    }
  };

  if (isLoading || !courseData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
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
          <DialogTitle>Edit Course: {courseData?.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-4 py-4">
            <div>
              <Label>Course Title *</Label>
              <Input
                value={courseData?.title || ''}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                placeholder="Course title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={courseData?.description || ''}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                placeholder="Course description"
                rows={3}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={courseData?.category || 'mandatory'} 
                  onValueChange={(value) => setCourseData({ ...courseData, category: value })}
                >
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
                <Select 
                  value={courseData?.difficulty_level || 'beginner'} 
                  onValueChange={(value) => setCourseData({ ...courseData, difficulty_level: value })}
                >
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={courseData?.duration_minutes || ''}
                  onChange={(e) => setCourseData({ ...courseData, duration_minutes: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  value={courseData?.passing_score || 70}
                  onChange={(e) => setCourseData({ ...courseData, passing_score: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4 py-4">
            <div className="space-y-3">
              {modules.map((module) => {
                const moduleLessons = lessons.filter(l => l.module_id === module.id);
                return (
                  <Card key={module.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{module.title}</h3>
                        <p className="text-xs text-slate-500">{moduleLessons.length} lessons</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingModuleId(editingModuleId === module.id ? null : module.id)}
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteModuleMutation.mutate(module.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {editingModuleId === module.id && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-lg mb-3">
                        <Input
                          value={module.title}
                          onChange={(e) => {
                            setModules(modules.map(m => m.id === module.id ? { ...m, title: e.target.value } : m));
                          }}
                          placeholder="Module title"
                        />
                        <Textarea
                          value={module.description || ''}
                          onChange={(e) => {
                            setModules(modules.map(m => m.id === module.id ? { ...m, description: e.target.value } : m));
                          }}
                          placeholder="Module description"
                          rows={2}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            updateModuleMutation.mutate({ moduleId: module.id, data: { title: module.title, description: module.description } });
                            setEditingModuleId(null);
                          }}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Save Module
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2 mb-3">
                      {moduleLessons.map((lesson) => (
                        <div key={lesson.id}>
                          {editingLessonId === lesson.id ? (
                            <div className="p-3 bg-amber-50 rounded-lg space-y-2">
                              <Input
                                value={lesson.title}
                                onChange={(e) => setLessons(lessons.map(l => l.id === lesson.id ? { ...l, title: e.target.value } : l))}
                                placeholder="Lesson title"
                                className="text-sm"
                              />
                              <Textarea
                                value={lesson.description || ''}
                                onChange={(e) => setLessons(lessons.map(l => l.id === lesson.id ? { ...l, description: e.target.value } : l))}
                                placeholder="Lesson description"
                                rows={2}
                                className="text-sm"
                              />
                              <Textarea
                                value={lesson.content || ''}
                                onChange={(e) => setLessons(lessons.map(l => l.id === lesson.id ? { ...l, content: e.target.value } : l))}
                                placeholder="Lesson content"
                                rows={4}
                                className="text-sm"
                              />
                              <Select 
                                value={lesson.content_type} 
                                onValueChange={(v) => setLessons(lessons.map(l => l.id === lesson.id ? { ...l, content_type: v } : l))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="document">Document</SelectItem>
                                </SelectContent>
                              </Select>
                              {lesson.content_type === 'video' && (
                                <Input
                                  value={lesson.video_url || ''}
                                  onChange={(e) => setLessons(lessons.map(l => l.id === lesson.id ? { ...l, video_url: e.target.value } : l))}
                                  placeholder="YouTube or video URL"
                                  className="text-sm"
                                />
                              )}
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
                                  onClick={() => {
                                    updateLessonMutation.mutate({ 
                                      lessonId: lesson.id, 
                                      data: { 
                                        title: lesson.title, 
                                        description: lesson.description,
                                        content: lesson.content,
                                        content_type: lesson.content_type,
                                        video_url: lesson.video_url
                                      } 
                                    });
                                  }}
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs"
                                  onClick={() => setEditingLessonId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-50 rounded flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {lesson.content_type === 'video' && <Play className="w-4 h-4 text-blue-500" />}
                                <span>{lesson.title}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingLessonId(lesson.id)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLessonMutation.mutate(lesson.id)}>
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {newLessonData.moduleId === module.id && (
                      <div className="space-y-2 p-3 bg-blue-50 rounded-lg mb-3">
                        <Input
                          value={newLessonData.title}
                          onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                          placeholder="Lesson title"
                          className="text-sm"
                        />
                        <Select value={newLessonData.content_type} onValueChange={(v) => setNewLessonData({ ...newLessonData, content_type: v })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                          </SelectContent>
                        </Select>
                        {newLessonData.content_type === 'video' && (
                          <Input
                            value={newLessonData.video_url}
                            onChange={(e) => setNewLessonData({ ...newLessonData, video_url: e.target.value })}
                            placeholder="YouTube or video URL"
                            className="text-sm"
                          />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => createLessonMutation.mutate()}>
                            Add Lesson
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setNewLessonData({ moduleId: null, title: '', content_type: 'text', video_url: '' })}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {newLessonData.moduleId !== module.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => setNewLessonData({ ...newLessonData, moduleId: module.id })}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Lesson
                      </Button>
                    )}
                  </Card>
                );
              })}

              <Card className="p-4 bg-slate-50 border-dashed">
                <div className="space-y-2">
                  <Input
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="New module title"
                  />
                  <Button
                    onClick={() => createModuleMutation.mutate()}
                    disabled={!newModuleTitle || createModuleMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleEnhance}
            disabled={enhancing}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {enhancing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance with AI
              </>
            )}
          </Button>
          <Button 
            onClick={handleSaveCourse}
            disabled={updateMutation.isPending || !courseData?.title}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}