import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Users, X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import Avatar from '@/components/ui/Avatar';

export default function TeamsManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['careTeams'],
    queryFn: () => base44.entities.CareTeam.list(),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  {/* Cleanup effect removed - teams and shifts are independent entities */}

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.CareTeam.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careTeams'] });
      handleCloseDialog();
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.CareTeam.update(editingTeam.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careTeams'] });
      handleCloseDialog();
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => base44.entities.CareTeam.delete(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careTeams'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamDesc('');
    setShowDialog(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDesc(team.description || '');
    setSelectedMembers(team.member_ids || []);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTeam(null);
    setTeamName('');
    setTeamDesc('');
    setSelectedMembers([]);
  };

  const handleSave = () => {
    const memberNames = selectedMembers.map(id => staff.find(s => s.id === id)?.staff_full_name || staff.find(s => s.id === id)?.full_name).filter(Boolean);
    const data = { name: teamName, description: teamDesc, member_ids: selectedMembers, member_names: memberNames };
    if (editingTeam) {
      updateTeamMutation.mutate(data);
    } else {
      createTeamMutation.mutate(data);
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const isLoading = createTeamMutation.isPending || updateTeamMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Care Teams</h3>
        <Button onClick={handleOpenCreate} className="gap-2 bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4" />
          New Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <Card key={team.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2 flex-1">
                <Users className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900">{team.name}</h4>
                  {team.description && (
                    <p className="text-sm text-slate-600 mt-1">{team.description}</p>
                  )}
                </div>
              </div>
            </div>
            {team.member_names && team.member_names.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium text-slate-600">Members:</p>
                <div className="flex flex-wrap gap-1">
                  {team.member_names.slice(0, 3).map((name, idx) => (
                    <span key={idx} className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                      {name}
                    </span>
                  ))}
                  {team.member_names.length > 3 && (
                    <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                      +{team.member_names.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {team.member_ids?.length || 0} members
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(team)}
                  className="h-8 w-8 text-slate-600 hover:text-slate-900"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setTeamToDelete(team);
                    setShowDeleteConfirm(true);
                  }}
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500">No teams created yet</p>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{teamToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTeamMutation.mutate(teamToDelete.id);
                setShowDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Team Name *</label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., North Team"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
              <textarea
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="Team description (optional)"
                className="w-full border rounded px-3 py-2 text-sm"
                rows="3"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Team Members</label>
              <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                {staff.length === 0 ? (
                  <p className="text-sm text-slate-500">No staff available</p>
                ) : (
                  staff.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded group">
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <Avatar name={member.staff_full_name || member.full_name} src={member.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{member.staff_full_name || member.full_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.job_title?.replace(/_/g, ' ')}</p>
                      </div>
                      {selectedMembers.includes(member.id) && (
                        <button
                          onClick={() => toggleMember(member.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Remove from team"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!teamName.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}