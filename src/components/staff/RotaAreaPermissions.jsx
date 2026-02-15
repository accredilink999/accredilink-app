import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function RotaAreaPermissions({ staff, isAdmin }) {
  const queryClient = useQueryClient();
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('view');

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['staffRotaPermissions', staff?.id],
    queryFn: () => base44.entities.RotaPermission.filter({ staff_id: staff?.id }),
    enabled: !!staff?.id,
  });

  const addPermissionMutation = useMutation({
    mutationFn: async () => {
      const area = rotaAreas.find(a => a.id === selectedAreaId);
      return base44.entities.RotaPermission.create({
        staff_id: staff.id,
        staff_name: staff.full_name,
        rota_area_id: selectedAreaId,
        rota_area_name: area.name,
        permission_level: selectedLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRotaPermissions', staff?.id] });
      setSelectedAreaId('');
      setSelectedLevel('view');
      toast.success('Permission added');
    },
    onError: () => toast.error('Failed to add permission'),
  });

  const removePermissionMutation = useMutation({
    mutationFn: (permissionId) => base44.entities.RotaPermission.delete(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRotaPermissions', staff?.id] });
      toast.success('Permission removed');
    },
    onError: () => toast.error('Failed to remove permission'),
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, level }) => base44.entities.RotaPermission.update(id, { permission_level: level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRotaPermissions', staff?.id] });
      toast.success('Permission updated');
    },
    onError: () => toast.error('Failed to update permission'),
  });

  const availableAreas = rotaAreas.filter(area => !permissions.some(p => p.rota_area_id === area.id));

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500">Only administrators can manage rota permissions</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Add Rota Area Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {availableAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => addPermissionMutation.mutate()}
              disabled={!selectedAreaId || addPermissionMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {permissions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Current Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissions.map(perm => (
              <div key={perm.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rotaAreas.find(a => a.id === perm.rota_area_id)?.color || '#666' }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900">{perm.rota_area_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    value={perm.permission_level}
                    onValueChange={(level) => updatePermissionMutation.mutate({ id: perm.id, level })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePermissionMutation.mutate(perm.id)}
                    disabled={removePermissionMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-center bg-slate-50">
          <p className="text-slate-500">No rota area permissions assigned</p>
        </Card>
      )}
    </div>
  );
}