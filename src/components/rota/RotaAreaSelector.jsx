import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings } from 'lucide-react';

export default function RotaAreaSelector({ selectedAreaId, onAreaChange, isAdmin, userId, createOpen, onCreateOpenChange, manageOpen, onManageOpenChange }) {
  const queryClient = useQueryClient();
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [internalManageOpen, setInternalManageOpen] = useState(false);

  // Support both controlled (via props) and uncontrolled (internal) dialog state
  const isCreateDialogOpen = createOpen !== undefined ? createOpen : internalCreateOpen;
  const setIsCreateDialogOpen = onCreateOpenChange || setInternalCreateOpen;
  const isManageDialogOpen = manageOpen !== undefined ? manageOpen : internalManageOpen;
  const setIsManageDialogOpen = onManageOpenChange || setInternalManageOpen;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#14b8a6'
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: myPermissions = [] } = useQuery({
    queryKey: ['myRotaPermissions', userId],
    queryFn: () => base44.entities.RotaPermission.filter({ staff_id: userId }),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RotaArea.create(data),
    onSuccess: (newArea) => {
      queryClient.invalidateQueries({ queryKey: ['rotaAreas'] });
      toast.success('Area created');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', color: '#14b8a6' });
      onAreaChange(newArea.id);
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...formData,
      is_active: true
    });
  };

  // Filter areas based on permissions (admins see all)
  const accessibleAreas = isAdmin ? rotaAreas : rotaAreas.filter(area =>
    myPermissions.some(p => p.rota_area_id === area.id)
  );

  // Auto-select first area when none is selected
  useEffect(() => {
    if (!selectedAreaId && accessibleAreas.length > 0) {
      onAreaChange(accessibleAreas[0].id);
    }
  }, [selectedAreaId, accessibleAreas, onAreaChange]);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Select value={selectedAreaId} onValueChange={onAreaChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Rota Area" />
        </SelectTrigger>
        <SelectContent>
          {accessibleAreas.map(area => (
            <SelectItem key={area.id} value={area.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                {area.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Rota Area</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., North Region, Night Shift..."
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Details about this rota area..."
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="#14b8a6"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!formData.name || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Dialog */}
      {isManageDialogOpen && (
        <RotaAreaManager
          open={isManageDialogOpen}
          onClose={() => setIsManageDialogOpen(false)}
          rotaAreas={rotaAreas}
        />
      )}
    </>
  );
}

function RotaAreaManager({ open, onClose, rotaAreas }) {
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RotaArea.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotaAreas'] });
      toast.success('Area deactivated');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Rota Areas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
            {rotaAreas.map(area => (
              <div key={area.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-lg" 
                    style={{ backgroundColor: area.color }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">{area.name}</h4>
                    {area.description && (
                      <p className="text-sm text-slate-500">{area.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedArea(area);
                      setIsPermissionDialogOpen(true);
                    }}
                  >
                    Permissions
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(area.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPermissionDialogOpen && selectedArea && (
        <PermissionManager
          open={isPermissionDialogOpen}
          onClose={() => {
            setIsPermissionDialogOpen(false);
            setSelectedArea(null);
          }}
          rotaArea={selectedArea}
        />
      )}
    </>
  );
}

function PermissionManager({ open, onClose, rotaArea }) {
  const queryClient = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState('view');

  const { data: staff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['rotaPermissions', rotaArea.id],
    queryFn: () => base44.entities.RotaPermission.filter({ rota_area_id: rotaArea.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RotaPermission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotaPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['myRotaPermissions'] });
      toast.success('Permission added');
      setSelectedStaffId('');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RotaPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotaPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['myRotaPermissions'] });
      toast.success('Permission removed');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, level }) => base44.entities.RotaPermission.update(id, { permission_level: level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotaPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['myRotaPermissions'] });
      toast.success('Permission updated');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const handleAdd = () => {
    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    createMutation.mutate({
      rota_area_id: rotaArea.id,
      staff_id: selectedStaffId,
      permission_level: permissionLevel
    });
  };

  const staffWithoutPermission = staff.filter(s => 
    !permissions.some(p => p.staff_id === s.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {rotaArea.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffWithoutPermission.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={permissionLevel} onValueChange={setPermissionLevel}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAdd}
              disabled={!selectedStaffId || createMutation.isPending}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {permissions.map(perm => (
              <div key={perm.id} className="p-3 border rounded-lg flex items-center justify-between">
                <span className="font-medium text-slate-900">{perm.staff_name}</span>
                <div className="flex items-center gap-2">
                  <Select 
                    value={perm.permission_level} 
                    onValueChange={(level) => updateMutation.mutate({ id: perm.id, level })}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(perm.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}