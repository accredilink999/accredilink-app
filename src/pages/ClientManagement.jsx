import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import ServiceUserForm from '@/components/serviceUsers/ServiceUserForm';
import ServiceUserDetails from '@/components/serviceUsers/ServiceUserDetails';
import ClientCardGrid from '@/components/serviceUsers/ClientCardGrid';
import ClientCardList from '@/components/serviceUsers/ClientCardList';
import {
  Heart,
  Plus,
  Search,
  AlertCircle,
  Settings
} from 'lucide-react';
import CareLogFormBuilder from '@/components/admin/CareLogFormBuilder';

export default function ClientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedArea, setSelectedArea] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: serviceUsers = [], isLoading } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list('-created_date'),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['allIncidents'],
    queryFn: () => base44.entities.Incident.filter({ status: 'open' }),
  });

  const { data: careLogs = [] } = useQuery({
    queryKey: ['allCareLogs'],
    queryFn: () => base44.entities.CareLog.list('-created_date', 500),
    staleTime: 0,
    gcTime: 0,
  });

  // Subscribe to care log changes
  React.useEffect(() => {
    const unsubscribe = base44.entities.CareLog.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['allCareLogs'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  // Get staff rota permissions for non-admins
  const { data: staffPermissions = [] } = useQuery({
    queryKey: ['staffRotaPermissions', user?.id],
    queryFn: () => base44.entities.RotaPermission.filter({ staff_id: user?.id }),
    enabled: !!user?.id && !isAdmin,
  });

  const userAreaIds = staffPermissions.map(p => p.rota_area_id);
  const userAreas = rotaAreas.filter(a => userAreaIds.includes(a.id));

  // Set initial filter for non-admins
  React.useEffect(() => {
    if (!isAdmin && userAreas.length > 0 && !selectedArea) {
      setSelectedArea(userAreas[0].id);
      setStatusFilter('all');
    }
  }, [isAdmin, userAreas.length]);

  const filteredUsers = serviceUsers.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesTeam = selectedArea ? u.area_id === selectedArea : true;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowDetails(false);
    setShowForm(true);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    discharged: 'bg-slate-100 text-slate-700'
  };

  const stats = {
    total: serviceUsers.length,
    active: serviceUsers.filter(u => u.status === 'active').length,
    onHold: serviceUsers.filter(u => u.status === 'on_hold').length,
    openIncidents: incidents.length
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading service users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clients" 
        subtitle={isAdmin ? "Manage all service users and their care plans" : "View service user information"}
        icon={Heart}
        className="[&_h1]:text-slate-900 [&_svg]:text-teal-600 [&_svg]:fill-teal-600"
      >
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFormBuilder(true)}
              title="Configure Care Log Form"
            >
              <Settings className="w-4 h-4 mr-2" />
              Care Log Form
            </Button>
            <Button
              onClick={() => {
                setEditingUser(null);
                setShowForm(true);
              }}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service User
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm text-teal-600 font-medium">Total Clients</p>
               <p className="text-2xl sm:text-3xl font-bold text-teal-900">{stats.total}</p>
             </div>
             <Heart className="w-6 sm:w-8 h-6 sm:h-8 text-teal-500 flex-shrink-0 ml-2" />
           </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm text-green-600 font-medium">Active</p>
               <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.active}</p>
             </div>
             <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 ml-2"></div>
           </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm text-yellow-600 font-medium">On Hold</p>
               <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{stats.onHold}</p>
             </div>
             <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0 ml-2"></div>
           </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm text-red-600 font-medium">Open Incidents</p>
               <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.openIncidents}</p>
             </div>
             <AlertCircle className="w-6 sm:w-8 h-6 sm:h-8 text-red-500 flex-shrink-0 ml-2" />
           </div>
        </Card>
      </div>

      {/* Filters */}
       <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="pl-10 text-xs sm:text-sm py-2 sm:py-3"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isAdmin && (
              <>
                <Button
                  variant={statusFilter === 'all' && !selectedArea ? 'default' : 'outline'}
                  onClick={() => {
                    setStatusFilter('all');
                    setSelectedArea(null);
                  }}
                  size="sm"
                  className="text-xs sm:text-sm bg-slate-600 hover:bg-slate-700 text-white"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' && !selectedArea ? 'default' : 'outline'}
                  onClick={() => {
                    setStatusFilter('active');
                    setSelectedArea(null);
                  }}
                  size="sm"
                  className={`text-xs sm:text-sm font-semibold ${statusFilter === 'active' && !selectedArea ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'on_hold' && !selectedArea ? 'default' : 'outline'}
                  onClick={() => {
                    setStatusFilter('on_hold');
                    setSelectedArea(null);
                  }}
                  size="sm"
                  className={`text-xs sm:text-sm font-semibold ${statusFilter === 'on_hold' && !selectedArea ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                >
                  On Hold
                </Button>
              </>
            )}

            {/* Area dropdown */}
            <Select
              value={selectedArea || 'all'}
              onValueChange={(val) => setSelectedArea(val === 'all' ? null : val)}
            >
              <SelectTrigger className="w-[200px] h-9 text-xs sm:text-sm border-slate-300">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && (
                  <SelectItem value="all">All Areas</SelectItem>
                )}
                {(isAdmin ? rotaAreas : userAreas).map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      {/* Service Users List */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={searchQuery ? 'No results found' : 'No service users yet'}
          description={searchQuery ? 'Try adjusting your search' : (isAdmin ? 'Add your first service user to get started' : 'No service users are assigned to your team yet')}
          action={!searchQuery && isAdmin && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service User
            </Button>
          )}
        />
      ) : (
        <ClientCardGrid 
          filteredUsers={filteredUsers} 
          careLogs={careLogs}
          onSelectUser={(user) => {
            setSelectedUser(user);
            setShowDetails(true);
          }}
          statusColors={statusColors}
        />
      )}

      {/* Modals */}
      {isAdmin && (
      <ServiceUserForm
        serviceUser={editingUser}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
      />
      )}

      <ServiceUserDetails
        serviceUser={selectedUser}
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedUser(null);
        }}
        onEdit={() => handleEdit(selectedUser)}
        onEditDisabled={!isAdmin}
        careLogs={careLogs}
      />

      {isAdmin && (
        <CareLogFormBuilder
          open={showFormBuilder}
          onClose={() => setShowFormBuilder(false)}
        />
      )}
    </div>
  );
}