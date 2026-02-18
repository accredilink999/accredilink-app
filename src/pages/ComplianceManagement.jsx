import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CalendarItemModal from '@/components/calendar/CalendarItemModal';
import { 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Lock
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parse, startOfWeek, endOfWeek, addDays } from 'date-fns';

export default function ComplianceManagement() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'day', 'week', 'month'
  const [remindingDocId, setRemindingDocId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: hrDocuments = [] } = useQuery({
    queryKey: ['hrDocuments'],
    queryFn: () => base44.entities.HRDocument.list('-expiry_date'),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list(),
  });

  const queryClient = useQueryClient();

  const sendReminderMutation = useMutation({
    mutationFn: async (docData) => {
      return await base44.functions.invoke('sendComplianceReminder', {
        documentId: docData.id,
        staffEmail: docData.staff_email,
        documentTitle: docData.title,
        expiryDate: docData.expiry_date
      });
    },
    onSuccess: () => {
      setRemindingDocId(null);
    },
  });

  const clearDocumentMutation = useMutation({
    mutationFn: async (docId) => {
      return await base44.entities.HRDocument.delete(docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrDocuments'] });
    },
  });

  const { data: documentRequirements = [] } = useQuery({
    queryKey: ['documentRequirements'],
    queryFn: () => base44.entities.DocumentRequirement.list(),
  });

  const tasksAndDocs = useMemo(() => {
    const items = [];

    // Add overdue/due HR Documents
    hrDocuments.forEach(doc => {
      if (doc.expiry_date) {
        items.push({
          id: `doc-${doc.id}`,
          title: doc.title,
          date: doc.expiry_date,
          type: 'document',
          staff: doc.staff_name,
          status: new Date(doc.expiry_date) < new Date() ? 'overdue' : 
                  new Date(doc.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'due_soon' : 'upcoming'
        });
      }
    });

    // Add care plan review dates
    serviceUsers.forEach(user => {
      if (user.plan_review_date) {
        items.push({
          id: `carePlan-${user.id}`,
          title: `Care Plan Review - ${user.full_name}`,
          date: user.plan_review_date,
          type: 'care_plan',
          staff: user.full_name,
          status: new Date(user.plan_review_date) < new Date() ? 'overdue' : 
                  new Date(user.plan_review_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'due_soon' : 'upcoming'
        });
      }
    });

    return items;
  }, [hrDocuments, serviceUsers]);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const daysCells = [
    ...Array(startOfMonth(currentDate).getDay()).fill(null),
    ...monthDays,
  ];

  const itemsByDate = useMemo(() => {
    const map = {};
    tasksAndDocs.forEach(item => {
      const dateStr = format(parse(item.date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd');
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    });
    return map;
  }, [tasksAndDocs]);

  const statusColors = {
    overdue: 'bg-red-100 text-red-700 border-red-300',
    due_soon: 'bg-orange-100 text-orange-700 border-orange-300',
    upcoming: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const statusIcons = {
    overdue: <AlertTriangle className="w-4 h-4" />,
    due_soon: <Clock className="w-4 h-4" />,
    upcoming: <CheckCircle className="w-4 h-4" />
  };

  const overdueDocs = tasksAndDocs.filter(item => item.status === 'overdue');
  const dueSoonDocs = tasksAndDocs.filter(item => item.status === 'due_soon');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compliance Management" 
        subtitle="Track due and overdue documents and tasks"
        icon={Lock}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueDocs.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Due Soon (30 days)</p>
              <p className="text-2xl font-bold text-orange-600">{dueSoonDocs.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Tracked</p>
              <p className="text-2xl font-bold text-slate-900">{tasksAndDocs.length}</p>
            </div>
            <Shield className="w-8 h-8 text-teal-500" />
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {viewType === 'day' ? format(currentDate, 'EEEE, MMMM d, yyyy') :
               viewType === 'week' ? `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}` :
               format(currentDate, 'MMMM yyyy')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50">
                <Button 
                  variant={viewType === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('day')}
                  className="text-xs"
                >
                  Day
                </Button>
                <Button 
                  variant={viewType === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('week')}
                  className="text-xs"
                >
                  Week
                </Button>
                <Button 
                  variant={viewType === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('month')}
                  className="text-xs"
                >
                  Month
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
                  else if (viewType === 'week') setCurrentDate(addDays(currentDate, -7));
                  else setCurrentDate(addDays(currentDate, -1));
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
                  else if (viewType === 'week') setCurrentDate(addDays(currentDate, 7));
                  else setCurrentDate(addDays(currentDate, 1));
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day View */}
          {viewType === 'day' && (
            <div className="space-y-4">
              {(() => {
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const items = itemsByDate[dateStr] || [];
                return (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-3">{format(currentDate, 'EEEE, MMMM d')}</h4>
                    {items.length === 0 ? (
                      <p className="text-slate-500 text-center py-6">No compliance items on this day</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              setShowItemModal(true);
                            }}
                            className={`w-full text-left p-3 rounded border ${statusColors[item.status]} hover:opacity-80 transition-opacity`}
                          >
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.staff && <p className="text-xs mt-1">{item.staff}</p>}
                            <p className="text-xs mt-1">Due: {item.date}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Week View */}
          {viewType === 'week' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={format(day, 'yyyy-MM-dd')} className="text-center text-xs font-semibold text-slate-600">
                    <div>{format(day, 'EEE')}</div>
                    <div className={isSameDay(day, new Date()) ? 'text-teal-600 font-bold' : ''}>{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const items = itemsByDate[dateStr] || [];
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={dateStr}
                      className={`min-h-32 p-2 border rounded-lg ${isToday ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="space-y-1">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              setShowItemModal(true);
                            }}
                            className={`w-full text-left text-xs p-1 rounded border ${statusColors[item.status]} truncate hover:opacity-80 transition-opacity`}
                            title={item.title}
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month View */}
          {viewType === 'month' && (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {daysCells.map((day, idx) => {
                  const isCurrentMonth = day && isSameMonth(day, currentDate);
                  const dateStr = day ? format(day, 'yyyy-MM-dd') : '';
                  const items = itemsByDate[dateStr] || [];
                  const isToday = day && isSameDay(day, new Date());

                  return (
                    <div
                      key={idx}
                      className={`min-h-24 p-2 border rounded-lg ${
                        isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                      } ${isToday ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-semibold mb-1 ${
                            isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                          }`}>
                            {format(day, 'd')}
                          </div>
                          <div className="space-y-1">
                            {items.slice(0, 2).map(item => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowItemModal(true);
                                }}
                                className={`w-full text-left text-xs p-1 rounded border ${statusColors[item.status]} truncate hover:opacity-80 transition-opacity`}
                                title={item.title}
                              >
                                {item.title}
                              </button>
                            ))}
                            {items.length > 2 && (
                              <div className="text-xs text-slate-600 px-1">
                                +{items.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Upcoming Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Compliance Items</h3>
        <div className="space-y-3">
          {overdueDocs.length === 0 && dueSoonDocs.length === 0 && tasksAndDocs.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No compliance items to track</p>
          ) : (
            <>
              {overdueDocs.map(doc => {
                const hrDoc = hrDocuments.find(d => d.id === doc.id.replace('doc-', ''));
                return (
                  <div key={doc.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{doc.title}</p>
                      {doc.staff && <p className="text-sm text-slate-600">{doc.staff}</p>}
                      <p className="text-sm text-red-600">Overdue: {doc.date}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {(user?.role === 'admin' || user?.role === 'super_admin') && hrDoc && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRemindingDocId(doc.id);
                              sendReminderMutation.mutate({
                                id: hrDoc.id,
                                staff_email: hrDoc.created_by,
                                title: hrDoc.title,
                                expiry_date: hrDoc.expiry_date
                              });
                            }}
                            disabled={remindingDocId === doc.id || sendReminderMutation.isPending}
                            className="text-xs"
                          >
                            {remindingDocId === doc.id ? 'Sending...' : 'Remind'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => clearDocumentMutation.mutate(hrDoc.id)}
                            disabled={clearDocumentMutation.isPending}
                            className="text-xs text-slate-600 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Badge className="bg-red-100 text-red-700">OVERDUE</Badge>
                    </div>
                  </div>
                );
              })}
              
              {dueSoonDocs.map(doc => {
                const hrDoc = hrDocuments.find(d => d.id === doc.id.replace('doc-', ''));
                return (
                  <div key={doc.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{doc.title}</p>
                      {doc.staff && <p className="text-sm text-slate-600">{doc.staff}</p>}
                      <p className="text-sm text-orange-600">Due: {doc.date}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {(user?.role === 'admin' || user?.role === 'super_admin') && hrDoc && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => clearDocumentMutation.mutate(hrDoc.id)}
                          disabled={clearDocumentMutation.isPending}
                          className="text-xs text-slate-600 hover:text-orange-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Badge className="bg-orange-100 text-orange-700 flex-shrink-0">DUE SOON</Badge>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </Card>

      {/* Item Detail Modal */}
      <CalendarItemModal 
        item={selectedItem}
        open={showItemModal}
        onOpenChange={setShowItemModal}
      />
    </div>
  );
}