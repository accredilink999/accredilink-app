import Link from 'next/link';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export const metadata = {
  title: 'CareCall AI | All-in-One Domiciliary Care Management Platform',
  description: 'CareCall AI is a comprehensive staff management and care operations platform built specifically for domiciliary care agencies. GPS tracking, rota management, care documentation, incident reporting, training, automatic payroll & payslips, invoicing, fuel & expense tracking, and CIW compliance — all in one app.',
  alternates: {
    canonical: "https://accredilinkcare.co.uk/apps-that-care/carecall-ai",
  },
};

const features = [
  {
    title: 'Real-Time GPS Control Room',
    description: 'Track your entire care team in real-time on an interactive map. See who\u2019s on shift, where they are, and which service users they\u2019re visiting.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
    preview: (
      <div className="bg-gradient-to-br from-green-100 via-green-50 to-blue-50 h-full relative overflow-hidden">
        <div className="absolute top-3 left-4 w-16 h-[1px] bg-slate-300/50" /><div className="absolute top-6 left-6 w-12 h-[1px] bg-slate-300/50" /><div className="absolute top-3 left-12 w-[1px] h-8 bg-slate-300/50" />
        <div className="absolute top-4 left-8 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center"><span className="text-[5px] font-bold text-white">SJ</span></div>
        <div className="absolute top-8 left-20 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center"><span className="text-[5px] font-bold text-white">KL</span></div>
        <div className="absolute top-14 left-12 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow flex items-center justify-center"><span className="text-[5px] font-bold text-white">RW</span></div>
        <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center"><span className="text-[5px] font-bold text-white">AM</span></div>
        <div className="absolute top-3 left-16 w-3 h-3 rounded-full bg-rose-400 border border-white shadow-sm" />
        <div className="absolute top-11 left-24 w-3 h-3 rounded-full bg-rose-400 border border-white shadow-sm" />
        <div className="absolute bottom-1 left-1 bg-white/80 rounded px-1.5 py-0.5 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[5px] text-slate-500">Active</span></div>
          <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[5px] text-slate-500">En Route</span></div>
        </div>
      </div>
    ),
  },
  {
    title: 'Integrated Care Documentation',
    description: 'Carers clock in and out of visits with automatic GPS verification. Each visit captures mood, food and fluid intake, personal care tasks, and detailed notes.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50',
    textColor: 'text-green-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1.5">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Mrs. Williams — Visit Log</p><span className="text-[5px] px-1 py-0.5 rounded bg-green-100 text-green-700">08:45</span></div>
        <div className="flex gap-1"><span className="text-[5px] px-1 py-0.5 rounded bg-green-100 text-green-700">GPS Verified</span><span className="text-[5px] px-1 py-0.5 rounded bg-blue-100 text-blue-700">Clocked In</span></div>
        <div className="flex items-center gap-2"><span className="text-xs">😊</span><span className="text-[5px] text-slate-500">Mood: Happy</span></div>
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-green-50 rounded px-1 py-0.5"><span className="text-[5px] text-green-700">Food: Good</span></div>
          <div className="bg-green-50 rounded px-1 py-0.5"><span className="text-[5px] text-green-700">Fluid: Good</span></div>
        </div>
        <div className="flex gap-0.5">{['Wash','Dress','Meds'].map(t=><span key={t} className="text-[5px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-700">{t}</span>)}</div>
        <div className="bg-slate-50 rounded px-1 py-0.5"><span className="text-[5px] text-slate-500 italic">Good spirits today, ate well...</span></div>
      </div>
    ),
  },
  {
    title: 'Incident & Safeguarding Hub',
    description: 'Structured incident reporting covering falls, medication errors, safeguarding concerns, and complaints — with severity levels, witnesses, and CIW notification tracking.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    textColor: 'text-red-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Open Incidents</p><span className="text-[5px] px-1 py-0.5 rounded bg-red-100 text-red-700">2 Open</span></div>
        <div className="bg-red-50 rounded p-1.5 border border-red-100">
          <div className="flex items-center gap-1 mb-0.5"><span className="text-[7px]">⚠️</span><span className="text-[6px] font-semibold text-slate-800">Fall — Mrs. Williams</span></div>
          <div className="flex gap-1"><span className="text-[5px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">Medium</span><span className="text-[5px] px-1 py-0.5 rounded bg-red-100 text-red-700">CIW Notifiable</span></div>
        </div>
        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
          <div className="flex items-center gap-1 mb-0.5"><span className="text-[7px]">📋</span><span className="text-[6px] font-semibold text-slate-800">Near Miss — Medication</span></div>
          <div className="flex gap-1"><span className="text-[5px] px-1 py-0.5 rounded bg-green-100 text-green-700">Low</span><span className="text-[5px] px-1 py-0.5 rounded bg-slate-100 text-slate-600">Internal</span></div>
        </div>
        <div className="flex gap-1"><span className="text-[5px] px-1 py-0.5 rounded bg-blue-50 text-blue-600">Full Audit Trail</span><span className="text-[5px] px-1 py-0.5 rounded bg-blue-50 text-blue-600">Witness Records</span></div>
      </div>
    ),
  },
  {
    title: 'Intelligent Rota Management',
    description: 'Build and manage rotas with month, week, and day views. Create recurring shift patterns, assign staff to areas, and manage allocations instantly.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50',
    textColor: 'text-purple-600',
    preview: (
      <div className="bg-white h-full p-2">
        <div className="flex items-center justify-between mb-1"><p className="text-[6px] font-bold text-slate-700">Feb 2026</p><div className="flex gap-0.5">{['M','W','D'].map(v=><span key={v} className={`text-[5px] px-1 py-0.5 rounded ${v==='W'?'bg-purple-500 text-white':'bg-slate-100 text-slate-500'}`}>{v}</span>)}</div></div>
        <div className="grid grid-cols-7 gap-[1px] mb-1">{['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className="text-center text-[4px] text-slate-400 py-0.5">{d}</div>)}</div>
        {['Sarah','Katie','Rob','Amy'].map(name=>(
          <div key={name} className="grid grid-cols-8 gap-[1px] items-center mb-[2px]">
            <span className="text-[4px] text-slate-600 truncate">{name}</span>
            {[['bg-green-200 text-green-800','E'],['bg-blue-200 text-blue-800','L'],['bg-amber-200 text-amber-800','Lg'],['','–'],['bg-green-200 text-green-800','E'],['bg-purple-200 text-purple-800','N'],['','–']].map(([cls,lbl],j)=>(
              <div key={j} className={`rounded text-center py-0.5 text-[4px] font-medium ${cls||'bg-slate-50 text-slate-300'}`}>{lbl}</div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Training Academy & AI Course Builder',
    description: 'Built-in LMS with course library, AI-powered course creation, assignment tracking, completion analytics, and certificate management.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    textColor: 'text-amber-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Training Academy</p><span className="text-[5px] px-1 py-0.5 rounded bg-amber-500 text-white">AI Builder</span></div>
        <div className="grid grid-cols-2 gap-1">
          {[{t:'Manual Handling',c:'bg-blue-500',p:85},{t:'Safeguarding',c:'bg-rose-500',p:62},{t:'Medication',c:'bg-amber-500',p:100},{t:'Infection Ctrl',c:'bg-green-500',p:40}].map(course=>(
            <div key={course.t} className="bg-slate-50 rounded overflow-hidden border border-slate-100">
              <div className={`${course.c} h-0.5`} />
              <div className="p-1"><p className="text-[5px] font-semibold text-slate-800">{course.t}</p><div className="w-full bg-slate-100 rounded-full h-1 mt-0.5"><div className={`${course.c} h-1 rounded-full`} style={{width:`${course.p}%`}} /></div><p className="text-[4px] text-slate-400 mt-0.5">{course.p}%</p></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1">{[['18','Up to Date','text-green-600'],['4','Due Soon','text-amber-500'],['2','Overdue','text-rose-500']].map(([n,l,c])=><div key={l} className="text-center"><p className={`text-[7px] font-bold ${c}`}>{n}</p><p className="text-[4px] text-slate-400">{l}</p></div>)}</div>
      </div>
    ),
  },
  {
    title: 'Advanced Analytics & Reporting',
    description: 'Dashboards with bar charts, pie charts, and line graphs covering shifts, incidents, training, payroll, and expenses. Export for CIW.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'from-teal-500 to-cyan-500',
    bg: 'bg-teal-50',
    textColor: 'text-teal-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Analytics</p><div className="flex gap-0.5">{['7d','30d','90d'].map(v=><span key={v} className={`text-[4px] px-1 py-0.5 rounded ${v==='30d'?'bg-teal-500 text-white':'bg-slate-100 text-slate-400'}`}>{v}</span>)}</div></div>
        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
          <p className="text-[5px] text-slate-500 mb-1">Shifts Completed</p>
          <div className="flex items-end gap-[2px] h-8">{[65,72,58,80,75,90,85,70,78,92,88,76].map((h,i)=><div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background:'linear-gradient(to top, #0D9488, #14B8A6)'}} />)}</div>
        </div>
        <div className="grid grid-cols-3 gap-1">{[['847','Shifts','text-teal-600'],['98.2%','Attend','text-blue-600'],['12','Incidents','text-amber-500']].map(([n,l,c])=><div key={l} className="bg-slate-50 rounded p-1 text-center border border-slate-100"><p className={`text-[7px] font-bold ${c}`}>{n}</p><p className="text-[4px] text-slate-400">{l}</p></div>)}</div>
      </div>
    ),
  },
  {
    title: 'Priority Messaging & Announcements',
    description: 'Built-in communication hub with 1-to-1 messaging, team chat, and priority announcements with read-receipt tracking.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    preview: (
      <div className="bg-slate-50 h-full p-2 space-y-1">
        <div className="bg-red-50 rounded p-1 border border-red-100"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-[5px] font-bold text-red-700">CRITICAL</span></div><p className="text-[5px] text-slate-700 mt-0.5">Icy Roads Warning — Extra Care</p><span className="text-[4px] text-slate-400">18/24 read</span></div>
        <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center text-[4px] font-bold text-slate-600 flex-shrink-0">KL</div><div className="bg-white rounded-lg px-1.5 py-1 border border-slate-200 max-w-[70%]"><p className="text-[5px] text-slate-700">Is Mrs. Williams&apos; meds the same?</p><p className="text-[4px] text-slate-400">09:14</p></div></div>
        <div className="flex justify-end"><div className="bg-indigo-600 rounded-lg px-1.5 py-1 max-w-[70%]"><p className="text-[5px] text-white">Yes, same dosage as last week.</p><p className="text-[4px] text-white/60 text-right">09:15 ✓✓</p></div></div>
        <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-slate-300 flex items-center justify-center text-[4px] font-bold text-slate-600 flex-shrink-0">KL</div><div className="bg-white rounded-lg px-1.5 py-1 border border-slate-200"><p className="text-[5px] text-slate-700">Perfect, thanks!</p></div></div>
      </div>
    ),
  },
  {
    title: 'Leave & Absence Management',
    description: 'Staff submit leave requests in-app. Managers approve/reject instantly with Bradford Factor scoring, absence pattern reports, and rota conflict detection.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Leave Requests</p><span className="text-[5px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">3 Pending</span></div>
        {[{n:'Katie L.',t:'Annual',d:'24–28 Feb',s:'Pending',sc:'bg-amber-100 text-amber-700'},{n:'Rob W.',t:'Sick',d:'17 Feb',s:'Pending',sc:'bg-amber-100 text-amber-700'},{n:'Sarah J.',t:'Annual',d:'10–12 Mar',s:'Approved',sc:'bg-green-100 text-green-700'}].map(r=>(
          <div key={r.n} className="bg-slate-50 rounded p-1 border border-slate-100">
            <div className="flex items-center justify-between"><span className="text-[5px] font-semibold text-slate-800">{r.n} — {r.t}</span><span className={`text-[4px] px-1 py-0.5 rounded-full font-medium ${r.sc}`}>{r.s}</span></div>
            <span className="text-[4px] text-slate-400">{r.d}</span>
          </div>
        ))}
        <div className="flex gap-1">{[{n:'Sarah',s:12,c:'bg-green-400'},{n:'Rob',s:48,c:'bg-amber-400'},{n:'Dan',s:96,c:'bg-red-400'}].map(b=><div key={b.n} className="flex-1"><div className="flex items-center gap-1"><span className="text-[4px] text-slate-500">{b.n}</span><div className="flex-1 bg-slate-100 rounded-full h-1"><div className={`${b.c} h-1 rounded-full`} style={{width:`${b.s}%`}} /></div></div></div>)}</div>
      </div>
    ),
  },
  {
    title: 'Mobile App — Works Offline',
    description: 'PWA + native iOS and Android. Biometric login, offline capability, push notifications, GPS tracking, and a clean mobile-first interface.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-slate-500 to-slate-700',
    bg: 'bg-slate-100',
    textColor: 'text-slate-600',
    preview: (
      <div className="bg-slate-800 h-full flex items-center justify-center p-2">
        <div className="w-16 bg-slate-900 rounded-lg p-1 border border-slate-700">
          <div className="w-6 h-1 bg-slate-700 rounded-full mx-auto mb-0.5" />
          <div className="bg-white rounded overflow-hidden">
            <div className="bg-green-600 px-1 py-0.5"><span className="text-[4px] font-semibold text-white">CareCall AI</span></div>
            <div className="p-1 space-y-0.5">
              <p className="text-[4px] font-bold text-slate-800">Hi Sarah</p>
              <div className="bg-green-50 rounded p-0.5 border border-green-100"><p className="text-[3px] font-semibold text-green-800">Current Visit</p><p className="text-[4px] font-bold text-slate-800">Mrs. Williams</p><span className="text-[3px] px-0.5 rounded bg-green-200 text-green-800">Clocked In</span></div>
              <div className="grid grid-cols-2 gap-0.5">{['Log Care','Clock Out','Incident','Messages'].map(a=><div key={a} className="bg-slate-50 rounded py-0.5 text-center border border-slate-100"><p className="text-[3px] text-slate-600">{a}</p></div>)}</div>
            </div>
            <div className="flex justify-around py-0.5 border-t border-slate-100">{['Home','Rota','Chat'].map(t=><span key={t} className={`text-[3px] ${t==='Home'?'text-green-600':'text-slate-400'}`}>{t}</span>)}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'CIW Compliance Suite',
    description: 'Purpose-built for Welsh care providers. Incident reporting, training tracking, care documentation, and audit trails all follow CIW requirements.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'from-welsh-red to-rose-600',
    bg: 'bg-red-50',
    textColor: 'text-welsh-red',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-600 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div><p className="text-[6px] font-bold text-slate-700">CIW Compliance</p></div>
        {[{t:'Incident Reporting',s:'Compliant'},{t:'Care Documentation',s:'Compliant'},{t:'Training Records',s:'Compliant'},{t:'Staff Qualifications',s:'Compliant'},{t:'Audit Trail',s:'Active'}].map(item=>(
          <div key={item.t} className="flex items-center justify-between bg-green-50/50 rounded px-1.5 py-0.5 border border-green-100">
            <span className="text-[5px] text-slate-700">{item.t}</span>
            <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[4px] text-green-700 font-medium">{item.s}</span></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Fuel & Mileage Tracking',
    description: 'GPS auto-mileage between visits, fuel receipt uploads, HMRC-rate calculations, and full expense reporting for travel costs.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    textColor: 'text-orange-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Fuel & Mileage</p><span className="text-[5px] px-1 py-0.5 rounded bg-orange-500 text-white">+ Log</span></div>
        <div className="grid grid-cols-3 gap-1">{[['£342','Fuel','text-orange-600'],['1,847mi','Miles','text-blue-600'],['£831','HMRC','text-green-600']].map(([n,l,c])=><div key={l} className="bg-slate-50 rounded p-1 text-center border border-slate-100"><p className={`text-[6px] font-bold ${c}`}>{n}</p><p className="text-[4px] text-slate-400">{l}</p></div>)}</div>
        {[{n:'Sarah J.',t:'🚗 47mi — 6 visits',a:'£21.15',s:'Auto',sc:'bg-green-100 text-green-700'},{n:'Katie L.',t:'⛽ BP Denbigh',a:'£52.40',s:'Pending',sc:'bg-amber-100 text-amber-700'}].map(e=>(
          <div key={e.n} className="bg-slate-50 rounded p-1 border border-slate-100">
            <div className="flex items-center justify-between"><span className="text-[5px] font-semibold text-slate-800">{e.n}</span><span className="text-[5px] font-bold text-slate-800">{e.a}</span></div>
            <div className="flex items-center justify-between"><span className="text-[4px] text-slate-500">{e.t}</span><span className={`text-[4px] px-1 py-0.5 rounded-full font-medium ${e.sc}`}>{e.s}</span></div>
          </div>
        ))}
        <div className="bg-orange-50 rounded p-1 border border-orange-100 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /><span className="text-[4px] text-orange-700 font-medium">GPS Auto-Mileage Active</span></div>
      </div>
    ),
  },
  {
    title: 'Automatic Payroll & Payslips',
    description: 'Auto-calculated pay from clocked hours with shift enhancements, tax, NI, pension deductions. Generate professional PDF payslips instantly.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    color: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Payroll — Feb 2026</p><span className="text-[5px] px-1 py-0.5 rounded bg-cyan-500 text-white">Generate</span></div>
        <div className="grid grid-cols-3 gap-1">{[['£18.4k','Gross','text-cyan-600'],['£4.1k','Deductions','text-red-500'],['£14.3k','Net','text-green-600']].map(([n,l,c])=><div key={l} className="bg-slate-50 rounded p-1 text-center border border-slate-100"><p className={`text-[6px] font-bold ${c}`}>{n}</p><p className="text-[4px] text-slate-400">{l}</p></div>)}</div>
        {[{n:'Sarah J.',h:'152h',net:'£1,456'},{n:'Katie L.',h:'144h',net:'£1,382'}].map(s=>(
          <div key={s.n} className="bg-slate-50 rounded p-1 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-cyan-100 flex items-center justify-center text-[4px] font-bold text-cyan-700">{s.n.split(' ').map(x=>x[0]).join('')}</div><span className="text-[5px] text-slate-700">{s.n}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-[4px] text-slate-400">{s.h}</span><span className="text-[5px] font-bold text-green-600">{s.net}</span></div>
          </div>
        ))}
        <div className="bg-cyan-50 rounded p-1 border border-cyan-100"><p className="text-[4px] font-semibold text-cyan-800">Payslip: Tax −£218 | NI −£156 | Pension −£97</p></div>
      </div>
    ),
  },
  {
    title: 'Automatic Invoicing System',
    description: 'Auto-generated invoices from completed visits matched to service agreements. Professional PDFs, payment tracking, and ageing reports.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    textColor: 'text-violet-600',
    preview: (
      <div className="bg-white h-full p-2 space-y-1">
        <div className="flex items-center justify-between"><p className="text-[6px] font-bold text-slate-700">Invoices — Feb 2026</p><span className="text-[5px] px-1 py-0.5 rounded bg-violet-500 text-white">+ Generate</span></div>
        <div className="grid grid-cols-4 gap-0.5">{[['12','Invoices','text-violet-600'],['£28k','Invoiced','text-green-600'],['£19k','Paid','text-blue-600'],['£9k','Due','text-amber-600']].map(([n,l,c])=><div key={l} className="bg-slate-50 rounded p-0.5 text-center border border-slate-100"><p className={`text-[5px] font-bold ${c}`}>{n}</p><p className="text-[3px] text-slate-400">{l}</p></div>)}</div>
        {[{r:'INV-0047',c:'Denbighshire CC',a:'£8,420',s:'Paid',sc:'bg-green-100 text-green-700'},{r:'INV-0048',c:'Conwy BC',a:'£6,180',s:'Sent',sc:'bg-blue-100 text-blue-700'},{r:'INV-0050',c:'Flintshire CC',a:'£4,860',s:'Draft',sc:'bg-slate-100 text-slate-600'}].map(inv=>(
          <div key={inv.r} className="bg-slate-50 rounded p-1 border border-slate-100">
            <div className="flex items-center justify-between"><span className="text-[5px] font-semibold text-slate-800">{inv.c}</span><span className={`text-[4px] px-1 py-0.5 rounded-full font-medium ${inv.sc}`}>{inv.s}</span></div>
            <div className="flex items-center justify-between"><span className="text-[4px] text-slate-400">{inv.r}</span><span className="text-[5px] font-bold text-slate-800">{inv.a}</span></div>
          </div>
        ))}
        <div className="bg-violet-50 rounded p-1 border border-violet-100 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-violet-500" /><span className="text-[4px] text-violet-700 font-medium">Auto-Generation Active</span></div>
      </div>
    ),
  },
];

const ciwFeatures = [
  {
    title: 'Incident Reporting & Notifications',
    description: 'Every incident is categorised, timestamped, and stored with full details including severity, witnesses, and whether it requires CIW notification. Managers receive instant alerts for serious incidents.',
  },
  {
    title: 'Care Documentation Trail',
    description: 'Every care visit is documented with clock-in/out times, GPS location verification, care tasks completed, and detailed notes. This creates the evidence trail that CIW inspectors expect to see.',
  },
  {
    title: 'Training Compliance Tracking',
    description: 'Track mandatory training requirements, completion dates, expiry dates, and renewal schedules for every staff member. The system flags when training is due or overdue.',
  },
  {
    title: 'Staff Qualification Records',
    description: 'Maintain digital records of DBS checks, qualifications, certifications, and right-to-work documentation. Everything is stored securely and accessible for inspection.',
  },
  {
    title: 'Safeguarding Protocols',
    description: 'Dedicated safeguarding incident category with escalation workflows. Log concerns, track family and GP notifications, and maintain a complete safeguarding audit trail.',
  },
  {
    title: 'Audit-Ready Reporting',
    description: 'Generate compliance reports covering incidents, training status, care delivery metrics, and staff performance. Be inspection-ready at all times, not just when CIW is coming.',
  },
];

const faqs = [
  {
    q: 'What is CareCall AI?',
    a: 'CareCall AI is an all-in-one staff management and care operations platform built specifically for domiciliary care agencies. It combines real-time GPS tracking, rota management, care documentation, incident reporting, training, messaging, payroll, and compliance tools into a single application.',
  },
  {
    q: 'Who is CareCall AI designed for?',
    a: 'CareCall AI is designed for domiciliary care agencies, home care providers, and supported living services — particularly those operating in Wales who need to meet Care Inspectorate Wales (CIW) requirements. It\u2019s used by care coordinators, managers, supervisors, and frontline carers.',
  },
  {
    q: 'Does it work on mobile phones?',
    a: 'Yes. CareCall AI is a Progressive Web App (PWA) that works on any device with a web browser. It also runs natively on iOS and Android devices. Carers can use it in the field with offline support — data syncs automatically when connectivity returns.',
  },
  {
    q: 'How does the GPS tracking work?',
    a: 'When carers clock in and out of visits, their GPS location is captured automatically. The control room displays all active staff on a live map with updates every 15 seconds, giving coordinators complete visibility of operations.',
  },
  {
    q: 'Is our data secure?',
    a: 'Absolutely. CareCall AI uses enterprise-grade security with encrypted data storage, role-based access controls, and secure authentication including biometric login. All data is hosted on secure cloud infrastructure.',
  },
  {
    q: 'Can we try it before committing?',
    a: 'Yes! We offer a free demo where we\u2019ll set you up with your own dedicated instance of CareCall AI so you can explore all features with sample data. Contact us to arrange your demo.',
  },
  {
    q: 'How is CareCall AI different from other care management systems?',
    a: 'CareCall AI is built by carers, for carers. Our development team includes experienced care professionals who understand the daily realities of domiciliary care. It\u2019s designed from the ground up for CIW compliance, not retrofitted. And it\u2019s a complete all-in-one platform — not a collection of separate tools bolted together.',
  },
  {
    q: 'Does CareCall AI handle payroll and payslips?',
    a: 'Yes. CareCall AI automatically calculates pay from clocked shift hours, applying the correct rates for different shift types including early, late, night, weekend, and bank holiday enhancements. You can generate professional PDF payslips for your entire team in seconds, with full breakdowns of tax, National Insurance, pension contributions, and deductions.',
  },
  {
    q: 'Can it generate invoices for our clients?',
    a: 'Absolutely. CareCall AI generates invoices automatically from completed visit data, matched against your service agreements and hourly rates. Whether you bill local authorities, NHS bodies, or private clients, every invoice is itemised, professional, and audit-ready. You can schedule automatic invoice generation and track payments with ageing reports.',
  },
  {
    q: 'How does fuel and mileage tracking work?',
    a: 'Mileage between client visits is calculated automatically using GPS clock-in and clock-out locations. Staff can also log fuel receipts with photo uploads directly in the app. The system calculates HMRC-rate reimbursements (45p/25p per mile) and feeds into the expense approval workflow, giving managers complete visibility of travel costs.',
  },
];

export default function CareCallAIPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 bg-welsh-green rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fade-up">
              <div>
                <Link href="/apps-that-care" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Apps That Care
                </Link>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  CareCall <span className="bg-gradient-to-r from-welsh-green to-emerald-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-xl text-slate-300 mb-4">
                  Not Just an App — A Fully Integrated Management Platform
                </p>
                <p className="text-base text-slate-400 mb-8 leading-relaxed max-w-lg">
                  CareCall AI is a complete workforce management platform for your care agency. It keeps your staff compliant, your service users cared for, and everyone safe — from the control room to the doorstep. Real-time GPS tracking, intelligent rota management, integrated care documentation, CIW compliance tools, AI-powered training, and so much more.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="px-8 py-4 bg-welsh-green text-white font-semibold rounded-xl hover:bg-welsh-green-light transition-colors text-base text-center"
                  >
                    Request a Free Demo
                  </Link>
                  <a
                    href="#features"
                    className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base text-center"
                  >
                    Explore Features
                  </a>
                </div>
                {/* App Store buttons */}
                <div className="mt-8">
                  <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Available on mobile</p>
                  <div className="flex items-center gap-3">
                    {/* Apple App Store */}
                    <div className="inline-flex items-center gap-2.5 bg-black/80 border border-white/20 rounded-xl px-5 py-2.5 cursor-default">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <div>
                        <p className="text-[9px] text-slate-400 leading-none">Download on the</p>
                        <p className="text-sm font-semibold text-white leading-tight">App Store</p>
                      </div>
                    </div>
                    {/* Google Play Store */}
                    <div className="inline-flex items-center gap-2.5 bg-black/80 border border-white/20 rounded-xl px-5 py-2.5 cursor-default">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
                        <path d="M17.556 8.235l-3.764 3.764 3.764 3.765 4.244-2.41a1 1 0 000-1.74l-4.244-2.38z" fill="#FBBC04"/>
                        <path d="M3.609 1.814L14.84 8.78l-1.048 1.048L3.609 1.814z" fill="#34A853"/>
                        <path d="M3.609 22.186L13.792 12l1.048 1.048-11.231 9.138z" fill="#EA4335"/>
                      </svg>
                      <div>
                        <p className="text-[9px] text-slate-400 leading-none">GET IT ON</p>
                        <p className="text-sm font-semibold text-white leading-tight">Google Play</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <div className="bg-slate-800 rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-slate-500 ml-2">CareCall AI Dashboard</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Active Staff</span>
                        <span className="text-sm font-bold text-welsh-green">12 on shift</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Today&apos;s Calls</span>
                        <span className="text-sm font-bold text-blue-400">47 scheduled</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Incidents</span>
                        <span className="text-sm font-bold text-amber-400">2 open</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Training Due</span>
                        <span className="text-sm font-bold text-rose-400">3 overdue</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-welsh-green">98%</p>
                      <p className="text-xs text-slate-400">Shift Coverage</p>
                    </div>
                    <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">156</p>
                      <p className="text-xs text-slate-400">Calls This Week</p>
                    </div>
                    <div className="bg-amber-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">24</p>
                      <p className="text-xs text-slate-400">Staff Members</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* What is CareCall AI */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">What is CareCall AI?</h2>
              <div className="text-lg text-slate-600 leading-relaxed space-y-6">
                <p>
                  CareCall AI is a <strong>comprehensive care management platform</strong> that brings together every tool a domiciliary care agency needs into one unified system. No more juggling separate apps for scheduling, care logs, incident reports, and messaging — CareCall AI does it all.
                </p>
                <p>
                  Developed in Denbighshire by <strong>Accredilink Community Response Taskforce</strong>, CareCall AI was born from real experience delivering domiciliary care across North Wales. Every feature exists because a real carer or coordinator needed it. From the GPS control room that gives coordinators live operational visibility, to the mobile app that lets carers document visits with a few taps — this platform was built by people who truly understand the job.
                </p>
                <p>
                  Unlike generic care management software, CareCall AI is designed specifically for <strong>Care Inspectorate Wales (CIW) compliance</strong>. Incident reporting, care documentation, training tracking, and audit trails all follow Welsh regulatory requirements from day one.
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-green/10 text-welsh-green text-sm font-medium mb-4">
                13 Powerful Modules
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything You Need, In One Place</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                CareCall AI combines thirteen integrated modules that work together seamlessly — no integrations needed, no data silos, no switching between systems.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimateOnScroll key={feature.title} animation="fade-up" delay={i * 50}>
                <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:border-slate-300 h-full flex flex-col">
                  {/* Mini app preview */}
                  <div className="relative h-36 sm:h-40 overflow-hidden border-b border-slate-100">
                    {feature.preview}
                    {/* Icon badge overlay */}
                    <div className={`absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-slate-900 text-base mb-2 group-hover:text-welsh-green transition-colors">{feature.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">{feature.description}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Mockups */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">See It in Action</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                A glimpse inside CareCall AI — from the coordinator&apos;s control room to the carer&apos;s mobile interface.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="space-y-16">
            {/* Dashboard Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Dashboard — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-900">Good morning, Sarah</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Online</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                        <p className="text-lg font-bold text-welsh-green">12</p>
                        <p className="text-[9px] text-slate-500">On Shift</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                        <p className="text-lg font-bold text-blue-600">47</p>
                        <p className="text-[9px] text-slate-500">Calls Today</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                        <p className="text-lg font-bold text-amber-500">2</p>
                        <p className="text-[9px] text-slate-500">Incidents</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                        <p className="text-lg font-bold text-rose-500">3</p>
                        <p className="text-[9px] text-slate-500">Training Due</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Today&apos;s Calls</p>
                      {[
                        { name: 'Mrs. Williams', time: '08:00', status: 'Completed', color: 'bg-green-100 text-green-700' },
                        { name: 'Mr. Hughes', time: '09:30', status: 'In Progress', color: 'bg-blue-100 text-blue-700' },
                        { name: 'Mrs. Evans', time: '11:00', status: 'Upcoming', color: 'bg-slate-100 text-slate-600' },
                        { name: 'Mr. Jones', time: '13:00', status: 'Upcoming', color: 'bg-slate-100 text-slate-600' },
                      ].map((call) => (
                        <div key={call.name} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">{call.name.split(' ').pop()[0]}</div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-800">{call.name}</p>
                              <p className="text-[8px] text-slate-400">{call.time}</p>
                            </div>
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${call.color}`}>{call.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Staff Dashboard</h3>
                  <p className="text-slate-600 leading-relaxed">At-a-glance view of today&apos;s shifts, client calls, open incidents, and pending tasks. Staff see exactly what they need to do and when. Quick-access stats keep everyone informed and ready.</p>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Control Room Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">GPS Control Room</h3>
                  <p className="text-slate-600 leading-relaxed">Live map showing all active staff and service user locations. Coordinators can see shift status, send messages, and manage operations in real-time with location updates every 15 seconds.</p>
                </div>
                <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Control Room — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg overflow-hidden">
                    {/* Map mockup */}
                    <div className="relative bg-gradient-to-br from-green-100 via-green-50 to-blue-50 h-52">
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-8 left-12 w-24 h-[1px] bg-slate-400" />
                        <div className="absolute top-16 left-4 w-32 h-[1px] bg-slate-400" />
                        <div className="absolute top-24 left-16 w-20 h-[1px] bg-slate-300" />
                        <div className="absolute top-8 left-24 w-[1px] h-20 bg-slate-400" />
                        <div className="absolute top-4 left-36 w-[1px] h-28 bg-slate-300" />
                      </div>
                      {/* Staff markers */}
                      <div className="absolute top-10 left-16 w-6 h-6 rounded-full bg-welsh-green border-2 border-white shadow-md flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">SJ</span>
                      </div>
                      <div className="absolute top-20 left-40 w-6 h-6 rounded-full bg-welsh-green border-2 border-white shadow-md flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">KL</span>
                      </div>
                      <div className="absolute top-32 left-24 w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">RW</span>
                      </div>
                      <div className="absolute top-14 right-16 w-6 h-6 rounded-full bg-welsh-green border-2 border-white shadow-md flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">AM</span>
                      </div>
                      <div className="absolute top-36 right-24 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">DT</span>
                      </div>
                      {/* Service user markers */}
                      <div className="absolute top-12 left-32 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-sm" />
                      <div className="absolute top-28 left-44 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-sm" />
                      <div className="absolute top-40 right-32 w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-sm" />
                      {/* Legend */}
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-1 flex items-center gap-3">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-welsh-green" /><span className="text-[7px] text-slate-600">Active</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[7px] text-slate-600">En Route</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[7px] text-slate-600">Service User</span></div>
                      </div>
                    </div>
                    {/* Staff list */}
                    <div className="p-3">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Active Staff (5)</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['Sarah J. — On Call', 'Katie L. — Visit', 'Rob W. — Travelling', 'Amy M. — Visit', 'Dan T. — Break'].map((s) => (
                          <div key={s} className="flex items-center gap-1.5 bg-white rounded px-2 py-1 border border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-welsh-green flex-shrink-0" />
                            <span className="text-[8px] text-slate-700 truncate">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Rota Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Rota — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-900">February 2026</p>
                      <div className="flex gap-1">
                        {['Month', 'Week', 'Day'].map((v) => (
                          <span key={v} className={`text-[8px] px-2 py-0.5 rounded ${v === 'Week' ? 'bg-welsh-red text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{v}</span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-[2px] mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <div key={d} className="text-center text-[8px] font-medium text-slate-500 py-1">{d}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {['Sarah Jones', 'Katie Lewis', 'Rob Williams', 'Amy Morgan'].map((name) => (
                        <div key={name} className="grid grid-cols-8 gap-[2px] items-center">
                          <span className="text-[8px] font-medium text-slate-700 truncate col-span-1">{name.split(' ')[0]}</span>
                          {[...Array(7)].map((_, j) => {
                            const shifts = ['bg-green-200 text-green-800', 'bg-blue-200 text-blue-800', 'bg-amber-200 text-amber-800', '', 'bg-green-200 text-green-800', 'bg-purple-200 text-purple-800', ''];
                            const labels = ['Early', 'Late', 'Long', '', 'Early', 'Night', ''];
                            return (
                              <div key={j} className={`rounded text-center py-1 text-[7px] font-medium ${shifts[j] || 'bg-slate-100 text-slate-400'}`}>
                                {labels[j] || '-'}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Rota Management</h3>
                  <p className="text-slate-600 leading-relaxed">Month, week, and day views for building and managing staff schedules. Create recurring patterns, assign areas, and allocate shifts. Staff see their schedules instantly on mobile with real-time updates.</p>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Care Logs Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Care Logs</h3>
                  <p className="text-slate-600 leading-relaxed">Detailed care visit records capturing mood, nutrition, personal care, and carer notes. Searchable and filterable for easy access during audits. Every visit creates a comprehensive care record.</p>
                </div>
                <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Care Logs — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Recent Care Logs</p>
                      <span className="text-[8px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">Filter</span>
                    </div>
                    {[
                      { user: 'Mrs. Williams', carer: 'Sarah J.', mood: '😊', food: 'Good', fluid: 'Good', time: '08:45' },
                      { user: 'Mr. Hughes', carer: 'Katie L.', mood: '😐', food: 'Fair', fluid: 'Good', time: '10:15' },
                      { user: 'Mrs. Evans', carer: 'Rob W.', mood: '😊', food: 'Good', fluid: 'Fair', time: '11:30' },
                    ].map((log) => (
                      <div key={log.user} className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-semibold text-slate-900">{log.user}</p>
                          <span className="text-[8px] text-slate-400">{log.time}</span>
                        </div>
                        <p className="text-[8px] text-slate-500 mb-1.5">Carer: {log.carer}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1"><span className="text-sm">{log.mood}</span><span className="text-[8px] text-slate-500">Mood</span></div>
                          <div className="flex items-center gap-1"><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${log.food === 'Good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{log.food}</span><span className="text-[8px] text-slate-500">Food</span></div>
                          <div className="flex items-center gap-1"><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${log.fluid === 'Good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{log.fluid}</span><span className="text-[8px] text-slate-500">Fluid</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Reports Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Reports — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-900">Analytics Overview</p>
                      <div className="flex gap-1">
                        {['7 Days', '30 Days', '90 Days'].map((v) => (
                          <span key={v} className={`text-[8px] px-2 py-0.5 rounded ${v === '30 Days' ? 'bg-welsh-red text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{v}</span>
                        ))}
                      </div>
                    </div>
                    {/* Chart mockup */}
                    <div className="bg-white rounded-lg p-3 border border-slate-200 mb-2">
                      <p className="text-[9px] font-medium text-slate-600 mb-2">Shifts Completed</p>
                      <div className="flex items-end gap-1.5 h-20">
                        {[65, 72, 58, 80, 75, 90, 85, 70, 78, 92, 88, 76].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, #166534, #16A34A)` }} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[7px] text-slate-400">Week 1</span>
                        <span className="text-[7px] text-slate-400">Week 4</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                        <p className="text-sm font-bold text-welsh-green">847</p>
                        <p className="text-[8px] text-slate-500">Total Shifts</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                        <p className="text-sm font-bold text-blue-600">98.2%</p>
                        <p className="text-[8px] text-slate-500">Attendance</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                        <p className="text-sm font-bold text-amber-500">12</p>
                        <p className="text-[8px] text-slate-500">Incidents</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Analytics & Reports</h3>
                  <p className="text-slate-600 leading-relaxed">Multi-metric dashboards with interactive charts covering every aspect of your care operations — from shift coverage and incident trends to training completion and payroll summaries. Export data for stakeholders and CIW.</p>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Mobile Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Mobile Experience</h3>
                  <p className="text-slate-600 leading-relaxed">Clean, intuitive mobile interface for carers in the field. Clock in with GPS, log care notes, report incidents, and check schedules — all from their phone. Works offline and syncs when back online.</p>
                </div>
                <div className="order-1 lg:order-2 flex justify-center">
                  <div className="w-56 bg-slate-900 rounded-[2rem] p-3 shadow-2xl border border-slate-700">
                    {/* Phone notch */}
                    <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
                    <div className="bg-white rounded-2xl overflow-hidden">
                      {/* Status bar */}
                      <div className="bg-welsh-green px-3 py-2 flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-white">CareCall AI</span>
                        <span className="text-[8px] text-white/80">09:42</span>
                      </div>
                      {/* Content */}
                      <div className="p-3 space-y-2">
                        <p className="text-[10px] font-bold text-slate-900">Hi Sarah</p>
                        <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                          <p className="text-[9px] font-semibold text-green-800">Current Visit</p>
                          <p className="text-[10px] font-bold text-slate-900 mt-0.5">Mrs. Williams</p>
                          <p className="text-[8px] text-slate-500">12 High Street, Denbigh</p>
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-[7px] px-1.5 py-0.5 rounded bg-green-200 text-green-800 font-medium">Clocked In 08:02</span>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <p className="text-[9px] font-semibold text-slate-700">Quick Actions</p>
                          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                            {['Log Care', 'Clock Out', 'Incident', 'Messages'].map((a) => (
                              <div key={a} className="bg-white rounded-lg py-2 text-center border border-slate-100">
                                <p className="text-[8px] font-medium text-slate-700">{a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <p className="text-[9px] font-semibold text-slate-700">Next Visit</p>
                          <div className="flex items-center justify-between mt-1">
                            <div>
                              <p className="text-[9px] font-medium text-slate-900">Mr. Hughes</p>
                              <p className="text-[7px] text-slate-500">09:30 — Oak Lane</p>
                            </div>
                            <span className="text-[7px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">30 min</span>
                          </div>
                        </div>
                      </div>
                      {/* Bottom nav */}
                      <div className="flex items-center justify-around py-2 border-t border-slate-100">
                        {['Home', 'Rota', 'Chat', 'Profile'].map((t) => (
                          <span key={t} className={`text-[8px] font-medium ${t === 'Home' ? 'text-welsh-green' : 'text-slate-400'}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Training Academy Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Training Academy — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Training Academy</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] px-2 py-0.5 rounded bg-welsh-green text-white">+ AI Course Builder</span>
                        <span className="text-[8px] px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">Assign</span>
                      </div>
                    </div>
                    {/* Course cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: 'Manual Handling', modules: 6, duration: '2h 30m', color: 'bg-blue-500', progress: 85 },
                        { title: 'Safeguarding Adults', modules: 8, duration: '3h 15m', color: 'bg-rose-500', progress: 62 },
                        { title: 'Medication Admin', modules: 5, duration: '1h 45m', color: 'bg-amber-500', progress: 100 },
                        { title: 'Infection Control', modules: 4, duration: '1h 20m', color: 'bg-green-500', progress: 40 },
                      ].map((course) => (
                        <div key={course.title} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <div className={`${course.color} h-1.5`} />
                          <div className="p-2.5">
                            <p className="text-[10px] font-semibold text-slate-900 mb-1">{course.title}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[8px] text-slate-500">{course.modules} modules</span>
                              <span className="text-[8px] text-slate-400">•</span>
                              <span className="text-[8px] text-slate-500">{course.duration}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className={`${course.color} h-1.5 rounded-full`} style={{ width: `${course.progress}%` }} />
                            </div>
                            <p className="text-[8px] text-slate-500 mt-1">{course.progress}% complete</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Staff training overview */}
                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Team Compliance</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-sm font-bold text-welsh-green">18</p>
                          <p className="text-[8px] text-slate-500">Up to Date</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-amber-500">4</p>
                          <p className="text-[8px] text-slate-500">Due Soon</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-rose-500">2</p>
                          <p className="text-[8px] text-slate-500">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Training Academy & AI Course Builder</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">A complete learning management system built into CareCall AI. Create, assign, and track mandatory and optional training across your entire team. Monitor completion rates, flag overdue certificates, and ensure your workforce is always compliant.</p>
                  <ul className="space-y-2">
                    {['AI-powered course creation in minutes', 'Module-based learning with quizzes', 'Certificate tracking and expiry alerts', 'Assign courses to individuals or teams', 'Completion analytics and compliance reports'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Clock In/Out & Care Visit Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Clock In/Out & Visit Logging</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Carers clock in when they arrive at a service user&apos;s home and clock out when they leave. GPS location is captured automatically to verify attendance. During the visit, they log mood, food &amp; fluid intake, personal care tasks, and detailed notes — building a comprehensive care record with every call.</p>
                  <ul className="space-y-2">
                    {['GPS-verified clock in and clock out', 'Automatic visit duration tracking', 'Mood assessment with emoji scale', 'Food, fluid & personal care logging', 'Free-text notes for detailed observations', 'Photo attachments for wound care etc.'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2 flex justify-center">
                  {/* Phone mockup for clock in/out flow */}
                  <div className="w-56 bg-slate-900 rounded-[2rem] p-3 shadow-2xl border border-slate-700">
                    <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
                    <div className="bg-white rounded-2xl overflow-hidden">
                      <div className="bg-welsh-green px-3 py-2 flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-white">Care Visit</span>
                        <span className="text-[8px] text-white/80">10:22</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="bg-green-50 rounded-lg p-2.5 border border-green-200">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold text-green-800">Clocked In</p>
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-200 text-green-800 font-medium">10:02 AM</span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-900">Mrs. Williams</p>
                          <p className="text-[8px] text-slate-500">12 High Street, Denbigh</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[7px] text-green-700">GPS Verified</span>
                          </div>
                        </div>
                        {/* Care logging form */}
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                          <p className="text-[9px] font-semibold text-slate-700 mb-2">Log Care</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[8px] text-slate-500 mb-1">Mood</p>
                              <div className="flex gap-1.5">
                                {['😊', '🙂', '😐', '😔', '😢'].map((e, i) => (
                                  <span key={e} className={`text-base cursor-pointer ${i === 0 ? 'scale-125' : 'opacity-40'}`}>{e}</span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <p className="text-[8px] text-slate-500 mb-0.5">Food Intake</p>
                                <div className="bg-white rounded px-2 py-1 border border-slate-200 text-[8px] text-green-700 font-medium">Good</div>
                              </div>
                              <div>
                                <p className="text-[8px] text-slate-500 mb-0.5">Fluid Intake</p>
                                <div className="bg-white rounded px-2 py-1 border border-slate-200 text-[8px] text-green-700 font-medium">Good</div>
                              </div>
                            </div>
                            <div>
                              <p className="text-[8px] text-slate-500 mb-0.5">Personal Care</p>
                              <div className="flex flex-wrap gap-1">
                                {['Wash', 'Dress', 'Meds', 'Meals'].map((t) => (
                                  <span key={t} className="text-[7px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[8px] text-slate-500 mb-0.5">Notes</p>
                              <div className="bg-white rounded px-2 py-1.5 border border-slate-200 text-[8px] text-slate-600 italic">Good spirits today, ate well...</div>
                            </div>
                          </div>
                        </div>
                        <button className="w-full bg-rose-500 text-white text-[9px] font-semibold rounded-lg py-2">
                          Clock Out & Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Client Management Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Service Users — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Service Users</p>
                      <span className="text-[8px] px-2.5 py-1 rounded-lg bg-welsh-green text-white font-medium">+ Add Client</span>
                    </div>
                    {/* Client cards */}
                    {[
                      { name: 'Mrs. Gwen Williams', age: 82, address: '12 High Street, Denbigh', visits: 'Daily — AM & PM', conditions: ['Dementia', 'Diabetes'], status: 'Active' },
                      { name: 'Mr. Idris Hughes', age: 74, address: '5 Oak Lane, Ruthin', visits: 'Daily — AM', conditions: ['Mobility', 'Heart'], status: 'Active' },
                      { name: 'Mrs. Megan Evans', age: 88, address: '23 Castle Road, Conwy', visits: 'Mon/Wed/Fri', conditions: ['Arthritis'], status: 'Active' },
                    ].map((client) => (
                      <div key={client.name} className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {client.name.split(' ').pop()[0]}{client.name.split(' ')[1][0]}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-900">{client.name}</p>
                              <p className="text-[8px] text-slate-400">Age {client.age}</p>
                            </div>
                          </div>
                          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{client.status}</span>
                        </div>
                        <p className="text-[8px] text-slate-500 mb-1.5">{client.address}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {client.conditions.map((c) => (
                              <span key={c} className="text-[7px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{c}</span>
                            ))}
                          </div>
                          <span className="text-[8px] text-slate-400">{client.visits}</span>
                        </div>
                      </div>
                    ))}
                    {/* Summary bar */}
                    <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-2">
                      <span className="text-[9px] text-slate-500">Showing 3 of 28 service users</span>
                      <div className="flex gap-1">
                        <span className="text-[8px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">← Prev</span>
                        <span className="text-[8px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">Next →</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Client / Service User Management</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Add, edit, and manage all your service users in one place. Store personal details, medical conditions, care plans, emergency contacts, GP information, and visit schedules. Every client has a complete profile that carers can access on their phone before each visit.</p>
                  <ul className="space-y-2">
                    {['Full client profiles with medical history', 'Care plan documentation and review dates', 'Emergency contact details and GP info', 'Visit schedule and preferred carer assignment', 'Condition and allergy alerts for carers', 'Link to all care logs, incidents, and notes'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Sick & Leave Management Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Sick & Leave Management</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Staff submit leave requests directly through the app — annual leave, sick leave, compassionate leave, or training days. Managers receive instant notifications and can approve or reject requests with a single tap. The system automatically tracks Bradford Factor scores and absence patterns to help identify concerns early.</p>
                  <ul className="space-y-2">
                    {['Annual, sick, compassionate & training leave types', 'One-tap approval or rejection for managers', 'Bradford Factor scoring for absence monitoring', 'Automatic rota conflict detection', 'Leave balance tracking per staff member', 'Absence pattern reports for HR oversight'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Leave Management — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Leave Requests</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">3 Pending</span>
                      </div>
                    </div>
                    {/* Leave request cards */}
                    {[
                      { name: 'Katie Lewis', type: 'Annual Leave', dates: '24–28 Feb', days: 5, status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
                      { name: 'Rob Williams', type: 'Sick Leave', dates: '17 Feb', days: 1, status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
                      { name: 'Amy Morgan', type: 'Training Day', dates: '20 Feb', days: 1, status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
                    ].map((req) => (
                      <div key={req.name} className="bg-white rounded-lg border border-slate-200 p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                              {req.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-900">{req.name}</p>
                              <p className="text-[8px] text-slate-400">{req.type}</p>
                            </div>
                          </div>
                          <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${req.statusColor}`}>{req.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-500">{req.dates} ({req.days} day{req.days > 1 ? 's' : ''})</span>
                          <div className="flex gap-1">
                            <span className="text-[7px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium cursor-pointer">Approve</span>
                            <span className="text-[7px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium cursor-pointer">Reject</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Recent decisions */}
                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <p className="text-[10px] font-semibold text-slate-700 mb-1.5">Recent Decisions</p>
                      {[
                        { name: 'Sarah Jones', type: 'Annual Leave', status: 'Approved', color: 'text-green-600' },
                        { name: 'Dan Thomas', type: 'Sick Leave', status: 'Recorded', color: 'text-blue-600' },
                      ].map((d) => (
                        <div key={d.name} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[8px] text-slate-600">{d.name} — {d.type}</span>
                          <span className={`text-[8px] font-medium ${d.color}`}>{d.status}</span>
                        </div>
                      ))}
                    </div>
                    {/* Bradford Factor */}
                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <p className="text-[10px] font-semibold text-slate-700 mb-1.5">Bradford Factor Scores</p>
                      <div className="space-y-1">
                        {[
                          { name: 'Sarah J.', score: 12, level: 'Low', color: 'bg-green-200 text-green-800', bar: 'bg-green-400', width: '12%' },
                          { name: 'Rob W.', score: 48, level: 'Medium', color: 'bg-amber-200 text-amber-800', bar: 'bg-amber-400', width: '48%' },
                          { name: 'Dan T.', score: 96, level: 'High', color: 'bg-red-200 text-red-800', bar: 'bg-red-400', width: '96%' },
                        ].map((s) => (
                          <div key={s.name} className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-600 w-12">{s.name}</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className={`${s.bar} h-1.5 rounded-full`} style={{ width: s.width }} />
                            </div>
                            <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${s.color}`}>{s.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Admin Approval Workflows Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Admin Approvals — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Approval Queue</p>
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">7 Awaiting Action</span>
                    </div>
                    {/* Approval categories */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Leave', count: 3, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { label: 'Expenses', count: 2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { label: 'Incidents', count: 1, color: 'bg-red-50 text-red-700 border-red-200' },
                        { label: 'Training', count: 1, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      ].map((cat) => (
                        <div key={cat.label} className={`rounded-lg p-2 text-center border ${cat.color}`}>
                          <p className="text-sm font-bold">{cat.count}</p>
                          <p className="text-[8px]">{cat.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Approval items */}
                    {[
                      { type: 'Leave Request', who: 'Katie Lewis', detail: 'Annual Leave — 24-28 Feb (5 days)', icon: '📅', urgency: 'Normal', urgencyColor: 'bg-blue-100 text-blue-700' },
                      { type: 'Expense Claim', who: 'Rob Williams', detail: 'Mileage — £47.50 (94 miles)', icon: '💷', urgency: 'Normal', urgencyColor: 'bg-blue-100 text-blue-700' },
                      { type: 'Incident Review', who: 'Sarah Jones', detail: 'Fall — Mrs. Williams (Low severity)', icon: '⚠️', urgency: 'Urgent', urgencyColor: 'bg-red-100 text-red-700' },
                      { type: 'Training Request', who: 'Amy Morgan', detail: 'Advanced Safeguarding — External course', icon: '📚', urgency: 'Normal', urgencyColor: 'bg-blue-100 text-blue-700' },
                      { type: 'Expense Claim', who: 'Dan Thomas', detail: 'PPE Supplies — £23.80', icon: '💷', urgency: 'Normal', urgencyColor: 'bg-blue-100 text-blue-700' },
                    ].map((item) => (
                      <div key={`${item.type}-${item.who}`} className="bg-white rounded-lg border border-slate-200 p-2.5">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.icon}</span>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-900">{item.type}</p>
                              <p className="text-[8px] text-slate-400">Submitted by {item.who}</p>
                            </div>
                          </div>
                          <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${item.urgencyColor}`}>{item.urgency}</span>
                        </div>
                        <p className="text-[8px] text-slate-600 mb-1.5">{item.detail}</p>
                        <div className="flex gap-1">
                          <span className="text-[7px] px-2.5 py-0.5 rounded bg-green-500 text-white font-medium">Approve</span>
                          <span className="text-[7px] px-2.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">Reject</span>
                          <span className="text-[7px] px-2.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 font-medium">View Details</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Admin Approval Workflows</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">A centralised approval queue where managers handle all pending requests in one place. Leave requests, expense claims, incident reviews, and training requests all flow through a structured approval workflow with full audit trails. Nothing slips through the cracks.</p>
                  <ul className="space-y-2">
                    {['Unified approval queue for all request types', 'One-tap approve or reject with notes', 'Urgency flagging for time-sensitive items', 'Full audit trail — who approved, when, and why', 'Push notifications for new pending approvals', 'Expense claims with receipt attachments and mileage tracking'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Direct Chat & Messaging Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Direct Chat & Team Messaging</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Built-in messaging so your team never needs WhatsApp or personal phones for work communication. One-to-one direct messages, team group chats, and priority announcements — all within CareCall AI. Messages are secure, auditable, and tied to your organisation.</p>
                  <ul className="space-y-2">
                    {['One-to-one direct messaging between staff', 'Team and group chat channels', 'Priority-based announcements (Critical, High, Normal, Low)', 'Read receipts and acknowledgement tracking', 'Push notifications for new messages', 'Secure — no personal phone numbers shared'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2 flex justify-center">
                  {/* Phone mockup for chat */}
                  <div className="w-56 bg-slate-900 rounded-[2rem] p-3 shadow-2xl border border-slate-700">
                    <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
                    <div className="bg-white rounded-2xl overflow-hidden">
                      <div className="bg-indigo-600 px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[7px] font-bold text-white">KL</div>
                          <div>
                            <span className="text-[9px] font-semibold text-white">Katie Lewis</span>
                            <p className="text-[7px] text-white/60">Online</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 space-y-2 bg-slate-50 h-56 overflow-hidden">
                        {/* Incoming message */}
                        <div className="flex gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[6px] font-bold text-slate-600 flex-shrink-0 mt-0.5">KL</div>
                          <div>
                            <div className="bg-white rounded-lg rounded-tl-none px-2.5 py-1.5 border border-slate-200 max-w-[160px]">
                              <p className="text-[8px] text-slate-800">Hi Sarah, just wanted to check — is Mrs. Williams&apos; medication still the same?</p>
                            </div>
                            <p className="text-[6px] text-slate-400 mt-0.5 ml-1">09:14</p>
                          </div>
                        </div>
                        {/* Outgoing message */}
                        <div className="flex justify-end">
                          <div>
                            <div className="bg-indigo-600 rounded-lg rounded-tr-none px-2.5 py-1.5 max-w-[160px]">
                              <p className="text-[8px] text-white">Yes, no changes. Same dosage as last week. Check the care plan for details.</p>
                            </div>
                            <p className="text-[6px] text-slate-400 mt-0.5 text-right mr-1">09:15 ✓✓</p>
                          </div>
                        </div>
                        {/* Incoming */}
                        <div className="flex gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[6px] font-bold text-slate-600 flex-shrink-0 mt-0.5">KL</div>
                          <div>
                            <div className="bg-white rounded-lg rounded-tl-none px-2.5 py-1.5 border border-slate-200 max-w-[160px]">
                              <p className="text-[8px] text-slate-800">Perfect, thanks! Also she seemed a bit low yesterday — I&apos;ll keep an eye today.</p>
                            </div>
                            <p className="text-[6px] text-slate-400 mt-0.5 ml-1">09:16</p>
                          </div>
                        </div>
                        {/* Outgoing */}
                        <div className="flex justify-end">
                          <div>
                            <div className="bg-indigo-600 rounded-lg rounded-tr-none px-2.5 py-1.5 max-w-[160px]">
                              <p className="text-[8px] text-white">Good thinking. Log it in the mood assessment so we can track it. Thanks Katie 👍</p>
                            </div>
                            <p className="text-[6px] text-slate-400 mt-0.5 text-right mr-1">09:17 ✓✓</p>
                          </div>
                        </div>
                      </div>
                      {/* Chat input */}
                      <div className="px-2.5 py-2 border-t border-slate-200 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full px-2.5 py-1.5">
                          <p className="text-[8px] text-slate-400">Type a message...</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Push Notifications & Alerts Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Notifications — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Notifications Centre</p>
                      <span className="text-[8px] px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">Mark All Read</span>
                    </div>
                    {/* Priority announcement */}
                    <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-red-700">CRITICAL ANNOUNCEMENT</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-900 mb-0.5">Icy Roads Warning — Extra Care Required</p>
                      <p className="text-[8px] text-slate-600">All staff: Roads are icy across Denbighshire this morning. Allow extra travel time and take extreme care when walking to clients&apos; doors. Report any concerns immediately.</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[7px] text-slate-400">Posted by Management — 06:45 AM</span>
                        <span className="text-[7px] px-1.5 py-0.5 rounded bg-red-200 text-red-700 font-medium">18/24 read</span>
                      </div>
                    </div>
                    {/* Notification list */}
                    {[
                      { icon: '📋', title: 'New shift assigned', desc: 'You have been assigned to Mr. Hughes — tomorrow 09:30', time: '2m ago', unread: true },
                      { icon: '✅', title: 'Leave approved', desc: 'Your annual leave request (24-28 Feb) has been approved', time: '15m ago', unread: true },
                      { icon: '💬', title: 'New message from Katie L.', desc: 'Re: Mrs. Williams medication query', time: '23m ago', unread: true },
                      { icon: '⚠️', title: 'Incident logged', desc: 'Rob W. reported a near miss at 23 Castle Road', time: '1h ago', unread: false },
                      { icon: '📚', title: 'Training due reminder', desc: 'Manual Handling refresher expires in 7 days', time: '3h ago', unread: false },
                      { icon: '🌤️', title: 'Weather alert', desc: 'Heavy rain forecast 2-6PM — drive safely', time: '5h ago', unread: false },
                    ].map((notif) => (
                      <div key={notif.title} className={`flex items-start gap-2.5 p-2 rounded-lg ${notif.unread ? 'bg-blue-50/50 border border-blue-100' : 'bg-white border border-slate-100'}`}>
                        <span className="text-sm flex-shrink-0 mt-0.5">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[9px] font-semibold ${notif.unread ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                            {notif.unread && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[8px] text-slate-500 truncate">{notif.desc}</p>
                          <p className="text-[7px] text-slate-400">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Push Notifications & Alerts</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Never miss anything important. CareCall AI sends real-time push notifications for new messages, shift assignments, approval decisions, incident reports, training reminders, and priority announcements. Managers can broadcast critical alerts to the whole team with read-receipt tracking.</p>
                  <ul className="space-y-2">
                    {['Real-time push notifications on mobile and desktop', 'Priority-based announcements (Critical, High, Normal, Low)', 'Read receipts and acknowledgement tracking for announcements', 'Shift assignment and rota change alerts', 'Approval decision notifications (leave, expenses, etc.)', 'Training due and overdue reminders', 'Incident alert escalation to managers'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Weather Alerts Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Live Weather Alerts</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Because your carers work outdoors and travel between clients, weather matters. CareCall AI integrates live weather data and Met Office warnings so coordinators and staff are always aware of conditions that could affect service delivery — from icy roads and flooding to heat warnings and storms.</p>
                  <ul className="space-y-2">
                    {['Live weather conditions for your service area', 'Met Office yellow, amber & red warning integration', 'Automatic alerts to staff when warnings are issued', 'Travel safety considerations for coordinators', 'Historical weather data logged against incidents', 'Helps evidence extreme weather in CIW reports'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Weather — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    {/* Current weather */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-white/80">Denbighshire • Now</p>
                          <p className="text-3xl font-bold">4°C</p>
                          <p className="text-[10px] text-white/80">Feels like 1°C</p>
                        </div>
                        <div className="text-center">
                          <span className="text-4xl">🌧️</span>
                          <p className="text-[10px] text-white/80 mt-1">Light Rain</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">💨</span>
                          <span className="text-[9px] text-white/80">18 mph</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">💧</span>
                          <span className="text-[9px] text-white/80">85%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">👁️</span>
                          <span className="text-[9px] text-white/80">4 km</span>
                        </div>
                      </div>
                    </div>
                    {/* Active warnings */}
                    <div className="bg-amber-50 rounded-lg border border-amber-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">!</span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-amber-800">YELLOW WARNING — Ice</p>
                          <p className="text-[8px] text-amber-600">Met Office • Valid until 10:00 AM</p>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-600">Icy patches likely on untreated roads and pavements. Extra care needed when walking to and from clients&apos; homes.</p>
                    </div>
                    {/* Hourly forecast */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Hourly Forecast</p>
                      <div className="flex justify-between">
                        {[
                          { time: '10AM', icon: '🌧️', temp: '4°' },
                          { time: '12PM', icon: '🌥️', temp: '6°' },
                          { time: '2PM', icon: '🌧️', temp: '5°' },
                          { time: '4PM', icon: '🌧️', temp: '4°' },
                          { time: '6PM', icon: '🌙', temp: '2°' },
                        ].map((h) => (
                          <div key={h.time} className="text-center">
                            <p className="text-[8px] text-slate-500">{h.time}</p>
                            <span className="text-lg">{h.icon}</span>
                            <p className="text-[9px] font-semibold text-slate-900">{h.temp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Staff impact */}
                    <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                      <p className="text-[10px] font-semibold text-slate-700 mb-1.5">Staff Impact Assessment</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-600">Driving conditions</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Caution</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-600">Walking conditions</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Poor</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-600">Estimated delays</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">10-15 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Fuel & Mileage Tracking Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Fuel & Expenses — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Fuel & Mileage Tracker</p>
                      <span className="text-[8px] px-2.5 py-1 rounded-lg bg-orange-500 text-white font-medium">+ Log Expense</span>
                    </div>
                    {/* Monthly summary */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">February 2026 Summary</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-sm font-bold text-orange-600">£342.80</p>
                          <p className="text-[8px] text-slate-500">Total Fuel</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-600">1,847 mi</p>
                          <p className="text-[8px] text-slate-500">Total Miles</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-600">£831.15</p>
                          <p className="text-[8px] text-slate-500">HMRC Claim</p>
                        </div>
                      </div>
                    </div>
                    {/* Expense entries */}
                    {[
                      { staff: 'Sarah Jones', type: 'Mileage', detail: '47 miles — 6 client visits', amount: '£21.15', date: '18 Feb', status: 'Auto-logged', statusColor: 'bg-green-100 text-green-700' },
                      { staff: 'Katie Lewis', type: 'Fuel Receipt', detail: 'BP Denbigh — Unleaded', amount: '£52.40', date: '17 Feb', status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
                      { staff: 'Rob Williams', type: 'Mileage', detail: '62 miles — 8 client visits', amount: '£27.90', date: '17 Feb', status: 'Approved', statusColor: 'bg-blue-100 text-blue-700' },
                    ].map((exp) => (
                      <div key={`${exp.staff}-${exp.date}`} className="bg-white rounded-lg border border-slate-200 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-[8px]">{exp.type === 'Mileage' ? '🚗' : '⛽'}</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-900">{exp.staff}</p>
                              <p className="text-[8px] text-slate-400">{exp.type} — {exp.date}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-900">{exp.amount}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[8px] text-slate-500">{exp.detail}</p>
                          <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${exp.statusColor}`}>{exp.status}</span>
                        </div>
                      </div>
                    ))}
                    {/* GPS auto-mileage bar */}
                    <div className="bg-orange-50 rounded-lg border border-orange-200 p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <p className="text-[9px] font-semibold text-orange-800">GPS Auto-Mileage Active</p>
                      </div>
                      <p className="text-[8px] text-slate-600 mt-1">Mileage between client visits is calculated automatically from GPS clock-in/out locations. Staff can also log fuel receipts with photo attachments.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Fuel & Mileage Tracking</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Take the pain out of expense claims. CareCall AI automatically tracks mileage between client visits using GPS data, and staff can log fuel purchases with receipt photos directly in the app. Managers get full visibility of travel costs across the team with HMRC-rate reimbursement calculations built in.</p>
                  <ul className="space-y-2">
                    {['Automatic mileage calculation from GPS clock-in/out data', 'Fuel receipt logging with photo uploads', 'HMRC mileage rate calculations (45p/25p per mile)', 'Per-staff and team-wide expense reporting', 'Manager approval workflow for expense claims', 'Monthly and quarterly expense summaries for accounts'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Automatic Payroll & Payslip Generation Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Automatic Payroll & Payslip Generation</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Stop spending hours on spreadsheets. CareCall AI calculates pay automatically from clocked shift hours, applying the correct rates for early, late, night, weekend, and bank holiday shifts. Generate professional payslips for your entire team in seconds — complete with tax, NI, pension, and deduction breakdowns.</p>
                  <ul className="space-y-2">
                    {['Automatic pay calculation from clocked hours', 'Shift-type pay rates (early, late, night, weekend, bank holiday)', 'Overtime and enhancement calculations', 'Tax, National Insurance & pension deductions', 'Professional PDF payslip generation', 'Pay period management (weekly, fortnightly, monthly)', 'Holiday pay accrual and calculation', 'Year-to-date summaries and P60-ready data'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Payroll — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Payroll — February 2026</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] px-2 py-0.5 rounded bg-cyan-500 text-white font-medium">Generate Payslips</span>
                      </div>
                    </div>
                    {/* Pay period summary */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Pay Period: 1–28 Feb 2026</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-sm font-bold text-cyan-600">£18,420</p>
                          <p className="text-[8px] text-slate-500">Gross Pay</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-red-500">£4,105</p>
                          <p className="text-[8px] text-slate-500">Deductions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-600">£14,315</p>
                          <p className="text-[8px] text-slate-500">Net Pay</p>
                        </div>
                      </div>
                    </div>
                    {/* Staff payslip rows */}
                    {[
                      { name: 'Sarah Jones', hours: '152h', gross: '£1,824.00', net: '£1,456.20', status: 'Ready' },
                      { name: 'Katie Lewis', hours: '144h', gross: '£1,728.00', net: '£1,382.40', status: 'Ready' },
                      { name: 'Rob Williams', hours: '160h', gross: '£1,920.00', net: '£1,536.00', status: 'Ready' },
                      { name: 'Amy Morgan', hours: '136h', gross: '£1,632.00', net: '£1,305.60', status: 'Ready' },
                    ].map((staff) => (
                      <div key={staff.name} className="bg-white rounded-lg border border-slate-200 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-[8px] font-bold text-cyan-700">
                              {staff.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <p className="text-[10px] font-semibold text-slate-900">{staff.name}</p>
                          </div>
                          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{staff.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <span className="text-[8px] text-slate-500">{staff.hours} worked</span>
                            <span className="text-[8px] text-slate-500">Gross: {staff.gross}</span>
                          </div>
                          <span className="text-[10px] font-bold text-green-600">{staff.net}</span>
                        </div>
                      </div>
                    ))}
                    {/* Payslip preview */}
                    <div className="bg-cyan-50 rounded-lg border border-cyan-200 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[9px] font-semibold text-cyan-800">Payslip Preview — Sarah Jones</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[8px]">
                        <span className="text-slate-500">Basic Pay (152h × £12/h)</span><span className="text-right text-slate-800 font-medium">£1,824.00</span>
                        <span className="text-slate-500">Night Enhancement</span><span className="text-right text-slate-800 font-medium">£48.00</span>
                        <span className="text-slate-500">Weekend Enhancement</span><span className="text-right text-slate-800 font-medium">£72.00</span>
                        <span className="text-slate-500 font-semibold">Gross Pay</span><span className="text-right text-slate-900 font-bold">£1,944.00</span>
                        <span className="text-slate-500">Income Tax</span><span className="text-right text-red-600">−£218.80</span>
                        <span className="text-slate-500">National Insurance</span><span className="text-right text-red-600">−£156.40</span>
                        <span className="text-slate-500">Pension (5%)</span><span className="text-right text-red-600">−£97.20</span>
                        <span className="text-slate-500 font-semibold">Net Pay</span><span className="text-right text-green-600 font-bold">£1,471.60</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Admin Panel — Tile Navigation Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Modern Tile Navigation</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Forget cluttered menus. CareCall AI organises every feature into clean, colour-coded icon tiles — grouped by function so admins, managers, and carers find what they need instantly, on any device.</p>
                  <ul className="space-y-2">
                    {['Colour-coded tiles grouped by function', 'One-tap access to every feature', 'Mobile-first responsive design', 'Role-based visibility (admin, manager, carer)', 'Intuitive icons — no training needed', 'Consistent design across all pages'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2 bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Admin Panel — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <p className="text-xs font-bold text-slate-900">Admin Panel</p>
                    </div>
                    {/* Core section */}
                    <p className="text-[9px] font-bold text-slate-600">Core</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Organisation', gradient: 'from-teal-400 to-teal-600', icon: '🏢' },
                        { label: 'Control Room', gradient: 'from-slate-500 to-slate-700', icon: '🛡' },
                        { label: 'AI Assistant', gradient: 'from-purple-400 to-purple-600', icon: '🤖' },
                      ].map((t) => (
                        <div key={t.label} className="flex flex-col items-center bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-1 shadow-sm`}>
                            <span className="text-[11px]">{t.icon}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-slate-700 text-center leading-tight">{t.label}</span>
                        </div>
                      ))}
                    </div>
                    {/* People & Clinical */}
                    <p className="text-[9px] font-bold text-slate-600">People & Clinical</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Clients', gradient: 'from-teal-400 to-teal-600', icon: '💚' },
                        { label: 'Staff', gradient: 'from-blue-400 to-blue-600', icon: '👥' },
                        { label: 'Clinical', gradient: 'from-rose-400 to-rose-600', icon: '🩺' },
                      ].map((t) => (
                        <div key={t.label} className="flex flex-col items-center bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-1 shadow-sm`}>
                            <span className="text-[11px]">{t.icon}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-slate-700 text-center leading-tight">{t.label}</span>
                        </div>
                      ))}
                    </div>
                    {/* HR & Finance */}
                    <p className="text-[9px] font-bold text-slate-600">HR & Finance</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Approvals', gradient: 'from-indigo-400 to-indigo-600', icon: '✅' },
                        { label: 'Invoicing', gradient: 'from-teal-400 to-teal-600', icon: '🧾' },
                        { label: 'Compliance', gradient: 'from-red-400 to-red-600', icon: '🛡' },
                      ].map((t) => (
                        <div key={t.label} className="flex flex-col items-center bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-1 shadow-sm`}>
                            <span className="text-[11px]">{t.icon}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-slate-700 text-center leading-tight">{t.label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Scheduling */}
                    <p className="text-[9px] font-bold text-slate-600">Scheduling & Training</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Rota', gradient: 'from-orange-400 to-orange-600', icon: '📅' },
                        { label: 'Training', gradient: 'from-cyan-400 to-cyan-600', icon: '🎓' },
                        { label: 'Documents', gradient: 'from-indigo-400 to-indigo-600', icon: '📂' },
                      ].map((t) => (
                        <div key={t.label} className="flex flex-col items-center bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-1 shadow-sm`}>
                            <span className="text-[11px]">{t.icon}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-slate-700 text-center leading-tight">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Profile & Quick Access Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">My Profile — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    {/* Profile header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">SJ</div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-900">Sarah Jones</p>
                        <p className="text-[9px] text-slate-500">Senior Carer — Denbigh</p>
                        <div className="flex gap-1 mt-0.5">
                          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">On Shift</span>
                          <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">DBS Valid</span>
                        </div>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <p className="text-sm font-bold text-blue-600">147</p>
                        <p className="text-[8px] text-slate-500">Visits</p>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <p className="text-sm font-bold text-green-600">98%</p>
                        <p className="text-[8px] text-slate-500">On Time</p>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                        <p className="text-sm font-bold text-purple-600">12</p>
                        <p className="text-[8px] text-slate-500">Courses</p>
                      </div>
                    </div>
                    {/* Quick access tiles */}
                    <p className="text-[9px] font-bold text-slate-600">Quick Access</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'My Details', gradient: 'from-blue-400 to-blue-600', icon: '👤' },
                        { label: 'My Files', gradient: 'from-teal-400 to-teal-600', icon: '📤' },
                        { label: 'Training', gradient: 'from-purple-400 to-purple-600', icon: '🏆' },
                        { label: 'Activity', gradient: 'from-amber-400 to-amber-600', icon: '🕐' },
                      ].map((t) => (
                        <div key={t.label} className="flex flex-col items-center bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-1.5 shadow-sm`}>
                            <span className="text-[12px]">{t.icon}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-slate-700 text-center">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Staff Profiles & Quick Access</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Every staff member has a rich profile with one-tap access to their details, documents, training records, and activity history. Clean tile navigation means carers spend less time navigating and more time caring.</p>
                  <ul className="space-y-2">
                    {['Photo, role, area, and status at a glance', 'Visit stats — total visits, punctuality, and courses', 'Quick-access tiles for files, training, and activity', 'DBS, supervision, and compliance tracking', 'Works beautifully on mobile devices', 'Same tile design across Profile, Assets, and Admin'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Automatic Invoicing System Mockup */}
            <AnimateOnScroll animation="fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-slate-500 ml-2">Invoicing — CareCall AI</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-900">Invoices — February 2026</p>
                      <div className="flex gap-1">
                        <span className="text-[8px] px-2 py-0.5 rounded bg-violet-500 text-white font-medium">+ Generate Invoice</span>
                        <span className="text-[8px] px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">Export</span>
                      </div>
                    </div>
                    {/* Invoice summary */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-[10px] font-semibold text-slate-700 mb-2">Monthly Overview</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <p className="text-sm font-bold text-violet-600">12</p>
                          <p className="text-[8px] text-slate-500">Invoices</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-600">£28,450</p>
                          <p className="text-[8px] text-slate-500">Invoiced</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-600">£19,200</p>
                          <p className="text-[8px] text-slate-500">Paid</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-amber-600">£9,250</p>
                          <p className="text-[8px] text-slate-500">Outstanding</p>
                        </div>
                      </div>
                    </div>
                    {/* Invoice rows */}
                    {[
                      { ref: 'INV-2026-0047', client: 'Denbighshire County Council', amount: '£8,420.00', date: '01 Feb', due: '28 Feb', status: 'Paid', statusColor: 'bg-green-100 text-green-700' },
                      { ref: 'INV-2026-0048', client: 'Conwy Borough Council', amount: '£6,180.00', date: '01 Feb', due: '28 Feb', status: 'Sent', statusColor: 'bg-blue-100 text-blue-700' },
                      { ref: 'INV-2026-0049', client: 'Mrs. G. Williams (Private)', amount: '£1,240.00', date: '05 Feb', due: '05 Mar', status: 'Sent', statusColor: 'bg-blue-100 text-blue-700' },
                      { ref: 'INV-2026-0050', client: 'Flintshire County Council', amount: '£4,860.00', date: '14 Feb', due: '14 Mar', status: 'Draft', statusColor: 'bg-slate-100 text-slate-600' },
                    ].map((inv) => (
                      <div key={inv.ref} className="bg-white rounded-lg border border-slate-200 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-900">{inv.client}</p>
                            <p className="text-[8px] text-slate-400">{inv.ref} — Issued {inv.date}</p>
                          </div>
                          <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${inv.statusColor}`}>{inv.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-500">Due: {inv.due}</span>
                          <span className="text-[10px] font-bold text-slate-900">{inv.amount}</span>
                        </div>
                      </div>
                    ))}
                    {/* Auto-generate info */}
                    <div className="bg-violet-50 rounded-lg border border-violet-200 p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <p className="text-[9px] font-semibold text-violet-800">Auto-Generation Active</p>
                      </div>
                      <p className="text-[8px] text-slate-600 mt-1">Invoices are generated automatically from completed visit data and service agreements. Itemised by service user, visit dates, hours delivered, and agreed hourly rates.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Automatic Invoicing System</h3>
                  <p className="text-slate-600 leading-relaxed mb-4">Let CareCall AI handle your billing. Invoices are generated automatically from completed visits, matched against service agreements and hourly rates. Whether you&apos;re billing local authorities, the NHS, or private clients — every invoice is accurate, professional, and audit-ready.</p>
                  <ul className="space-y-2">
                    {['Auto-generate invoices from completed visit data', 'Itemised by service user, dates, and hours delivered', 'Multiple billing clients (councils, NHS, private)', 'Professional PDF invoices with your branding', 'Payment tracking and ageing reports', 'Automatic invoice scheduling (weekly, monthly)', 'Credit notes and adjustments', 'Export to accounting software (CSV, PDF)'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Built for Domiciliary Care */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fade-up">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-red/20 text-welsh-red text-sm font-medium mb-6">
                  Purpose-Built
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Built Specifically for Domiciliary Care
                </h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  CareCall AI isn&apos;t a generic business tool adapted for care. It was designed from scratch for the unique challenges of domiciliary care delivery — where your team is spread across the community, visiting people in their homes, and needs tools that work in the real world.
                </p>
                <ul className="space-y-4">
                  {[
                    { title: 'Community-Based Operations', desc: 'GPS tracking and location-aware features built for teams that work across a wide geographic area, not in a single building.' },
                    { title: 'Visit-Centric Workflows', desc: 'Clock in/out at each visit with automatic care documentation. Every interaction is captured in the context of the visit.' },
                    { title: 'Person-Centred Care Records', desc: 'Mood tracking, food/fluid intake, personal care tasks — the holistic care data that matters for domiciliary care.' },
                    { title: 'Emergency Response Ready', desc: 'Incident reporting with severity levels, safeguarding protocols, and notification workflows for when things don\u2019t go to plan.' },
                    { title: 'Lone Worker Safety', desc: 'Real-time GPS visibility means coordinators always know where their carers are, supporting lone worker safety policies.' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-welsh-green flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: '24/7', label: 'Operations Support' },
                  { number: '15s', label: 'GPS Update Interval' },
                  { number: '50+', label: 'Integrated Features' },
                  { number: '100%', label: 'Welsh CIW Focused' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-welsh-green to-emerald-400 bg-clip-text text-transparent">{stat.number}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* CIW Compliance */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-green/10 text-welsh-green text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Welsh Compliance
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">CIW Compliance, Built In</h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Care Inspectorate Wales expects care providers to maintain comprehensive records, report incidents promptly, ensure staff are trained, and demonstrate person-centred care. CareCall AI makes this effortless.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ciwFeatures.map((feature, i) => (
              <AnimateOnScroll key={feature.title} animation="fade-up" delay={i * 80}>
                <div className="bg-green-50/50 rounded-2xl border border-green-200/50 p-6 h-full">
                  <div className="w-10 h-10 rounded-lg bg-welsh-green/10 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-welsh-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Who Is CareCall AI For?</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Whether you&apos;re a growing agency or an established provider, CareCall AI scales with your needs.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Domiciliary Care Agencies', desc: 'The core use case — manage staff, visits, and compliance across your community care operations.', icon: '🏠' },
              { title: 'Care Coordinators', desc: 'The GPS control room and rota tools give you real-time visibility and complete operational control.', icon: '📡' },
              { title: 'Care Managers', desc: 'Analytics, reports, approval workflows, and compliance tracking — everything you need to manage effectively.', icon: '📊' },
              { title: 'Frontline Carers', desc: 'A simple, intuitive mobile app that makes documentation quick and keeps you connected to your team.', icon: '💚' },
            ].map((role, i) => (
              <AnimateOnScroll key={role.title} animation="fade-up" delay={i * 100}>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow h-full">
                  <span className="text-4xl mb-4 block">{role.icon}</span>
                  <h3 className="font-semibold text-slate-900 mb-2">{role.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{role.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Demo / Trial CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-welsh-green to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">See CareCall AI for Yourself</h2>
            <p className="text-xl text-white/80 mb-4">
              Request a free demo and we&apos;ll set you up with your own dedicated instance.
            </p>
            <p className="text-base text-white/60 mb-10 max-w-2xl mx-auto">
              Explore every feature with sample data — no commitment, no credit card, no pressure. Just a chance to see how CareCall AI can transform your care operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-welsh-green font-semibold rounded-xl hover:bg-slate-100 transition-colors text-base"
              >
                Request a Free Demo
              </Link>
              <a
                href="mailto:enquiries@accredilinkcare.co.uk?subject=CareCall AI Demo Request"
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
              >
                Email Us Directly
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            </div>
          </AnimateOnScroll>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 50}>
                <div className="border border-slate-200 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform How You Deliver Care?
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
              CareCall AI is more than software — it&apos;s a complete operational platform built by people who understand care. Let us show you what it can do for your agency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors text-base"
              >
                Request a Demo Today
              </Link>
              <Link
                href="/apps-that-care"
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
              >
                Back to Apps That Care
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}
