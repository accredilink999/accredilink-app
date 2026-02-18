import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, startOfWeek } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/ui/PageHeader';
import MonthView from '@/components/rota/MonthView';
import WeekView from '@/components/rota/WeekView';
import DayView from '@/components/rota/DayView';
import ShiftDetailModal from '@/components/rota/ShiftDetailModal';
import CreateShiftModal from '@/components/rota/CreateShiftModal';
import PatternManager from '@/components/rota/PatternManager';
import BaseShiftTemplateManager from '@/components/rota/BaseShiftTemplateManager';
import ClaimShiftModal from '@/components/rota/ClaimShiftModal';
import RotaAreaSelector from '@/components/rota/RotaAreaSelector';
import ClientCallManager from '@/components/rota/ClientCallManager';
import ShiftTypeManager from '@/components/rota/ShiftTypeManager';
import { ChevronLeft, ChevronRight, Plus, Settings, Phone, Tag, CalendarDays, MapPin, LayoutTemplate } from 'lucide-react';

export default function RotaManagement() {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPatternManagerOpen, setIsPatternManagerOpen] = useState(false);
  const [isCallManagerOpen, setIsCallManagerOpen] = useState(false);
  const [isShiftTypeManagerOpen, setIsShiftTypeManagerOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [createShiftDate, setCreateShiftDate] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [isCreateAreaOpen, setIsCreateAreaOpen] = useState(false);
  const [isManageAreasOpen, setIsManageAreasOpen] = useState(false);
  const [shiftFilter, setShiftFilter] = useState('my-shifts');
  const [claimShift, setClaimShift] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Auto-initialize first rota area
  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  React.useEffect(() => {
    if (selectedAreaId === null && rotaAreas.length > 0) {
      setSelectedAreaId(rotaAreas[0].id);
    }
  }, [rotaAreas, selectedAreaId]);

  const isAdmin = user?.role === 'admin';

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Reset to today when switching views
  React.useEffect(() => {
    setCurrentDate(new Date());
  }, [view]);

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

  const getDateRangeText = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rota Management"
        subtitle="Schedule shifts and manage calls"
        icon={CalendarDays}
        className="[&_h1]:text-slate-900 [&_svg]:text-orange-500 [&_svg]:fill-orange-500"
      />

      {/* Controls Bar */}
      <div className="space-y-3 -mt-2">
        {/* Row 1: Area dropdown + navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <RotaAreaSelector
            selectedAreaId={selectedAreaId}
            onAreaChange={setSelectedAreaId}
            isAdmin={isAdmin}
            userId={user?.id}
            createOpen={isCreateAreaOpen}
            onCreateOpenChange={setIsCreateAreaOpen}
            manageOpen={isManageAreasOpen}
            onManageOpenChange={setIsManageAreasOpen}
          />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="h-9 w-9">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleToday} className="text-xs sm:text-sm px-2 sm:px-3 h-9">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Row 2: Add Shift + Manage Areas side by side */}
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateShift(currentDate)}
              className="bg-teal-600 hover:bg-teal-700 gap-1.5 text-xs sm:text-sm h-9 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              Add Shift
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsManageAreasOpen(true)}
              className="gap-1.5 text-xs sm:text-sm h-9 flex-1 sm:flex-none"
            >
              <Settings className="w-4 h-4" />
              Manage Areas
            </Button>
          </div>
        )}

        {/* Row 3: Create Area + Patterns + Base Templates */}
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsCreateAreaOpen(true)}
              className="gap-1.5 text-xs sm:text-sm h-9 flex-1 md:flex-none"
            >
              <Plus className="w-4 h-4" />
              Create Area
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsPatternManagerOpen(true)}
            className="gap-1.5 text-xs sm:text-sm h-9 flex-1 md:flex-none"
          >
            <Settings className="w-4 h-4" />
            Patterns
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsTemplateManagerOpen(true)}
              className="gap-1.5 text-xs sm:text-sm h-9 flex-1 md:flex-none"
            >
              <LayoutTemplate className="w-4 h-4" />
              Base Templates
            </Button>
          )}
        </div>

        {/* Row 4: Client Calls + Shift Types side by side */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCallManagerOpen(true)}
            className="gap-1.5 text-xs sm:text-sm h-9 flex-1 md:flex-none"
          >
            <Phone className="w-4 h-4" />
            Client Calls
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsShiftTypeManagerOpen(true)}
              className="gap-1.5 text-xs sm:text-sm h-9 flex-1 md:flex-none"
            >
              <Tag className="w-4 h-4" />
              Shift Types
            </Button>
          )}
        </div>
      </div>

      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{getDateRangeText()}</h2>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Tabs value={shiftFilter} onValueChange={setShiftFilter} className="flex-1">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="my-shifts" className="text-xs sm:text-sm">My Shifts</TabsTrigger>
            <TabsTrigger value="all-shifts" className="text-xs sm:text-sm">All Shifts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="day" className="text-xs sm:text-sm">Day</TabsTrigger>
          <TabsTrigger value="week" className="text-xs sm:text-sm">Week</TabsTrigger>
          <TabsTrigger value="month" className="text-xs sm:text-sm">Month</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6">
          <MonthView 
            currentDate={currentDate}
            onShiftClick={handleShiftClick}
            onCreateShift={handleCreateShift}
            isAdmin={isAdmin}
            selectedAreaId={selectedAreaId}
            shiftFilter={shiftFilter}
            userId={user?.id}
          />
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <WeekView 
            currentDate={currentDate}
            onShiftClick={handleShiftClick}
            onCreateShift={handleCreateShift}
            isAdmin={isAdmin}
            selectedAreaId={selectedAreaId}
            shiftFilter={shiftFilter}
            userId={user?.id}
          />
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <DayView 
            currentDate={currentDate}
            onShiftClick={handleShiftClick}
            onCreateShift={handleCreateShift}
            isAdmin={isAdmin}
            userId={user?.id}
            selectedAreaId={selectedAreaId}
            shiftFilter={shiftFilter}
          />
        </TabsContent>
      </Tabs>

      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          open={!!selectedShift}
          onClose={() => setSelectedShift(null)}
          isAdmin={isAdmin}
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

      {isCallManagerOpen && (
        <ClientCallManager
          open={isCallManagerOpen}
          onClose={() => setIsCallManagerOpen(false)}
        />
      )}

      {isShiftTypeManagerOpen && (
        <ShiftTypeManager
          open={isShiftTypeManagerOpen}
          onClose={() => setIsShiftTypeManagerOpen(false)}
        />
      )}

      {isTemplateManagerOpen && (
        <BaseShiftTemplateManager
          open={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
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