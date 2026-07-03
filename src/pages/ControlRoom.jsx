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
import { MapPin, Navigation, Search, Check, AlertCircle, ChevronDown, Edit, Loader2, Mail, Clock, Plus, Users, Radio } from 'lucide-react';
import PagerPanel from '@/components/admin/PagerPanel';
import PagerSvg from '@/components/PagerSvg';
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
  const [activeTab, setActiveTab] = useState('announcements');
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

  // Fetch ALL service users so the map always has waypoints
  const { data: allServiceUsers = [] } = useQuery({
    queryKey: ['allServiceUsers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_users')
        .select('id, full_name, address, postcode, is_active')
        .eq('is_active', true);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build address fallbacks from service_users + today's call addresses
  const addressFallbacks = React.useMemo(() => {
    const map = new Map();
    for (const su of allServiceUsers) {
      if (su.id && su.address) map.set(su.id, su.address);
    }
    for (const call of todayCalls) {
      if (call.service_user_id && call.service_user_address && !map.has(call.service_user_id)) {
        map.set(call.service_user_id, call.service_user_address);
      }
    }
    return map;
  }, [allServiceUsers, todayCalls]);

  const clientIds = React.useMemo(() => {
    const fromCalls = todayCalls.map(c => c.service_user_id).filter(Boolean);
    const fromUsers = allServiceUsers.map(su => su.id);
    return [...new Set([...fromCalls, ...fromUsers])];
  }, [todayCalls, allServiceUsers]);

  // Geocode all client locations (postcode → coordinates via postcodes.io, then Nominatim)
  const { data: clientLocations = new Map() } = useQuery({
    queryKey: ['clientLocations', clientIds.join(',')],
    queryFn: () => getServiceUserLocations(clientIds, addressFallbacks),
    enabled: clientIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // ── STAFF LIVE GPS (separate from client/calls code) ────────────
  // Only show staff who are currently clocked in (not completed/cancelled)
  const staffOnShiftIds = React.useMemo(() => {
    return [...new Set(todayShifts
      .filter(s => s.staff_id && s.status !== 'cancelled' && s.status !== 'completed')
      .filter(s => s.status === 'in_progress' || s.clock_in_time)
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

  // Build client markers — all service users always on map, status from today's calls
  const clientMarkers = React.useMemo(() => {
    // Build call lookup by service_user_id
    const callsByClient = {};
    for (const call of todayCalls) {
      if (!call.service_user_id) continue;
      const shift = todayShifts.find(s => s.id === call.shift_id);
      if (!callsByClient[call.service_user_id]) callsByClient[call.service_user_id] = [];
      callsByClient[call.service_user_id].push({
        ...call,
        staff_name: shift?.staff_name || 'Unknown',
        shift_name: shift?.shift_name || '',
      });
    }

    const markers = [];

    // All geocoded service users get a pin
    for (const su of allServiceUsers) {
      const coords = clientLocations.get(su.id);
      if (!coords) continue;

      const calls = (callsByClient[su.id] || []).sort((a, b) =>
        (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
      );
      const realCalls = calls.filter(c => c.call_type !== 'sitin_cover');
      const hasInProgress = realCalls.some(c => c.status === 'in_progress' && c.clock_in_time);
      const allCompleted = realCalls.length > 0 && realCalls.every(c =>
        c.status === 'completed' || c.status === 'missed' || c.status === 'not_at_home'
      );

      let markerStatus = calls.length > 0 ? 'scheduled' : 'no_calls';
      let statusColor = '#64748B'; // slate — no calls today
      if (hasInProgress) { markerStatus = 'in_progress'; statusColor = '#F59E0B'; }
      else if (allCompleted) { markerStatus = 'completed'; statusColor = '#10B981'; }
      else if (calls.length > 0) { markerStatus = 'pending'; statusColor = '#3B82F6'; }

      markers.push({
        id: su.id,
        name: su.full_name || su.name || 'Client',
        address: su.address || calls[0]?.service_user_address,
        lat: coords.latitude,
        lng: coords.longitude,
        calls,
        markerStatus,
        statusColor,
        latestCall: realCalls[realCalls.length - 1] || calls[calls.length - 1],
        inProgressCall: realCalls.find(c => c.status === 'in_progress' && c.clock_in_time),
      });
    }

    // Also include any clients from today's calls not in service_users list
    for (const [suId, calls] of Object.entries(callsByClient)) {
      if (markers.find(m => m.id === suId)) continue;
      const coords = clientLocations.get(suId);
      if (!coords) continue;
      const realCalls = calls.filter(c => c.call_type !== 'sitin_cover');
      const hasInProgress = realCalls.some(c => c.status === 'in_progress' && c.clock_in_time);
      const allCompleted = realCalls.length > 0 && realCalls.every(c =>
        c.status === 'completed' || c.status === 'missed' || c.status === 'not_at_home'
      );
      let statusColor = hasInProgress ? '#F59E0B' : allCompleted ? '#10B981' : '#3B82F6';
      markers.push({
        id: suId,
        name: calls[0]?.service_user_name || 'Client',
        address: calls[0]?.service_user_address,
        lat: coords.latitude,
        lng: coords.longitude,
        calls,
        markerStatus: hasInProgress ? 'in_progress' : allCompleted ? 'completed' : 'pending',
        statusColor,
        latestCall: calls[calls.length - 1],
        inProgressCall: realCalls.find(c => c.status === 'in_progress' && c.clock_in_time),
      });
    }

    return markers;
  }, [allServiceUsers, todayCalls, clientLocations, todayShifts]);

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
                    : call.status === 'not_at_home' ? 'bg-amber-100 text-amber-700'
                    : call.status === 'missed' ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600';
                  const statusText = call.status === 'in_progress' ? 'In Progress'
                    : call.status === 'completed' ? 'Completed'
                    : call.status === 'not_at_home' ? 'Not at Home'
                    : call.status === 'missed' ? 'Missed'
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
        tutorialKey="ControlRoom"
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
      <div className="w-full grid grid-cols-3 h-auto p-1 gap-1">
        <button onClick={() => setActiveTab('announcements')} className={`flex items-center justify-center gap-1.5 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'announcements' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Announcements</span>
          <span className="sm:hidden">Announce</span>
        </button>
        {user?.role === 'super_admin' && (
          <button onClick={() => setActiveTab('radio-settings')} className={`flex items-center justify-center gap-1.5 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'radio-settings' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:from-teal-500 hover:to-teal-600'}`}>
            <Radio className="w-4 h-4 flex-shrink-0" />
            <span>Radio</span>
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('pager')}
            className={`flex items-center justify-center gap-1.5 flex-1 text-xs sm:text-sm py-1 sm:py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg overflow-hidden ${activeTab === 'pager' ? 'bg-slate-800 ring-2 ring-slate-500' : 'bg-slate-700 hover:bg-slate-800'}`}
          >
            <PagerSvg className="h-8 sm:h-10 w-auto" />
            <span className="text-white">Alerter</span>
          </button>
        )}
      </div>

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

      {activeTab === 'radio-settings' && user?.role === 'super_admin' && (
        <RadioSettingsPanel queryClient={queryClient} user={user} />
      )}

      {activeTab === 'pager' && isAdmin && (
        <PagerPanel user={user} />
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

// ── AlerterLogPanel ──────────────────────────────────────────────────────────
const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

function AlerterLogPanel() {
  const { useState: useLocalState, useMemo: useLocalMemo } = React;
  const orgId = getOrgId();
  const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['alerter_logs_panel', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('alerter_logs')
        .select('*')
        .eq('organization_id', orgId)
        .gte('log_date', thirtyDaysAgo)
        .order('triggered_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!orgId,
    refetchInterval: 60000,
  });

  const [openDays, setOpenDays] = React.useState(new Set());

  const grouped = React.useMemo(() => {
    const map = new Map();
    for (const log of logs) {
      const d = log.log_date || 'unknown';
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(log);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  const toggleDay = (d) => setOpenDays(prev => {
    const next = new Set(prev);
    if (next.has(d)) next.delete(d); else next.add(d);
    return next;
  });

  const CREATE_SQL = `CREATE TABLE IF NOT EXISTS alerter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT,
  alert_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  priority TEXT DEFAULT 'HIGH',
  title TEXT,
  body TEXT,
  ref_id TEXT,
  log_date DATE DEFAULT CURRENT_DATE,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Alerter Log</h3>
            <p className="text-sm text-slate-500">Last 30 days of alerter events for this organisation</p>
          </div>
        </div>

        {/* SQL block */}
        <details className="mb-4">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium">Show setup SQL</summary>
          <pre className="mt-2 text-[10px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{CREATE_SQL}</pre>
        </details>

        {isLoading && <p className="text-sm text-slate-500 py-4 text-center">Loading…</p>}
        {!isLoading && grouped.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">No alerter logs in the last 30 days.</p>
        )}

        <div className="space-y-2">
          {grouped.map(([date, entries]) => {
            let displayDate = date;
            try { displayDate = format(new Date(date), 'EEEE dd MMMM yyyy'); } catch {}
            const isOpen = openDays.has(date);
            const urgentCount = entries.filter(e => e.priority === 'URGENT').length;

            return (
              <div key={date} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800 text-sm">{displayDate}</span>
                    <span className="text-xs text-slate-500">{entries.length} alert{entries.length !== 1 ? 's' : ''}</span>
                    {urgentCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">{urgentCount} URGENT</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="divide-y divide-slate-100">
                    {entries.map(log => {
                      const isUrgent = log.priority === 'URGENT';
                      let timeLabel = '';
                      try { timeLabel = format(new Date(log.triggered_at), 'HH:mm'); } catch {}
                      return (
                        <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>{isUrgent ? 'URGENT' : 'HIGH'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{timeLabel}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {log.title && (
                              <p className="font-mono text-xs text-slate-800 font-semibold leading-tight">{log.title}</p>
                            )}
                            {log.body && (
                              <p className="font-mono text-[10px] text-slate-500 mt-0.5 leading-relaxed break-words">{log.body}</p>
                            )}
                            {log.alert_type && (
                              <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">{log.alert_type}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled, color = 'teal' }) {
  const colors = {
    teal:  { on: 'bg-teal-500',  off: 'bg-slate-300' },
    amber: { on: 'bg-amber-500', off: 'bg-slate-300' },
  };
  const c = colors[color] || colors.teal;
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-medium text-slate-900 text-sm">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none shrink-0 ${checked ? c.on : c.off} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function AlerterSettingsPanel({ user }) {
  const queryClient = useQueryClient();
  const [alerterSaving, setAlerterSaving] = useState(null);
  const [testAlertFiring, setTestAlertFiring] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);

  const { data: allStaff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('id, full_name, email, role, is_control_device, alerter_enabled, alerter_area_ids').order('full_name');
      return data || [];
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: async () => {
      const { data } = await supabase.from('rota_areas').select('id, name').order('name');
      return data || [];
    },
  });

  const adminStaff = allStaff.filter(s => s.role === 'super_admin' || s.role === 'admin');

  const toggleAlerter = async (staffId, enabled) => {
    setAlerterSaving(staffId);
    await supabase.from('users').update({ alerter_enabled: enabled, alerter_area_ids: null }).eq('id', staffId);
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    setAlerterSaving(null);
  };

  const toggleAlerterArea = async (staffId, areaId, currentAreaIds) => {
    const current = currentAreaIds || [];
    const next = current.includes(areaId) ? current.filter(id => id !== areaId) : [...current, areaId];
    await supabase.from('users').update({ alerter_area_ids: next.length ? next : null }).eq('id', staffId);
    queryClient.invalidateQueries({ queryKey: ['staff'] });
  };

  const fireTestAlert = async () => {
    setTestAlertFiring(true);
    const orgId = localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';
    await supabase.from('alerter_test_triggers').insert({
      organization_id: orgId,
      triggered_by: user?.full_name || user?.email || 'Control Room',
      message: 'Test alert fired from Control Room',
    });
    setTestAlertFiring(false);
    setTestAlertSent(true);
    setTimeout(() => setTestAlertSent(false), 4000);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Alerter Settings</h3>
            <p className="text-sm text-slate-500">Control who gets the alerter and test it</p>
          </div>
        </div>

        {/* Alerter Access */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <p className="font-medium text-slate-900 text-sm">Alerter Access</p>
            <p className="text-xs text-slate-500 mt-0.5">Control handsets always have the Alerter. Grant it to individual admins below.</p>
          </div>
          <div className="space-y-3">
            {adminStaff.map(s => {
              const areaIds = s.alerter_area_ids || [];
              const allAreas = areaIds.length === 0;
              return (
                <div key={s.id} className="border border-slate-100 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold shrink-0">
                        {s.full_name?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate">{s.full_name}</p>
                        {s.is_control_device && <p className="text-[10px] text-teal-600">Control handset — all areas always</p>}
                      </div>
                    </div>
                    {s.is_control_device ? (
                      <span className="text-[10px] text-teal-500 font-semibold shrink-0">AUTO</span>
                    ) : (
                      <button
                        onClick={() => toggleAlerter(s.id, !s.alerter_enabled)}
                        disabled={alerterSaving === s.id}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${s.alerter_enabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${s.alerter_enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </button>
                    )}
                  </div>
                  {s.alerter_enabled && !s.is_control_device && areas.length > 0 && (
                    <div className="pl-8">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Monitoring areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {areas.map(a => {
                          const on = areaIds.includes(a.id);
                          return (
                            <button
                              key={a.id}
                              onClick={() => toggleAlerterArea(s.id, a.id, areaIds)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${on ? 'bg-teal-100 border-teal-400 text-teal-700' : 'bg-slate-100 border-slate-300 text-slate-500'}`}
                            >
                              {a.name}
                            </button>
                          );
                        })}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${allAreas ? 'bg-amber-100 border border-amber-400 text-amber-700' : 'text-slate-400'}`}>
                          {allAreas ? '★ All areas' : '(none = all areas)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {adminStaff.length === 0 && <p className="text-xs text-slate-400">No admin accounts found</p>}
          </div>

          {/* Fire Test Alert */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={fireTestAlert}
              disabled={testAlertFiring || testAlertSent}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                testAlertSent
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
              }`}
            >
              {testAlertSent ? '✓ Test alert sent — check alerter devices' : testAlertFiring ? 'Sending…' : '⚡ Fire Test Alert'}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">Triggers a live test on all active alerter devices</p>
          </div>
        </div>
      </Card>

      <AlerterLogPanel />
    </div>
  );
}

function RadioSettingsPanel({ queryClient, user }) {
  const [saving, setSaving] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [testUser, setTestUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['radioSettings'],
    queryFn: async () => {
      const { data } = await supabase.from('radio_settings').select('*').limit(1).single();
      return data;
    },
  });

  const upsert = async (patch) => {
    setSaving(true);
    const orgId = localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';
    if (settings?.id) {
      await supabase.from('radio_settings').update(patch).eq('id', settings.id);
    } else {
      await supabase.from('radio_settings').insert({ ...patch, organization_id: orgId });
    }
    queryClient.invalidateQueries({ queryKey: ['radioSettings'] });
    setSaving(false);
  };

  const createTestUser = async () => {
    setCreatingTest(true);
    setTestUser(null);
    const password = 'RadioTest' + Math.floor(1000 + Math.random() * 9000) + '!';
    const email = 'teststaff.radio@carecallai.co.uk';
    try {
      const result = await base44.functions.invoke('createStaffUser', {
        email, password, full_name: 'Test Staff (Radio)', job_title: 'care_worker', role: 'user',
      });
      if (result?.error) throw new Error(result.error);
      setTestUser({ name: 'Test Staff (Radio)', email, password });
    } catch (e) {
      if (e.message?.includes('already') || e.message?.includes('exists')) {
        setTestUser({ name: 'Test Staff (Radio)', email, password: 'Already exists — delete and recreate to reset password' });
      }
    }
    setCreatingTest(false);
  };

  const copyCredentials = () => {
    if (!testUser) return;
    navigator.clipboard.writeText(`Name: ${testUser.name}\nEmail: ${testUser.email}\nPassword: ${testUser.password}\nLogin at: https://app.carecallai.co.uk`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Team Radio Settings</h3>
          <p className="text-sm text-slate-500">Manage radio features and test tools</p>
        </div>
      </div>

      <ToggleRow
        label="Enable Radio"
        description="Shows the radio icon in the bottom nav for all staff"
        checked={!!settings?.is_enabled}
        onChange={() => upsert({ is_enabled: !settings?.is_enabled })}
        disabled={saving || isLoading}
        color="teal"
      />

      <ToggleRow
        label="🧪 Test Mode"
        description="When ON — all radio alerts only notify you (super admin). Safe to test without disturbing staff."
        checked={!!settings?.test_mode}
        onChange={() => upsert({ test_mode: !settings?.test_mode })}
        disabled={saving || isLoading}
        color="amber"
      />

      {settings?.test_mode && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Test Mode is ON.</strong> All radio notifications will only be sent to your account. Disable before going live.
          </p>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <p className="font-medium text-slate-900 text-sm">Create Test Staff Account</p>
          <p className="text-xs text-slate-500 mt-0.5">Creates a staff login you can use on a second device to test radio features.</p>
        </div>
        <Button
          onClick={createTestUser}
          disabled={creatingTest}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white"
        >
          {creatingTest ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : 'Create Test Staff Account'}
        </Button>
        {testUser && (
          <div className="bg-slate-900 rounded-lg p-3 space-y-1">
            <p className="text-xs text-slate-400">Login credentials:</p>
            <p className="text-sm text-white font-mono">{testUser.email}</p>
            <p className="text-sm text-green-400 font-mono">{testUser.password}</p>
            <Button size="sm" variant="outline" onClick={copyCredentials} className="mt-2 w-full text-xs border-slate-600 text-slate-300 hover:bg-slate-700">
              {copied ? <><Check className="w-3 h-3 mr-1" />Copied!</> : 'Copy credentials'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
