import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EventForm from '@/components/calendar/EventForm';
import CalendarView from '@/components/calendar/CalendarView';
import { Plus, Trash2, Edit, Clock, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['workCalendarEvents'],
    queryFn: () => base44.entities.WorkCalendarEvent.list('-start_date', 200),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staffList'],
    queryFn: () => base44.entities.User.list(),
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const assignedNames = eventData.assigned_to
        .map(id => staffList.find(s => s.id === id)?.full_name)
        .filter(Boolean);

      return base44.entities.WorkCalendarEvent.create({
        ...eventData,
        assigned_names: assignedNames,
        created_by: user.id,
        created_by_name: user.full_name,
        color_code: eventData.color_code || '#3b82f6'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workCalendarEvents'] });
      setFormOpen(false);
      setSelectedEvent(null);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const assignedNames = eventData.assigned_to
        .map(id => staffList.find(s => s.id === id)?.full_name)
        .filter(Boolean);

      return base44.entities.WorkCalendarEvent.update(eventData.id, {
        ...eventData,
        assigned_names: assignedNames
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workCalendarEvents'] });
      setFormOpen(false);
      setSelectedEvent(null);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => base44.entities.WorkCalendarEvent.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workCalendarEvents'] });
      setSelectedEvent(null);
      setDetailsOpen(false);
    },
  });

  const handleSubmit = (formData) => {
    if (selectedEvent?.id) {
      updateEventMutation.mutate({ ...formData, id: selectedEvent.id });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const typeColors = {
    meeting: '#3b82f6',
    interview: '#f59e0b',
    training: '#10b981',
    deadline: '#ef4444',
    other: '#6366f1'
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Calendar"
        subtitle="Schedule and manage team events, meetings, and interviews"
        icon={CalendarDays}
        tutorialKey="WorkCalendar"
      >
        {isAdmin && (
          <Button
            onClick={() => {
              setSelectedEvent(null);
              setFormOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </PageHeader>

      <div className="space-y-4">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card className="p-6">
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    onClick={() => setViewMode('month')}
                    size="sm"
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    onClick={() => setViewMode('week')}
                    size="sm"
                  >
                    Week
                  </Button>
                </div>
              </div>

              <CalendarView
                events={events}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setDetailsOpen(true);
                }}
                viewMode={viewMode}
              />
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {events.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-slate-600">No events scheduled</p>
              </Card>
            ) : (
              events.map(event => (
                <Card
                  key={event.id}
                  className="p-4 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderLeftColor: event.color_code }}
                  onClick={() => {
                    setSelectedEvent(event);
                    setDetailsOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{event.title}</h3>
                        <Badge className={`capitalize ${
                          event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                          event.type === 'interview' ? 'bg-amber-100 text-amber-700' :
                          event.type === 'training' ? 'bg-green-100 text-green-700' :
                          event.type === 'deadline' ? 'bg-red-100 text-red-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {event.type}
                        </Badge>
                        <Badge variant="outline">{event.status}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.start_date), 'MMM d, HH:mm')}
                        </span>
                        {event.location && <span>📍 {event.location}</span>}
                      </div>

                      {event.description && (
                        <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                      )}

                      {event.assigned_names && event.assigned_names.length > 0 && (
                        <div className="text-sm">
                          <span className="text-slate-500">Assigned to: </span>
                          <span className="text-slate-700">{event.assigned_names.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Type:</span>
                  <p className="font-medium capitalize">{selectedEvent.type}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Status:</span>
                  <p className="font-medium capitalize">{selectedEvent.status}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Start:</span>
                  <p className="font-medium">
                    {format(new Date(selectedEvent.start_date), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">End:</span>
                  <p className="font-medium">
                    {format(new Date(selectedEvent.end_date), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {selectedEvent.location && (
                <div>
                  <span className="text-sm text-slate-500">Location:</span>
                  <p className="font-medium">{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <span className="text-sm text-slate-500">Description:</span>
                  <p className="text-slate-700">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.assigned_names && selectedEvent.assigned_names.length > 0 && (
                <div>
                  <span className="text-sm text-slate-500">Assigned to:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedEvent.assigned_names.map(name => (
                      <Badge key={name} className="bg-teal-100 text-teal-700">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    onClick={() => {
                      setFormOpen(true);
                    }}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Form */}
      <EventForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleSubmit}
        event={selectedEvent}
        staffList={staffList}
        isLoading={createEventMutation.isPending || updateEventMutation.isPending}
      />
    </div>
  );
}