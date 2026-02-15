import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isPast, addDays, isWithinInterval } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import CourseLibrary from '@/components/training/CourseLibrary';
import MyCoursesView from '@/components/training/MyCoursesView';
import TrainingAnalytics from '@/components/training/TrainingAnalytics';
import AICourseBuilder from '@/components/training/AICourseBuilder';
import CoursePlayer from '@/components/training/CoursePlayer';
import AssignCourses from '@/components/training/AssignCourses';
import { 
  Plus, 
  Search, 
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Upload,
  ExternalLink,
  BookOpen,
  BarChart3,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Training() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIBuilderOpen, setIsAIBuilderOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [enhancingAllCourses, setEnhancingAllCourses] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    training_name: '',
    category: 'mandatory',
    provider: '',
    completion_date: '',
    expiry_date: '',
    certificate_url: '',
    notes: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const { data: training = [], isLoading } = useQuery({
    queryKey: ['training'],
    queryFn: () => base44.entities.Training.list('-completion_date'),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Training.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      staff_id: '',
      training_name: '',
      category: 'mandatory',
      provider: '',
      completion_date: '',
      expiry_date: '',
      certificate_url: '',
      notes: ''
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, certificate_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    const staffMember = staff.find(s => s.id === formData.staff_id);
    let status = 'valid';
    
    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      const now = new Date();
      const thirtyDaysFromNow = addDays(now, 30);
      
      if (isPast(expiryDate)) {
        status = 'expired';
      } else if (isWithinInterval(expiryDate, { start: now, end: thirtyDaysFromNow })) {
        status = 'expiring_soon';
      }
    }

    createMutation.mutate({
      ...formData,
      staff_name: staffMember?.full_name,
      status
    });
  };

  const handleEnhanceAllCourses = async () => {
    if (!confirm('This will enhance ALL courses with additional AI-generated content from the internet. This may take several minutes. Continue?')) {
      return;
    }

    setEnhancingAllCourses(true);
    toast.info('Starting course enhancement...');

    try {
      const courses = await base44.entities.Course.filter({ is_active: true, is_archived: false });
      let successCount = 0;
      let failCount = 0;

      for (const course of courses) {
        try {
          const modules = await base44.entities.Module.filter({ course_id: course.id });
          const existingContent = modules.map(m => `Module: ${m.title}\n${m.description}`).join('\n\n');

          const allLessons = await base44.entities.Lesson.list();
          const courseLessons = allLessons.filter(l => l.course_id === course.id);
          const fullContent = modules.map(m => {
            const moduleLessons = courseLessons.filter(l => l.module_id === m.id);
            const lessonsDetail = moduleLessons.map(l => 
              `  - ${l.title}: ${l.content?.substring(0, 300) || l.description || 'No content'}`
            ).join('\n');
            return `Module: ${m.title}
Description: ${m.description || 'No description'}
Lessons:
${lessonsDetail}`;
          }).join('\n\n');

          const prompt = `Enhance this training course with extensive internet research:

Title: ${course.title}
Description: ${course.description}
Category: ${course.category}
Difficulty: ${course.difficulty_level}

EXISTING CONTENT:
${fullContent}

CRITICAL INSTRUCTIONS:
- Search the internet extensively for latest training materials, videos, and resources
- Keep existing modules but greatly expand their content (300-500 words per lesson)
- Add 2-4 NEW modules to fill any gaps in coverage
- Find and include relevant YouTube training videos (use full URLs: https://www.youtube.com/watch?v=ID)
- Research real-world case studies and best practices
- Expand assessment to 20+ questions based on enhanced content
- Include latest industry regulations and standards

Return ONLY valid JSON (no markdown) with this COMPLETE structure:
{
  "course": {
    "title": "${course.title}",
    "description": "enhanced description",
    "category": "${course.category}",
    "difficulty_level": "${course.difficulty_level}",
    "duration_minutes": estimated_total,
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
          "content_type": "text|video|document",
          "video_url": "https://www.youtube.com/watch?v=..." (if applicable)
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

          await base44.entities.Course.update(course.id, {
            description: result.course.description,
            duration_minutes: result.course.duration_minutes
          });

          const oldModules = await base44.entities.Module.filter({ course_id: course.id });
          for (const oldModule of oldModules) {
            const oldLessons = await base44.entities.Lesson.filter({ module_id: oldModule.id });
            for (const oldLesson of oldLessons) {
              await base44.entities.Lesson.delete(oldLesson.id);
            }
            await base44.entities.Module.delete(oldModule.id);
          }

          if (result.modules) {
            for (let i = 0; i < result.modules.length; i++) {
              const moduleData = result.modules[i];
              const module = await base44.entities.Module.create({
                course_id: course.id,
                title: moduleData.title,
                description: moduleData.description,
                order_index: i
              });

              if (moduleData.lessons) {
                for (let j = 0; j < moduleData.lessons.length; j++) {
                  const lessonData = moduleData.lessons[j];
                  await base44.entities.Lesson.create({
                    course_id: course.id,
                    module_id: module.id,
                    title: lessonData.title,
                    description: lessonData.description,
                    content: lessonData.content,
                    content_type: lessonData.content_type || 'text',
                    video_url: lessonData.video_url || undefined,
                    document_url: lessonData.document_url || undefined,
                    order_index: j
                  });
                }
              }
            }
          }

          if (result.assessment) {
            const existingAssessment = await base44.entities.Assessment.filter({ course_id: course.id });
            if (existingAssessment.length > 0) {
              await base44.entities.Assessment.update(existingAssessment[0].id, {
                questions: JSON.stringify(result.assessment.questions || [])
              });
            }
          }

          successCount++;
          toast.success(`Enhanced: ${course.title}`);
        } catch (error) {
          console.error(`Failed to enhance ${course.title}:`, error);
          failCount++;
          toast.error(`Failed: ${course.title}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(`Enhancement complete! ${successCount} enhanced, ${failCount} failed.`);
    } catch (error) {
      toast.error('Failed to enhance courses: ' + error.message);
    } finally {
      setEnhancingAllCourses(false);
    }
  };

  const getStatus = (record) => {
    if (!record.expiry_date) return 'valid';
    const expiryDate = new Date(record.expiry_date);
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    
    if (isPast(expiryDate)) return 'expired';
    if (isWithinInterval(expiryDate, { start: now, end: thirtyDaysFromNow })) return 'expiring_soon';
    return 'valid';
  };

  const myTraining = training.filter(t => t.staff_id === user?.id);
  const allTraining = training;

  const validCount = training.filter(t => getStatus(t) === 'valid').length;
  const expiringCount = training.filter(t => getStatus(t) === 'expiring_soon').length;
  const expiredCount = training.filter(t => getStatus(t) === 'expired').length;

  const filteredTraining = (isAdmin ? allTraining : myTraining).filter(t => {
    const matchesSearch = t.training_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.staff_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(t);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by staff
  const groupedByStaff = filteredTraining.reduce((acc, t) => {
    if (!acc[t.staff_id]) {
      acc[t.staff_id] = {
        name: t.staff_name,
        records: []
      };
    }
    acc[t.staff_id].records.push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Training & Development" 
        subtitle="Comprehensive LMS for staff compliance and development"
        icon={GraduationCap}
        className="[&_h1]:text-slate-900 [&_svg]:text-cyan-600 [&_svg]:fill-cyan-600"
      >
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setIsAIBuilderOpen(true)} className="bg-amber-600 hover:bg-amber-700">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Course Builder
            </Button>
            <Button 
              onClick={handleEnhanceAllCourses}
              disabled={enhancingAllCourses}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {enhancingAllCourses ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance All with AI
                </>
              )}
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Training
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Tab Navigation */}
      <Tabs defaultValue="my-courses" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-2'} overflow-x-auto`}>
          <TabsTrigger value="my-courses" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">My Courses</span>
            <span className="sm:hidden">Courses</span>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="courses" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Course Library</span>
                <span className="sm:hidden">Library</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Assignments</span>
                <span className="sm:hidden">Assign</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="legacy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
            Records
          </TabsTrigger>
        </TabsList>

        {/* My Courses Tab */}
        <TabsContent value="my-courses" className="mt-6">
          <MyCoursesView userId={user?.id} onResumeCourse={(courseId, completionId) => {
            setSelectedCourseId(courseId);
          }} />
        </TabsContent>

        {/* Course Library Tab */}
        <TabsContent value="courses" className="mt-6">
          <CourseLibrary isAdmin={isAdmin} onSelectCourse={(course) => {
            if (isAdmin) {
              setSelectedCourseId(course.id);
            }
          }} />
        </TabsContent>

        {/* Assignments Tab */}
        {isAdmin && (
          <TabsContent value="assignments" className="mt-6">
            <AssignCourses />
          </TabsContent>
        )}

        {/* Analytics Tab */}
        {isAdmin && (
          <TabsContent value="analytics" className="mt-6">
            <TrainingAnalytics />
          </TabsContent>
        )}

        {/* Legacy Training Records */}
        <TabsContent value="legacy" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{validCount}</p>
              <p className="text-sm text-emerald-600">Valid</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3">
             <Clock className="w-5 h-5 text-amber-600" />
             <div>
               <p className="text-2xl font-bold text-amber-700">{expiringCount}</p>
               <p className="text-sm text-amber-600">Expiring Soon</p>
             </div>
           </div>
         </Card>
         <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{expiredCount}</p>
              <p className="text-sm text-red-600">Expired</p>
            </div>
          </div>
        </Card>
      </div>

          {/* Filters */}
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm">
             <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row">
               <div className="relative flex-1 min-w-0">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input
                   placeholder="Search training..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 text-xs sm:text-sm py-2 sm:py-3"
                 />
               </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Training List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 h-24 animate-pulse bg-gradient-to-r from-blue-100 to-purple-100" />
          ))}
        </div>
      ) : Object.keys(groupedByStaff).length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No training records"
          description="Add training records to track compliance."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByStaff).map(([staffId, data]) => {
            const validRecords = data.records.filter(r => getStatus(r) === 'valid').length;
            const totalRecords = data.records.length;
            const compliancePercent = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0;

            return (
              <Card key={staffId} className="p-3 sm:p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={data.name} />
                    <div>
                      <h3 className="font-semibold text-slate-900">{data.name}</h3>
                      <p className="text-sm text-slate-500">{validRecords}/{totalRecords} valid</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{compliancePercent}%</p>
                    <Progress value={compliancePercent} className="w-24 h-2" />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                   {data.records.map((record) => {
                     const status = getStatus(record);
                     return (
                       <div 
                         key={record.id}
                         className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors ${
                           status === 'valid' ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' :
                           status === 'expiring_soon' ? 'bg-amber-50/50 border-amber-100 hover:bg-amber-50' : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                         }`}
                       >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            status === 'valid' ? 'bg-emerald-100' :
                            status === 'expiring_soon' ? 'bg-amber-100' : 'bg-red-100'
                          }`}>
                            <GraduationCap className={`w-4 h-4 ${
                              status === 'valid' ? 'text-emerald-600' :
                              status === 'expiring_soon' ? 'text-amber-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{record.training_name}</p>
                            <p className="text-xs text-slate-500">
                              {record.category} • {record.provider && `${record.provider} • `}
                              {record.expiry_date && `Expires: ${format(new Date(record.expiry_date), 'dd MMM yyyy')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status} />
                          {record.certificate_url && (
                            <a href={record.certificate_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                     );
                   })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
        </TabsContent>
      </Tabs>

      {/* Add Training Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Training Record</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Staff Member *</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(value) => setFormData({...formData, staff_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Training Name *</Label>
              <Input
                value={formData.training_name}
                onChange={(e) => setFormData({...formData, training_name: e.target.value})}
                placeholder="e.g. Moving & Handling"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandatory">Mandatory</SelectItem>
                    <SelectItem value="specialist">Specialist</SelectItem>
                    <SelectItem value="refresher">Refresher</SelectItem>
                    <SelectItem value="induction">Induction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Completion Date</Label>
                <Input
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({...formData, completion_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Certificate</Label>
              <div className="mt-2">
                {formData.certificate_url ? (
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certificate uploaded
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        {uploading ? 'Uploading...' : 'Upload certificate'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.staff_id || !formData.training_name || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Training'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Course Builder */}
      <AICourseBuilder 
       isOpen={isAIBuilderOpen} 
       onClose={() => setIsAIBuilderOpen(false)}
       onSuccess={() => {
         queryClient.invalidateQueries({ queryKey: ['courses'] });
       }}
      />

      {/* Course Player Modal */}
      <CoursePlayer 
        isOpen={!!selectedCourseId} 
        onClose={() => setSelectedCourseId(null)} 
        courseId={selectedCourseId} 
      />
      </div>
      );
      }