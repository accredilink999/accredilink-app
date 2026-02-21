import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { getServiceUserLocations } from '@/lib/gpsCache';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Search, Check, AlertCircle, ChevronDown, Edit, Loader2, Mail, Clock, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CompanyLogoUploader from '@/components/CompanyLogoUploader';
import EmailNotificationCenter from '@/components/admin/EmailNotificationCenter';
import ShiftStatusOverview from '@/components/admin/ShiftStatusOverview';
import ShiftReminderSettings from '@/components/admin/ShiftReminderSettings';
import { Trash2 } from 'lucide-react';

// Helper: flies the map to a target location when props change
function FlyToLocation({ lat, lng, zoom, onComplete }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom || 16, { duration: 1 });
      const timer = setTimeout(() => onComplete?.(), 1200);
      return () => clearTimeout(timer);
    }
  }, [lat, lng, zoom, map, onComplete]);
  return null;
}

export default function ControlRoom() {
  const queryClient = useQueryClient();
  const [mapMaximized, setMapMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('tracking');
  const [showLogoUploader, setShowLogoUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const mapRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager' || user?.job_title === 'supervisor';

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

  // Fetch today's shifts (all, not just active)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['todayShifts', todayStr],
    queryFn: () => ShiftApi.filter({ date: todayStr }),
    refetchInterval: 15000,
  });

  // Fetch ALL shift_calls for today's shifts
  const { data: todayCalls = [] } = useQuery({
    queryKey: ['todayCalls', todayShifts.map(s => s.id).join(',')],
    queryFn: async () => {
      if (todayShifts.length === 0) return [];
      const { data, error } = await supabase
        .from('shift_calls')
        .select('*')
        .in('shift_id', todayShifts.map(s => s.id))
        .neq('call_type', 'sitin_cover');
      if (error) throw error;
      return data || [];
    },
    enabled: todayShifts.length > 0,
    refetchInterval: 10000,
  });

  // Get unique service user IDs from today's calls
  const clientIds = [...new Set(todayCalls.map(c => c.service_user_id).filter(Boolean))];

  // Build address fallback map for geocoding new clients
  const addressFallbacks = React.useMemo(() => {
    const map = new Map();
    for (const call of todayCalls) {
      if (call.service_user_id && call.service_user_address && !map.has(call.service_user_id)) {
        map.set(call.service_user_id, call.service_user_address);
      }
    }
    return map;
  }, [todayCalls]);

  // Fetch cached GPS locations for all clients on today's calls
  const { data: clientLocations = new Map() } = useQuery({
    queryKey: ['clientLocations', ...clientIds],
    queryFn: () => getServiceUserLocations(clientIds, addressFallbacks),
    enabled: clientIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // ── STAFF LIVE GPS (separate from client/calls code) ────────────
  const staffOnShiftIds = React.useMemo(() => {
    return [...new Set(todayShifts
      .filter(s => s.staff_id && s.status !== 'cancelled')
      .map(s => s.staff_id)
    )];
  }, [todayShifts]);

  const { data: staffLocations = [] } = useQuery({
    queryKey: ['staffLiveLocations', staffOnShiftIds.join(',')],
    queryFn: async () => {
      if (staffOnShiftIds.length === 0) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('staff_id, staff_name, latitude, longitude, accuracy, timestamp')
        .in('staff_id', staffOnShiftIds);
      if (error) throw error;
      return data || [];
    },
    enabled: staffOnShiftIds.length > 0,
    refetchInterval: 15000,
  });

  const { data: lastKnownGPS = [] } = useQuery({
    queryKey: ['staffLastKnownGPS', staffOnShiftIds.join(','), todayStr],
    queryFn: async () => {
      if (staffOnShiftIds.length === 0) return [];
      const shiftIds = todayShifts
        .filter(s => staffOnShiftIds.includes(s.staff_id) && s.status !== 'cancelled')
        .map(s => s.id);
      if (shiftIds.length === 0) return [];
      const { data, error } = await supabase
        .from('shift_calls')
        .select('shift_id, checkin_latitude, checkin_longitude, clock_in_time')
        .in('shift_id', shiftIds)
        .not('checkin_latitude', 'is', null)
        .not('checkin_longitude', 'is', null)
        .order('clock_in_time', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: staffOnShiftIds.length > 0,
    staleTime: 60000,
  });

  // Subscribe to shift_calls for real-time updates
  useEffect(() => {
    const unsubscribe = ShiftCallApi.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['todayCalls'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Subscribe to locations table for live staff GPS updates
  useEffect(() => {
    const channel = supabase
      .channel('staff-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['staffLiveLocations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Subscribe to shift updates
  useEffect(() => {
    const unsubscribe = ShiftApi.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['todayShifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftsToday'] });
      queryClient.invalidateQueries({ queryKey: ['allShifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftStatusData'] });
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

  // Build client markers with call status
  const clientMarkers = React.useMemo(() => {
    const byClient = {};

    for (const call of todayCalls) {
      if (!call.service_user_id) continue;
      const coords = clientLocations.get(call.service_user_id);
      if (!coords) continue;

      // Find which shift this call belongs to (for staff name)
      const shift = todayShifts.find(s => s.id === call.shift_id);

      if (!byClient[call.service_user_id]) {
        byClient[call.service_user_id] = {
          id: call.service_user_id,
          name: call.service_user_name,
          address: call.service_user_address,
          lat: coords.latitude,
          lng: coords.longitude,
          calls: [],
        };
      }

      byClient[call.service_user_id].calls.push({
        ...call,
        staff_name: shift?.staff_name || 'Unknown',
        shift_name: shift?.shift_name || '',
      });
    }

    // Determine overall status for each client marker
    return Object.values(byClient).map(client => {
      const calls = client.calls.sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));
      const realCalls = calls.filter(c => c.call_type !== 'sitin_cover');
      // Only count as in_progress if staff has actually clocked in
      const hasInProgress = realCalls.some(c => c.status === 'in_progress' && c.clock_in_time);
      const allCompleted = realCalls.length > 0 && realCalls.every(c => c.status === 'completed' || c.status === 'missed');
      const latestCall = realCalls[realCalls.length - 1] || calls[calls.length - 1];

      let markerStatus = 'pending';
      let statusColor = '#10B981'; // green
      if (hasInProgress) {
        markerStatus = 'in_progress';
        statusColor = '#F59E0B'; // amber
      } else if (allCompleted) {
        markerStatus = 'completed';
        statusColor = '#10B981'; // green
      }

      return {
        ...client,
        calls,
        markerStatus,
        statusColor,
        latestCall,
        inProgressCall: realCalls.find(c => c.status === 'in_progress' && c.clock_in_time),
      };
    });
  }, [todayCalls, clientLocations, todayShifts]);

  // Active staff: staff with shifts today who have activity in last hour
  // Deduplicated by staff_id — multiple shifts for the same person are merged
  const activeStaffList = React.useMemo(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const byStaff = new Map();

    for (const shift of todayShifts) {
      if (!shift.staff_id || shift.status === 'cancelled') continue;

      const shiftCalls = todayCalls.filter(c => c.shift_id === shift.id);
      const realCalls = shiftCalls.filter(c => c.call_type !== 'sitin_cover');
      const totalCalls = realCalls.length;
      const completedCalls = realCalls.filter(c => c.status === 'completed').length;
      const hasInProgress = realCalls.some(c => c.status === 'in_progress' && c.clock_in_time);

      const hasRecentActivity = shift.clock_in_time ||
        shiftCalls.some(c =>
          (c.clock_in_time && c.clock_in_time > oneHourAgo) ||
          (c.clock_out_time && c.clock_out_time > oneHourAgo)
        );

      const shouldShow = shift.status !== 'completed' && (hasRecentActivity || shift.status === 'in_progress' || shift.clock_in_time);
      if (!shouldShow) continue;

      let statusLabel = 'Scheduled';
      let statusColor = 'text-slate-500';
      if (shift.status === 'completed') {
        statusLabel = 'Completed';
        statusColor = 'text-green-600';
      } else if (hasInProgress) {
        statusLabel = 'On Call';
        statusColor = 'text-amber-600';
      } else if (shift.status === 'in_progress' || shift.clock_in_time) {
        statusLabel = 'On Shift';
        statusColor = 'text-blue-600';
      }

      if (byStaff.has(shift.staff_id)) {
        const existing = byStaff.get(shift.staff_id);
        existing.totalCalls += totalCalls;
        existing.completedCalls += completedCalls;
        // Keep the more active status
        const priority = { 'On Call': 3, 'On Shift': 2, 'Scheduled': 1 };
        if ((priority[statusLabel] || 0) > (priority[existing.statusLabel] || 0)) {
          existing.statusLabel = statusLabel;
          existing.statusColor = statusColor;
        }
        // Widen the time range
        if (shift.start_time < existing.start_time) existing.start_time = shift.start_time;
        if (shift.end_time > existing.end_time) existing.end_time = shift.end_time;
      } else {
        byStaff.set(shift.staff_id, {
          ...shift,
          totalCalls,
          completedCalls,
          statusLabel,
          statusColor,
          hasRecentActivity,
        });
      }
    }

    return Array.from(byStaff.values())
      .sort((a, b) => (a.staff_name || '').localeCompare(b.staff_name || ''));
  }, [todayShifts, todayCalls]);

  // ── Staff map markers (live GPS + last known fallback) ──────────
  const staffMarkers = React.useMemo(() => {
    const markers = [];
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const gpsMap = new Map();
    for (const loc of staffLocations) {
      if (loc.latitude && loc.longitude) {
        gpsMap.set(loc.staff_id, loc);
      }
    }
    const shiftToStaff = new Map();
    for (const s of todayShifts) {
      if (s.staff_id) shiftToStaff.set(s.id, s.staff_id);
    }
    const lastKnownMap = new Map();
    for (const call of lastKnownGPS) {
      const sid = shiftToStaff.get(call.shift_id);
      if (sid && !lastKnownMap.has(sid)) {
        lastKnownMap.set(sid, {
          latitude: call.checkin_latitude,
          longitude: call.checkin_longitude,
          timestamp: call.clock_in_time,
        });
      }
    }
    for (const staffId of staffOnShiftIds) {
      const shift = todayShifts.find(s => s.staff_id === staffId && s.status !== 'cancelled');
      if (!shift) continue;
      const gps = gpsMap.get(staffId);
      const lastKnown = lastKnownMap.get(staffId);
      if (gps) {
        // Has a GPS record — "live" only if updated within last 2 minutes
        const isRecent = gps.timestamp && gps.timestamp > twoMinAgo;
        markers.push({
          staffId,
          staffName: gps.staff_name || shift.staff_name || 'Unknown',
          lat: Number(gps.latitude),
          lng: Number(gps.longitude),
          isLive: isRecent,
          accuracy: gps.accuracy,
          timestamp: gps.timestamp,
        });
      } else if (lastKnown) {
        markers.push({
          staffId,
          staffName: shift.staff_name || 'Unknown',
          lat: Number(lastKnown.latitude),
          lng: Number(lastKnown.longitude),
          isLive: false,
          timestamp: lastKnown.timestamp,
        });
      }
    }
    return markers;
  }, [staffOnShiftIds, staffLocations, lastKnownGPS, todayShifts]);

  // Map center from all markers (clients + staff)
  const allMapPoints = [
    ...clientMarkers.map(m => ({ lat: m.lat, lng: m.lng })),
    ...staffMarkers.map(m => ({ lat: m.lat, lng: m.lng })),
  ];
  const hasMarkers = allMapPoints.length > 0;
  const centerLat = hasMarkers
    ? allMapPoints.reduce((sum, m) => sum + m.lat, 0) / allMapPoints.length
    : 52.82;
  const centerLng = hasMarkers
    ? allMapPoints.reduce((sum, m) => sum + m.lng, 0) / allMapPoints.length
    : -3.40;

  // Lollipop icon with client name label
  const createClientLollipop = (color, name, isInProgress) => {
    const pulse = isInProgress ? 'animation:pulse 2s infinite;' : '';
    const labelText = name.length > 15 ? name.substring(0, 14) + '...' : name;
    return L.divIcon({
      className: 'client-lollipop',
      html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="font-size:9px;font-weight:600;color:#334155;background:white;padding:1px 4px;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,0.15);white-space:nowrap;margin-bottom:2px;max-width:100px;overflow:hidden;text-overflow:ellipsis;">${labelText}</div>
        <div style="width:18px;height:18px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);${pulse}"></div>
        <div style="width:2px;height:16px;background:${color};border-radius:1px;"></div>
      </div>
      <style>@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.15)}}</style>`,
      iconSize: [80, 50],
      iconAnchor: [40, 50],
      popupAnchor: [0, -50],
    });
  };

  // Staff GPS marker icon (blue = live, grey = last known)
  const createStaffIcon = (name, isLive) => {
    const color = isLive ? '#3B82F6' : '#9CA3AF';
    const pulse = isLive ? 'animation:staffPulse 2s infinite;' : '';
    const labelText = name.length > 15 ? name.substring(0, 14) + '...' : name;
    const liveDot = isLive
      ? '<div style="width:7px;height:7px;background:#22C55E;border-radius:50%;position:absolute;top:-1px;right:-1px;border:1.5px solid white;"></div>'
      : '';
    return L.divIcon({
      className: 'staff-gps-marker',
      html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="font-size:9px;font-weight:600;color:white;background:${color};padding:1px 5px;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.25);white-space:nowrap;margin-bottom:2px;max-width:100px;overflow:hidden;text-overflow:ellipsis;">${labelText}</div>
        <div style="position:relative;width:22px;height:22px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;${pulse}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          ${liveDot}
        </div>
      </div>
      <style>@keyframes staffPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.8;transform:scale(1.1)}}</style>`,
      iconSize: [80, 42],
      iconAnchor: [40, 42],
      popupAnchor: [0, -42],
    });
  };

  const renderStaffMarkers = () => (
    <>
      {staffMarkers.map(s => (
        <Marker
          key={`staff-${s.staffId}`}
          position={[s.lat, s.lng]}
          icon={createStaffIcon(s.staffName, s.isLive)}
        >
          <Popup>
            <div className="text-sm p-2 w-48">
              <p className="font-bold text-slate-900">{s.staffName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${s.isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-slate-500">
                  {s.isLive ? 'Live GPS' : 'Last known location'}
                </span>
              </div>
              {s.timestamp && (
                <p className="text-xs text-slate-400 mt-1">
                  Updated: {format(new Date(s.timestamp), 'HH:mm')}
                </p>
              )}
              {s.accuracy && (
                <p className="text-xs text-slate-400">Accuracy: ±{Math.round(s.accuracy)}m</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );

  // Render client markers for map
  const renderClientMarkers = () => (
    <>
      {clientMarkers.map(client => (
        <Marker
          key={client.id}
          position={[client.lat, client.lng]}
          icon={createClientLollipop(client.statusColor, client.name, client.markerStatus === 'in_progress')}
        >
          <Popup>
            <div className="text-sm p-2 w-56 space-y-2">
              <p className="font-bold text-slate-900">{client.name}</p>
              {client.address && (
                <p className="text-xs text-slate-500">{client.address}</p>
              )}
              <div className="space-y-1.5 border-t border-slate-100 pt-2">
                {client.calls.map((call, idx) => {
                  const statusBg = call.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                    : call.status === 'completed' ? 'bg-green-100 text-green-700'
                    : call.status === 'missed' ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600';
                  const statusText = call.status === 'in_progress' ? 'In Progress'
                    : call.status === 'completed' ? 'Completed'
                    : call.status === 'missed' ? 'Not Home'
                    : 'Pending';

                  return (
                    <div key={idx} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{call.scheduled_time || '—'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBg}`}>{statusText}</span>
                      </div>
                      <p className="text-slate-500">{call.staff_name}</p>
                      {call.clock_in_time && (
                        <p className="text-slate-400">In: {format(new Date(call.clock_in_time), 'HH:mm')}</p>
                      )}
                      {call.clock_out_time && (
                        <p className="text-slate-400">Out: {format(new Date(call.clock_out_time), 'HH:mm')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );

  if (mapMaximized) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Control Room — Live Map</h1>
          <Button variant="outline" onClick={() => setMapMaximized(false)}>Minimize</Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {renderClientMarkers()}
            {renderStaffMarkers()}
            {flyToTarget && <FlyToLocation lat={flyToTarget.lat} lng={flyToTarget.lng} zoom={16} onComplete={() => setFlyToTarget(null)} />}
          </MapContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Room"
        subtitle="Live client map & staff tracking"
        icon={Navigation}
        className="[&_h1]:text-slate-900 [&_svg]:text-slate-700 [&_svg]:fill-slate-700 flex-col sm:flex-row"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link to={createPageUrl('ClientManagement')}>
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </Button>
          </Link>
          {isAdmin && (
            <>
              <Link to={createPageUrl('RotaManagement')}>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all">
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
        <button onClick={() => setActiveTab('tracking')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'tracking' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600'}`}>
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Tracking</span>
          <span className="sm:hidden">Map</span>
        </button>
        <button onClick={() => setActiveTab('shifts')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'shifts' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600'}`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Today's Shifts</span>
          <span className="sm:hidden">Shifts</span>
        </button>
        <button onClick={() => setActiveTab('announcements')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'announcements' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Announcements</span>
          <span className="sm:hidden">Announce</span>
        </button>
        <button onClick={() => setActiveTab('email-settings')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'email-settings' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' : 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-600'}`}>
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Email</span>
          <span className="sm:hidden">Mail</span>
        </button>
      </div>

      {activeTab === 'tracking' && isAdmin && (
      <div className="max-w-4xl space-y-4">
        {/* Map */}
        <Card className="p-0 bg-white border-0 shadow-sm overflow-hidden relative group h-[350px] z-0">
          <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {renderClientMarkers()}
            {renderStaffMarkers()}
            {flyToTarget && <FlyToLocation lat={flyToTarget.lat} lng={flyToTarget.lng} zoom={16} onComplete={() => setFlyToTarget(null)} />}
          </MapContainer>
          {clientMarkers.length === 0 && staffMarkers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <p className="text-slate-500 text-xs">No markers to show — client and staff markers will appear when shifts are active</p>
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

        {/* Map Legend */}
        <div className="flex flex-wrap gap-3 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            In Progress
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            Completed / Pending
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Staff (Live)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            Staff (Last Known)
          </div>
          <div className="text-xs text-slate-400">
            {clientMarkers.length} client{clientMarkers.length !== 1 ? 's' : ''} · {staffMarkers.length} staff on map
          </div>
        </div>

        {/* Active Staff List */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Staff ({activeStaffList.length})
          </h3>
          {activeStaffList.length === 0 ? (
            <p className="text-sm text-slate-500">No active staff in the last hour</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeStaffList.map(shift => {
                const gpsMarker = staffMarkers.find(m => m.staffId === shift.staff_id);
                return (
                  <div
                    key={shift.staff_id}
                    className={`flex items-center justify-between p-3 bg-slate-50 rounded-lg transition-colors ${gpsMarker ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => {
                      if (!gpsMarker) return;
                      setFlyToTarget({ lat: gpsMarker.lat, lng: gpsMarker.lng });
                      setMapMaximized(true);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        gpsMarker?.isLive ? 'bg-blue-500 animate-pulse' :
                        gpsMarker ? 'bg-gray-400' :
                        'bg-transparent border border-dashed border-slate-300'
                      }`} title={gpsMarker?.isLive ? 'Live GPS' : gpsMarker ? 'Last known' : 'No GPS'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{shift.staff_name}</p>
                        <p className="text-xs text-slate-500">{shift.shift_name} &middot; {shift.start_time}–{shift.end_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-slate-600">{shift.completedCalls}/{shift.totalCalls} calls</span>
                      <span className={`text-xs font-medium ${shift.statusColor}`}>{shift.statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
