import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FileUploadDownload({ platform, fieldName }) {
  const [editing, setEditing] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: adminUsers = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['adminUsers', fieldName],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin' || u.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(u.job_title));
    },
    enabled: !!user,
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);
  
  // Get drive link from current user or any admin user
  const driveLink = React.useMemo(() => {
    if (user?.[`${fieldName}_url`]) return user[`${fieldName}_url`];
    const adminWithLink = adminUsers.find(u => u[`${fieldName}_url`]);
    return adminWithLink?.[`${fieldName}_url`];
  }, [user, adminUsers, fieldName]);

  React.useEffect(() => {
    if (driveLink) {
      setLinkInput(driveLink);
    }
  }, [driveLink]);

  const saveLinkMutation = useMutation({
    mutationFn: async (link) => {
      const updateData = {};
      updateData[`${fieldName}_url`] = link;
      return base44.auth.updateMe(updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers', fieldName] });
      toast.success('Google Drive link saved');
      setEditing(false);
    },
  });

  const handleSaveLink = () => {
    if (!linkInput.trim()) {
      toast.error('Please enter a valid Google Drive link');
      return;
    }
    saveLinkMutation.mutate(linkInput.trim());
  };

  if (loadingAdmins) {
    return (
      <Card className="p-6 bg-white border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{platform} App</h3>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-0 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{platform} App</h3>
      
      {driveLink && !editing ? (
        <div className="space-y-4">
          <a 
            href={driveLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 underline text-sm break-all"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {driveLink}
          </a>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="w-full"
            >
              Change Link
            </Button>
          )}
        </div>
      ) : isAdmin && (!driveLink || editing) ? (
        <div className="space-y-4">
          <div>
            <Label>Google Drive Link</Label>
            <Input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            {editing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setLinkInput(driveLink || '');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSaveLink}
              disabled={saveLinkMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700 gap-2"
            >
              {saveLinkMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Link
            </Button>
          </div>
        </div>
      ) : !isAdmin && !driveLink ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">No {platform} app link available</p>
          <p className="text-xs text-slate-500 mt-1">Contact your administrator</p>
        </div>
      ) : null}
    </Card>
  );
}