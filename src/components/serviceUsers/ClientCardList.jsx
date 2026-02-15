import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Avatar from '@/components/ui/Avatar';
import { MapPin, Phone, Calendar } from 'lucide-react';

export default function ClientCardList({ filteredUsers, careLogs, onSelectUser, statusColors }) {

  return (
    <div className="space-y-2">
      {filteredUsers.map(user => (
        <Card 
          key={user.id} 
          className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-orange-50"
          onClick={() => onSelectUser(user)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar name={user.full_name} size="md" src={user.photo_url} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 truncate">{user.full_name}</h3>
                {user.dna_cpr_in_place === 'yes' && (
                  <Badge className="bg-red-600 text-white font-bold text-xs">DNA CPR</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={statusColors[user.status]} size="sm">
                  {user.status.replace('_', ' ')}
                </Badge>
                {user.address && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{user.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
            {user.phone && (
              <a href={`tel:${user.phone}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                {user.phone}
              </a>
            )}
            {user.date_of_birth && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{user.date_of_birth}</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}