import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Play, 
  Square, 
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';

export default function ClockInOut() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [careNotes, setCareNotes] = useState('');
  const [mood, setMood] = useState('');
  const [foodIntake, setFoodIntake] = useState('');
  const [fluidIntake, setFluidIntake] = useState('');
  const [personalCare, setPersonalCare] = useState(false);
  const [completedTasks, setCompletedTasks] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myShifts = [], isLoading } = useQuery({
    queryKey: ['myShifts', today, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return ShiftApi.filter({ 
        staff_id: user.id, 
        date: today 
      }, 'start_time');
    },
    enabled: !!user?.id
  });

  const { data: serviceUsers = {} } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: async () => {
      const users = await base44.entities.ServiceUser.list();
      const map = {};
      users.forEach(u => map[u.id] = u);
      return map;
    }
  });

  const activeShift = myShifts.find(s => s.status === 'in_progress');
  const isClientOnHold = activeShift && serviceUsers[activeShift.service_user_id]?.status === 'on_hold';

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }) => ShiftApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['myShifts'] });
      
      // Snapshot previous value
      const previousShifts = queryClient.getQueryData(['myShifts', today, user?.id]);
      
      // Optimistically update
      queryClient.setQueryData(['myShifts', today, user?.id], (old) =>
        old?.map(shift => shift.id === id ? { ...shift, ...data } : shift) || []
      );
      
      return { previousShifts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousShifts) {
        queryClient.setQueryData(['myShifts', today, user?.id], context.previousShifts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShifts'] });
      setCareNotes('');
      setMood('');
      setFoodIntake('');
      setFluidIntake('');
      setPersonalCare(false);
      setCompletedTasks({});
      setSelectedShift(null);
    },
  });

  const getLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError('Unable to get location');
        setLoadingLocation(false);
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleClockIn = (shift) => {
    const locationStr = location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Location unavailable';
    
    updateShiftMutation.mutate({
      id: shift.id,
      data: {
        status: 'in_progress',
        clock_in_time: new Date().toISOString(),
        clock_in_location: locationStr
      }
    });
  };

  const handleClockOut = () => {
    if (!activeShift) return;
    
    const locationStr = location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Location unavailable';
    
    const updatedTasks = activeShift.tasks?.map((task, idx) => ({
      ...task,
      completed: completedTasks[idx] || false
    })) || [];

    updateShiftMutation.mutate({
      id: activeShift.id,
      data: {
        status: 'completed',
        clock_out_time: new Date().toISOString(),
        clock_out_location: locationStr,
        care_notes: careNotes,
        mood,
        food_intake: foodIntake,
        fluid_intake: fluidIntake,
        personal_care_provided: personalCare,
        tasks: updatedTasks
      }
    });
  };

  return (
    <div className="space-y-6 dark:bg-slate-950 pb-10">
      <PageHeader 
        title="Clock In / Out" 
        subtitle={format(new Date(), 'EEEE, d MMMM yyyy')}
      />

      {/* Location Status */}
      <Card className="p-4 bg-white dark:bg-slate-950 border-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${location ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
              <MapPin className={`w-5 h-5 ${location ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-50">Location Status</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {loadingLocation ? 'Getting location...' : 
                 location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 
                 locationError || 'Location unavailable'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={getLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </Card>

      {/* Active Shift */}
      {activeShift && (
        <Card className={`p-6 border-0 shadow-sm ${isClientOnHold ? 'opacity-50 bg-gray-100 dark:bg-slate-800' : 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Currently Clocked In</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{activeShift.service_user_name}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-white/80 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">Clocked In At</p>
              <p className="font-semibold dark:text-slate-50">{format(new Date(activeShift.clock_in_time), 'HH:mm')}</p>
            </div>
            <div className="p-3 bg-white/80 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled Time</p>
              <p className="font-semibold dark:text-slate-50">{activeShift.start_time} - {activeShift.end_time}</p>
            </div>
          </div>

          {/* Tasks Checklist */}
          {activeShift.tasks?.length > 0 && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block dark:text-slate-200">Visit Tasks</Label>
              <div className="space-y-2">
                {activeShift.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-800/50 rounded-lg min-h-[44px]">
                    <Checkbox
                      checked={completedTasks[idx] || false}
                      onCheckedChange={(checked) => setCompletedTasks({...completedTasks, [idx]: checked})}
                    />
                    <span className="text-sm dark:text-slate-200">{task.task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isClientOnHold && (
            <div className="mb-6 p-4 bg-amber-100 border border-amber-400 rounded-lg">
              <p className="text-amber-800 font-semibold">This client is currently on hold. Care log fields are disabled.</p>
            </div>
          )}

          {/* Care Log Fields */}
          <div className={`space-y-4 mb-6 ${isClientOnHold ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm dark:text-slate-200">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="upset">Upset</SelectItem>
                    <SelectItem value="unwell">Unwell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm dark:text-slate-200">Food Intake</Label>
                <Select value={foodIntake} onValueChange={setFoodIntake}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm dark:text-slate-200">Fluid Intake</Label>
                <Select value={fluidIntake} onValueChange={setFluidIntake}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-800/50 rounded-lg min-h-[44px]">
              <Checkbox
                checked={personalCare}
                onCheckedChange={setPersonalCare}
              />
              <span className="text-sm dark:text-slate-200">Personal care provided</span>
            </div>

            <div>
              <Label className="text-sm dark:text-slate-200">Care Notes</Label>
              <Textarea
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                placeholder="Enter any observations or notes about this visit..."
                className="bg-white dark:bg-slate-800 dark:text-slate-50 dark:placeholder-slate-400 min-h-[100px]"
              />
            </div>
          </div>

          <Button 
            onClick={handleClockOut}
            disabled={updateShiftMutation.isPending || isClientOnHold}
            className="w-full h-12 bg-red-600 hover:bg-red-700"
          >
            {updateShiftMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            Clock Out & Complete Visit
          </Button>
        </Card>
      )}

      {/* Today's Shifts */}
      <Card className="p-5 bg-white dark:bg-slate-950 border-0 shadow-sm">
        <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Scheduled Visits/Shifts</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : myShifts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No visits scheduled"
            description="You have no visits scheduled for today."
          />
        ) : (
          <div className="space-y-3">
            {myShifts.map((shift) => (
              <div 
                key={shift.id}
                className={`p-4 rounded-xl border transition-all min-h-[80px] ${
                  shift.status === 'in_progress' 
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700' 
                    : shift.status === 'completed'
                    ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        shift.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 
                        shift.status === 'in_progress' ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                      {shift.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Clock className={`w-6 h-6 ${shift.status === 'in_progress' ? 'text-teal-600' : 'text-slate-400'}`} />
                      )}
                      </div>
                      <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{shift.service_user_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{shift.start_time} - {shift.end_time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <StatusBadge status={shift.status} />
                    {shift.status === 'scheduled' && !activeShift && (
                      <Button 
                        onClick={() => handleClockIn(shift)}
                        disabled={updateShiftMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700 h-10"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Clock In
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}