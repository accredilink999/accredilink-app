import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import ReactMarkdown from 'react-markdown';
import useSpeechToText from '@/hooks/useSpeechToText';
import SpeakButton from '@/components/ui/SpeakButton';
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  MessageSquare,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Terminal,
  Mic,
  MicOff,
  FileText,
  Download
} from 'lucide-react';

const adminActions = [
  { label: 'View system status', prompt: 'Give me a comprehensive system status including active users, pending tasks, compliance metrics, and any alerts.' },
  { label: 'Manage users', prompt: 'What user management actions do I need to perform? Show me pending approvals and issues.' },
  { label: 'Review analytics', prompt: 'Provide detailed analytics on staff performance, client metrics, and operational KPIs.' },
  { label: 'Configuration', prompt: 'Review current system configuration and suggest optimization opportunities.' },
  { label: 'Audit & compliance', prompt: 'Generate a compliance audit report with any flagged issues or risks.' },
];

const documentTemplates = [
   { label: 'Standard Operating Procedure', type: 'sop', prompt: 'Create a standard operating procedure document for: ' },
   { label: 'Care Plan', type: 'care_plan', prompt: 'Create a comprehensive care plan for: ' },
   { label: 'Incident Report', type: 'incident_report', prompt: 'Create an incident report for: ' },
   { label: 'Policy', type: 'policy', prompt: 'Create a policy document for: ' },
];



