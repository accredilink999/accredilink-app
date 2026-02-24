"use client";

export default function PhoneMockup({ children, className = "", title = "CareCallAI" }) {
  return (
    <div className={`w-[280px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl border border-slate-700 ${className}`}>
      {/* Notch */}
      <div className="w-24 h-5 bg-slate-800 rounded-full mx-auto mb-1" />
      {/* Screen */}
      <div className="bg-white rounded-[1.5rem] overflow-hidden">
        {/* Status bar */}
        <div className="bg-teal-600 px-4 py-2 flex items-center justify-between">
          <span className="text-white text-[10px] font-medium">9:41</span>
          <span className="text-white text-[10px] font-semibold">{title}</span>
          <div className="flex gap-1">
            <div className="w-3 h-2 border border-white rounded-sm">
              <div className="w-1.5 h-full bg-white rounded-sm" />
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="min-h-[400px]">
          {children}
        </div>
        {/* Home indicator */}
        <div className="py-2 flex justify-center">
          <div className="w-28 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PhoneScreenRota() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-900">Today&apos;s Visits</h3>
        <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">4 calls</span>
      </div>
      {[
        { time: "08:00", name: "Margaret Jones", type: "Morning", status: "completed", color: "bg-green-500" },
        { time: "10:30", name: "David Williams", type: "Personal Care", status: "in-progress", color: "bg-amber-500" },
        { time: "13:00", name: "Eleanor Price", type: "Lunch", status: "pending", color: "bg-slate-300" },
        { time: "16:00", name: "Robert Evans", type: "Tea & Meds", status: "pending", color: "bg-slate-300" },
      ].map((visit, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className={`w-2 h-8 rounded-full ${visit.color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-900 truncate">{visit.name}</p>
            <p className="text-[9px] text-slate-500">{visit.time} &middot; {visit.type}</p>
          </div>
          {visit.status === "completed" && (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          )}
          {visit.status === "in-progress" && (
            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
          )}
        </div>
      ))}
      <div className="mt-3 p-2 rounded-lg bg-teal-50 border border-teal-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-teal-800">GPS Check-In Active</p>
            <p className="text-[8px] text-teal-600">Location verified at 10:31</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneScreenMAR() {
  return (
    <div className="p-3 space-y-2">
      <div className="mb-2">
        <h3 className="text-xs font-bold text-slate-900">MAR Chart</h3>
        <p className="text-[9px] text-slate-500">Margaret Jones &middot; February 2026</p>
      </div>
      {[
        { name: "Paracetamol 500mg", time: "Morning", status: "G", initials: "ST", color: "bg-green-500" },
        { name: "Amlodipine 5mg", time: "Morning", status: "G", initials: "ST", color: "bg-green-500" },
        { name: "Metformin 500mg", time: "Lunch", status: "R", initials: "ST", color: "bg-amber-500" },
        { name: "Codeine 30mg", time: "As Needed", status: "—", initials: "", color: "bg-slate-200", badge: "PRN" },
      ].map((med, i) => (
        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-slate-900">{med.name}</p>
            {med.badge && <span className="text-[7px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">{med.badge}</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-400">{med.time}</span>
            <div className="flex items-center gap-1">
              <span className={`w-5 h-5 rounded text-[9px] font-bold text-white flex items-center justify-center ${med.color}`}>
                {med.status}
              </span>
              {med.initials && <span className="text-[8px] text-slate-500">{med.initials}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PhoneScreenCheckIn() {
  return (
    <div className="p-3 space-y-3">
      <div className="text-center mb-2">
        <h3 className="text-xs font-bold text-slate-900">Check In</h3>
        <p className="text-[9px] text-slate-500">David Williams &middot; 10 High Street</p>
      </div>
      {/* Map placeholder */}
      <div className="h-32 bg-gradient-to-b from-teal-100 to-blue-50 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-6 w-20 h-0.5 bg-slate-400 rotate-12" />
          <div className="absolute top-8 left-2 w-32 h-0.5 bg-slate-400 -rotate-6" />
          <div className="absolute top-16 left-10 w-24 h-0.5 bg-slate-400 rotate-3" />
          <div className="absolute top-12 left-20 w-0.5 h-16 bg-slate-400 rotate-12" />
          <div className="absolute top-6 left-12 w-0.5 h-20 bg-slate-400 -rotate-6" />
        </div>
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center shadow-lg z-10 animate-bounce">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <div>
          <p className="text-[10px] font-semibold text-green-800">Location Verified</p>
          <p className="text-[8px] text-green-600">Within 50m of client address</p>
        </div>
      </div>
      <button className="w-full py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl">
        Check In Now — 10:31 AM
      </button>
      <div className="flex gap-2">
        <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <p className="text-[8px] text-slate-400">Distance</p>
          <p className="text-[11px] font-bold text-slate-900">12m</p>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <p className="text-[8px] text-slate-400">Duration</p>
          <p className="text-[11px] font-bold text-slate-900">30 min</p>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <p className="text-[8px] text-slate-400">Mileage</p>
          <p className="text-[11px] font-bold text-slate-900">4.2 mi</p>
        </div>
      </div>
    </div>
  );
}
