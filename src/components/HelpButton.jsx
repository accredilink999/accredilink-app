import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import useSpeechToText from '@/hooks/useSpeechToText';
import { toast } from 'sonner';
import {
  HelpCircle,
  X,
  Send,
  Bug,
  MessageSquare,
  Lightbulb,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  FileWarning,
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'bug', label: 'Bug / Error', icon: Bug, color: 'text-red-500' },
  { id: 'help', label: 'Need Help', icon: MessageSquare, color: 'text-blue-500' },
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500' },
];

const HELP_SYSTEM_PROMPT = `You are MikeAI, a friendly and knowledgeable AI assistant for CareCallAI, a care management app used by domiciliary care staff and administrators.

You have LIVE ACCESS to the app's data including staff lists, client lists, upcoming shifts, pending leave requests, recent incidents, and expiring training. Use this data to give specific, accurate answers.

You help users with:
- Answering questions about staff, clients, shifts, rotas, and schedules using real data
- Navigating the app (shifts, rotas, care logs, client calls, chat, settings)
- Understanding features (how to clock on/off, submit care logs, view rotas, manage medications)
- Troubleshooting common issues (login problems, missing data, sync issues, notification problems)
- Explaining how the rota system works (creating shifts, assigning staff, sit-in shifts)
- Helping with care log submissions, daily reports, and compliance questions
- Providing summaries of pending leave, incidents, training compliance, and staffing

When answering questions about data (e.g. "who is working tomorrow", "how many clients do we have", "any pending leave requests"), use the LIVE APP DATA provided in context. Give specific names, dates, and numbers.

Keep responses concise but complete. Be warm, professional and helpful. Introduce yourself as MikeAI when appropriate.
If you genuinely cannot resolve the issue or it sounds like a technical bug, suggest the user submit a formal bug report using the button below.
Never make up data - only reference what's in the live context. The user is currently on: PAGE_PLACEHOLDER`;

const AI_GREETING = "Hey there! I'm MikeAI, your CareCallAI assistant. How can I help you today? You can type or tap the mic to speak.";

