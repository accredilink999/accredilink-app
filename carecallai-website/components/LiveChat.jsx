"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Mail, Bot } from "lucide-react";

const WELCOME_MSG = {
  from: "agent",
  text: "Hi! I'm CareCallAI's assistant. I can answer any questions about our care management software — features, pricing, compliance, setup, or anything else. How can I help?",
  time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
};

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailName, setEmailName] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-open for new visitors after 5 seconds
  useEffect(() => {
    try {
      const visited = localStorage.getItem("carecallai_chat_visited");
      if (!visited) {
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem("carecallai_chat_visited", "true");
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = {
      from: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          from: "agent",
          text: reply,
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          from: "agent",
          text: "I'm having connection issues. Please email support@carecallai.co.uk or call 01824 538 688.",
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleEmailEscalation = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await fetch("/api/chat-escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: emailName.trim() || undefined,
          chatHistory: messages,
        }),
      });
    } catch {}

    setEmailSent(true);
    setMessages((prev) => [
      ...prev,
      {
        from: "agent",
        text: `Thanks${emailName ? ` ${emailName}` : ""}! I've sent your chat to our team at ${email}. Someone will get back to you within 24 hours. You can also call us on 01824 538 688.`,
        time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setShowEmailForm(false);
  };

  return (
    <>
      {/* Chat bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 rounded-full shadow-lg hover:bg-teal-700 transition-all hover:scale-105 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">CareCallAI Assistant</p>
                <p className="text-xs text-teal-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  AI-powered — ask me anything
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.from === "user"
                      ? "bg-teal-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-700 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-teal-200" : "text-slate-400"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                  <span className="text-xs text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Email escalation form */}
          {showEmailForm && !emailSent && (
            <div className="border-t border-slate-200 p-3 bg-blue-50">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Leave your email and we'll get back to you within 24 hours:
              </p>
              <form onSubmit={handleEmailEscalation} className="space-y-2">
                <input
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-3 py-1.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={!email.includes("@")}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
              <button onClick={() => setShowEmailForm(false)} className="text-xs text-blue-400 mt-1 hover:text-blue-600">
                Cancel
              </button>
            </div>
          )}

          {/* Input + action bar */}
          <div className="border-t border-slate-200 flex-shrink-0">
            <form onSubmit={handleSend} className="p-3 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about features, pricing, compliance..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            {/* Action buttons */}
            <div className="px-3 pb-2 flex gap-2">
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-3 h-3" />
                Email the team
              </button>
              <span className="text-slate-300">|</span>
              <a
                href="tel:01824538688"
                className="text-xs text-slate-500 hover:text-teal-600 transition-colors"
              >
                Call 01824 538 688
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
