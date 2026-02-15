import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CalendarView({ events, currentDate, onDateChange, onEventClick, viewMode = 'month' }) {
  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const weekStart = startOfWeek(start);
    const weekEnd = endOfWeek(end);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getDayEvents = (day) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      return isSameDay(eventStart, day);
    });
  };

  const monthDays = viewMode === 'month' ? getMonthDays() : getWeekDays();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <h2 className="text-lg font-semibold">
          {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {viewMode === 'month' ? (
        <div className="border rounded-lg bg-white">
          <div className="grid grid-cols-7 gap-px bg-slate-200 p-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-slate-100 p-2 text-center font-semibold text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 p-px">
            {monthDays.map(day => (
              <div
                key={day.toString()}
                className={`min-h-24 p-2 ${
                  isSameMonth(day, currentDate)
                    ? 'bg-white'
                    : 'bg-slate-50'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isSameMonth(day, currentDate)
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {getDayEvents(day).slice(0, 2).map(event => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left text-xs p-1 rounded text-white truncate hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: event.color_code }}
                    >
                      {event.title}
                    </button>
                  ))}
                  {getDayEvents(day).length > 2 && (
                    <div className="text-xs text-slate-500 px-1">
                      +{getDayEvents(day).length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {monthDays.map(day => (
            <div key={day.toString()} className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold mb-3">
                {format(day, 'EEEE, MMMM d')}
              </h3>
              <div className="space-y-2">
                {getDayEvents(day).length === 0 ? (
                  <p className="text-slate-500 text-sm">No events</p>
                ) : (
                  getDayEvents(day).map(event => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left p-3 rounded border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      style={{ borderLeftColor: event.color_code }}
                    >
                      <div className="font-semibold text-sm">{event.title}</div>
                      <div className="text-xs text-slate-600">
                        {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                      </div>
                      {event.location && (
                        <div className="text-xs text-slate-500">📍 {event.location}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}