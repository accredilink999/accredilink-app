import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  LayoutDashboard, Users, Calendar, Smartphone, Pill,
  AlertTriangle, Radio, BarChart3, CheckCircle, ArrowRight,
  Shield, Zap, TrendingUp, Clock, MapPin, FileText, Bell,
} from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    icon: LayoutDashboard,
    colour: '#0d9488',
    title: 'Welcome to CareCall AI',
    subtitle: 'The complete care management platform for modern home care providers',
    body: 'Everything your team needs — scheduling, care logging, compliance, GPS tracking, medications, incident reporting, built-in radio communication and real-time alerting — in one app. One price. No hidden fees. No per-user charges. Just £99 a month, forever.',
    voice: 'Welcome to CareCall AI — the complete care management platform built for modern home care providers. Everything your team needs is right here. From scheduling and care logging, to GPS tracking, medications, incident reporting, and built-in two-way radio communication. All of it, for one flat price. Ninety-nine pounds a month. No hidden fees, no per-user charges, and we promise to keep adding features at no extra cost.',
    highlights: ['All features included', 'Unlimited staff', '£99/month flat rate'],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    colour: '#3b82f6',
    title: 'Live Operations Dashboard',
    subtitle: "Today's visits, live alerts and missed calls — all in one view",
    body: "Your dashboard gives you complete real-time visibility. See every scheduled visit for today, who has clocked in, who is running late, any missed calls, and live alerts from your alerter system. Management and coordinators see the full picture the moment they open the app.",
    voice: "Your live dashboard gives you complete visibility of everything happening right now. See every scheduled visit for today, who has clocked in, who is running late, any missed calls, and live pager alerts. Management and coordinators see the full picture the moment they open the app — no chasing calls, no spreadsheets.",
    highlights: ["Today's visit schedule", 'Missed call alerts', 'Live GPS status'],
  },
  {
    id: 'service-users',
    icon: Users,
    colour: '#8b5cf6',
    title: 'Service User Profiles & Care Plans',
    subtitle: 'Complete profiles, care plans and visit history for every service user',
    body: 'Create detailed service user profiles with care plans, medical history, emergency contacts, and preferences. Assign areas, link recurring shifts, and keep full care notes — all searchable and accessible to authorised staff on their mobile device.',
    voice: "Create complete service user profiles with care plans, medical history, emergency contacts, and preferences. Assign areas, link recurring shifts, and keep full care notes — all searchable and accessible to authorised staff on their mobile device at the point of care.",
    highlights: ['Full care plan builder', 'Medical & contact history', 'Mobile access for carers'],
  },
  {
    id: 'scheduling',
    icon: Calendar,
    colour: '#f59e0b',
    title: 'Smart Rota & Scheduling',
    subtitle: 'Recurring visits, shift patterns and conflict detection',
    body: 'Build recurring visit schedules, assign carers to service users, and set up shift patterns that repeat weekly. The system flags scheduling conflicts automatically so you never double-book a carer. Coordinators can view and edit rotas by area, staff member or service user.',
    voice: "Build recurring visit schedules, assign carers to service users, and set up shift patterns that repeat weekly. The system flags scheduling conflicts automatically so you never double-book a carer. Coordinators can view and manage rotas by area, staff member, or service user — giving complete control over the working week.",
    highlights: ['Recurring shift patterns', 'Conflict detection', 'Area & staff views'],
  },
  {
    id: 'mobile',
    icon: Smartphone,
    colour: '#10b981',
    title: 'Carer Mobile App',
    subtitle: 'GPS clock-in, care notes and real-time updates on any phone',
    body: "Carers use the app on any Android or iOS device — no specialist hardware required. They clock in and out with GPS verification, log care notes at the point of visit, record observations, and receive real-time notifications. The app works on the web too, so there's no barrier to getting started.",
    voice: "Carers use the app on any Android or iOS device — no specialist hardware required. They clock in and out with GPS verification, log care notes at the point of visit, record observations, and receive real-time notifications. The app works as a browser-based Progressive Web App too, so getting your whole team set up takes minutes.",
    highlights: ['GPS clock-in & out', 'Point-of-care logging', 'Works on any device'],
  },
  {
    id: 'emar',
    icon: Pill,
    colour: '#ec4899',
    title: 'Medication Recording (eMAR)',
    subtitle: 'Electronic medication administration records at the point of care',
    body: "Carers record medication administration directly in the app during the visit. The system tracks given, refused and missed doses, flags overdue medications, and keeps a full auditable eMAR record for every service user — ready for CQC inspections.",
    voice: "Carers record medication administration directly in the app during the visit. The system tracks given, refused, and missed doses, flags overdue medications, and keeps a full auditable electronic medication record for every service user — ready for C Q C inspections at any time.",
    highlights: ['Given / refused / missed tracking', 'Overdue flagging', 'CQC-ready audit trail'],
  },
  {
    id: 'incidents',
    icon: AlertTriangle,
    colour: '#ef4444',
    title: 'Incident Reporting',
    subtitle: 'Log, track and escalate incidents instantly from the field',
    body: 'Carers can raise incident reports directly from their mobile during or after a visit. Reports are timestamped, geo-located and immediately visible to management. Incidents are tracked through to resolution and feed into your compliance dashboard.',
    voice: "Carers can raise incident reports directly from their mobile during or after a visit. Reports are timestamped, geo-located, and immediately visible to management. Incidents are tracked through to resolution and feed into your compliance dashboard — giving you a clear audit trail without any paperwork.",
    highlights: ['Instant mobile reporting', 'GPS & timestamp', 'Management escalation'],
  },
  {
    id: 'radio',
    icon: Radio,
    colour: '#6366f1',
    title: 'Built-in Radio & Alerter System',
    subtitle: 'The feature no competitor offers — real-time PTT radio and pager alerting',
    body: "CareCall AI is the only care management platform with a built-in two-way radio system. Coordinators and field staff communicate instantly with push-to-talk, just like a professional radio handset. The alerter system monitors your schedule and fires a pager-style tone when visits are missed or overdue — waking the screen even from screensaver mode on dedicated handsets.",
    voice: "This is what sets CareCall AI apart from every other platform on the market. We have a built-in two-way radio system. Coordinators and field staff communicate instantly with push-to-talk, just like a professional radio handset — directly through the app, with no extra hardware needed. And our alerter system monitors your schedule around the clock, firing a pager-style alert when visits are missed or overdue — even waking a dedicated handset from screensaver mode. No other care management software does this.",
    highlights: ['Push-to-talk radio', 'Real-time pager alerts', 'Dedicated T320 handset support'],
    highlight: true,
  },
  {
    id: 'compliance',
    icon: BarChart3,
    colour: '#0ea5e9',
    title: 'Reports & Compliance',
    subtitle: 'Management reports, CQC dashboards and full audit trails',
    body: 'Run reports on visit completion, missed calls, carer punctuality, medication compliance and incident trends. Every action in the system is logged with a timestamp and user ID, giving you a complete audit trail for CQC inspections and local authority reporting.',
    voice: "Run reports on visit completion, missed calls, carer punctuality, medication compliance, and incident trends. Every action in the system is logged with a timestamp and user ID, giving you a complete audit trail for C Q C inspections and local authority reporting — all exportable and always up to date.",
    highlights: ['Visit & medication reports', 'CQC audit trail', 'Exportable data'],
  },
  {
    id: 'pricing',
    icon: CheckCircle,
    colour: '#16a34a',
    title: '£99/month. Everything. Forever.',
    subtitle: 'One price. Unlimited staff. All features. No price increases — ever.',
    body: "Unlike competitors who charge per carer, per module, or increase prices every year — CareCall AI is £99 a month for everything. Unlimited staff, all current features, and every new feature we build. We're growing fast and adding new functionality every week. Lock in your price today.",
    voice: "Unlike competitors who charge per carer, per module, or increase prices every year — CareCall AI is ninety-nine pounds a month for everything. Unlimited staff, all current features, and every new feature we build going forward. We are growing fast and adding new functionality every week. We promise that price will never increase for existing customers. Start your free demo today and see why home care providers are switching to CareCall AI.",
    highlights: ['Unlimited staff', 'All features included', 'Price locked forever'],
    isCta: true,
  },
];

