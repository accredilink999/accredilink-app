import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { calculateDistance } from '@/components/DistanceCalculator';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Trash2, Search, Check, AlertCircle, ChevronDown, Edit, Loader2, Mail, Clock, Plus, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isToday, parseISO } from 'date-fns';
import CompanyLogoUploader from '@/components/CompanyLogoUploader';
import EmailNotificationCenter from '@/components/admin/EmailNotificationCenter';
import ShiftStatusOverview from '@/components/admin/ShiftStatusOverview';
import ShiftReminderSettings from '@/components/admin/ShiftReminderSettings';

export default function ControlRoom() {
  const queryClient = useQueryClient();
  const [tracking, setTracking] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapMaximized, setMapMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('tracking');
  const [showLogoUploader, setShowLogoUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [distanceMarkers, setDistanceMarkers] = useState([]);
  const [showMileageData, setShowMileageData] = useState(false);
  const mapRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.job_title === 'admin' || user?.job_title === 'manager' || user?.job_title === 'supervisor';

  const { data: staffLocations = [] } = useQuery({
    queryKey: ['staffLocations'],
    queryFn: () => base44.entities.Location.list('-timestamp', 100),
    refetchInterval: 3000,
  });

  const { data: mileageLocations = [] } = useQuery({
    queryKey: ['mileageLocations'],
    queryFn: () => base44.entities.Location.list('-timestamp', 500),
    enabled: activeTab === 'tracking' && showMileageData,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['acknowledgements'],
    queryFn: () => base44.entities.AnnouncementAcknowledgement.filter({}, '-acknowledged_at', 1000),
  });

  const { data: trackingSettings = [] } = useQuery({
    queryKey: ['trackingSettings'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'gps_tracking_enabled' }),
  });

  // GPS tracking defaults to ON — admin can turn it off if needed
  const globalTrackingEnabled = trackingSettings.length === 0 || trackingSettings[0]?.setting_value !== 'false';

  // Fetch today's shifts that are in_progress (staff currently on shift)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: activeShifts = [] } = useQuery({
    queryKey: ['activeShiftsToday', todayStr],
    queryFn: async () => {
      const shifts = await ShiftApi.filter({ date: todayStr });
      return shifts.filter(s => s.status === 'in_progress' || s.clock_in_time);
    },
    refetchInterval: 10000,
  });

  // Fetch all shift_calls with GPS data for today's active shifts
  const { data: gpsCallData = [] } = useQuery({
    queryKey: ['gpsCallData', activeShifts.map(s => s.id).join(',')],
    queryFn: async () => {
      if (activeShifts.length === 0) return [];
      const { data, error } = await supabase
        .from('shift_calls')
        .select('*')
        .in('shift_id', activeShifts.map(s => s.id))
        .not('checkin_latitude', 'is', null)
        .order('clock_in_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: activeShifts.length > 0,
    refetchInterval: 10000,
  });

  // Group GPS call data by staff_id (from the shift)
  const staffBreadcrumbs = React.useMemo(() => {
    const byStaff = {};
    for (const shift of activeShifts) {
      if (!shift.staff_id) continue;
      const shiftCalls = gpsCallData
        .filter(c => c.shift_id === shift.id && c.checkin_latitude && c.checkin_longitude)
        .sort((a, b) => new Date(a.clock_in_time) - new Date(b.clock_in_time));
      if (shiftCalls.length === 0) continue;
      if (!byStaff[shift.staff_id]) {
        byStaff[shift.staff_id] = {
          staff_id: shift.staff_id,
          staff_name: shift.staff_name,
          shift,
          points: [],
        };
      }
      for (const call of shiftCalls) {
        byStaff[shift.staff_id].points.push({
          lat: parseFloat(call.checkin_latitude),
          lng: parseFloat(call.checkin_longitude),
          time: call.clock_in_time,
          service_user: call.service_user_name,
          status: call.status,
          drove: call.drove_to_call,
          callId: call.id,
        });
      }
    }
    return Object.values(byStaff);
  }, [activeShifts, gpsCallData]);

  // Subscribe to shift_calls for real-time GPS updates on the map
  useEffect(() => {
    const unsubscribe = ShiftCallApi.subscribe((event) => {
      if (event.new?.checkin_latitude) {
        queryClient.invalidateQueries({ queryKey: ['gpsCallData'] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const announcements = messages.filter(m => m.type === 'announcement' || m.type === 'weather_warning');

  const getAnnouncementStats = (announcementId) => {
    const acks = acknowledgements.filter(a => a.announcement_id === announcementId);
    const activeStaff = staff.filter(s => s.is_active);

    return {
      total: activeStaff.length,
      acknowledged: acks.length,
      pending: activeStaff.length - acks.length,
      details: acks
    };
  };

  const updateAnnouncementMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.update(editingAnnouncement.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setShowEditDialog(false);
      setEditingAnnouncement(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (locationId) => base44.entities.Location.delete(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffLocations'] });
      setSelectedMarker(null);
    },
    onError: (error) => {
      console.error('Error deleting location:', error);
      queryClient.invalidateQueries({ queryKey: ['staffLocations'] });
    },
  });

  const toggleGlobalTrackingMutation = useMutation({
    mutationFn: async (enabled) => {
      if (trackingSettings[0]) {
        return base44.entities.SystemSettings.update(trackingSettings[0].id, { 
          setting_value: enabled ? 'true' : 'false' 
        });
      } else {
        return base44.entities.SystemSettings.create({
          setting_key: 'gps_tracking_enabled',
          setting_value: enabled ? 'true' : 'false',
          description: 'Controls GPS tracking for all staff members'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingSettings'] });
    },
  });

  // Subscribe to real-time location updates
  useEffect(() => {
    const unsubscribe = base44.entities.Location.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['staffLocations'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Subscribe to real-time shift updates
  useEffect(() => {
    const unsubscribe = ShiftApi.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['shiftsToday'] });
      queryClient.invalidateQueries({ queryKey: ['allShifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftStatusData'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const updateLocationMutation = useMutation({
   mutationFn: async (coords) => {
     return base44.entities.Location.create({
       staff_id: user.id,
       staff_name: user.staff_full_name || user.gps_map_name || user.full_name,
       latitude: coords.latitude,
       longitude: coords.longitude,
       accuracy: coords.accuracy,
       timestamp: new Date().toISOString()
     });
   },
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['staffLocations'] });
   },
  });

  useEffect(() => {
    if (!tracking || !user?.id) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(coords);
        updateLocationMutation.mutate(coords);
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, user?.id]);

  const toggleGlobalTracking = () => {
    toggleGlobalTrackingMutation.mutate(!globalTrackingEnabled);
  };

  const latestLocations = staffLocations.reduce((acc, loc) => {
    // Only include locations from the last 5 minutes
    const locationTime = new Date(loc.timestamp).getTime();
    const now = new Date().getTime();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    if (locationTime > fiveMinutesAgo) {
      if (!acc[loc.staff_id] || new Date(loc.timestamp) > new Date(acc[loc.staff_id].timestamp)) {
        acc[loc.staff_id] = loc;
      }
    }
    return acc;
  }, {});

  // Calculate map center from breadcrumb data OR location data
  const allPoints = staffBreadcrumbs.flatMap(s => s.points);
  const locationPoints = Object.values(latestLocations);
  const hasBreadcrumbs = allPoints.length > 0;
  const hasLocations = locationPoints.length > 0;
  const centerLat = hasBreadcrumbs
    ? allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length
    : hasLocations
    ? locationPoints.reduce((sum, loc) => sum + loc.latitude, 0) / locationPoints.length
    : 52.82;
  const centerLng = hasBreadcrumbs
    ? allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length
    : hasLocations
    ? locationPoints.reduce((sum, loc) => sum + loc.longitude, 0) / locationPoints.length
    : -3.40;

  const createMarkerIcon = (isCurrentUser) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${isCurrentUser ? '#3B82F6' : '#EF4444'}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  const createLollipopIcon = (color = '#F97316') => {
    return L.divIcon({
      className: 'lollipop-marker',
      html: `<div style="position:relative;width:14px;height:26px;">
        <div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);position:absolute;top:0;left:0;"></div>
        <div style="width:2px;height:14px;background:${color};position:absolute;top:12px;left:6px;border-radius:1px;"></div>
      </div>`,
      iconSize: [14, 26],
      iconAnchor: [7, 26],
      popupAnchor: [0, -26]
    });
  };

  const createLatestIcon = (color = '#10B981') => {
    return L.divIcon({
      className: 'latest-marker',
      html: `<div style="width:36px;height:36px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <div style="width:10px;height:10px;background:white;border-radius:50%;"></div>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  // Staff colors for breadcrumb trails
  const staffColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  // Render breadcrumb layers for map (used in both normal and maximized view)
  const renderBreadcrumbs = () => (
    <>
      {staffBreadcrumbs.map((staffData, sIdx) => {
        const color = staffColors[sIdx % staffColors.length];
        const points = staffData.points;
        const latestPoint = points[points.length - 1];
        const trailPositions = points.map(p => [p.lat, p.lng]);

        return (
          <React.Fragment key={staffData.staff_id}>
            {/* Breadcrumb polyline trail */}
            {trailPositions.length > 1 && (
              <Polyline
                positions={trailPositions}
                pathOptions={{ color, weight: 3, opacity: 0.7, dashArray: '8, 6' }}
              />
            )}
            {/* Lollipop markers for each check-in (except the latest) */}
            {points.slice(0, -1).map((pt, idx) => (
              <Marker
                key={`breadcrumb-${staffData.staff_id}-${idx}`}
                position={[pt.lat, pt.lng]}
                icon={createLollipopIcon(color)}
              >
                <Popup>
                  <div className="text-sm p-1 w-44">
                    <p className="font-semibold text-xs">{staffData.staff_name}</p>
                    <p className="text-xs text-slate-700">{pt.service_user}</p>
                    <p className="text-xs text-slate-500">{pt.time ? format(new Date(pt.time), 'HH:mm') : ''}</p>
                    {pt.drove && <p className="text-xs text-green-600">Drove to call</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* Latest position — large marker */}
            {latestPoint && (
              <Marker
                key={`latest-${staffData.staff_id}`}
                position={[latestPoint.lat, latestPoint.lng]}
                icon={createLatestIcon(color)}
              >
                <Popup>
                  <div className="text-sm p-2 w-48">
                    <p className="font-bold">{staffData.staff_name}</p>
                    <p className="text-xs text-slate-700">{latestPoint.service_user}</p>
                    <p className="text-xs text-slate-500">Last check-in: {latestPoint.time ? format(new Date(latestPoint.time), 'HH:mm') : ''}</p>
                    <p className="text-xs text-slate-500">{points.length} call{points.length !== 1 ? 's' : ''} tracked</p>
                    {latestPoint.status === 'in_progress' && (
                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Active</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );

  if (mapMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Control Room</h1>
          <Button
            variant="outline"
            onClick={() => setMapMaximized(false)}
            className="text-slate-600"
          >
            Minimize
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {Object.values(latestLocations).map((location) => (
              <Marker
                key={location.staff_id}
                position={[location.latitude, location.longitude]}
                icon={createMarkerIcon(location.staff_id === user?.id)}
                eventHandlers={{
                  click: () => setSelectedMarker(location)
                }}
              >
                <Popup>
                  <div className="text-sm p-2 space-y-2 w-48">
                    <p className="font-semibold">{location.staff_name}</p>
                    <p className="text-xs text-slate-600">±{location.accuracy.toFixed(0)}m accuracy</p>
                    <p className="text-xs text-slate-500">{new Date(location.timestamp).toLocaleTimeString()}</p>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteLocationMutation.mutate(location.id)}
                        className="w-full mt-2"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            {renderBreadcrumbs()}
            {showMileageData && mileageLocations.map((location) => (
              <Marker
                key={`mileage-${location.id}`}
                position={[location.latitude, location.longitude]}
                icon={createLollipopIcon()}
              >
                <Popup>
                  <div className="text-sm p-2 space-y-1 w-40">
                    <p className="font-semibold text-xs">{location.staff_name}</p>
                    <p className="text-xs text-slate-500">{new Date(location.timestamp).toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          </div>
          </div>
          );
          }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Control Room" 
        subtitle="Real-time GPS staff tracking & announcement logs"
        icon={Navigation}
        className="[&_h1]:text-slate-900 [&_svg]:text-slate-700 [&_svg]:fill-slate-700 flex-col sm:flex-row"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link to={createPageUrl('ClientManagement')}>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Clients
            </Button>
          </Link>
          {isAdmin && (
            <>
              <Link to={createPageUrl('RotaManagement')}>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </Link>
              <Button 
                onClick={() => setShowLogoUploader(!showLogoUploader)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
              >
                {showLogoUploader ? 'Hide' : 'Logo'}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {showLogoUploader && <CompanyLogoUploader />}

      {/* Tabs */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
        <button 
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'tracking' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600'}`}
        >
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Tracking</span>
          <span className="sm:hidden">Map</span>
        </button>
        <button 
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'shifts' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600'}`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Today's Shifts</span>
          <span className="sm:hidden">Shifts</span>
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'announcements' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600'}`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Announcements</span>
          <span className="sm:hidden">Announce</span>
        </button>
        <button 
          onClick={() => setActiveTab('email-settings')}
          className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'email-settings' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' : 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-600'}`}
        >
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Email</span>
          <span className="sm:hidden">Mail</span>
        </button>
      </div>

      {activeTab === 'tracking' && isAdmin && (
      <div className="max-w-4xl">
        {isAdmin && (
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm mb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Global GPS Tracking</h3>
                <p className="text-xs text-slate-600">Control location tracking for all staff members</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={toggleGlobalTracking}
                  disabled={toggleGlobalTrackingMutation.isPending}
                  className={`${globalTrackingEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-md w-full sm:w-auto`}
                >
                  {toggleGlobalTrackingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : globalTrackingEnabled ? (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Stop All Tracking
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Start All Tracking
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowMileageData(!showMileageData)}
                  className={`${showMileageData ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-500 hover:bg-slate-600'} text-white shadow-md w-full sm:w-auto`}
                >
                  {showMileageData ? 'Hide Mileage Data' : 'Show Mileage Data'}
                </Button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-slate-600">
                Status: {globalTrackingEnabled ? (
                  <span className="text-green-700 font-medium">All staff tracking enabled</span>
                ) : (
                  <span className="text-red-700 font-medium">All staff tracking disabled</span>
                )}
              </p>
            </div>
          </Card>
        )}

        <Card className="p-0 bg-white border-0 shadow-sm overflow-hidden relative group h-[300px] mb-24 z-0">
           <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
             <TileLayer
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               attribution='&copy; OpenStreetMap contributors'
             />
             {Object.values(latestLocations).map((location) => (
               <Marker
                 key={location.staff_id}
                 position={[location.latitude, location.longitude]}
                 icon={createMarkerIcon(location.staff_id === user?.id)}
                 eventHandlers={{
                   click: () => setSelectedMarker(location)
                 }}
               >
                 <Popup>
                   <div className="text-sm p-2 space-y-2 w-48">
                     <p className="font-semibold">{location.staff_name}</p>
                     <p className="text-xs text-slate-600">±{location.accuracy.toFixed(0)}m accuracy</p>
                     <p className="text-xs text-slate-500">{new Date(location.timestamp).toLocaleTimeString()}</p>
                     {isAdmin && (
                       <Button
                         size="sm"
                         variant="destructive"
                         onClick={() => deleteLocationMutation.mutate(location.id)}
                         className="w-full mt-2"
                       >
                         <Trash2 className="w-3 h-3 mr-1" />
                         Remove
                       </Button>
                     )}
                   </div>
                 </Popup>
               </Marker>
             ))}
             {renderBreadcrumbs()}
             {showMileageData && mileageLocations.map((location) => (
               <Marker
                 key={`mileage-${location.id}`}
                 position={[location.latitude, location.longitude]}
                 icon={createLollipopIcon()}
               >
                 <Popup>
                   <div className="text-sm p-2 space-y-1 w-40">
                     <p className="font-semibold text-xs">{location.staff_name}</p>
                     <p className="text-xs text-slate-500">{new Date(location.timestamp).toLocaleTimeString()}</p>
                   </div>
                 </Popup>
               </Marker>
             ))}
           </MapContainer>
          {Object.values(latestLocations).length === 0 && staffBreadcrumbs.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <p className="text-slate-500 text-xs">No active staff on shift — check-in GPS data will appear here</p>
            </div>
          )}
          <button
            onClick={() => setMapMaximized(true)}
            className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Maximize map"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v4m12-4h4v4M6 18h4v4m6-4h4v4" />
            </svg>
          </button>
        </Card>

        <Card className="p-4 bg-white border-0 shadow-sm overflow-hidden flex flex-col max-h-96">
           <div className="space-y-3 mb-3">
             <h3 className="font-semibold text-slate-900">Active Staff ({new Set([...Object.values(latestLocations).map(l => l.staff_id), ...staffBreadcrumbs.map(s => s.staff_id)]).size})</h3>
             {distanceMarkers.length === 2 && (
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                 <p className="text-sm font-medium text-slate-900 mb-2">Distance Calculation</p>
                 <p className="text-xs text-slate-600 mb-2">
                   {distanceMarkers[0].staff_name} → {distanceMarkers[1].staff_name}
                 </p>
                 <p className="text-lg font-bold text-blue-600">
                   {calculateDistance(distanceMarkers[0].latitude, distanceMarkers[0].longitude, distanceMarkers[1].latitude, distanceMarkers[1].longitude)} miles
                 </p>
                 <button
                   onClick={() => setDistanceMarkers([])}
                   className="text-xs text-blue-600 hover:text-blue-700 mt-2 underline"
                 >
                   Clear
                 </button>
               </div>
             )}
             {distanceMarkers.length === 1 && (
               <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                 Click another marker to calculate distance
               </p>
             )}
           </div>
           <div className="space-y-2 overflow-y-auto flex-1">
            {/* Location-tracked staff */}
            {Object.values(latestLocations).sort((a, b) => a.staff_name.localeCompare(b.staff_name)).map((location) => (
              <div key={location.staff_id} className={`flex items-center gap-2 p-2 rounded transition-colors cursor-pointer ${distanceMarkers.some(m => m.staff_id === location.staff_id) ? 'bg-blue-100 border border-blue-300' : 'bg-slate-50 hover:bg-slate-100'}`}>
                <button
                  onClick={() => {
                    mapRef.current?.setCenter({ lat: location.latitude, lng: location.longitude });
                    mapRef.current?.setZoom(16);
                    setSelectedMarker(location);
                    if (distanceMarkers.length < 2 && !distanceMarkers.some(m => m.staff_id === location.staff_id)) {
                      setDistanceMarkers([...distanceMarkers, location]);
                    }
                  }}
                  className="flex-1 flex items-center justify-between text-left cursor-pointer"
                >
                  <p className="text-sm font-medium text-slate-900">{location.staff_name}</p>
                  <p className="text-xs text-slate-500">±{location.accuracy.toFixed(0)}m</p>
                </button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLocationMutation.mutate(location.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            {/* Breadcrumb-tracked staff (from shift check-in GPS, not in Location table) */}
            {staffBreadcrumbs
              .filter(s => !latestLocations[s.staff_id])
              .sort((a, b) => a.staff_name.localeCompare(b.staff_name))
              .map((staffData) => {
                const latest = staffData.points[staffData.points.length - 1];
                const colorIdx = staffBreadcrumbs.indexOf(staffData);
                const color = staffColors[colorIdx % staffColors.length];
                return (
                  <div key={`bc-${staffData.staff_id}`} className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <button
                      onClick={() => {
                        if (mapRef.current && latest) {
                          mapRef.current.setView([latest.lat, latest.lng], 16);
                        }
                      }}
                      className="flex-1 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                        <p className="text-sm font-medium text-slate-900">{staffData.staff_name}</p>
                      </div>
                      <p className="text-xs text-slate-500">{staffData.points.length} check-in{staffData.points.length !== 1 ? 's' : ''}</p>
                    </button>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
      )}

      {activeTab === 'shifts' && isAdmin && (
      <div className="space-y-6">
        <ShiftStatusOverview />
        <ShiftReminderSettings />
      </div>
      )}

      {activeTab === 'announcements' && (
      <div className="space-y-4">
        {/* Search */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </Card>

        {/* Announcements Log */}
        <div className="space-y-2 sm:space-y-4">
          {announcements.filter(a =>
            a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.content?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((announcement) => {
            const stats = getAnnouncementStats(announcement.id);
            const isExpanded = expandedId === announcement.id;
            const pendingStaff = staff.filter(s => 
              s.is_active && !stats.details.some(a => a.staff_id === s.id)
            );

            return (
              <Card key={announcement.id} className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                    className="w-full text-left p-3 sm:p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 flex-1 break-words">
                              {announcement.title || 'Untitled'}
                            </h3>
                            <Badge variant={
                              announcement.priority === 'urgent' ? 'destructive' :
                              announcement.priority === 'high' ? 'secondary' : 'default'
                            } className="text-xs flex-shrink-0">
                              {announcement.priority === 'urgent' ? 'URGENT' : announcement.priority === 'high' ? 'HIGH' : 'NORMAL'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(announcement.created_date), 'dd MMM HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAnnouncement(announcement);
                                setShowEditDialog(true);
                              }}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnnouncementMutation.mutate(announcement.id);
                              }}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-4 pt-2 sm:pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                          {stats.acknowledged}/{stats.total}
                        </span>
                      </div>
                      {stats.pending > 0 && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <AlertCircle className="w-3 sm:w-4 h-3 sm:h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700">
                            {stats.pending}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  </button>
                  </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-3 sm:p-5 bg-slate-50 space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Acknowledged ({stats.acknowledged})
                      </h4>
                      {stats.details.length > 0 ? (
                        <div className="space-y-2">
                          {stats.details.sort((a, b) => new Date(b.acknowledged_at) - new Date(a.acknowledged_at)).map(ack => (
                            <div key={ack.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100">
                              <div>
                                <p className="font-medium text-slate-900">{ack.staff_name}</p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(ack.acknowledged_at), 'dd MMM yyyy • HH:mm')}
                                </p>
                              </div>
                              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No acknowledgements yet</p>
                      )}
                    </div>

                    {pendingStaff.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Pending Acknowledgement ({pendingStaff.length})
                        </h4>
                        <div className="space-y-2">
                          {pendingStaff.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                              <div>
                                <p className="font-medium text-slate-900">{s.full_name}</p>
                                <p className="text-xs text-slate-500 capitalize">{s.job_title?.replace(/_/g, ' ')}</p>
                              </div>
                              <Badge variant="outline" className="border-amber-300 text-amber-700">Pending</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      )}

      {activeTab === 'email-settings' && isAdmin && (
        <EmailNotificationCenter />
      )}

      {/* Edit Announcement Dialog */}
      {editingAnnouncement && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingAnnouncement.title || ''}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  value={editingAnnouncement.content || ''}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})}
                  placeholder="Announcement content"
                  rows={4}
                />
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={editingAnnouncement.priority || 'normal'} onValueChange={(value) => setEditingAnnouncement({...editingAnnouncement, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateAnnouncementMutation.mutate({
                  title: editingAnnouncement.title,
                  content: editingAnnouncement.content,
                  priority: editingAnnouncement.priority
                })}
                disabled={updateAnnouncementMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateAnnouncementMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}