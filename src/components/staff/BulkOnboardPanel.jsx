import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus, Trash2, Plus, Mail, Clock, CheckCircle2,
  Copy, Send, AlertTriangle, Loader2
} from 'lucide-react';

const SITE_URL = 'https://care-call-ai.vercel.app';

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
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

const DEFAULT_EMAIL_TEMPLATE = `Hi {{name}},

Welcome to Care Call AI! Your admin has created an account for you.

<strong>IMPORTANT: Please remove any other care-related apps from your phone before installing this one.</strong>

<strong>How to Install:</strong>
1. Open this link on your phone: <a href="${SITE_URL}">${SITE_URL}</a>
2. On iPhone: Tap the Share button (square with arrow) → "Add to Home Screen"
3. On Android: Tap the three dots menu → "Install app" or "Add to Home Screen"
4. Open the app from your home screen

<strong>Your Login Details:</strong>
Email: {{email}}
Temporary Password: {{password}}

You will be asked to set a new password on your first login.

<strong>Permissions Required:</strong>
When prompted, please allow the following:
• <strong>Location/GPS</strong> — Required for clock-in and clock-out verification
• <strong>Camera</strong> — Used for photo verification and document uploads
• <strong>Notifications</strong> — So you receive shift reminders, messages, and alerts

These permissions are essential for the app to work correctly. Please enable them all when asked.

<strong>Getting Started:</strong>
1. Open the app and sign in with the details above
2. Set your new password when prompted
3. Allow all permissions when asked
4. You're ready to go!

If you have any issues, please contact your manager.

Best regards,
Care Call AI Team`;