function useVoice() {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (muted) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1.0;
    u.volume = 1.0;
    // prefer a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Samantha') || v.name.includes('Google UK'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) u.voice = preferred;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, [muted]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      if (!m) window.speechSynthesis.cancel();
      return !m;
    });
  }, []);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  return { speak, stop, speaking, muted, toggleMute };
}

export default function Demo() {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const { speak, stop, speaking, muted, toggleMute } = useVoice();
  const timerRef = useRef(null);
  const current = STEPS[step];
  const Icon = current.icon;

  const goTo = useCallback((idx) => {
    stop();
    clearTimeout(timerRef.current);
    setStep(idx);
  }, [stop]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) goTo(step + 1);
  }, [step, goTo]);

  const prev = useCallback(() => {
    if (step > 0) goTo(step - 1);
  }, [step, goTo]);

  // Speak and auto-advance when step changes (after start)
  useEffect(() => {
    if (!started) return;
    speak(current.voice);
    if (autoPlay && step < STEPS.length - 1) {
      const wordCount = current.voice.split(' ').length;
      const ms = Math.max(8000, (wordCount / 0.92) * 650);
      timerRef.current = setTimeout(next, ms);
    }
    return () => clearTimeout(timerRef.current);
  }, [step, started]); // eslint-disable-line

  const handleStart = () => {
    setStarted(true);
  };

  // Voices load async on some browsers
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0c2a1e 100%)',
      display: 'flex',
      flexDirection: 'column',
      color: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif',
      overflowX: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
        <a href="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="CareCall AI" style={{ height: 36, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>CareCall AI</span>
        </a>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={toggleMute} style={ghostBtn}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <a href="/login" style={{ ...solidBtn('#0d9488'), textDecoration: 'none' }}>
            Get Started — £99/mo
          </a>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#1e293b' }}>
        <div style={{
          height: '100%',
          background: current.colour,
          width: `${((step + 1) / STEPS.length) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 0 0' }}>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === step ? current.colour : i < step ? '#334155' : '#1e293b',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 20px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {!started ? (
          /* Splash / start screen */
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0d948820', border: `2px solid #0d948860`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Play size={32} color="#0d9488" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
              See CareCall AI in action
            </h1>
            <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 400 }}>
              A guided voice tour of every feature — from dashboard to radio. Takes about 4 minutes.
            </p>
            <button
              onClick={handleStart}
              style={{ ...solidBtn('#0d9488'), fontSize: 16, padding: '14px 36px', borderRadius: 12 }}
            >
              <Play size={18} /> Start Demo Tour
            </button>
            <p style={{ fontSize: 13, color: '#475569', marginTop: 16 }}>
              Make sure your sound is on for voice narration
            </p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `${current.colour}20`,
              border: `2px solid ${current.colour}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
              transition: 'all 0.4s ease',
            }}>
              <Icon size={30} color={current.colour} />
            </div>

            {/* Step label */}
            <div style={{ fontSize: 12, fontWeight: 600, color: current.colour, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              {step + 1} of {STEPS.length}
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', textAlign: 'center', lineHeight: 1.2 }}>
              {current.title}
            </h2>
            <p style={{ fontSize: 14, color: current.colour, margin: '0 0 20px', textAlign: 'center', fontWeight: 500 }}>
              {current.subtitle}
            </p>

            {/* Body */}
            <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7, textAlign: 'center', margin: '0 0 24px' }}>
              {current.body}
            </p>

            {/* Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 32 }}>
              {current.highlights.map(h => (
                <div key={h} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: `${current.colour}12`,
                  border: `1px solid ${current.colour}30`,
                  borderRadius: 10, padding: '12px 16px',
                }}>
                  <CheckCircle size={16} color={current.colour} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{h}</span>
                </div>
              ))}
            </div>

            {/* CTA on last step */}
            {current.isCta && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 24 }}>
                <a href="/login" style={{ ...solidBtn('#0d9488'), textDecoration: 'none', fontSize: 16, padding: '14px 0', borderRadius: 12, justifyContent: 'center' }}>
                  Start for £99/month <ArrowRight size={16} />
                </a>
                <a href="mailto:hello@carecallai.co.uk" style={{ ...solidBtn('#1e293b'), textDecoration: 'none', fontSize: 14, padding: '12px 0', borderRadius: 12, justifyContent: 'center', border: '1px solid #334155' }}>
                  Book a live demo with our team
                </a>
              </div>
            )}

            {/* Speaking indicator */}
            {speaking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{
                      width: 3, borderRadius: 2, background: current.colour,
                      animation: `wave${i} 0.8s ease-in-out infinite`,
                      height: [8, 14, 8][i - 1],
                    }} />
                  ))}
                </div>
                Narrating…
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {started && (
        <div style={{
          borderTop: '1px solid #1e293b',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <button onClick={prev} disabled={step === 0} style={navBtn(step === 0)}>
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => {
              if (speaking) { stop(); }
              else { speak(current.voice); }
            }}
            style={navBtn(false, true, current.colour)}
          >
            {speaking ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={next} disabled={step === STEPS.length - 1} style={navBtn(step === STEPS.length - 1)}>
            <SkipForward size={18} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes wave1 { 0%,100%{height:6px} 50%{height:14px} }
        @keyframes wave2 { 0%,100%{height:14px} 50%{height:6px} }
        @keyframes wave3 { 0%,100%{height:6px} 50%{height:14px} }
      `}</style>
    </div>
  );
}

const ghostBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'transparent', border: '1px solid #334155',
  color: '#94a3b8', borderRadius: 8, padding: '8px 12px',
  fontSize: 13, cursor: 'pointer', fontWeight: 500,
};

const solidBtn = (bg) => ({
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: bg, color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 20px',
  fontSize: 14, cursor: 'pointer', fontWeight: 600,
  width: '100%', textAlign: 'center',
});

const navBtn = (disabled, primary = false, colour = '#0d9488') => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: primary ? 52 : 40, height: primary ? 52 : 40,
  borderRadius: '50%',
  background: primary ? colour : '#1e293b',
  border: `1px solid ${primary ? colour : '#334155'}`,
  color: disabled ? '#334155' : primary ? '#fff' : '#94a3b8',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1,
});
