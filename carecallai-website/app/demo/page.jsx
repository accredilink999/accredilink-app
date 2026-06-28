'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  LayoutDashboard, Users, Calendar, Smartphone, Pill,
  AlertTriangle, Radio, BarChart3, CheckCircle, ArrowRight,
  MapPin, Clock, Bell, Mic, MicOff, Activity,
  Receipt, Car, DollarSign, Bot, FileText, Sparkles, Send,
  TrendingUp, Briefcase, Star, Award,
} from 'lucide-react';

/* ─── Mock app screens for each step ─── */

function ScreenDashboard() {
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>TODAY — MON 23 JUN</span>
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Dashboard</span>
        <Bell size={14} color="#f59e0b" />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px 6px' }}>
        {[['28', 'Visits Today', '#0d9488'], ['6', 'Completed', '#16a34a'], ['3', 'In Progress', '#f59e0b'], ['1', 'Missed', '#ef4444']].map(([n, l, c]) => (
          <div key={l} style={{ flex: 1, background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>LIVE VISITS</div>
        {[
          { name: 'Margaret T.', carer: 'Sarah K.', time: '09:00', status: 'done', colour: '#16a34a' },
          { name: 'David R.', carer: 'James M.', time: '10:30', status: 'live', colour: '#f59e0b' },
          { name: 'Betty H.', carer: 'Lisa P.', time: '11:00', status: 'late', colour: '#ef4444' },
          { name: 'Harold C.', carer: 'Tom W.', time: '12:00', status: 'sched', colour: '#3b82f6' },
        ].map(v => (
          <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.colour, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9' }}>{v.name}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{v.carer}</div>
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{v.time}</div>
            <div style={{ fontSize: 9, background: `${v.colour}22`, color: v.colour, borderRadius: 4, padding: '1px 5px', fontWeight: 600, textTransform: 'uppercase' }}>
              {v.status === 'done' ? '✓ Done' : v.status === 'live' ? '● Live' : v.status === 'late' ? '! Late' : '○ Sched'}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '6px 12px', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, background: '#ef444418', border: '1px solid #ef444444', borderRadius: 8, padding: '6px 8px', fontSize: 10, color: '#ef4444' }}>
          <Bell size={10} style={{ display: 'inline', marginRight: 4 }} />
          <strong>Alert:</strong> Betty H. missed 11:00 visit
        </div>
      </div>
    </div>
  );
}

function ScreenServiceUser() {
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>← Service Users</span>
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Profile</span>
        <span />
      </div>
      <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1e293b' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👵</div>
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>Margaret Thompson</div>
          <div style={{ color: '#8b5cf6', fontSize: 11 }}>Area: North · ID: SU-0042</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#16a34a22', color: '#16a34a', fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>Active</div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Care Level', 'High Dependency — Daily visits'],
          ['Next Visit', 'Today 14:00 — Sarah K.'],
          ['Medication', '3 prescribed — MAR chart active'],
          ['Emergency', 'Daughter: 07700 900123'],
          ['Notes', 'Prefers female carers. Allergic to penicillin.'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 80, fontSize: 10, color: '#64748b', fontWeight: 600, flexShrink: 0, paddingTop: 1 }}>{k}</div>
            <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>{v}</div>
          </div>
        ))}
        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
          {['Care Plan', 'Visit History', 'MAR Chart', 'Incidents'].map(t => (
            <div key={t} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', fontSize: 9, color: '#94a3b8' }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenScheduling() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colours = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#16a34a', '#ef4444'];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Week 26</span>
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Rota</span>
        <span style={{ fontSize: 10, color: '#0d9488' }}>+ Add</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {days.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, color: i === 0 ? '#0d9488' : '#64748b', fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {['Sarah K.', 'James M.', 'Lisa P.', 'Tom W.'].map((carer, ci) => (
          <div key={carer} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {days.map((_, di) => {
              const hasShift = (ci + di) % 3 !== 2;
              const c = colours[(ci + di) % colours.length];
              return (
                <div key={di} style={{
                  height: 28, borderRadius: 4,
                  background: hasShift ? `${c}22` : 'transparent',
                  border: hasShift ? `1px solid ${c}55` : '1px solid #1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasShift && <div style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { time: '09:00', su: 'Margaret T.', carer: 'Sarah K.', colour: '#0d9488' },
            { time: '10:30', su: 'David R.', carer: 'James M.', colour: '#3b82f6' },
            { time: '11:00', su: 'Betty H.', carer: 'Lisa P.', colour: '#8b5cf6' },
          ].map(s => (
            <div key={s.time} style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${s.colour}12`, border: `1px solid ${s.colour}33`, borderRadius: 6, padding: '5px 8px' }}>
              <div style={{ width: 3, height: 28, borderRadius: 2, background: s.colour, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#f1f5f9' }}>{s.time} — {s.su}</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{s.carer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenMobileApp() {
  return (
    <div style={{ ...screen, padding: 0, overflow: 'hidden' }}>
      <div style={{ background: '#0d9488', padding: '14px 16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: '#fff', fontSize: 11, opacity: 0.8 }}>CURRENT VISIT</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Margaret Thompson</div>
        <div style={{ color: '#99f6e4', fontSize: 11 }}>12 Maple Avenue, Leeds LS1 4PL</div>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: '#16a34a', borderRadius: 10, padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
            <MapPin size={18} color="#fff" style={{ margin: '0 auto 4px' }} />
            <div style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Clock In</div>
            <div style={{ color: '#bbf7d0', fontSize: 9 }}>GPS verified</div>
          </div>
          <div style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
            <Clock size={18} color="#64748b" style={{ margin: '0 auto 4px' }} />
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>Clock Out</div>
            <div style={{ color: '#475569', fontSize: 9 }}>End of visit</div>
          </div>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>CARE LOG</div>
          {['Personal care completed', 'Medication administered', 'Meal prepared — ate well'].map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <CheckCircle size={10} color="#0d9488" />
              <span style={{ fontSize: 10, color: '#cbd5e1' }}>{n}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, background: '#0f172a', borderRadius: 6, padding: '6px 8px', fontSize: 10, color: '#475569' }}>
            Add observation note…
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['MAR Chart', 'Incident', 'Photo'].map(t => (
            <div key={t} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '6px', textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenEMAR() {
  const meds = [
    { name: 'Amlodipine 5mg', time: '08:00', status: 'given', colour: '#16a34a' },
    { name: 'Metformin 500mg', time: '08:00', status: 'given', colour: '#16a34a' },
    { name: 'Warfarin 3mg', time: '12:00', status: 'due', colour: '#f59e0b' },
    { name: 'Bisoprolol 2.5mg', time: '20:00', status: 'pending', colour: '#3b82f6' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <Pill size={12} color="#ec4899" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>MAR Chart</span>
        <span style={{ fontSize: 9, color: '#ec4899', background: '#ec489922', padding: '2px 6px', borderRadius: 99 }}>Jun 2026</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>MARGARET THOMPSON · TODAY</div>
        {meds.map(m => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${m.colour}22`, border: `1px solid ${m.colour}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pill size={12} color={m.colour} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9' }}>{m.name}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{m.time}</div>
            </div>
            <div style={{ fontSize: 9, background: `${m.colour}22`, color: m.colour, borderRadius: 4, padding: '2px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
              {m.status === 'given' ? '✓ Given' : m.status === 'due' ? '⚠ Due Now' : '○ Pending'}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, background: '#ec489912', border: '1px solid #ec489933', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#f9a8d4' }}>
          <strong>Note:</strong> Full audit trail — all entries timestamped with carer ID. CQC-ready.
        </div>
      </div>
    </div>
  );
}

function ScreenIncidents() {
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <AlertTriangle size={12} color="#ef4444" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Incident Report</span>
        <span style={{ fontSize: 9, color: '#ef4444' }}>OPEN</span>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: '#ef444418', border: '1px solid #ef444444', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>HIGH</span>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>Today · 11:14am</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Fall — Service User</div>
          <div style={{ fontSize: 10, color: '#fca5a5' }}>Betty Hammond · 14 Rose St, Leeds</div>
        </div>
        {[
          ['Reported By', 'Lisa P. (Carer)'],
          ['Location', 'Bathroom — slipped on wet floor'],
          ['Injuries', 'Minor bruising to right arm'],
          ['Action Taken', 'Assisted, notified family, GP called'],
          ['GPS', '53.8008° N, 1.5491° W'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 78, fontSize: 10, color: '#64748b', fontWeight: 600, flexShrink: 0 }}>{k}</div>
            <div style={{ fontSize: 10, color: '#cbd5e1' }}>{v}</div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <div style={{ flex: 1, background: '#ef4444', borderRadius: 8, padding: '7px', textAlign: 'center', fontSize: 10, color: '#fff', fontWeight: 600 }}>Escalate to Management</div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '7px 10px', fontSize: 10, color: '#94a3b8' }}>Close</div>
        </div>
      </div>
    </div>
  );
}

function ScreenRadio() {
  const [active, setActive] = useState(false);
  return (
    <div style={{ ...screen, display: 'flex', flexDirection: 'column' }}>
      <div style={screenHeader('#1e293b')}>
        <Radio size={12} color="#6366f1" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Radio</span>
        <span style={{ fontSize: 9, color: '#16a34a', background: '#16a34a22', padding: '2px 6px', borderRadius: 99 }}>● Online</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px 14px', gap: 10 }}>
        <div style={{ width: '100%', background: '#0f172a', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 9, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>CHANNEL · ALPHA TEAM</div>
          {[
            { name: 'Sarah K.', msg: 'Finished at Margaret T. — heading to next', time: '11:02', self: false },
            { name: 'You', msg: 'Copy that. Betty H. needs check-in, Lisa is running 10 mins late', time: '11:03', self: true },
            { name: 'Lisa P.', msg: 'On my way, 5 mins out', time: '11:04', self: false },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.self ? 'row-reverse' : 'row', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.self ? '#6366f1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', flexShrink: 0 }}>
                {m.name[0]}
              </div>
              <div style={{ maxWidth: '75%' }}>
                <div style={{ background: m.self ? '#6366f133' : '#1e293b', border: `1px solid ${m.self ? '#6366f155' : '#334155'}`, borderRadius: 8, padding: '4px 8px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: m.self ? '#a5b4fc' : '#94a3b8', marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: '#cbd5e1', lineHeight: 1.4 }}>{m.msg}</div>
                </div>
                <div style={{ fontSize: 8, color: '#475569', marginTop: 2, textAlign: m.self ? 'right' : 'left' }}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onMouseDown={() => setActive(true)}
          onMouseUp={() => setActive(false)}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: active ? '#ef4444' : '#6366f1',
            border: `3px solid ${active ? '#fca5a5' : '#818cf8'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.1s', boxShadow: active ? '0 0 20px #ef444466' : '0 0 20px #6366f144',
          }}
        >
          {active ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
          <span style={{ fontSize: 7, color: '#fff', marginTop: 2, fontWeight: 700 }}>{active ? 'RELEASE' : 'HOLD PTT'}</span>
        </button>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {['5 online', 'Channel: Alpha', 'T320 ●'].map(t => (
            <div key={t} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '4px', textAlign: 'center', fontSize: 9, color: '#64748b' }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenTraining() {
  const courses = [
    { name: 'Moving & Handling', due: 'Completed', pct: 100, colour: '#16a34a' },
    { name: 'Fire Safety', due: 'Completed', pct: 100, colour: '#16a34a' },
    { name: 'Infection Control', due: 'Due 30 Jun', pct: 60, colour: '#f59e0b' },
    { name: 'Safeguarding Adults', due: 'Overdue', pct: 0, colour: '#ef4444' },
    { name: 'Medication Awareness', due: '15 Jul', pct: 30, colour: '#3b82f6' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <CheckCircle size={12} color="#0ea5e9" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Training & Compliance</span>
        <span style={{ fontSize: 9, color: '#f59e0b', background: '#f59e0b22', padding: '2px 6px', borderRadius: 99 }}>2 Due</span>
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>SARAH K. · STAFF COMPLIANCE MATRIX</div>
        {courses.map(c => (
          <div key={c.name} style={{ background: '#1e293b', borderRadius: 8, padding: '7px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#f1f5f9' }}>{c.name}</span>
              <span style={{ fontSize: 9, color: c.colour, fontWeight: 700 }}>{c.due}</span>
            </div>
            <div style={{ height: 5, background: '#0f172a', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${c.pct}%`, background: c.colour, borderRadius: 3 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 4, background: '#0ea5e912', border: '1px solid #0ea5e933', borderRadius: 8, padding: '7px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8' }}>Auto-Certificate</div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Pass assessment → certificate issued instantly to staff record</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 2 }}>
          {[['12', 'Staff trained'], ['94%', 'Compliance rate'], ['3', 'Overdue', '#ef4444'], ['8', 'Certs issued']].map(([n, l, c]) => (
            <div key={l} style={{ background: '#1e293b', borderRadius: 7, padding: '7px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: c || '#0ea5e9' }}>{n}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenInvoicing() {
  const invoices = [
    { id: 'INV-0041', client: 'Leeds City Council', visits: 12, amount: '£1,248.00', status: 'paid', colour: '#16a34a' },
    { id: 'INV-0042', client: 'Margaret T. (Private)', visits: 8, amount: '£832.00', status: 'sent', colour: '#f59e0b' },
    { id: 'INV-0043', client: 'Bradford CC', visits: 24, amount: '£2,496.00', status: 'draft', colour: '#3b82f6' },
    { id: 'INV-0044', client: 'David R. (Private)', visits: 4, amount: '£416.00', status: 'overdue', colour: '#ef4444' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <Receipt size={12} color="#0d9488" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Invoicing</span>
        <span style={{ fontSize: 9, color: '#0d9488', background: '#0d948822', padding: '2px 6px', borderRadius: 99 }}>+ New</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px 4px' }}>
        {[['£4,992', 'This Month', '#0d9488'], ['£832', 'Awaiting', '#f59e0b'], ['£416', 'Overdue', '#ef4444']].map(([n, l, c]) => (
          <div key={l} style={{ flex: 1, background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, margin: '6px 0 6px' }}>RECENT INVOICES</div>
        {invoices.map(inv => (
          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
            <FileText size={10} color={inv.colour} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#f1f5f9' }}>{inv.client}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{inv.id} · {inv.visits} visits</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f1f5f9' }}>{inv.amount}</div>
            <div style={{ fontSize: 9, background: `${inv.colour}22`, color: inv.colour, borderRadius: 4, padding: '1px 5px', fontWeight: 600, textTransform: 'uppercase' }}>{inv.status}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, background: '#0d948812', border: '1px solid #0d948833', borderRadius: 8, padding: '7px 10px', fontSize: 10, color: '#99f6e4' }}>
          <strong>Auto-generate:</strong> Invoice created from completed visit log — hours, rates and notes pulled automatically.
        </div>
      </div>
    </div>
  );
}

function ScreenExpenses() {
  const claims = [
    { name: 'Sarah K.', date: 'Mon 23 Jun', miles: '47 mi', amount: '£25.38', status: 'approved', colour: '#16a34a' },
    { name: 'James M.', date: 'Mon 23 Jun', miles: '63 mi', amount: '£34.02', status: 'pending', colour: '#f59e0b' },
    { name: 'Lisa P.', date: 'Mon 23 Jun', miles: '38 mi', amount: '£20.52', status: 'pending', colour: '#f59e0b' },
    { name: 'Tom W.', date: 'Mon 23 Jun', miles: '55 mi', amount: '£29.70', status: 'approved', colour: '#16a34a' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <Car size={12} color="#f59e0b" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Mileage & Expenses</span>
        <span style={{ fontSize: 9, color: '#f59e0b' }}>Week 26</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px 4px' }}>
        {[['203 mi', 'Team Total', '#f59e0b'], ['£109.62', 'Week Total', '#0d9488'], ['HMRC', '54p/mile', '#8b5cf6']].map(([n, l, c]) => (
          <div key={l} style={{ flex: 1, background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, margin: '6px 0 6px' }}>WEEKLY MILEAGE CLAIMS</div>
        {claims.map(c => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>{c.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#f1f5f9' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{c.date} · {c.miles}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f1f5f9' }}>{c.amount}</div>
            <div style={{ fontSize: 9, background: `${c.colour}22`, color: c.colour, borderRadius: 4, padding: '1px 5px', fontWeight: 600, textTransform: 'uppercase' }}>{c.status}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, background: '#16a34a', borderRadius: 7, padding: '7px', textAlign: 'center', fontSize: 10, color: '#fff', fontWeight: 600 }}>Approve All</div>
          <div style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '7px', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>Export CSV</div>
        </div>
      </div>
    </div>
  );
}

function ScreenPayroll() {
  const staff = [
    { name: 'Sarah K.', hours: '37.5h', rate: '£12.50', gross: '£468.75', net: '£389.20' },
    { name: 'James M.', hours: '40h', rate: '£12.50', gross: '£500.00', net: '£412.00' },
    { name: 'Lisa P.', hours: '32h', rate: '£11.80', gross: '£377.60', net: '£315.00' },
    { name: 'Tom W.', hours: '35h', rate: '£12.50', gross: '£437.50', net: '£362.80' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <DollarSign size={12} color="#16a34a" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Payroll</span>
        <span style={{ fontSize: 9, color: '#16a34a', background: '#16a34a22', padding: '2px 6px', borderRadius: 99 }}>Jun 2026</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px 4px' }}>
        {[['12', 'Staff', '#3b82f6'], ['£5,840', 'Gross', '#0d9488'], ['£4,720', 'Net', '#16a34a']].map(([n, l, c]) => (
          <div key={l} style={{ flex: 1, background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, margin: '6px 0 5px' }}>PAYSLIPS — WEEK 26</div>
        {staff.map(s => (
          <div key={s.name} style={{ padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#f1f5f9' }}>{s.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>{s.net} net</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{s.hours} @ {s.rate}</span>
              <span style={{ fontSize: 9, color: '#94a3b8' }}>Gross: {s.gross}</span>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <div style={{ flex: 2, background: '#16a34a', borderRadius: 7, padding: '7px', textAlign: 'center', fontSize: 10, color: '#fff', fontWeight: 600 }}>Generate Payslips & P60s</div>
          <div style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '7px', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>Export</div>
        </div>
      </div>
    </div>
  );
}

function ScreenAI() {
  const msgs = [
    { role: 'user', text: 'Which carers are approaching overtime this week?' },
    { role: 'ai', text: 'Sarah K. is at 36.5h with 2 shifts remaining — she\'ll hit overtime. James M. is at 38h with 1 shift left. I\'d recommend reassigning James\'s Friday shift to Lisa who is currently under-contracted at 29h.' },
    { role: 'user', text: 'Generate a CQC compliance summary for this month' },
    { role: 'ai', text: '✓ Visit completion: 94.2%  ✓ Medication compliance: 98.1%  ⚠ 2 incident reports open past 48h  ✓ All staff training up to date  → Overall: Good standing' },
  ];
  return (
    <div style={{ ...screen, display: 'flex', flexDirection: 'column' }}>
      <div style={screenHeader('#1e293b')}>
        <Sparkles size={12} color="#8b5cf6" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>AI Assistant</span>
        <span style={{ fontSize: 9, color: '#8b5cf6', background: '#8b5cf622', padding: '2px 6px', borderRadius: 99 }}>Powered by Claude</span>
      </div>
      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.role === 'ai' ? '#8b5cf6' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.role === 'ai' ? <Bot size={11} color="#fff" /> : <span style={{ fontSize: 9, color: '#fff' }}>You</span>}
            </div>
            <div style={{ maxWidth: '80%', background: m.role === 'ai' ? '#8b5cf622' : '#1e293b', border: `1px solid ${m.role === 'ai' ? '#8b5cf644' : '#334155'}`, borderRadius: 8, padding: '6px 9px' }}>
              <div style={{ fontSize: 10, color: m.role === 'ai' ? '#c4b5fd' : '#cbd5e1', lineHeight: 1.5 }}>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: 6, background: '#1e293b', borderRadius: 8, padding: '6px 10px', alignItems: 'center' }}>
          <span style={{ flex: 1, fontSize: 10, color: '#475569' }}>Ask anything about your operations…</span>
          <Send size={12} color="#8b5cf6" />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {['Staff hours', 'Compliance', 'Invoices due', 'Incidents'].map(s => (
            <span key={s} style={{ background: '#8b5cf622', border: '1px solid #8b5cf644', borderRadius: 99, padding: '2px 7px', fontSize: 9, color: '#c4b5fd' }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenOperations() {
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <RefreshCwIcon size={12} color="#f59e0b" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Operations Hub</span>
        <span style={{ fontSize: 9, color: '#f59e0b', background: '#f59e0b22', padding: '2px 6px', borderRadius: 99 }}>3 pending</span>
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Shift swaps */}
        <div style={{ background: '#1e293b', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>⇄ SHIFT SWAP REQUESTS</div>
          {[
            { from: 'Sarah K.', to: 'Lisa P.', shift: 'Thu 26 Jun 09:00', status: 'pending' },
            { from: 'Tom W.', to: 'James M.', shift: 'Fri 27 Jun 14:00', status: 'approved' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i === 0 ? 4 : 0 }}>
              <span style={{ fontSize: 10, color: '#f1f5f9' }}>{s.from}</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>→</span>
              <span style={{ fontSize: 10, color: '#f1f5f9' }}>{s.to}</span>
              <span style={{ fontSize: 9, color: '#64748b', flex: 1, textAlign: 'right' }}>{s.shift}</span>
              <span style={{ fontSize: 9, background: s.status === 'approved' ? '#16a34a22' : '#f59e0b22', color: s.status === 'approved' ? '#16a34a' : '#f59e0b', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{s.status}</span>
            </div>
          ))}
        </div>
        {/* Uncovered shifts */}
        <div style={{ background: '#ef444412', border: '1px solid #ef444433', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>● UNCOVERED SHIFTS</div>
          {['Fri 27 Jun 08:00 — Betty H.', 'Sat 28 Jun 10:00 — Harold C.'].map(s => (
            <div key={s} style={{ fontSize: 9, color: '#fca5a5', marginBottom: 2 }}>⚠ {s}</div>
          ))}
          <div style={{ marginTop: 6, background: '#ef4444', borderRadius: 5, padding: '4px 8px', fontSize: 9, color: '#fff', fontWeight: 600, display: 'inline-block' }}>Notify Available Staff</div>
        </div>
        {/* Tasks */}
        <div style={{ background: '#1e293b', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>✓ TASKS TODAY</div>
          {[
            { task: 'Update care plan — Margaret T.', done: true },
            { task: 'Call GP re: David R. medication', done: true },
            { task: 'Review incident report INV-0014', done: false },
            { task: 'Confirm Betty H. Friday cover', done: false },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: t.done ? '#16a34a' : '#334155', border: `1px solid ${t.done ? '#16a34a' : '#475569'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.done && <span style={{ fontSize: 8, color: '#fff' }}>✓</span>}
              </div>
              <span style={{ fontSize: 9, color: t.done ? '#64748b' : '#cbd5e1', textDecoration: t.done ? 'line-through' : 'none' }}>{t.task}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RefreshCwIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );
}

function ScreenLeavePayroll() {
  const leave = [
    { name: 'Sarah K.', type: 'Annual Leave', dates: '14–18 Jul', days: 5, status: 'approved', colour: '#16a34a' },
    { name: 'James M.', type: 'Sick Leave', dates: '23–24 Jun', days: 2, status: 'recorded', colour: '#ef4444' },
    { name: 'Lisa P.', type: 'Annual Leave', dates: '4–8 Aug', days: 5, status: 'pending', colour: '#f59e0b' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <Briefcase size={12} color="#3b82f6" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Leave & HR</span>
        <span style={{ fontSize: 9, color: '#3b82f6', background: '#3b82f622', padding: '2px 6px', borderRadius: 99 }}>+ Request</span>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px 4px' }}>
        {[['18 days', 'Remaining (avg)', '#3b82f6'], ['2 pending', 'Requests', '#f59e0b'], ['1 sick', 'This week', '#ef4444']].map(([n, l, c]) => (
          <div key={l} style={{ flex: 1, background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: c }}>{n}</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, margin: '6px 0 6px' }}>LEAVE REQUESTS</div>
        {leave.map(l => (
          <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.colour, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#f1f5f9' }}>{l.name} — {l.type}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{l.dates} · {l.days} days</div>
            </div>
            <div style={{ fontSize: 9, background: `${l.colour}22`, color: l.colour, borderRadius: 4, padding: '1px 6px', fontWeight: 600, textTransform: 'uppercase' }}>{l.status}</div>
          </div>
        ))}
        <div style={{ marginTop: 8, background: '#3b82f612', border: '1px solid #3b82f633', borderRadius: 8, padding: '7px 10px', fontSize: 10, color: '#93c5fd' }}>
          Leave automatically excluded from rota and payroll calculations.
        </div>
      </div>
    </div>
  );
}

function ScreenCompliance() {
  const bars = [
    { label: 'Visit Completion', pct: 94, colour: '#0d9488' },
    { label: 'Med Compliance', pct: 98, colour: '#ec4899' },
    { label: 'On-Time Arrival', pct: 87, colour: '#3b82f6' },
    { label: 'Incident Closure', pct: 100, colour: '#16a34a' },
  ];
  return (
    <div style={screen}>
      <div style={screenHeader('#1e293b')}>
        <BarChart3 size={12} color="#0ea5e9" />
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>Reports</span>
        <span style={{ fontSize: 9, color: '#0ea5e9' }}>Jun 2026</span>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{b.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: b.colour }}>{b.pct}%</span>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${b.pct}%`, background: b.colour, borderRadius: 3, transition: 'width 1s ease' }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[['328', 'Visits this month'], ['12', 'Staff members'], ['0', 'Safeguarding issues'], ['100%', 'CQC ready']].map(([n, l]) => (
            <div key={l} style={{ background: '#1e293b', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0ea5e9' }}>{n}</div>
              <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenPricing() {
  return (
    <div style={{ ...screen, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 14px', gap: 10 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Simple Pricing</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>£99</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>/month · everything included</div>
      </div>
      <div style={{ width: '100%', background: '#1e293b', borderRadius: 10, border: '1px solid #16a34a44', padding: '10px 12px' }}>
        {['Unlimited staff & clients', 'Scheduling & care logging', 'GPS clock-in / clock-out', 'eMAR medication records', 'Incident reporting', 'Built-in PTT radio system', 'Real-time pager alerting', 'CQC reports & audit trail', 'Android & iOS app', 'Price locked forever'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #0f172a' }}>
            <CheckCircle size={10} color="#16a34a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>{f}</span>
          </div>
        ))}
      </div>
      <a href="/signup" style={{ width: '100%', background: '#0d9488', color: '#fff', textAlign: 'center', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'block' }}>
        Get Started Now →
      </a>
    </div>
  );
}

const STEPS = [
  {
    id: 'welcome', icon: LayoutDashboard, colour: '#0d9488',
    title: 'Live Operations Dashboard',
    subtitle: "Real-time visibility of every visit, carer and alert",
    body: 'See every visit happening right now — who has clocked in, who is running late, and any missed calls or alerts. The dashboard updates live so coordinators always have the full picture.',
    voice: 'Welcome to CareCall AI — the complete care management platform built for modern home care providers. Your live dashboard gives you complete real-time visibility. See every scheduled visit for today, who has clocked in, who is running late, any missed calls, and live pager alerts. Management and coordinators see the full picture the moment they open the app.',
    highlights: ["Today's visit schedule", 'Live GPS status', 'Real-time alerts'],
    Screen: ScreenDashboard,
  },
  {
    id: 'service-users', icon: Users, colour: '#8b5cf6',
    title: 'Service User Profiles & Care Plans',
    subtitle: 'Complete profiles, care plans and visit history',
    body: 'Every service user has a full profile — care plans, medical history, emergency contacts, preferences and a complete visit log. All accessible to authorised carers on their phone.',
    voice: "Create complete service user profiles with care plans, medical history, emergency contacts, and preferences. Assign areas, link recurring shifts, and keep full care notes — all searchable and accessible to authorised staff on their mobile device at the point of care.",
    highlights: ['Full care plan builder', 'Medical & contact history', 'Mobile access for carers'],
    Screen: ScreenServiceUser,
  },
  {
    id: 'scheduling', icon: Calendar, colour: '#f59e0b',
    title: 'Smart Rota & Scheduling',
    subtitle: 'Recurring visits, shift patterns and conflict detection',
    body: 'Build recurring schedules, assign carers and set up repeating shift patterns. The system flags conflicts automatically so you never double-book. View by area, staff member or service user.',
    voice: "Build recurring visit schedules, assign carers to service users, and set up shift patterns that repeat weekly. The system flags scheduling conflicts automatically so you never double-book a carer. Coordinators can view and manage rotas by area, staff member, or service user — giving complete control over the working week.",
    highlights: ['Recurring shift patterns', 'Conflict detection', 'Area & staff views'],
    Screen: ScreenScheduling,
  },
  {
    id: 'mobile', icon: Smartphone, colour: '#10b981',
    title: 'Carer Mobile App',
    subtitle: 'GPS clock-in, care notes and real-time updates on any phone',
    body: 'Carers clock in with GPS verification, log care notes and observations, tick off tasks and access MAR charts — all from any Android or iOS device. No specialist hardware needed.',
    voice: "Carers use the app on any Android or iOS device — no specialist hardware required. They clock in and out with GPS verification, log care notes at the point of visit, record observations, and receive real-time notifications. The app works as a Progressive Web App too, so getting your whole team set up takes minutes.",
    highlights: ['GPS clock-in & out', 'Point-of-care logging', 'Works on any device'],
    Screen: ScreenMobileApp,
  },
  {
    id: 'emar', icon: Pill, colour: '#ec4899',
    title: 'Medication Recording (eMAR)',
    subtitle: 'Electronic medication administration at the point of care',
    body: "Carers record every medication administration during the visit. Given, refused and missed doses are tracked, overdue meds are flagged, and a full auditable eMAR record is kept for every service user.",
    voice: "Carers record medication administration directly in the app during the visit. The system tracks given, refused, and missed doses, flags overdue medications, and keeps a full auditable electronic medication record for every service user — ready for C Q C inspections at any time.",
    highlights: ['Given / refused / missed tracking', 'Overdue flagging', 'CQC-ready audit trail'],
    Screen: ScreenEMAR,
  },
  {
    id: 'incidents', icon: AlertTriangle, colour: '#ef4444',
    title: 'Incident Reporting',
    subtitle: 'Log, track and escalate incidents instantly from the field',
    body: 'Carers raise incident reports directly from their phone during or after a visit. Reports are timestamped, geo-located and immediately visible to management, tracked through to resolution.',
    voice: "Carers can raise incident reports directly from their mobile during or after a visit. Reports are timestamped, geo-located, and immediately visible to management. Incidents are tracked through to resolution and feed into your compliance dashboard — giving you a clear audit trail without any paperwork.",
    highlights: ['Instant mobile reporting', 'GPS & timestamp', 'Management escalation'],
    Screen: ScreenIncidents,
  },
  {
    id: 'training', icon: CheckCircle, colour: '#0ea5e9',
    title: 'Training, Development & Staff Compliance',
    subtitle: 'Mandatory courses, assessments and auto-issued certificates',
    body: 'Every staff member has a compliance matrix tracking mandatory training — moving & handling, safeguarding, infection control and more. Staff complete assessments in the app and receive certificates automatically. Overdue training is flagged instantly.',
    voice: "CareCall AI includes a full training and development module. Every staff member has a compliance matrix tracking mandatory courses — moving and handling, safeguarding, fire safety, medication awareness and more. Staff complete built-in assessments directly in the app. Pass the assessment and a certificate is issued automatically to their staff record. Managers see a live compliance dashboard showing who is up to date and who is overdue — keeping you CQC-ready at all times.",
    highlights: ['Mandatory course tracking', 'In-app assessments', 'Auto-issued certificates', 'Live compliance matrix'],
    Screen: ScreenTraining,
  },
  {
    id: 'radio', icon: Radio, colour: '#6366f1',
    title: 'Built-in Radio & Alerter System',
    subtitle: 'The feature no competitor offers — real-time PTT radio',
    body: "Push-to-talk radio built directly into the app. Coordinators and field staff communicate instantly, just like a professional radio handset. The alerter fires a pager tone when visits are missed — even waking dedicated T320 handsets from sleep.",
    voice: "This is what sets CareCall AI apart from every other platform on the market. We have a built-in two-way radio system. Coordinators and field staff communicate instantly with push-to-talk, just like a professional radio handset — directly through the app, with no extra hardware needed. And our alerter system monitors your schedule around the clock, firing a pager-style alert when visits are missed or overdue. No other care management software does this.",
    highlights: ['Push-to-talk radio', 'Real-time pager alerts', 'Dedicated T320 handset support'],
    Screen: ScreenRadio,
  },
  {
    id: 'compliance', icon: BarChart3, colour: '#0ea5e9',
    title: 'Reports & Compliance',
    subtitle: 'Management reports, CQC dashboards and full audit trails',
    body: 'Run reports on visit completion, carer punctuality, medication compliance and incident trends. Every action is logged with a timestamp and user ID — a complete audit trail, always ready for CQC.',
    voice: "Run reports on visit completion, missed calls, carer punctuality, medication compliance, and incident trends. Every action in the system is logged with a timestamp and user ID, giving you a complete audit trail for C Q C inspections and local authority reporting — all exportable and always up to date.",
    highlights: ['Visit & medication reports', 'CQC audit trail', 'Exportable data'],
    Screen: ScreenCompliance,
  },
  {
    id: 'invoicing', icon: Receipt, colour: '#0d9488',
    title: 'Automated Invoicing',
    subtitle: 'Invoices generated directly from completed visit logs',
    body: 'Once visits are logged and approved, invoices are generated automatically — pulling hours, rates and care notes straight from the rota. Send to local authorities or private clients, track payments and run financial reports.',
    voice: "CareCall AI takes the pain out of invoicing. Once visits are completed and care notes logged, the system automatically generates invoices pulling the hours, rates and client details straight from the visit record. You can invoice local councils and private clients separately, track what has been paid and what is overdue, and run full financial reports — all without a single spreadsheet.",
    highlights: ['Auto-generated from visit logs', 'Council & private client billing', 'Payment tracking & overdue alerts', 'Financial reports'],
    Screen: ScreenInvoicing,
  },
  {
    id: 'expenses', icon: Car, colour: '#f59e0b',
    title: 'Mileage & Expense Claims',
    subtitle: 'Staff submit fuel claims — managers approve in one click',
    body: 'Carers log their weekly mileage between visits directly in the app. Claims are calculated at the HMRC approved rate automatically. Managers see all claims in one place, approve with one tap and export for payroll.',
    voice: "Staff fuel and mileage claims are handled entirely in the app. Carers log their mileage between visits each week, and the system calculates the amount automatically at the current H M R C approved rate. Managers see every claim, approve them in one tap, and the totals feed straight into payroll. No paper forms, no spreadsheets, no chasing receipts.",
    highlights: ['Weekly mileage submission', 'HMRC rate auto-calculated', 'One-tap manager approval', 'Exports to payroll'],
    Screen: ScreenExpenses,
  },
  {
    id: 'payroll', icon: DollarSign, colour: '#16a34a',
    title: 'Payroll & Payslips',
    subtitle: 'Hours, mileage and leave all flow into payroll automatically',
    body: 'Hours worked, approved mileage and leave are all calculated automatically at the end of each pay period. Generate payslips for every staff member, produce P60s and export everything for your accountant — in minutes.',
    voice: "Payroll is calculated automatically from hours worked, approved mileage claims and leave records. At the end of each pay period, generate payslips for every member of staff in seconds, produce P60s at year end, and export everything your accountant needs. What used to take a day now takes five minutes.",
    highlights: ['Auto-calculated from hours & mileage', 'Payslips & P60 generation', 'Leave deducted automatically', 'Accountant export ready'],
    Screen: ScreenPayroll,
  },
  {
    id: 'operations', icon: TrendingUp, colour: '#f59e0b',
    title: 'Shift Swaps, Tasks & Care Plan Updates',
    subtitle: 'Keep operations running smoothly without the chaos',
    body: 'Staff request shift swaps directly in the app — managers approve or reassign in seconds. Uncovered shifts are flagged automatically. Daily task lists keep coordinators on top of care plan reviews, follow-ups and admin. Everything in one place.',
    voice: "Keeping daily operations running smoothly is where CareCall AI really shines. Staff can request shift swaps directly in the app — you approve or reassign in seconds. Uncovered shifts are flagged automatically and you can notify available staff with one tap. Coordinators have a daily task list — care plan reviews, GP follow-ups, incident closures — all visible and trackable. Nothing falls through the cracks.",
    highlights: ['Staff shift swap requests', 'Uncovered shift alerts', 'Daily coordinator task lists', 'Care plan update tracking'],
    Screen: ScreenOperations,
  },
  {
    id: 'ai', icon: Sparkles, colour: '#8b5cf6',
    title: 'AI-Powered Admin Assistant',
    subtitle: 'Ask anything — get instant answers across your whole operation',
    body: 'The built-in AI assistant knows your rota, your staff, your compliance status and your finances. Ask in plain English — "who is approaching overtime?", "generate a CQC summary" — and get instant, accurate answers.',
    voice: "CareCall AI includes a built-in artificial intelligence assistant that knows everything about your operation. Ask it in plain English — which carers are approaching overtime, who has overdue training, what is our visit completion rate this month, generate a CQC compliance summary. It reads your live data and gives you instant, accurate answers. It can even draft documents, summarise incident reports and flag risks before they become problems.",
    highlights: ['Plain English queries', 'Live data across all modules', 'CQC & compliance summaries', 'Document drafting'],
    Screen: ScreenAI,
  },
  {
    id: 'leave', icon: Briefcase, colour: '#3b82f6',
    title: 'Leave Management & HR',
    subtitle: 'Holiday, sick leave and HR records — all automated',
    body: 'Staff request leave in the app. Managers approve with one tap, and the system automatically blocks those dates in the rota, adjusts payroll and updates the staff record. Sick leave, annual leave and HR notes all in one place.',
    voice: "Leave management is fully integrated. Staff request holiday or log sick leave directly in the app. Managers approve with one tap, and the system automatically blocks those dates in the rota, adjusts payroll calculations and updates the staff record. There is no risk of accidentally scheduling someone who is on leave, and every absence is recorded and reportable for CQC and HR purposes.",
    highlights: ['In-app leave requests', 'Rota & payroll auto-updated', 'Sick leave tracking', 'HR records & reporting'],
    Screen: ScreenLeavePayroll,
  },
  {
    id: 'pricing', icon: CheckCircle, colour: '#16a34a',
    title: '£99/month. Everything. Forever.',
    subtitle: 'One price. Unlimited staff. All features. Price locked.',
    body: "£99 a month for everything — unlimited staff, all features, every update we ever ship. No per-user charges, no modules to add. The price is locked for existing customers forever.",
    voice: "Unlike competitors who charge per carer, per module, or increase prices every year — CareCall AI is ninety-nine pounds a month for everything. Unlimited staff, all current features, and every new feature we build going forward. We promise that price will never increase for existing customers. Sign up today.",
    highlights: ['Unlimited staff', 'All features included', 'Price locked forever'],
    isCta: true,
    Screen: ScreenPricing,
  },
];

function useVoice() {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const speak = useCallback((text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (muted) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92; u.pitch = 1.0; u.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Google UK') || v.name.includes('Samantha'))) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) u.voice = preferred;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [muted]);
  const stop = useCallback(() => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); setSpeaking(false); }, []);
  const toggleMute = useCallback(() => setMuted(m => { if (!m && typeof window !== 'undefined') window.speechSynthesis.cancel(); return !m; }), []);
  useEffect(() => () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); }, []);
  return { speak, stop, speaking, muted, toggleMute };
}

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const { speak, stop, speaking, muted, toggleMute } = useVoice();
  const timerRef = useRef(null);
  const current = STEPS[step];
  const Icon = current.icon;
  const Screen = current.Screen;

  const goTo = useCallback((idx) => { stop(); clearTimeout(timerRef.current); setStep(idx); }, [stop]);
  const next = useCallback(() => { if (step < STEPS.length - 1) goTo(step + 1); }, [step, goTo]);
  const prev = useCallback(() => { if (step > 0) goTo(step - 1); }, [step, goTo]);

  useEffect(() => {
    if (!started) return;
    speak(current.voice);
    const ms = Math.max(9000, (current.voice.split(' ').length / 0.92) * 650);
    if (step < STEPS.length - 1) timerRef.current = setTimeout(next, ms);
    return () => clearTimeout(timerRef.current);
  }, [step, started]); // eslint-disable-line

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0c2a1e 100%)', display: 'flex', flexDirection: 'column', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1e293b' }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9', textDecoration: 'none' }}>CareCall AI</a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggleMute} style={ghostBtn}>
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span style={{ fontSize: 12 }}>{muted ? 'Unmute' : 'Mute'}</span>
          </button>
          <a href="/signup" style={{ background: '#0d9488', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: 'none' }}>
            Sign Up — £99/mo
          </a>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: '#1e293b' }}>
        <div style={{ height: '100%', background: current.colour, width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.5s ease' }} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 0' }}>
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)} title={s.title} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, background: i === step ? current.colour : i < step ? '#334155' : '#1e293b', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>

      {!started ? (
        /* Splash screen */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#0d948818', border: '2px solid #0d948866', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Play size={36} color="#0d9488" />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px', lineHeight: 1.1 }}>See CareCall AI in action</h1>
          <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.6, maxWidth: 420 }}>
            A guided voice tour with live app screens showing every feature — dashboard, scheduling, eMAR, radio and more.
          </p>
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 28px' }}>Takes about 4 minutes · 9 features covered</p>
          <button onClick={() => setStarted(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#0d9488', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            <Play size={20} /> Start Demo Tour
          </button>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 14 }}>Turn your sound on for voice narration</p>
        </div>
      ) : (
        /* Main demo layout */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto', width: '100%', padding: '16px 16px 0' }}>
          {/* Two-column on wide, stacked on mobile */}
          <div style={{ display: 'flex', gap: 20, flex: 1, flexWrap: 'wrap' }}>

            {/* Left: info panel */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${current.colour}20`, border: `1.5px solid ${current.colour}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={current.colour} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: current.colour, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                    {step + 1} of {STEPS.length}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{current.title}</h2>
                </div>
              </div>

              <p style={{ fontSize: 13, color: current.colour, fontWeight: 600, margin: '0 0 10px', lineHeight: 1.4 }}>{current.subtitle}</p>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 16px' }}>{current.body}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                {current.highlights.map(h => (
                  <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${current.colour}10`, border: `1px solid ${current.colour}28`, borderRadius: 8, padding: '9px 12px' }}>
                    <CheckCircle size={13} color={current.colour} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{h}</span>
                  </div>
                ))}
              </div>

              {current.isCta && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <a href="/signup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0d9488', color: '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                    Sign Up — £99/month <ArrowRight size={15} />
                  </a>
                  <a href="mailto:hello@carecallai.co.uk?subject=CareCall AI enquiry&body=Hi, I watched the demo and would like to know more..." style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1e293b', color: '#cbd5e1', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid #334155' }}>
                    ✉ Send us a message
                  </a>
                  <a href="/download" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: '#64748b', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                    📲 Download the App
                  </a>
                </div>
              )}

              {speaking && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                    {[6, 12, 6].map((h, i) => (
                      <div key={i} style={{ width: 3, borderRadius: 2, background: current.colour, height: h, animation: `wave${i + 1} 0.8s ease-in-out infinite` }} />
                    ))}
                  </div>
                  Narrating…
                </div>
              )}
            </div>

            {/* Right: app screen mockup */}
            <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 16 }}>
              <div style={{
                width: '100%', maxWidth: 300,
                background: '#0f172a',
                border: `2px solid ${current.colour}44`,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: `0 0 40px ${current.colour}22, 0 20px 40px #00000066`,
                transition: 'border-color 0.4s',
              }}>
                {/* Phone notch bar */}
                <div style={{ background: '#080e1a', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>9:41</span>
                  <div style={{ width: 60, height: 6, background: '#1e293b', borderRadius: 99 }} />
                  <Activity size={10} color="#475569" />
                </div>
                <Screen />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Controls */}
      {started && (
        <div style={{ borderTop: '1px solid #1e293b', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0f172a88', backdropFilter: 'blur(8px)' }}>
          <button onClick={prev} disabled={step === 0} style={navBtn(step === 0)}>
            <SkipBack size={16} />
          </button>
          <button onClick={() => speaking ? stop() : speak(current.voice)} style={navBtn(false, true, current.colour)}>
            {speaking ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={next} disabled={step === STEPS.length - 1} style={navBtn(step === STEPS.length - 1)}>
            <SkipForward size={16} />
          </button>
          <div style={{ position: 'absolute', right: 20, fontSize: 12, color: '#475569' }}>
            {step + 1} / {STEPS.length}
          </div>
        </div>
      )}

      <style>{`
        @keyframes wave1 { 0%,100%{height:4px} 50%{height:12px} }
        @keyframes wave2 { 0%,100%{height:12px} 50%{height:4px} }
        @keyframes wave3 { 0%,100%{height:4px} 50%{height:12px} }
      `}</style>
    </div>
  );
}

/* ─── Shared styles ─── */
const screen = {
  background: '#0f172a',
  minHeight: 340,
  color: '#f1f5f9',
  fontFamily: 'system-ui, sans-serif',
};

const screenHeader = (bg) => ({
  background: bg,
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid #1e293b',
  minHeight: 36,
});

const ghostBtn = {
  display: 'flex', alignItems: 'center', gap: 5,
  background: 'transparent', border: '1px solid #334155',
  color: '#94a3b8', borderRadius: 8, padding: '7px 11px',
  cursor: 'pointer', fontWeight: 500,
};

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