export default function HelpButton() {
  const { user } = useAuth();
  const location = useLocation();

  // Panel state
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'report'

  // AI chat state
  const [messages, setMessages] = useState([
    { role: 'assistant', content: AI_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Voice state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const maleVoiceRef = useRef(null);
  const pendingSpeechRef = useRef(null);

  // Bug report state
  const [reportType, setReportType] = useState('bug');
  const [reportMessage, setReportMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Hide on Chat page — the floating button covers the chat input
  const isOnChatPage = location.pathname.toLowerCase().includes('chat');

  // Pre-cache male voice when voices become available
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const pickMaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      maleVoiceRef.current =
        voices.find(v => v.lang.startsWith('en') && /daniel|david|james|george|mark/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en-GB')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;
    };

    // Try immediately (works in Firefox)
    pickMaleVoice();

    // Also listen for async load (Chrome, Safari, mobile)
    window.speechSynthesis.onvoiceschanged = pickMaleVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech-to-text hook (works everywhere — Web Speech API + Whisper fallback)
  const { isListening, toggleListening } = useSpeechToText({
    onResult: (transcript) => {
      setInput(transcript);
      // Auto-send after speech input
      pendingSpeechRef.current = transcript;
    },
    lang: 'en-GB',
  });

  // Send message when speech result arrives (needs to be in useEffect to access latest handleSendMessage)
  useEffect(() => {
    if (pendingSpeechRef.current) {
      const text = pendingSpeechRef.current;
      pendingSpeechRef.current = null;
      setTimeout(() => handleSendMessage(text), 200);
    }
  }, [input]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Early return AFTER all hooks (React Rules of Hooks)
  if (isOnChatPage) {
    return null;
  }

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    // Use pre-cached male voice
    if (maleVoiceRef.current) {
      utterance.voice = maleVoiceRef.current;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build chat history for multi-turn context (skip greeting)
      const chatHistory = updatedMessages
        .filter((_, i) => i > 0) // skip AI greeting
        .map(m => ({ role: m.role, content: m.content }));

      const systemPrompt = HELP_SYSTEM_PROMPT.replace('PAGE_PLACEHOLDER', location.pathname);

      // Use only messages (not prompt) to avoid edge function conflict
      const response = await base44.integrations.Core.InvokeLLM({
        systemPrompt,
        messages: chatHistory,
        includeAppContext: true,
      });

      if (!response || response.trim() === '') {
        throw new Error('Empty response from AI');
      }

      const assistantMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      speakText(response);
    } catch (error) {
      console.error('MikeAI error:', error);
      const errMsg = error?.message || 'Unknown error';
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I hit a snag: ${errMsg}. Try again or submit a bug report below.`,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchToReport = () => {
    // Pre-fill report with AI conversation summary
    if (messages.length > 1) {
      const summary = messages
        .slice(1) // skip greeting
        .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');
      setReportMessage(`AI Chat Summary:\n${summary}\n\n---\nAdditional details: `);
    }
    setView('report');
  };

  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setSending(true);
    try {
      await supabase.from('app_error_logs').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'anonymous',
        error_message: `[${reportType.toUpperCase()}] ${reportMessage.trim()}`,
        error_stack: '',
        error_source: 'user_report',
        page_url: window.location.pathname,
        user_agent: navigator.userAgent.slice(0, 500),
        metadata: JSON.stringify({
          report_type: reportType,
          reported_by: user?.full_name || user?.email || 'Unknown',
          reported_at: new Date().toISOString(),
          had_ai_chat: messages.length > 1,
        }),
      });

      toast.success('Report submitted — thank you!');
      setReportMessage('');
      setOpen(false);
      setView('chat');
    } catch (err) {
      console.error('Failed to submit report:', err);
      toast.error('Failed to submit report');
    }
    setSending(false);
  };

  const handleClose = () => {
    setOpen(false);
    stopSpeaking();
  };

  const handleOpen = () => {
    setOpen(true);
    setView('chat');
    // Reset chat if previously closed
    if (messages.length <= 1) {
      setMessages([{ role: 'assistant', content: AI_GREETING }]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={open ? handleClose : handleOpen}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Help & Report"
      >
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-[136px] right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>

          {/* ── Header ── */}
          <div className="bg-teal-600 text-white p-3 flex items-center gap-2 shrink-0">
            {view === 'report' && (
              <button onClick={() => setView('chat')} className="hover:bg-teal-700 rounded p-0.5">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {view === 'chat' ? 'MikeAI' : 'Submit Report'}
              </h3>
              <p className="text-xs text-teal-100">
                {view === 'chat' ? 'Your CareCallAI assistant' : 'Report an issue or suggestion'}
              </p>
            </div>
            {view === 'chat' && isSpeaking && (
              <button onClick={stopSpeaking} className="hover:bg-teal-700 rounded p-1" title="Stop speaking">
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── AI Chat View ── */}
          {view === 'chat' && (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[400px] bg-slate-50">
                {messages.map((msg, i) => {
                  const mentionsBugReport = msg.role === 'assistant' && i > 0 &&
                    /bug report|report.*(issue|bug|problem)|submit.*(report|ticket)/i.test(msg.content);

                  return (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%]">
                        <div
                          className={`rounded-xl px-3 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-teal-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.role === 'assistant' && i > 0 && (
                            <button
                              onClick={() => speakText(msg.content)}
                              className="mt-1 text-slate-400 hover:text-teal-600 transition-colors"
                              title="Replay this message"
                            >
                              <Volume2 className="w-3 h-3 inline" />
                            </button>
                          )}
                        </div>
                        {mentionsBugReport && (
                          <button
                            onClick={switchToReport}
                            className="mt-1.5 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors w-full"
                          >
                            <FileWarning className="w-3.5 h-3.5" />
                            Submit a Bug Report
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-slate-500 border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2 text-sm shadow-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <div className="p-2 border-t border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-1.5">
                  {/* Mic button */}
                  <button
                    onClick={toggleListening}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={isListening ? 'Stop listening' : 'Speak your question'}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Text input */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? 'Listening...' : 'Type your question...'}
                    className="flex-1 text-sm border border-slate-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-teal-400"
                    disabled={isLoading || isListening}
                  />

                  {/* Send button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-teal-700 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bug report link */}
                <button
                  onClick={switchToReport}
                  className="w-full mt-2 text-xs text-slate-400 hover:text-teal-600 flex items-center justify-center gap-1 transition-colors"
                >
                  <FileWarning className="w-3 h-3" />
                  Can't resolve? Submit a bug report
                </button>
              </div>
            </>
          )}

          {/* ── Bug Report View ── */}
          {view === 'report' && (
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Report type selector */}
              <div className="flex gap-2">
                {REPORT_TYPES.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => setReportType(rt.id)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-colors ${
                      reportType === rt.id
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <rt.icon className={`w-4 h-4 ${reportType === rt.id ? 'text-teal-600' : rt.color}`} />
                    {rt.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">
                  {reportType === 'bug' ? 'What went wrong?' : reportType === 'help' ? 'What do you need help with?' : 'Your suggestion'}
                </Label>
                <Textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder={
                    reportType === 'bug'
                      ? "Describe what happened and what you expected..."
                      : reportType === 'help'
                      ? "Describe what you're trying to do..."
                      : "Share your idea for improvement..."
                  }
                  rows={4}
                  className="text-sm"
                />
              </div>

              {/* Context info */}
              <div className="text-xs text-slate-400 bg-slate-50 rounded p-2">
                Page: {window.location.pathname} &middot; {user?.full_name || user?.email || 'Not logged in'}
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitReport}
                disabled={sending || !reportMessage.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="sm"
              >
                <Send className="w-3 h-3 mr-2" />
                {sending ? 'Sending...' : 'Submit Report'}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
