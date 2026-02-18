import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, AlertCircle, CheckCircle2, Clock, Plus, Trash2, Users as UsersIcon, Mic, MicOff, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSpeechToText from '@/hooks/useSpeechToText';
import SpeakButton from '@/components/ui/SpeakButton';

export default function AIAdminAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const pendingSpeechRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingLeave = [] } = useQuery({
    queryKey: ['pendingLeaveAssistant'],
    queryFn: () => base44.entities.LeaveRequest.filter({ status: 'pending' }),
  });

  const { data: pendingSwaps = [] } = useQuery({
    queryKey: ['pendingSwapsAssistant'],
    queryFn: () => base44.entities.ShiftSwapRequest.filter({ status: 'pending' }),
  });

  const { data: openIncidents = [] } = useQuery({
    queryKey: ['openIncidentsAssistant'],
    queryFn: () => base44.entities.Incident.filter({ status: 'open' }),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['careTeams'],
    queryFn: () => base44.entities.CareTeam.list(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documentsForAlerts'],
    queryFn: () => base44.entities.Document.list(),
  });

  const { data: allIncidents = [] } = useQuery({
    queryKey: ['allIncidents'],
    queryFn: () => base44.entities.Incident.list(),
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.CareTeam.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careTeams'] });
      setTeamName('');
      setTeamDesc('');
      setShowTeamDialog(false);
    },
  });

  const deleteTeamMutation = useMutation({
     mutationFn: (teamId) => base44.entities.CareTeam.delete(teamId),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['careTeams'] });
     },
   });

  // Proactive alert generation for policy review dates
  useEffect(() => {
    if (!documents || !user) return;

    const checkPolicyReviews = async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

      for (const doc of documents) {
        if (doc.category === 'policy' && doc.review_date) {
          const reviewDate = new Date(doc.review_date);

          if (reviewDate <= thirtyDaysFromNow && reviewDate >= today) {
            const daysUntilReview = Math.ceil((reviewDate - today) / (1000 * 60 * 60 * 24));

            try {
              const existingAlerts = await base44.entities.Message.filter({
                type: 'announcement',
                title: `Policy Review Due: ${doc.title}`
              });

              if (existingAlerts.length === 0) {
                const priority = daysUntilReview <= 7 ? 'high' : 'normal';
                const alertContent = `🔔 The policy "${doc.title}" is due for review in ${daysUntilReview} days (${reviewDate.toLocaleDateString()}). Please review and update as necessary.`;

                await base44.entities.Message.create({
                  type: 'announcement',
                  title: `Policy Review Due: ${doc.title}`,
                  content: alertContent,
                  sender_id: 'system',
                  sender_name: 'AI Assistant',
                  priority,
                  read_by: []
                });

                // Send email to admins
                const allUsers = await base44.entities.User.list();
                const adminEmails = allUsers
                  .filter(u => u.role === 'admin' || u.role === 'super_admin' || u.job_title === 'admin' || u.job_title === 'manager')
                  .map(u => u.email)
                  .filter(Boolean);

                if (adminEmails.length > 0) {
                  await base44.functions.invoke('sendAlertEmail', {
                    title: `Policy Review Due: ${doc.title}`,
                    content: alertContent,
                    recipientEmails: adminEmails,
                    priority
                  });
                }
              }
            } catch (error) {
              console.error('Error creating policy alert:', error);
            }
          }
        }
      }
    };

    checkPolicyReviews();
  }, [documents, user]);

  // Proactive alert generation for incident reports with critical keywords
  useEffect(() => {
    if (!allIncidents || !user) return;

    const checkIncidentKeywords = async () => {
      const criticalKeywords = [
        'death', 'died', 'fatality', 'fatal',
        'serious injury', 'severe injury', 'hospitalized', 'hospital admission',
        'abuse', 'assault', 'violence', 'attacked',
        'safeguarding', 'vulnerable', 'neglect',
        'police', 'ambulance', 'emergency services',
        'missing', 'absconded', 'wandered off',
        'medication error', 'wrong medication', 'overdose'
      ];

      for (const incident of allIncidents) {
        if (incident.status === 'open' || incident.status === 'investigating') {
          const description = (incident.description || '').toLowerCase();
          const immediateAction = (incident.immediate_action_taken || '').toLowerCase();
          const fullText = `${description} ${immediateAction}`;

          const foundKeywords = criticalKeywords.filter(keyword => 
            fullText.includes(keyword.toLowerCase())
          );

          if (foundKeywords.length > 0) {
            try {
              const existingAlerts = await base44.entities.Message.filter({
                type: 'announcement',
                title: `Critical Incident Alert: ${incident.title}`
              });

              if (existingAlerts.length === 0) {
                const alertContent = `⚠️ CRITICAL: Incident "${incident.title}" contains critical keywords: ${foundKeywords.join(', ')}. Immediate attention required.\n\nIncident Type: ${incident.type}\nSeverity: ${incident.severity}\nDate: ${incident.incident_date}\n\nPlease review and take appropriate action immediately.`;

                await base44.entities.Message.create({
                  type: 'announcement',
                  title: `Critical Incident Alert: ${incident.title}`,
                  content: alertContent,
                  sender_id: 'system',
                  sender_name: 'AI Assistant',
                  priority: 'urgent',
                  read_by: []
                });

                // Send urgent email to all admins and managers
                const allUsers = await base44.entities.User.list();
                const adminEmails = allUsers
                  .filter(u => u.role === 'admin' || u.role === 'super_admin' || u.job_title === 'admin' || u.job_title === 'manager' || u.job_title === 'supervisor')
                  .map(u => u.email)
                  .filter(Boolean);

                if (adminEmails.length > 0) {
                  await base44.functions.invoke('sendAlertEmail', {
                    title: `Critical Incident Alert: ${incident.title}`,
                    content: alertContent,
                    recipientEmails: adminEmails,
                    priority: 'urgent'
                  });
                }
              }
            } catch (error) {
              console.error('Error creating incident alert:', error);
            }
          }
        }
      }
    };

    checkIncidentKeywords();
  }, [allIncidents, user]);

  // Speech-to-text hook (Web Speech API + Whisper fallback)
  const { isListening, toggleListening } = useSpeechToText({
    onResult: (transcript) => {
      setInput(transcript);
      pendingSpeechRef.current = transcript;
    },
    lang: 'en-GB',
  });

  // Auto-submit when speech result arrives
  React.useEffect(() => {
    if (pendingSpeechRef.current) {
      pendingSpeechRef.current = null;
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      }, 100);
    }
  }, [input]);



  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI admin assistant for a care management system. The current user is ${user?.staff_full_name || user?.full_name}. 
        
