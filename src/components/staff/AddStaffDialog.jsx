import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Avatar from '@/components/ui/Avatar';
import { supabase } from '@/api/supabaseClient';
import {
  UserPlus, Copy, RefreshCw, CheckCircle2, Shield, MapPin,
  Users, MessageSquare, Smartphone, Camera, Bell, Eye, EyeOff,
  Loader2, Mail
} from 'lucide-react';

function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  const all = upper + lower + digits;
  for (let i = 0; i < 9; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

const SITE_URL = 'https://care-call-ai-clone.vercel.app';

export default function AddStaffDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [showPassword, setShowPassword] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    job_title: '',
    password: generateTempPassword(),
    role: 'user',
    area_id: '',
    enforce_gps: false,
    enforce_camera: false,
    enforce_notifications: false,
  });

  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedChatGroups, setSelectedChatGroups] = useState([]);
  const [createdUser, setCreatedUser] = useState(null);

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
    enabled: !!open,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['careTeams'],
    queryFn: () => base44.entities.CareTeam.list(),
    enabled: !!open,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 500),
    enabled: !!open,
  });

  const groupChats = conversations.filter(c => c.type === 'group');

  const createStaffMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      console.log('[AddStaff] Calling createStaffUser edge function...');

      // 1. Call edge function to create auth user + profiles + users rows
      let result;
      try {
        result = await base44.functions.invoke('createStaffUser', {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          job_title: formData.job_title || null,
          role: formData.role,
          area_id: formData.area_id || null,
          enforce_gps: formData.enforce_gps,
          enforce_camera: formData.enforce_camera,
          enforce_notifications: formData.enforce_notifications,
        });
        console.log('[AddStaff] Edge function response:', result);
      } catch (err) {
        console.error('[AddStaff] Edge function error:', err);
        throw err;
      }

      if (!result || result.error) {
        throw new Error(result?.error || 'No response from server');
      }

      if (!result.user_id) {
        console.error('[AddStaff] Missing user_id in response:', result);
        throw new Error('Server returned success but no user_id');
      }

      const newUserId = result.user_id;
      const newUserName = formData.full_name.trim();

      // 2. Add to selected teams
      for (const teamId of selectedTeams) {
        const team = teams.find(t => t.id === teamId);
        if (!team) continue;
        try {
          const updatedMemberIds = [...(team.member_ids || []), newUserId];
          const updatedMemberNames = [...(team.member_names || []), newUserName];
          await base44.entities.CareTeam.update(teamId, {
            member_ids: updatedMemberIds,
            member_names: updatedMemberNames,
          });
        } catch (err) {
          console.warn('[AddStaff] Failed to add to team:', team.name, err);
        }
      }

      // 3. Add to selected chat groups
      for (const convId of selectedChatGroups) {
        const conv = conversations.find(c => c.id === convId);
        if (!conv) continue;
        try {
          const updatedParticipants = [...(conv.participants || []), newUserId];
          const updatedParticipantNames = [...(conv.participant_names || []), newUserName];
          const updatedUnread = { ...(typeof conv.unread_count === 'object' ? conv.unread_count : {}), [newUserId]: 0 };
          await base44.entities.Conversation.update(convId, {
            participants: updatedParticipants,
            participant_names: updatedParticipantNames,
            unread_count: updatedUnread,
          });
        } catch (err) {
          console.warn('[AddStaff] Failed to add to chat group:', conv.name, err);
        }
      }

      return { user_id: newUserId, email: result.email };
    },
    onSuccess: (result) => {
      const creds = {
        name: formData.full_name.trim(),
        email: result.email,
        password: formData.password,
      };
      setCreatedUser(creds);
      setFormError(null);

      // Auto-copy credentials to clipboard
      const text = `Name: ${creds.name}\nEmail: ${creds.email}\nTemporary Password: ${creds.password}`;
      navigator.clipboard.writeText(text).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['careTeams'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      toast.success(
        `${creds.name} created — credentials copied to clipboard`,
        { duration: 8000 }
      );

      // Show success step for email sending / credential review
      setStep('success');
    },
    onError: (error) => {
      console.error('[AddStaff] Mutation error:', error);
      // Show full diagnostic info including steps from edge function
      let msg = error.message || 'Unknown error';
      if (error.steps) {
        msg += '\n\nDiagnostic steps: ' + error.steps.join(' → ');
      }
      if (error.detail) {
        msg += '\n\nDetail: ' + error.detail;
      }
      setFormError(msg);
      toast.error('Failed to create staff: ' + (error.message || 'Unknown error'), { duration: 10000 });
    },
  });

  const handleClose = () => {
    setStep('form');
    setFormData({
      full_name: '',
      email: '',
      job_title: '',
      password: generateTempPassword(),
      role: 'user',
      area_id: '',
      enforce_gps: false,
      enforce_camera: false,
      enforce_notifications: false,
    });
    setSelectedTeams([]);
    setSelectedChatGroups([]);
    setCreatedUser(null);
    setShowPassword(false);
    setSendingEmail(false);
    setEmailSent(false);
    setFormError(null);
    onClose();
  };

  const handleCopyCredentials = () => {
    const text = `Name: ${createdUser.name}\nEmail: ${createdUser.email}\nTemporary Password: ${createdUser.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    toast.info('Password copied');
  };

  const handleSendEmail = async () => {
    if (!createdUser) return;
    setSendingEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(createdUser.email, {
        redirectTo: SITE_URL,
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success(`Password setup email sent to ${createdUser.email}`);
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const canSubmit = formData.full_name.trim() && formData.email.trim() && formData.password;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-600" />
            {step === 'form' ? 'Add New Staff Member' : 'Staff Created'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Enter the details for the new staff member
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Basic Information
                </h3>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Select
                    value={formData.job_title}
                    onValueChange={(value) => setFormData({ ...formData, job_title: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carer">Carer</SelectItem>
                      <SelectItem value="senior_carer">Senior Carer</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Temporary Password
                </h3>
                <p className="text-xs text-slate-500">
                  Staff must change this on first login
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                    title="Copy password"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, password: generateTempPassword() })}
                    title="Generate new password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Role & Area */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Role & Area
                </h3>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Admin Access</p>
                    <p className="text-xs text-slate-500">Full administrative permissions</p>
                  </div>
                  <Switch
                    checked={formData.role === 'admin'}
                    onCheckedChange={(checked) => setFormData({ ...formData, role: checked ? 'admin' : 'user' })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Rota Area
                  </Label>
                  <Select
                    value={formData.area_id}
                    onValueChange={(value) => setFormData({ ...formData, area_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No area</SelectItem>
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
              </div>

              {/* Team Assignment */}
              {teams.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Team Assignment
                    </h3>
                    {selectedTeams.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedTeams.length} selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Select one or more teams</p>
                  <div className="space-y-1 border rounded-lg p-3 bg-slate-50 max-h-40 overflow-y-auto">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded">
                        <Checkbox
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTeams(prev =>
                              checked ? [...prev, team.id] : prev.filter(id => id !== team.id)
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{team.name}</p>
                          <p className="text-xs text-slate-500">{team.member_ids?.length || 0} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Groups */}
              {groupChats.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> Chat Groups
                    </h3>
                    {selectedChatGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedChatGroups.length} selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Select one or more chat groups</p>
                  <div className="space-y-1 border rounded-lg p-3 bg-slate-50 max-h-40 overflow-y-auto">
                    {groupChats.map((conv) => (
                      <div key={conv.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded">
                        <Checkbox
                          checked={selectedChatGroups.includes(conv.id)}
                          onCheckedChange={(checked) => {
                            setSelectedChatGroups(prev =>
                              checked ? [...prev, conv.id] : prev.filter(id => id !== conv.id)
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{conv.name || 'Unnamed Group'}</p>
                          <p className="text-xs text-slate-500">{conv.participants?.length || 0} participants</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device Enforcement */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Device Settings Enforcement
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Enforce GPS</p>
                        <p className="text-xs text-slate-500">Require location for clock-in/out</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.enforce_gps}
                      onCheckedChange={(checked) => setFormData({ ...formData, enforce_gps: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Enforce Camera</p>
                        <p className="text-xs text-slate-500">Require photo verification</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.enforce_camera}
                      onCheckedChange={(checked) => setFormData({ ...formData, enforce_camera: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Enforce Notifications</p>
                        <p className="text-xs text-slate-500">Require push notifications enabled</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.enforce_notifications}
                      onCheckedChange={(checked) => setFormData({ ...formData, enforce_notifications: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {formError && (
              <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <p className="font-semibold">Error creating staff:</p>
                <p className="mt-1">{formError}</p>
              </div>
            )}

            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => createStaffMutation.mutate()}
                disabled={!canSubmit || createStaffMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {createStaffMutation.isPending ? 'Creating...' : 'Create Staff Account'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Success state */
          <div className="px-6 py-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Account Created</h3>
              <p className="text-sm text-slate-500 mt-1">
                Share these credentials with the new staff member
              </p>
            </div>

            <Card className="p-4 space-y-3 bg-slate-50">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Name</span>
                  <span className="text-sm font-medium text-slate-900">{createdUser?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Email</span>
                  <span className="text-sm font-medium text-slate-900">{createdUser?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Temp Password</span>
                  <span className="text-sm font-mono font-medium text-slate-900 bg-white px-2 py-0.5 rounded border">
                    {createdUser?.password}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleCopyCredentials}
                variant="outline"
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy All Credentials
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || emailSent}
                variant="outline"
                className={`w-full gap-2 ${emailSent ? 'border-green-300 text-green-700 bg-green-50' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}`}
              >
                {sendingEmail ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : emailSent ? (
                  <><CheckCircle2 className="w-4 h-4" /> Email Sent</>
                ) : (
                  <><Mail className="w-4 h-4" /> Send Password Setup Email</>
                )}
              </Button>
              <Button
                onClick={handleClose}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
