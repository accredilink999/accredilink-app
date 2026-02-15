import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, isPast, addDays } from 'date-fns';
import { BookOpen, Clock, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function MyCoursesView({ userId, onResumeCourse }) {
  const [generatingCerts, setGeneratingCerts] = React.useState(new Set());

  const { data: completions = [], isLoading } = useQuery({
    queryKey: ['myCourses', userId],
    queryFn: () => base44.entities.CourseCompletion.filter({ staff_id: userId }),
    enabled: !!userId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['myAssignments', userId],
    queryFn: () => base44.entities.CourseAssignment.filter({ target_id: userId }),
    enabled: !!userId,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  // Group by status
  const inProgress = completions.filter(c => c.status === 'in_progress');
  const completed = completions.filter(c => c.status === 'completed');
  const pending = assignments.filter(a => a.status === 'pending');

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-100" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* In Progress */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          In Progress ({inProgress.length})
        </h3>
        {inProgress.length === 0 ? (
          <p className="text-sm text-slate-500">No courses in progress</p>
        ) : (
          <div className="space-y-3">
            {inProgress.map(c => {
              const course = courses.find(co => co.id === c.course_id);
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{course?.title || c.course_id}</h4>
                    <span className="text-sm text-slate-500">{c.progress_percent}% complete</span>
                  </div>
                  <Progress value={c.progress_percent} className="mb-3" />
                  <Button
                    onClick={() => onResumeCourse(c.course_id, c.id)}
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Resume
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Assignments */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Pending Courses ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(a => {
              const course = courses.find(c => c.id === a.course_id);
              return (
                <Card key={a.id} className="p-4 border-amber-200 bg-amber-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-slate-900">{course?.title || a.course_id}</h4>
                      {a.due_date && (
                        <p className="text-sm text-slate-600">
                          Due: {format(new Date(a.due_date), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => onResumeCourse(a.course_id)}
                    >
                      Start
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Completed ({completed.length})
        </h3>
        {completed.length === 0 ? (
          <p className="text-sm text-slate-500">No courses completed yet</p>
        ) : (
          <div className="space-y-2">
            {completed.map(c => {
              const course = courses.find(co => co.id === c.course_id);
              const isGenerating = generatingCerts.has(c.id);

              return (
                <Card key={c.id} className="p-4 bg-emerald-50 border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{course?.title || c.course_id}</h4>
                      <p className="text-sm text-slate-600">
                        Completed: {format(new Date(c.completed_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    {c.certificate_url ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = c.certificate_url;
                          link.download = `certificate_${course?.title || 'course'}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Certificate
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isGenerating}
                        onClick={async () => {
                          try {
                            setGeneratingCerts(prev => new Set([...prev, c.id]));
                            await base44.functions.invoke('generateCertificate', { 
                              courseCompletionId: c.id 
                            });
                            window.location.reload();
                          } catch (error) {
                            console.error('Error generating certificate:', error);
                            setGeneratingCerts(prev => {
                              const next = new Set(prev);
                              next.delete(c.id);
                              return next;
                            });
                          }
                        }}
                      >
                        {isGenerating ? 'Generating...' : 'Generate'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {inProgress.length === 0 && pending.length === 0 && completed.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No courses assigned"
          description="You'll see your training courses here once they're assigned"
        />
      )}
    </div>
  );
}