Current admin metrics:
- Pending leave requests: ${pendingLeave.length}
- Pending shift swaps: ${pendingSwaps.length}
- Open incidents: ${openIncidents.length}

User query: ${input}

Provide helpful, actionable insights and recommendations.`,
        add_context_from_internet: false,
      });

      const assistantMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'I encountered an error processing your request. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Admin Assistant" 
        subtitle="Get intelligent insights and assistance with administrative tasks"
        icon={Bot}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
          <TabsTrigger value="insights">Quick Insights</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          <Card className="p-6 bg-white border-0 shadow-sm flex flex-col h-96">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <p className="text-sm">Start a conversation with your AI assistant</p>
                    <p className="text-xs mt-2">Ask about pending approvals, staffing insights, or system recommendations</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      {msg.role !== 'user' && msg.content && (
                        <div className="flex items-center mt-1">
                          <SpeakButton text={msg.content} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={toggleListening}
                disabled={isLoading}
                variant={isListening ? "destructive" : "outline"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-white border-0 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Pending Approvals</p>
                  <p className="text-3xl font-bold text-slate-900">{pendingLeave.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Leave requests awaiting approval</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-0 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Pending Swaps</p>
                  <p className="text-3xl font-bold text-slate-900">{pendingSwaps.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Shift swap requests to review</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-0 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Open Incidents</p>
                  <p className="text-3xl font-bold text-slate-900">{openIncidents.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Unresolved incidents</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Tips</h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">Review and approve pending leave requests to keep your roster updated</p>
              </div>
              <div className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">Process shift swap requests promptly to maintain staff satisfaction</p>
              </div>
              <div className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">Investigate and resolve open incidents to ensure compliance and safety</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Care Teams</h3>
            <Button onClick={() => setShowTeamDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => (
              <Card key={team.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2">
                    <UsersIcon className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{team.name}</h4>
                      {team.description && (
                        <p className="text-sm text-slate-600 mt-1">{team.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTeamMutation.mutate(team.id)}
                    className="text-red-600 hover:text-red-700 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  {team.member_ids?.length || 0} members
                </p>
              </Card>
            ))}
          </div>

          {teams.length === 0 && (
            <Card className="p-8 text-center">
              <UsersIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">No teams created yet</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Team Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Team Name *</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., North Team"
                className="w-full border rounded px-3 py-2 text-sm"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createTeamMutation.mutate({ name: teamName, description: teamDesc, member_ids: [], member_names: [] })}
              disabled={!teamName.trim() || createTeamMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}