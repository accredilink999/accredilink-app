import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Clock, Users, Edit2, Trash2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import CourseEditor from './CourseEditor';

export default function CourseLibrary({ onSelectCourse, isAdmin }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingCourseId, setEditingCourseId] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ is_active: true, is_archived: false }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId) => {
      await base44.entities.Course.delete(courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const handleDelete = (courseId) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteMutation.mutate(courseId);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="mandatory">Mandatory</SelectItem>
            <SelectItem value="specialist">Specialist</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="induction">Induction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses available"
          description="Check back soon for new training courses"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <Card key={course.id} className="p-4 hover:shadow-lg transition-shadow flex flex-col">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <h3 className="font-semibold text-slate-900 mb-1">{course.title}</h3>
              <p className="text-xs text-slate-500 mb-2 flex-grow">{course.description}</p>
              
              <div className="space-y-2 text-xs text-slate-600 mb-3">
                {course.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {course.duration_minutes} min
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded capitalize">
                    {course.category}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onSelectCourse(course)}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm"
                >
                  {isAdmin ? 'View' : 'Start Course'}
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      onClick={() => setEditingCourseId(course.id)}
                      variant="outline"
                      size="icon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(course.id)}
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Course Editor Modal */}
      {editingCourseId && (
        <CourseEditor
          isOpen={!!editingCourseId}
          courseId={editingCourseId}
          onClose={() => setEditingCourseId(null)}
          onSuccess={() => setEditingCourseId(null)}
        />
      )}
    </div>
  );
}