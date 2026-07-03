import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format, parseISO, isToday, isYesterday, subDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import CareLogForm from '@/components/careLogs/CareLogForm';
import CareLogList from '@/components/careLogs/CareLogList';
import { 
  Search, 
  FileText, 
  Calendar,
  Clock,
  User,
  Smile,
  Utensils,
  Droplets,
  Bath,
  Filter,
  AlertCircle
} from 'lucide-react';

const moodIcons = {
  happy: '😊',
  content: '🙂',
  anxious: '😰',
  upset: '😢',
  unwell: '🤒'
};

const intakeColors = {
  good: 'text-emerald-600 bg-emerald-50',
  fair: 'text-amber-600 bg-amber-50',
  poor: 'text-red-600 bg-red-50',
  refused: 'text-slate-600 bg-slate-100'
};

export default function CareLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [serviceUserFilter, setServiceUserFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showCareLogForm, setShowCareLogForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedServiceUser, setSelectedServiceUser] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['completedShifts'],
    queryFn: () => ShiftApi.list('-date', 100),
  });

  const { data: careLogs = [] } = useQuery({
    queryKey: ['careLogs'],
    queryFn: () => base44.entities.CareLog.list('-created_date', 500),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list(),
  });

  const formatDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, d MMM');
  };

  // Get pending care logs for current user to complete
  const pendingCareLogs = careLogs.filter(log => 
    log.status === 'pending' && log.staff_id === user?.id
  );

  // Get submitted care logs
  const submittedCareLogs = careLogs.filter(log => log.status !== 'pending');

  const filteredLogs = submittedCareLogs.filter(log => {
    const matchesSearch = log.service_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesServiceUser = serviceUserFilter === 'all' || log.service_user_id === serviceUserFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = isToday(parseISO(log.visit_date));
    } else if (dateFilter === 'yesterday') {
      matchesDate = isYesterday(parseISO(log.visit_date));
    } else if (dateFilter === 'last7') {
      matchesDate = isAfter(parseISO(log.visit_date), subDays(new Date(), 7));
    } else if (dateFilter === 'last30') {
      matchesDate = isAfter(parseISO(log.visit_date), subDays(new Date(), 30));
    } else if (dateFilter === 'custom' && customDate) {
      matchesDate = log.visit_date === customDate;
    }
    
    return matchesSearch && matchesServiceUser && matchesDate;
  });

  // Group by date
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const dateKey = log.visit_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  // Check for overdue logs
  const overdueLogs = careLogs.filter(log => log.status === 'overdue');
  const pendingLogs = careLogs.filter(log => log.status === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Care Logs"
        subtitle="Daily visit notes and observations"
        tutorialKey="CareLogs"
      />

      {/* Overdue Alert */}
      {overdueLogs.length > 0 && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">{overdueLogs.length} Overdue Care Log{overdueLogs.length !== 1 ? 's' : ''}</p>
              <p className="text-sm text-red-700">Care logs were not completed within 1 hour of shift end.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Care Logs for Current User */}
      {user && pendingCareLogs.length > 0 && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <p className="font-semibold text-blue-900 mb-3">
            {pendingCareLogs.length} Care Log{pendingCareLogs.length !== 1 ? 's' : ''} Pending Submission
          </p>
          <div className="space-y-2">
            {pendingCareLogs.map(log => (
              <Button 
                key={log.id}
                variant="outline"
                className="w-full justify-start text-left h-auto"
                onClick={() => {
                  setSelectedLog(log);
                }}
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{log.service_user_name}</p>
                  <p className="text-xs text-slate-600">{log.visit_date} • {log.visit_time}</p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">Complete Log</Badge>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="custom">Pick Date</SelectItem>
            </SelectContent>
          </Select>
          {dateFilter === 'custom' && (
            <Input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full sm:w-40"
            />
          )}
          <Select value={serviceUserFilter} onValueChange={setServiceUserFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Service User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {serviceUsers.map(su => (
                <SelectItem key={su.id} value={su.id}>{su.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Logs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : Object.keys(groupedLogs).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No care logs found"
          description="Care logs will appear here after visits are completed."
        />
      ) : (
       <div className="space-y-6">
          {Object.entries(groupedLogs)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, logs]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-slate-500 mb-3">
                  {formatDateLabel(date)}
                </h3>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <Card 
                      key={log.id}
                      className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar name={log.service_user_name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-slate-900">{log.service_user_name}</h4>
                              <p className="text-sm text-slate-500">
                                {log.visit_time} • {log.staff_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {log.status === 'overdue' && (
                                <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                              )}
                              {log.mood && (
                                <span className="text-xl" title={log.mood}>
                                  {moodIcons[log.mood]}
                                </span>
                              )}
                            </div>
                          </div>

                          {log.notes && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {log.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {log.food_intake && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${intakeColors[log.food_intake]}`}>
                                <Utensils className="w-3 h-3" />
                                Food: {log.food_intake}
                              </span>
                            )}
                            {log.fluid_intake && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${intakeColors[log.fluid_intake]}`}>
                                <Droplets className="w-3 h-3" />
                                Fluids: {log.fluid_intake}
                              </span>
                            )}
                            {log.personal_care_provided && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
                                <Bath className="w-3 h-3" />
                                Personal care
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
       </div>
      )}

      {/* Log Detail/Edit Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Care Log - {selectedLog?.service_user_name}
              {selectedLog?.status === 'pending' && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-700">Pending</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <CareLogList careLogs={[selectedLog]} serviceUserId={selectedLog.service_user_id} isEditable={selectedLog?.status === 'pending' && selectedLog?.staff_id === user?.id} />
          )}

          <Button variant="outline" onClick={() => setSelectedLog(null)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}