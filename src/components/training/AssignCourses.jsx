import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, UserPlus, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '@/components/ui/Avatar';
import { format } from 'date-fns';

export default function AssignCourses() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ is_active: true, is_archived: false }),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['courseAssignments'],
    queryFn: () => base44.entities.CourseAssignment.list('-created_date'),
  });

  const assignMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.CourseAssignment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignments'] });
      toast.success('Course assigned successfully');
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseAssignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseAssignments'] });
      toast.success('Assignment removed');
    },
  });

  const handleAssign = () => {
    if (!selectedCourse || selectedStaff.length === 0) {
      toast.error('Please select a course and at least one staff member');
      return;
    }

    selectedStaff.forEach(staffId => {
      const staffMember = staff.find(s => s.id === staffId);
      assignMutation.mutate({
        course_id: selectedCourse,
        assigned_to: 'individual',
        target_id: staffId,
        target_name: staffMember?.staff_full_name || staffMember?.full_name,
        due_date: dueDate || undefined,
        assigned_date: new Date().toISOString().split('T')[0],
        assigned_by: 'admin'
      });
    });

    setAssignDialogOpen(false);
    setSelectedStaff([]);
    setSelectedCourse('');
    setDueDate('');
  };

  const filteredAssignments = assignments.filter(a => {
    const course = courses.find(c => c.id === a.course_id);
    return a.target_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const groupedByStaff = filteredAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.target_id]) {
      acc[assignment.target_id] = {
        name: assignment.target_name,
        assignments: []
      };
    }
    acc[assignment.target_id].assignments.push(assignment);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setAssignDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Course
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByStaff).map(([staffId, data]) => (
          <Card key={staffId} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={data.name} />
              <div>
                <h3 className="font-semibold text-slate-900">{data.name}</h3>
                <p className="text-sm text-slate-500">{data.assignments.length} assigned courses</p>
              </div>
            </div>

            <div className="space-y-2">
              {data.assignments.map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{assignment.course_title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="capitalize">{assignment.status?.replace('_', ' ')}</span>
                      {assignment.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {format(new Date(assignment.due_date), 'dd MMM yyyy')}
                        </span>
                      )}
                      {assignment.completed_at && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed: {format(new Date(assignment.completed_at), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {Object.keys(groupedByStaff).length === 0 && (
          <Card className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Course Assignments</h3>
            <p className="text-slate-500 mb-4">Start by assigning courses to staff members</p>
            <Button onClick={() => setAssignDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Assign First Course
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Course to Staff</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Course *</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Staff Members *</label>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                {staff.map(member => (
                  <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaff([...selectedStaff, member.id]);
                        } else {
                          setSelectedStaff(selectedStaff.filter(id => id !== member.id));
                        }
                      }}
                      className="rounded"
                    />
                    <Avatar name={member.staff_full_name || member.full_name} size="xs" />
                    <span className="text-sm">{member.staff_full_name || member.full_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Due Date (Optional)</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
              {selectedStaff.length > 0 ? (
                <p>Assigning to {selectedStaff.length} staff member{selectedStaff.length > 1 ? 's' : ''}</p>
              ) : (
                <p>Select staff members to assign the course</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedCourse || selectedStaff.length === 0 || assignMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}