export default function BulkOnboardPanel() {
  const queryClient = useQueryClient();
  const [staffEntries, setStaffEntries] = useState([
    { name: '', email: '', password: generateTempPassword() }
  ]);
  const [emailSubject, setEmailSubject] = useState('Welcome to Care Call AI — Your Login Details');
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [step, setStep] = useState('edit'); // 'edit' | 'preview' | 'processing' | 'done'
  const [results, setResults] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedChatGroups, setSelectedChatGroups] = useState([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['careTeams'],
    queryFn: () => base44.entities.CareTeam.list(),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at', 500),
  });

  const groupChats = conversations.filter(c => c.type === 'group');

  const handleAddRow = () => {
    setStaffEntries(prev => [...prev, { name: '', email: '', password: generateTempPassword() }]);
  };

  const handleRemoveRow = (idx) => {
    setStaffEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEntryChange = (idx, field, value) => {
    setStaffEntries(prev => prev.map((entry, i) =>
      i === idx ? { ...entry, [field]: value } : entry
    ));
  };

  const handleRegeneratePassword = (idx) => {
    handleEntryChange(idx, 'password', generateTempPassword());
  };

  const validEntries = staffEntries.filter(e => e.name.trim() && e.email.trim());

  const buildEmailHtml = (entry) => {
    let html = emailTemplate
      .replace(/\{\{name\}\}/g, entry.name.trim())
      .replace(/\{\{email\}\}/g, entry.email.trim().toLowerCase())
      .replace(/\{\{password\}\}/g, entry.password);

    // Wrap in styled HTML
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #0d9488; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 700;">C</div>
          <h1 style="font-size: 22px; color: #0f172a; margin: 12px 0 4px;">Care Call AI</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; line-height: 1.7;">
          ${html.replace(/\n/g, '<br>')}
        </div>
        <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8;">This is an automated message from Care Call AI</p>
        </div>
      </div>
    `;
  };

  const processOnboarding = useMutation({
    mutationFn: async () => {
      const resultsList = [];

      // Tomorrow 6am UK time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledAt = new Date(
        tomorrow.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }) + 'T06:00:00+00:00'
      );
      // Adjust for UK timezone offset
      const ukOffset = getUKOffset(tomorrow);
      scheduledAt.setHours(6 - ukOffset);

      for (const entry of validEntries) {
        try {
          // 1. Create the staff account via edge function
          const result = await base44.functions.invoke('createStaffUser', {
            email: entry.email.trim().toLowerCase(),
            password: entry.password,
            full_name: entry.name.trim(),
            role: 'user',
          });

          if (result.error) throw new Error(result.error);

          const newUserId = result.user_id;
          const newUserName = entry.name.trim();

          // 2. Add to selected teams
          for (const teamId of selectedTeams) {
            const team = teams.find(t => t.id === teamId);
            if (!team) continue;
            await base44.entities.CareTeam.update(teamId, {
              member_ids: [...(team.member_ids || []), newUserId],
              member_names: [...(team.member_names || []), newUserName],
            });
          }

          // 3. Add to selected chat groups
          for (const convId of selectedChatGroups) {
            const conv = conversations.find(c => c.id === convId);
            if (!conv) continue;
            await base44.entities.Conversation.update(convId, {
              participants: [...(conv.participants || []), newUserId],
              participant_names: [...(conv.participant_names || []), newUserName],
              unread_count: { ...(typeof conv.unread_count === 'object' ? conv.unread_count : {}), [newUserId]: 0 },
            });
          }

          // 4. Schedule the onboarding email
          const htmlBody = buildEmailHtml(entry);
          await supabase.from('scheduled_onboarding_emails').insert({
            user_id: newUserId,
            email: entry.email.trim().toLowerCase(),
            full_name: entry.name.trim(),
            temp_password: entry.password,
            subject: emailSubject,
            html_body: htmlBody,
            scheduled_at: scheduledAt.toISOString(),
          });

          resultsList.push({ ...entry, status: 'success', user_id: newUserId });
        } catch (err) {
          resultsList.push({ ...entry, status: 'error', error: err.message });
        }
      }

      return resultsList;
    },
    onSuccess: (resultsList) => {
      setResults(resultsList);
      setStep('done');
      const successCount = resultsList.filter(r => r.status === 'success').length;
      const errorCount = resultsList.filter(r => r.status === 'error').length;
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['careTeams'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (errorCount === 0) {
        toast.success(`${successCount} staff accounts created & emails scheduled for 6am`);
      } else {
        toast.warning(`${successCount} created, ${errorCount} failed`);
      }
    },
    onError: (error) => {
      toast.error('Bulk onboarding failed: ' + error.message);
    },
  });

  const handleSendEmailsNow = async () => {
    setSendingEmails(true);
    setEmailSendResult(null);
    try {
      const result = await base44.functions.invoke('sendOnboardingEmails', {});
      if (result.error) throw new Error(result.error);
      setEmailSendResult(`${result.sent} email${result.sent !== 1 ? 's' : ''} sent successfully`);
      toast.success(`${result.sent} onboarding email${result.sent !== 1 ? 's' : ''} sent`);
    } catch (err) {
      setEmailSendResult('Send error: ' + err.message);
      toast.error('Failed to send emails: ' + err.message);
    } finally {
      setSendingEmails(false);
    }
  };

  const handleCopyAllCredentials = () => {
    const successResults = results.filter(r => r.status === 'success');
    const text = successResults.map(r =>
      `Name: ${r.name}\nEmail: ${r.email}\nTemp Password: ${r.password}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('All credentials copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {step === 'edit' && (
        <>
          {/* Staff List */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600" />
                Staff to Onboard
              </h3>
              <Button onClick={handleAddRow} variant="outline" size="sm" className="gap-1">
                <Plus className="w-3 h-3" /> Add Row
              </Button>
            </div>

            <div className="space-y-2">
              {staffEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={entry.name}
                      onChange={(e) => handleEntryChange(idx, 'name', e.target.value)}
                      placeholder="Full Name"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={entry.email}
                      onChange={(e) => handleEntryChange(idx, 'email', e.target.value)}
                      placeholder="Email"
                      className="text-sm"
                    />
                  </div>
                  <div className="w-36">
                    <div className="flex gap-1">
                      <Input
                        value={entry.password}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => handleRegeneratePassword(idx)}
                        title="Regenerate password"
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-700 shrink-0"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={staffEntries.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              {validEntries.length} of {staffEntries.length} entries ready
            </p>
          </Card>

          {/* Team & Chat Group Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.length > 0 && (
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Assign to Teams</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center gap-2 p-1.5">
                      <Checkbox
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={(checked) => {
                          setSelectedTeams(prev =>
                            checked ? [...prev, team.id] : prev.filter(id => id !== team.id)
                          );
                        }}
                      />
                      <span className="text-sm text-slate-700">{team.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {groupChats.length > 0 && (
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Add to Chat Groups</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {groupChats.map(conv => (
                    <div key={conv.id} className="flex items-center gap-2 p-1.5">
                      <Checkbox
                        checked={selectedChatGroups.includes(conv.id)}
                        onCheckedChange={(checked) => {
                          setSelectedChatGroups(prev =>
                            checked ? [...prev, conv.id] : prev.filter(id => id !== conv.id)
                          );
                        }}
                      />
                      <span className="text-sm text-slate-700">{conv.name || 'Unnamed Group'}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Email Editor */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600" />
              Email Template
            </h3>

            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Email Body
                <span className="text-xs text-slate-500 ml-2">
                  Use {'{{name}}'}, {'{{email}}'}, {'{{password}}'} for personalisation
                </span>
              </Label>
              <Textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={16}
                className="text-sm font-mono"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setStep('preview')}
              disabled={validEntries.length === 0}
              className="gap-2"
            >
              Preview Email
            </Button>
          </Card>

          {/* Schedule Info & Submit */}
          <Card className="p-4 space-y-3 border-teal-200 bg-teal-50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <div>
                <p className="font-semibold text-slate-900">Scheduled for 6:00 AM UK Time Tomorrow</p>
                <p className="text-sm text-slate-600">
                  Accounts will be created now. Emails will be sent tomorrow morning.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setStep('processing');
                processOnboarding.mutate();
              }}
              disabled={validEntries.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              Create {validEntries.length} Account{validEntries.length !== 1 ? 's' : ''} & Schedule Emails
            </Button>
          </Card>
        </>
      )}

      {step === 'preview' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Email Preview</h3>
            <Button variant="outline" size="sm" onClick={() => setStep('edit')}>
              Back to Edit
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b text-sm">
              <span className="text-slate-500">Subject:</span> {emailSubject}
            </div>
            <div
              className="p-4 bg-white text-sm"
              dangerouslySetInnerHTML={{
                __html: buildEmailHtml(
                  validEntries[0] || { name: 'Jane Smith', email: 'jane@example.com', password: 'TempPass123!' }
                )
              }}
            />
          </div>
          <Button variant="outline" onClick={() => setStep('edit')}>
            Back to Edit
          </Button>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="p-12 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-lg font-semibold text-slate-900">Creating accounts & scheduling emails...</p>
          <p className="text-sm text-slate-500">This may take a moment</p>
        </Card>
      )}

      {step === 'done' && (
        <div className="space-y-4">
          <Card className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-900">Onboarding Complete</h3>
            <p className="text-sm text-slate-600">
              Accounts created. Emails queued and ready to send.
            </p>
          </Card>

          <Card className="p-4 space-y-3 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Send Onboarding Emails</p>
                <p className="text-sm text-slate-600">
                  {results.filter(r => r.status === 'success').length} email{results.filter(r => r.status === 'success').length !== 1 ? 's' : ''} queued
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendEmailsNow}
                disabled={sendingEmails}
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {sendingEmails ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Emails Now</>
                )}
              </Button>
            </div>
            {emailSendResult && (
              <p className={`text-sm ${emailSendResult.includes('error') ? 'text-red-600' : 'text-green-700'}`}>
                {emailSendResult}
              </p>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Results</h3>
              <Button variant="outline" size="sm" onClick={handleCopyAllCredentials} className="gap-1">
                <Copy className="w-3 h-3" /> Copy All Credentials
              </Button>
            </div>

            <div className="space-y-2">
              {results.map((r, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-600">{r.email}</p>
                    {r.status === 'success' && (
                      <p className="text-xs font-mono text-slate-500 mt-1">Password: {r.password}</p>
                    )}
                    {r.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {r.error}
                      </p>
                    )}
                  </div>
                  <Badge className={r.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {r.status === 'success' ? 'Created' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Button
            variant="outline"
            onClick={() => {
              setStep('edit');
              setStaffEntries([{ name: '', email: '', password: generateTempPassword() }]);
              setResults([]);
              setEmailSendResult(null);
            }}
            className="w-full"
          >
            Start New Batch
          </Button>
        </div>
      )}
    </div>
  );
}

// Get UK timezone offset (handles BST/GMT)
function getUKOffset(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const ukJan = -0; // GMT = UTC+0
  const ukJul = -60; // BST = UTC+1

  // Check if date is in BST (last Sunday of March to last Sunday of October)
  const month = date.getMonth();
  if (month > 2 && month < 9) return 1; // April-September = BST
  if (month < 2 || month > 9) return 0; // Jan-Feb, Nov-Dec = GMT

  // March or October — check exact switchover
  const lastSunday = new Date(date.getFullYear(), month + 1, 0);
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());

  if (month === 2) return date >= lastSunday ? 1 : 0; // March
  return date < lastSunday ? 1 : 0; // October
}
