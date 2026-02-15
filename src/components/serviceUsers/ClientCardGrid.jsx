import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Avatar from '@/components/ui/Avatar';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Phone, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ClientCardGrid({ filteredUsers, careLogs, onSelectUser, statusColors }) {
  const [pendingChange, setPendingChange] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const isAdmin = currentUser?.role === 'admin';

  const updateAreaMutation = useMutation({
    mutationFn: async ({ userId, areaId }) => {
      return base44.entities.ServiceUser.update(userId, { area_id: areaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      setPendingChange(null);
      setShowConfirm(false);
    },
  });

  const handleAreaChange = (userId, areaId) => {
    setPendingChange({ userId, areaId });
    setShowConfirm(true);
  };

  const confirmChange = () => {
    if (pendingChange) {
      updateAreaMutation.mutate(pendingChange);
    }
  };

  const getAreaName = (areaId) => {
    const area = rotaAreas.find(a => a.id === areaId);
    return area?.name || '';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {filteredUsers.map(user => (
        <Card
          key={user.id}
          className="p-4 sm:p-5 hover:shadow-lg transition-shadow cursor-pointer bg-orange-50"
          onClick={() => onSelectUser(user)}
        >
          <div className="flex items-start gap-3 mb-4">
            <Avatar name={user.full_name} size="md" src={user.photo_url} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">{user.full_name}</h3>
                {user.dna_cpr_in_place === 'yes' && (
                  <Badge className="bg-red-600 text-white font-bold text-xs">DNA CPR</Badge>
                )}
              </div>
              <Badge className={statusColors[user.status]} size="sm">
                {user.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            {user.address && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(user.address)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="line-clamp-2 text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors"
                >
                  {user.address}
                </button>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                <a href={`tel:${user.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  {user.phone}
                </a>
              </div>
            )}
            {user.date_of_birth && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>{user.date_of_birth}</span>
              </div>
            )}
          </div>

          {user.mobility_level && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Mobility: <span className="text-slate-700 capitalize">{user.mobility_level.replace('_', ' ')}</span>
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
              <Select value={user.area_id || ''} onValueChange={(value) => handleAreaChange(user.id, value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Assign area..." />
                </SelectTrigger>
                <SelectContent>
                  {rotaAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>
      ))}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign to Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this client to the selected area?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmChange}>Confirm</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}