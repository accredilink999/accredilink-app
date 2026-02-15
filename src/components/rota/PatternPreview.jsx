import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, CalendarDays } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PatternPreview({ shifts, patternType, staffName, patternName }) {
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'daily'
  const days = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
  ];

  const getWeekCount = () => {
    switch (patternType) {
      case 'weekly': return 1;
      case 'two_week': return 2;
      case 'three_week': return 3;
      case 'four_week': return 4;
      default: return 1;
    }
  };

  const getShiftTypeColor = (type) => {
    switch (type) {
      case 'early': return { color: '#f59e0b' };
      case 'late': return { color: '#3b82f6' };
      case 'night': return { color: '#a855f7' };
      case 'long_day': return { color: '#14b8a6' };
      default: return { color: '#64748b' };
    }
  };

  const getShiftsForDay = (day, week) => {
    return shifts.filter(s => s.day_of_week === day && s.week === week);
  };

  const weekCount = getWeekCount();

  const renderDailyView = () => {
    return (
      <div className="space-y-3">
        {Array.from({ length: weekCount }, (_, weekIndex) => {
          const week = weekIndex + 1;
          return (
            <div key={week} className="space-y-2">
              {weekCount > 1 && (
                <p className="text-xs font-semibold text-slate-500">Week {week}</p>
              )}
              {days.map((day) => {
                const dayShifts = getShiftsForDay(day.value, week);
                return (
                  <Card key={`${week}-${day.value}`} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700">{day.label}</p>
                      {dayShifts.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {dayShifts.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No shifts</p>
                      ) : (
                        dayShifts.map((shift, idx) => {
                            const colors = getShiftTypeColor(shift.shift_type);
                            return (
                            <div
                              key={idx}
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: colors.color }}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-white" />
                                  <span className="text-sm font-semibold text-white">
                                    {shift.start_time} - {shift.end_time}
                                  </span>
                                </div>
                                {staffName && (
                                  <div className="text-xs font-medium text-white">
                                    {staffName}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                          })
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeeklyView = () => {
    return (
      <div className="space-y-4">
        {Array.from({ length: weekCount }, (_, weekIndex) => {
          const week = weekIndex + 1;
          return (
            <div key={week}>
              {weekCount > 1 && (
                <p className="text-xs font-semibold text-slate-500 mb-2">Week {week}</p>
              )}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayShifts = getShiftsForDay(day.value, week);
                  return (
                    <Card key={`${week}-${day.value}`} className="p-2 min-h-[80px]">
                      <p className="text-xs font-medium text-slate-600 mb-1">{day.label}</p>
                      <div className="space-y-1">
                        {dayShifts.length === 0 ? (
                          <div className="text-center py-2">
                            <span className="text-xs text-slate-300">-</span>
                          </div>
                        ) : (
                          dayShifts.map((shift, idx) => {
                            const colors = getShiftTypeColor(shift.shift_type);
                            return (
                            <div
                              key={idx}
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: colors.color }}
                            >
                              <div className="flex items-center gap-0.5 mb-1">
                                <Clock className="w-2.5 h-2.5 text-white" />
                                <span className="text-[9px] font-medium text-white">
                                  {shift.start_time}-{shift.end_time}
                                </span>
                              </div>
                              {staffName && (
                                <div className="text-[8px] font-medium truncate text-white">
                                  {staffName}
                                </div>
                              )}
                            </div>
                          );
                          })
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Live Rota Preview</h3>
        <div className="flex items-center gap-2">
          {patternName && (
            <Badge variant="outline" className="text-xs">
              {patternName}
            </Badge>
          )}
          {staffName && (
            <Badge variant="secondary" className="text-xs">
              {staffName}
            </Badge>
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
              className="h-7 px-2"
            >
              <Calendar className="w-3 h-3 mr-1" />
              <span className="text-xs">Week</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              className="h-7 px-2"
            >
              <CalendarDays className="w-3 h-3 mr-1" />
              <span className="text-xs">Daily</span>
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'weekly' ? renderWeeklyView() : renderDailyView()}

      {shifts.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Add shifts to see the preview
        </div>
      )}
    </div>
  );
}