import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format, startOfMonth, startOfWeek, addDays, isSameDay } from 'date-fns';
import { usePullToRefresh } from '@/components/hooks/usePullToRefresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";


import PageHeader from '@/components/ui/PageHeader';
import MonthView from '@/components/rota/MonthView';
import WeekView from '@/components/rota/WeekView';
import DayView from '@/components/rota/DayView';
import ShiftDetailModal from '@/components/rota/ShiftDetailModal';
import CreateShiftModal from '@/components/rota/CreateShiftModal';
import PatternManager from '@/components/rota/PatternManager';
import ClaimShiftModal from '@/components/rota/ClaimShiftModal';
import RotaAreaSelector from '@/components/rota/RotaAreaSelector';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';

export default function Rota() {
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const filterParam = urlParams.get('filter');
  const autoShiftId = urlParams.get('autoShift');

  const [view, setView] = useState(viewParam || 'day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPatternManagerOpen, setIsPatternManagerOpen] = useState(false);
  const [createShiftDate, setCreateShiftDate] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [isCreateAreaOpen, setIsCreateAreaOpen] = useState(false);
  const [showMyShiftsOnly, setShowMyShiftsOnly] = useState(filterParam === 'myshifts');
  const [claimShift, setClaimShift] = useState(null);
  const queryClient = useQueryClient();
  const autoShiftLoaded = useRef(false);

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['rotaAreas'] }),
      queryClient.refetchQueries({ queryKey: ['shifts'] }),
      queryClient.refetchQueries({ queryKey: ['shift-calls'] }),
      queryClient.refetchQueries({ queryKey: ['myRotaPermissions'] })
    ]);
  };

  const { containerRef, isPulling, pullDistance, pullPercentage } = usePullToRefresh(handleRefresh, { enable: false });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || ['manager', 'supervisor'].includes(user?.job_title);

  // Auto-open shift from URL param (set by ActiveShiftAutoOpen on app start)
  const { data: autoShiftData } = useQuery({
    queryKey: ['autoShift', autoShiftId],
    queryFn: () => ShiftApi.filter({ id: autoShiftId }),
    enabled: !!autoShiftId && !autoShiftLoaded.current,
  });

  useEffect(() => {
    if (autoShiftData?.length > 0 && !autoShiftLoaded.current) {
      autoShiftLoaded.current = true;
      setSelectedShift(autoShiftData[0]);
      // Clean the URL param without triggering a re-render
      const url = new URL(window.location);
      url.searchParams.delete('autoShift');
      window.history.replaceState({}, '', url);
    }
  }, [autoShiftData]);

  // Get user's permission for selected area
  const { data: myPermissions = [] } = useQuery({
    queryKey: ['myRotaPermissions', user?.id],
    queryFn: () => base44.entities.RotaPermission.filter({ staff_id: user?.id }),
    enabled: !!user?.id,
  });

  const currentPermission = myPermissions.find(p => p.rota_area_id === selectedAreaId);
  const canEdit = isAdmin || currentPermission?.permission_level === 'edit' || currentPermission?.permission_level === 'admin';
  const canAdmin = isAdmin || currentPermission?.permission_level === 'admin';

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleShiftClick = (shift) => {
    if (!shift.staff_id) {
      setClaimShift(shift);
    } else {
      setSelectedShift(shift);
    }
  };

  const handleCreateShift = (date) => {
    setCreateShiftDate(date);
    setIsCreateModalOpen(true);
  };

  const handleDayClick = (date) => {
    if (canEdit) {
      setCurrentDate(date);
      setView('day');
    }
  };

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const getDateRangeText = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, d MMMM yyyy');
    }
  };

  const selectedArea = rotaAreas.find(a => a.id === selectedAreaId);

  return (
    <div className="space-y-6">
      {isPulling && (
        <div className="flex justify-center py-4 text-teal-600 text-sm font-medium sticky top-0 z-50 bg-gradient-to-b from-white to-transparent">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent"
              style={{ 
                transform: `rotate(${pullPercentage * 3.6}deg)`,
                opacity: Math.min(pullPercentage / 100, 1)
              }}
            />
            <span>{pullPercentage >= 100 ? 'Release to refresh' : 'Pull to refresh'}</span>
          </div>
        </div>
      )}
      <PageHeader 
        title={selectedArea ? `Staff Rota - ${selectedArea.name}` : "Staff Rota"} 
        subtitle="Manage shifts, calls, and schedules"
      >
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap w-full sm:w-auto">
          <RotaAreaSelector
            selectedAreaId={selectedAreaId}
            onAreaChange={setSelectedAreaId}
            isAdmin={isAdmin}
            userId={user?.id}
            createOpen={isCreateAreaOpen}
            onCreateOpenChange={setIsCreateAreaOpen}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} className="text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-10">
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {canEdit && (
            <>
              <Button
                onClick={() => handleCreateShift(currentDate)}
                className="bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-10"
              >
                <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Shift</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPatternManagerOpen(true)}
                className="text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-10"
              >
                <Settings className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Patterns</span>
              </Button>
            </>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsCreateAreaOpen(true)}
              className="text-xs sm:text-sm px-2 sm:px-3 h-9 sm:h-10"
            >
              <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create Area</span>
              <span className="sm:hidden">Area</span>
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="text-center mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">{getDateRangeText()}</h2>
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="day" className="text-xs sm:text-sm py-2">Day</TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm py-2">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm py-2">Month</TabsTrigger>
          </TabsList>
          <Button
            variant={showMyShiftsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMyShiftsOnly(!showMyShiftsOnly)}
            className="ml-2 text-xs sm:text-sm whitespace-nowrap"
          >
            {showMyShiftsOnly ? 'My Shifts' : 'All Shifts'}
          </Button>
        </div>
        <TabsContent value="month" className="mt-6">
          <MonthView 
            currentDate={currentDate}
            onShiftClick={handleShiftClick}
            onCreateShift={handleCreateShift}
            onDayClick={handleDayClick}
            isAdmin={canEdit}
            selectedAreaId={selectedAreaId}
            userId={user?.id}
            filterByUserId={showMyShiftsOnly ? user?.id : null}
          />
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <WeekView 
            currentDate={currentDate}
            onShiftClick={handleShiftClick}
            onCreateShift={handleCreateShift}
            onDayClick={handleDayClick}
            isAdmin={canEdit}
            selectedAreaId={selectedAreaId}
            userId={user?.id}
            filterByUserId={showMyShiftsOnly ? user?.id : null}
          />
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <DayView 
            currentDate={currentDate}
            onShiftClick={handleShiftClick}
            onCreateShift={handleCreateShift}
            isAdmin={canEdit}
            userId={user?.id}
            selectedAreaId={selectedAreaId}
            filterByUserId={showMyShiftsOnly ? user?.id : null}
          />
        </TabsContent>
      </Tabs>

      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          open={!!selectedShift}
          onClose={() => setSelectedShift(null)}
          isAdmin={canEdit}
          userId={user?.id}
        />
      )}

      {isCreateModalOpen && (
        <CreateShiftModal
          open={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateShiftDate(null);
          }}
          selectedDate={createShiftDate}
          selectedAreaId={selectedAreaId}
        />
      )}

      {isPatternManagerOpen && (
        <PatternManager
          open={isPatternManagerOpen}
          onClose={() => setIsPatternManagerOpen(false)}
        />
      )}

      {claimShift && (
        <ClaimShiftModal
          shift={claimShift}
          open={!!claimShift}
          onClose={() => setClaimShift(null)}
        />
      )}

      </div>
      );
      }