import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import { toast } from 'sonner';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  UserPlus, Trash2, Plus, Mail, Clock, CheckCircle2,
  Copy, Send, AlertTriangle, Loader2, Save, FolderOpen, RefreshCw
} from 'lucide-react';

const SITE_URL = 'https://app.carecallai.co.uk';

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

const DEFAULT_TEMPLATE = `Hi {{name}},

Welcome to Care Call AI! Your admin has created an account for you.

IMPORTANT: Please remove any other care-related apps from your phone before installing this one.

How to Install:
1. Open this link on your phone: ${SITE_URL}
2. On iPhone: Tap the Share button (square with arrow) then "Add to Home Screen"
3. On Android: Tap the three dots menu then "Install app" or "Add to Home Screen"
4. Open the app from your home screen

Your Login Details:
Email: {{email}}
Temporary Password: {{password}}

You will be asked to set a new password on your first login.

Permissions Required:
When prompted, please allow the following:
- Location/GPS — Required for clock-in and clock-out verification
- Camera — Used for photo verification and document uploads
- Notifications — So you receive shift reminders, messages, and alerts

These permissions are essential for the app to work correctly. Please enable them all when asked.

Getting Started:
1. Open the app and sign in with the details above
2. Set your new password when prompted
3. Allow all permissions when asked
4. You're ready to go!

If you have any issues, please contact your manager.

Best regards,
Care Call AI Team`;