export default function AIAssistant() {
   const [conversations, setConversations] = useState([]);
   const [currentConversation, setCurrentConversation] = useState(null);
   const [messages, setMessages] = useState([]);
   const [input, setInput] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [confirmDialog, setConfirmDialog] = useState(null);
   const [showDocumentDialog, setShowDocumentDialog] = useState(false);
   const [selectedDocType, setSelectedDocType] = useState(null);
   const [docInput, setDocInput] = useState('');
   const messagesEndRef = useRef(null);
   const pendingSpeechRef = useRef(null);

   const { data: user } = useQuery({
     queryKey: ['currentUser'],
     queryFn: () => base44.auth.me(),
   });

   const isAdmin = user?.role === 'admin';

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs = await base44.agents.listConversations({ agent_name: 'care_assistant' });
        setConversations(convs || []);
        if (convs?.length > 0 && !currentConversation) {
          setCurrentConversation(convs[0]);
          setMessages(convs[0].messages || []);
        }
      } catch (error) {
        console.log('No existing conversations');
      }
    };
    loadConversations();
  }, []);



  // Subscribe to conversation updates
  useEffect(() => {
    if (!currentConversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
      const newMessages = data.messages || [];

      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentConversation?.id]);

  // Speech-to-text hook (Web Speech API + Whisper fallback)
  const { isListening, toggleListening } = useSpeechToText({
    onResult: (transcript) => {
      setInput(transcript);
      pendingSpeechRef.current = transcript;
    },
    lang: 'en-GB',
  });

  // Auto-send when speech result arrives
  useEffect(() => {
    if (pendingSpeechRef.current) {
      const text = pendingSpeechRef.current;
      pendingSpeechRef.current = null;
      setTimeout(() => sendMessage(text), 100);
    }
  }, [input]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const createNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'care_assistant',
        metadata: {
          name: `Chat ${format(new Date(), 'dd MMM HH:mm')}`,
          type: 'task'
        }
      });
      setConversations([conv, ...conversations]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    let conv = currentConversation;

    if (!conv) {
      try {
        conv = await base44.agents.createConversation({
          agent_name: 'care_assistant',
          metadata: {
            name: `Chat ${format(new Date(), 'dd MMM HH:mm')}`,
            type: 'task'
          }
        });
        setConversations([conv, ...conversations]);
        setCurrentConversation(conv);
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const getSystemPrompt = () => {
        const basePrompt = `You are an intelligent task assistant integrated with the care management system. You help users execute tasks and operations based on their permission level.

       CRITICAL INSTRUCTION: You ONLY have access to operations that the current user is permitted to perform based on their role. Do NOT attempt operations outside their permission level. If a user requests something they don't have access to, explain what permissions are needed.

       Current user: ${user?.full_name}
       User role: ${user?.role}
       Current date: ${format(new Date(), 'PPpp')}

       PERMISSION-BASED ACCESS:`;

        if (user?.role === 'admin') {
          return basePrompt + `

       ADMIN LEVEL - Full System Access:
       - ALL database entities (full CRUD)
       - User management and roles
       - System configuration
       - All backend functions
       - Email and notifications (Core.SendEmail)
       - Forms, documents, and submissions
       - Analytics and reporting`;
        } else {
          return basePrompt + `

       STAFF LEVEL - Limited Access:
       - View and manage: Service Users, Shifts, Care Logs, Training, Leave Requests
       - View: Incidents, Messages, Documents
       - Cannot: Create/modify users, change system configuration, manage admin functions
       - Cannot: Access system-level operations or unrestricted data

       For any task, only execute operations within this permission level. If user requests restricted operations, explain the limitation and suggest what you can help with instead.`;
        }
      };

      const systemPrompt = getSystemPrompt();

      await base44.agents.addMessage(conv, {
        role: 'user',
        content: text
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  const generateDocument = async (type, content) => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('generateDocument', {
        type,
        content
      });

      if (response.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Document generated: **${response.data.document.title}**\n\n${response.data.content}`,
          type: 'document'
        }]);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error generating document: ${error.message}`
      }]);
    }
    setIsLoading(false);
    setShowDocumentDialog(false);
    setSelectedDocType(null);
    setDocInput('');
  };




  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b">
         <h1 className="text-lg md:text-2xl font-bold text-slate-900">AI Task Assistant</h1>
         <div className="flex items-center gap-2 mt-2">
           <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200">
             <CheckCircle2 className="w-3 h-3 text-blue-600" />
             <span className="text-xs font-medium text-blue-700">{user?.role === 'admin' ? 'Admin Access' : 'Staff Access'}</span>
           </div>
           <Button 
             onClick={createNewConversation}
             size="sm"
             className="md:hidden bg-teal-600 hover:bg-teal-700 h-7 text-xs"
           >
             <Plus className="w-3 h-3 mr-1" />
             New
           </Button>
         </div>
       </div>

       <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 px-2 md:px-4">
         {/* Sidebar - Sessions */}
         <div className="hidden md:flex md:w-56 flex-col bg-white rounded-lg shadow-sm p-3">
           <Button 
             onClick={createNewConversation}
             size="sm"
             className="w-full mb-3 bg-teal-600 hover:bg-teal-700"
           >
             <Plus className="w-4 h-4 mr-2" />
             New
           </Button>

           <div className="flex-1 overflow-y-auto space-y-2">
             {conversations.map((conv) => (
               <button
                 key={conv.id}
                 onClick={() => {
                   setCurrentConversation(conv);
                   setMessages(conv.messages || []);
                 }}
                 className={`w-full text-left p-3 rounded-lg transition-colors ${
                   currentConversation?.id === conv.id 
                     ? 'bg-teal-50 text-teal-700' 
                     : 'hover:bg-slate-50 text-slate-600'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 flex-shrink-0" />
                   <span className="truncate text-sm font-medium">
                     {conv.metadata?.name || 'Session'}
                   </span>
                 </div>
               </button>
             ))}
           </div>
           </div>

           {/* Main Chat Area */}
          <Card className="flex-1 flex flex-col bg-white border-0 shadow-sm overflow-hidden rounded-lg">
          {/* Status Banner */}
          <div className="text-white px-3 py-2 md:px-4 md:py-3 flex items-center gap-2 md:gap-3 bg-gradient-to-r from-teal-600 to-teal-700">
            <Bot className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs md:text-sm truncate">Task Assistant</p>
              <p className="text-xs opacity-90 truncate">{user?.role === 'admin' ? 'Admin privileges' : 'Staff level access'}</p>
            </div>
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-xs font-medium flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 md:mb-4 bg-gradient-to-br from-teal-400 to-teal-600">
                   <Bot className="w-6 h-6 md:w-8 md:h-8 text-white" />
                 </div>
                 <h2 className="text-base md:text-xl font-bold text-slate-900 mb-2">Task Assistant</h2>
                 <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6 max-w-sm md:max-w-md">
                   Ask me to complete tasks based on your access level. I'll help with scheduling, clients, training, and more.
                 </p>

                 <Alert className="mt-4 md:mt-6 max-w-sm md:max-w-lg bg-blue-50 border-blue-200">
                   <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                   <AlertDescription className="text-xs md:text-sm text-blue-700">
                     {user?.role === 'admin' ? 'Full admin access enabled. Review before high-risk actions.' : 'Staff-level access. I can only perform operations you have permission for.'}
                   </AlertDescription>
                 </Alert>
              </div>
            ) : (
              messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role !== 'user' && (
                     <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                       <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                     </div>
                   )}

                  <div className={`max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 ${
                       message.role === 'user' 
                         ? 'bg-teal-600 text-white' 
                         : 'bg-slate-100 text-slate-900'
                     }`}>
                      {message.role === 'user' ? (
                        <p className="text-xs md:text-sm break-words">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm md:prose-base max-w-none text-xs md:text-sm [&>*]:my-1 md:[&>*]:my-2 [&>p]:leading-snug md:[&>p]:leading-normal">
                          <ReactMarkdown>{message.content || ''}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {message.role !== 'user' && message.content && (
                      <div className="flex items-center mt-1">
                        <SpeakButton text={message.content} />
                      </div>
                    )}

                    {message.tool_calls?.length > 0 && (
                      <div className="mt-1 md:mt-2 space-y-0.5">
                        {message.tool_calls.map((tc, i) => (
                          <div key={i} className="text-xs text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                            <span className="truncate text-xs">{tc.status === 'running' ? 'Executing...' : tc.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar name={user?.full_name} size="sm" src={user?.photo_url} />
                  )}
                </div>
              ))
            )}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
               <div className="flex gap-2 md:gap-3">
                 <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                   <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                 </div>
                 <div className="bg-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3">
                   <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-teal-600" />
                 </div>
               </div>
             )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 md:p-4 border-t space-y-2">
            {isAdmin && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {documentTemplates.map((doc) => (
                  <Button
                    key={doc.type}
                    onClick={() => {
                      setSelectedDocType(doc.type);
                      setShowDocumentDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs whitespace-nowrap"
                    disabled={isLoading}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    {doc.label}
                  </Button>
                ))}
              </div>
            )}
            <form 
             onSubmit={(e) => {
               e.preventDefault();
               sendMessage(input);
             }}
             className="flex gap-2"
            >
             <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAdmin ? "Admin command..." : "Ask..."}
                className="flex-1 text-xs md:text-sm h-9 md:h-10"
                disabled={isLoading}
               />
             <Button
               type="button"
               onClick={toggleListening}
               disabled={isLoading}
               variant={isListening ? "destructive" : "outline"}
               size="sm"
               className="h-9 md:h-10 px-2 md:px-3"
             >
               {isListening ? (
                 <MicOff className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
               ) : (
                 <Mic className="w-3 h-3 md:w-4 md:h-4" />
               )}
             </Button>
             <Button 
               type="submit" 
               disabled={!input.trim() || isLoading}
               size="sm"
               className="bg-teal-600 hover:bg-teal-700"
             >
               {isLoading ? (
                 <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
               ) : (
                 <Send className="w-3 h-3 md:w-4 md:h-4" />
               )}
             </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Document Generation Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Generate Document
            </DialogTitle>
            <DialogDescription>
              {documentTemplates.find(d => d.type === selectedDocType)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Enter details about the document content..."
              value={docInput}
              onChange={(e) => setDocInput(e.target.value)}
              className="min-h-24"
              as="textarea"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => generateDocument(selectedDocType, docInput)}
              disabled={!docInput.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Confirm High-Risk Action
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.message}
              </DialogDescription>
            </DialogHeader>
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                This action is irreversible and affects system integrity.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}