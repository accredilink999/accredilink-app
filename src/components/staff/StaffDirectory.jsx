import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Avatar from '@/components/ui/Avatar';
import { Search, Filter, UserPlus } from 'lucide-react';
import AddStaffDialog from '@/components/staff/AddStaffDialog';

export default function StaffDirectory({ onSelectStaff, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddStaff, setShowAddStaff] = useState(false);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.employment_status === filterStatus;
    const matchesRole = filterRole === 'all' || member.job_title === filterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'terminated': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        {isAdmin && (
          <Button
            onClick={() => setShowAddStaff(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-700 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff
          </Button>
        )}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="carer">Carer</SelectItem>
            <SelectItem value="senior_carer">Senior Carer</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((member) => (
          <Card
            key={member.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectStaff(member.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar name={member.staff_full_name || member.full_name} src={member.photo_url} size="md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{member.staff_full_name || member.full_name}</h3>
                <p className="text-sm text-slate-500 capitalize">{member.job_title?.replace(/_/g, ' ')}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusColor(member.employment_status)}>
                    {member.employment_status?.replace(/_/g, ' ')}
                  </Badge>
                  {member.employment_type && (
                    <Badge variant="outline" className="text-xs">
                      {member.employment_type.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No staff members found</p>
        </Card>
      )}

      {isAdmin && (
        <AddStaffDialog
          open={showAddStaff}
          onClose={() => setShowAddStaff(false)}
        />
      )}
    </div>
  );
}