/** Convert plain text to styled HTML email */
function textToHtml(text, entry) {
  let body = text
    .replace(/\{\{name\}\}/g, entry.name?.trim() || 'Staff Member')
    .replace(/\{\{email\}\}/g, entry.email?.trim()?.toLowerCase() || 'email@example.com')
    .replace(/\{\{password\}\}/g, entry.password || 'TempPass123!');

  // Auto-detect and bold section headings (lines ending with colon, or ALL CAPS lines)
  const lines = body.split('\n');
  const htmlLines = lines.map(line => {
    const trimmed = line.trim();
    // Bold headings: lines that end with ":" and are short
    if (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
      return `<strong>${trimmed}</strong>`;
    }
    // Bold IMPORTANT lines
    if (trimmed.startsWith('IMPORTANT:') || trimmed.startsWith('IMPORTANT ')) {
      return `<strong>${trimmed}</strong>`;
    }
    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return `&bull; ${trimmed.slice(2)}`;
    }
    // Linkify URLs
    return trimmed.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" style="color: #0d9488; text-decoration: underline;">$1</a>'
    );
  });

  const htmlBody = htmlLines.join('<br>');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: #0d9488; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 700;">C</div>
        <h1 style="font-size: 22px; color: #0f172a; margin: 12px 0 4px;">Care Call AI</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; line-height: 1.7;">
        ${htmlBody}
      </div>
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #94a3b8;">This is an automated message from Care Call AI</p>
      </div>
    </div>
  `;
}

export default function BulkOnboardPanel() {
  const queryClient = useQueryClient();
  const [staffEntries, setStaffEntries] = useState([
    { name: '', email: '', password: generateTempPassword() }
  ]);
  const [emailSubject, setEmailSubject] = useState('Welcome to Care Call AI — Your Login Details');
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_TEMPLATE);
  const [step, setStep] = useState('edit'); // 'edit' | 'preview' | 'processing' | 'done'
  const [results, setResults] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedChatGroups, setSelectedChatGroups] = useState([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState(null);
  const [sendNow, setSendNow] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('onboarding_email_templates');
      if (stored) setSavedTemplates(JSON.parse(stored));
    } catch {}
  }, []);

  const saveTemplatesToStorage = (templates) => {
    setSavedTemplates(templates);
    localStorage.setItem('onboarding_email_templates', JSON.stringify(templates));
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Enter a template name');
      return;
    }
    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      subject: emailSubject,
      body: emailTemplate,
    };
    const updated = [...savedTemplates.filter(t => t.name !== templateName.trim()), newTemplate];
    saveTemplatesToStorage(updated);
    setShowSaveTemplate(false);
    setTemplateName('');
    toast.success('Template saved');
  };

  const handleLoadTemplate = (template) => {
    setEmailSubject(template.subject);
    setEmailTemplate(template.body);
    toast.success(`Loaded: ${template.name}`);
  };

  const handleDeleteTemplate = (id) => {
    saveTemplatesToStorage(savedTemplates.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

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

  const processOnboarding = useMutation({
    mutationFn: async () => {
      const resultsList = [];

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

          // 4. Handle email — send now or schedule
          const htmlBody = textToHtml(emailTemplate, entry);

          if (sendNow) {
            // Send immediately via edge function
            try {
              await base44.functions.invoke('sendOnboardingEmails', {
                immediate: true,
                emails: [{
                  email: entry.email.trim().toLowerCase(),
                  full_name: entry.name.trim(),
                  subject: emailSubject,
                  html_body: htmlBody,
                }],
              });
            } catch (emailErr) {
              console.warn('Email send failed, queuing instead:', emailErr);
              // Fallback: queue for later
              await supabase.from('scheduled_onboarding_emails').insert({
                user_id: newUserId,
                email: entry.email.trim().toLowerCase(),
                full_name: entry.name.trim(),
                temp_password: entry.password,
                subject: emailSubject,
                html_body: htmlBody,
                scheduled_at: new Date().toISOString(),
              });
            }
          } else {
            // Schedule for tomorrow 6am UK
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const ukOffset = getUKOffset(tomorrow);
            const scheduledAt = new Date(
              tomorrow.toLocaleDateString('en-CA', { timeZone: 'Europe/London' }) + 'T06:00:00+00:00'
            );
            scheduledAt.setHours(6 - ukOffset);

            await supabase.from('scheduled_onboarding_emails').insert({
              user_id: newUserId,
              email: entry.email.trim().toLowerCase(),
              full_name: entry.name.trim(),
              temp_password: entry.password,
              subject: emailSubject,
              html_body: htmlBody,
              scheduled_at: scheduledAt.toISOString(),
            });
          }

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
        toast.success(`${successCount} staff account${successCount !== 1 ? 's' : ''} created${sendNow ? ' & emails sent' : ' & emails scheduled for 6am'}`);
      } else {
        toast.warning(`${successCount} created, ${errorCount} failed`);
      }
    },
    onError: (error) => {
      toast.error('Onboarding failed: ' + error.message);
      setStep('edit');
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
      setEmailSendResult('Failed: ' + err.message);
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

  const sampleEntry = validEntries[0] || { name: 'Jane Smith', email: 'jane@example.com', password: 'TempPass123!' };

  return (
    <div className="space-y-4">
      {step === 'edit' && (
        <>
          {/* Staff List */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-600" />
                Staff to Onboard
              </h3>
              <Button onClick={handleAddRow} variant="outline" size="sm" className="gap-1">
                <Plus className="w-3 h-3" /> Add
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
                  <div className="w-32 sm:w-36">
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
                        <RefreshCw className="w-3 h-3" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teams.length > 0 && (
              <Card className="p-4 space-y-2">
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
              <Card className="p-4 space-y-2">
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

          {/* Email Template Editor */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                Welcome Email
              </h3>
              <div className="flex gap-1.5">
                {savedTemplates.length > 0 && (
                  <Select onValueChange={(val) => {
                    const tpl = savedTemplates.find(t => String(t.id) === val);
                    if (tpl) handleLoadTemplate(tpl);
                  }}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <FolderOpen className="w-3 h-3 mr-1" />
                      <SelectValue placeholder="Load template" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedTemplates.map(t => (
                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                >
                  <Save className="w-3 h-3" /> Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setEmailTemplate(DEFAULT_TEMPLATE); toast.success('Reset to default'); }}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Save template inline */}
            {showSaveTemplate && (
              <div className="flex gap-2 p-2 bg-slate-50 rounded-lg">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                />
                <Button size="sm" onClick={handleSaveTemplate}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSaveTemplate(false)}>Cancel</Button>
              </div>
            )}

            {/* Saved templates list */}
            {savedTemplates.length > 0 && showSaveTemplate && (
              <div className="space-y-1">
                {savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                    <span className="text-slate-700">{t.name}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleLoadTemplate(t)}>Load</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500" onClick={() => handleDeleteTemplate(t.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Message</Label>
                <span className="text-[11px] text-slate-400">
                  Use {'{{name}}'}, {'{{email}}'}, {'{{password}}'} for auto-fill
                </span>
              </div>
              <Textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={14}
                className="text-sm"
                placeholder="Write your welcome email here..."
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setStep('preview')}
              disabled={validEntries.length === 0}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Preview Email
            </Button>
          </Card>

          {/* Send Options & Submit */}
          <Card className="p-4 space-y-3 border-teal-200 bg-teal-50">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setSendNow(true)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    sendNow ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 inline mr-1.5" />
                  Send Now
                </button>
                <button
                  onClick={() => setSendNow(false)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !sendNow ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                  Schedule 6am
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              {sendNow
                ? 'Accounts will be created and welcome emails sent immediately.'
                : 'Accounts will be created now. Emails will be sent tomorrow at 6:00 AM UK time.'}
            </p>

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
              Create {validEntries.length} Account{validEntries.length !== 1 ? 's' : ''} & {sendNow ? 'Send Emails' : 'Schedule Emails'}
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
              <span className="text-slate-500">To:</span> {sampleEntry.email}
            </div>
            <div className="bg-slate-100 px-4 py-2 border-b text-sm">
              <span className="text-slate-500">Subject:</span> {emailSubject}
            </div>
            <div
              className="p-4 bg-white text-sm"
              dangerouslySetInnerHTML={{ __html: textToHtml(emailTemplate, sampleEntry) }}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('edit')}>
              Edit
            </Button>
            <Button
              onClick={() => {
                setStep('processing');
                processOnboarding.mutate();
              }}
              disabled={validEntries.length === 0}
              className="flex-1 bg-teal-600 hover:bg-teal-700 gap-2"
            >
              <Send className="w-4 h-4" />
              Create Accounts & {sendNow ? 'Send' : 'Schedule'} Emails
            </Button>
          </div>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="p-12 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-lg font-semibold text-slate-900">Creating accounts{sendNow ? ' & sending emails' : ''}...</p>
          <p className="text-sm text-slate-500">This may take a moment</p>
        </Card>
      )}

      {step === 'done' && (
        <div className="space-y-4">
          <Card className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-900">Onboarding Complete</h3>
            <p className="text-sm text-slate-600">
              {results.filter(r => r.status === 'success').length} account{results.filter(r => r.status === 'success').length !== 1 ? 's' : ''} created.
              {sendNow ? ' Welcome emails sent.' : ' Emails scheduled for 6am tomorrow.'}
            </p>
          </Card>

          {!sendNow && (
            <Card className="p-4 space-y-3 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Send Emails Now Instead</p>
                  <p className="text-sm text-slate-600">
                    Send all queued onboarding emails immediately
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendEmailsNow}
                disabled={sendingEmails}
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {sendingEmails ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send All Emails Now</>
                )}
              </Button>
              {emailSendResult && (
                <p className={`text-sm ${emailSendResult.includes('Failed') ? 'text-red-600' : 'text-green-700'}`}>
                  {emailSendResult}
                </p>
              )}
            </Card>
          )}

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Results</h3>
              <Button variant="outline" size="sm" onClick={handleCopyAllCredentials} className="gap-1">
                <Copy className="w-3 h-3" /> Copy Credentials
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
  const month = date.getMonth();
  if (month > 2 && month < 9) return 1; // April-September = BST
  if (month < 2 || month > 9) return 0; // Jan-Feb, Nov-Dec = GMT
  const lastSunday = new Date(date.getFullYear(), month + 1, 0);
  lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
  if (month === 2) return date >= lastSunday ? 1 : 0; // March
  return date < lastSunday ? 1 : 0; // October
}
