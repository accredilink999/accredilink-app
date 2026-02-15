import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';

export default function TrainingAnalytics() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [dateRange, setDateRange] = useState('30days');

  const { data: completions = [] } = useQuery({
    queryKey: ['allCompletions'],
    queryFn: () => base44.entities.CourseCompletion.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['allAssignments'],
    queryFn: () => base44.entities.CourseAssignment.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['coursesList'],
    queryFn: () => base44.entities.Course.list(),
  });

  const completionRate = assignments.length > 0
    ? Math.round((completions.filter(c => c.status === 'completed').length / assignments.length) * 100)
    : 0;

  const complianceStatus = [
    { name: 'Compliant', value: completions.filter(c => c.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: completions.filter(c => c.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Not Started', value: assignments.filter(a => !completions.find(c => c.course_id === a.course_id)).length, color: '#ef4444' }
  ];

  const courseCompletionData = courses.map(course => {
    const total = assignments.filter(a => a.course_id === course.id).length;
    const completed = completions.filter(c => c.course_id === course.id && c.status === 'completed').length;
    return {
      name: course.title,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
      total
    };
  });

  const stats = [
    { label: 'Total Assignments', value: assignments.length, icon: Users, color: 'bg-blue-50' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, color: 'bg-emerald-50' },
    { label: 'In Progress', value: completions.filter(c => c.status === 'in_progress').length, icon: Clock, color: 'bg-amber-50' },
    { label: 'Overdue', value: assignments.filter(a => a.status === 'expired').length, icon: AlertCircle, color: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={`p-4 ${stat.color}`}>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-600">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compliance Status Pie Chart */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Compliance Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={complianceStatus} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                {complianceStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Course Completion Bar Chart */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Course Completion Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion" fill="#0891b2" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Course Details Table */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Course Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-2 font-semibold text-slate-900">Course</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-900">Assigned</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-900">Completed</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-900">Rate</th>
              </tr>
            </thead>
            <tbody>
              {courseCompletionData.map((course, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-900 font-medium">{course.name}</td>
                  <td className="text-center py-3 px-2 text-slate-600">{course.total}</td>
                  <td className="text-center py-3 px-2 text-slate-600">{completions.filter(c => c.course_id === course.name && c.status === 'completed').length}</td>
                  <td className="text-center py-3 px-2">
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded font-semibold">{course.completion}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}