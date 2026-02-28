"use client";

export default function BrowserMockup({ children, className = "", title = "Dashboard — CareCallAI" }) {
  return (
    <div className={`bg-slate-900 rounded-2xl p-3 shadow-2xl border border-slate-700 ${className}`}>
      {/* Chrome bar */}
      <div className="flex items-center gap-2 mb-2 px-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-slate-800 rounded-md px-3 py-1 ml-2">
          <span className="text-[10px] text-slate-500">{title}</span>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function DashboardScreen() {
  return (
    <div className="p-4">
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">CC</span>
          </div>
          <span className="text-xs font-bold text-slate-900">CareCall<span className="text-teal-600">AI</span></span>
        </div>
        <div className="flex gap-3">
          {["Rota", "Clients", "Staff", "Reports"].map((tab) => (
            <span key={tab} className={`text-[9px] font-medium ${tab === "Rota" ? "text-teal-600" : "text-slate-400"}`}>{tab}</span>
          ))}
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Active Calls", value: "12", color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Completed", value: "28", color: "text-green-600", bg: "bg-green-50" },
          { label: "Missed", value: "1", color: "text-red-600", bg: "bg-red-50" },
          { label: "Staff Online", value: "8", color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-lg p-2 text-center`}>
            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[7px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
      {/* Rota preview */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between border-b border-slate-200">
          <span className="text-[9px] font-semibold text-slate-700">Week View — North Area</span>
          <div className="flex gap-1">
            <span className="text-[8px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Day</span>
            <span className="text-[8px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-medium">Week</span>
            <span className="text-[8px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Month</span>
          </div>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="text-[7px] text-slate-400 text-center font-medium">{d}</span>
            ))}
          </div>
          {/* Shift rows */}
          {["Sarah T.", "James M.", "Lisa R."].map((name, ri) => (
            <div key={name} className="grid grid-cols-7 gap-1 mb-1">
              {[...Array(7)].map((_, ci) => {
                const colors = ["bg-teal-400", "bg-blue-400", "bg-purple-400", "bg-amber-400"];
                const show = !(ri === 2 && ci > 4);
                return (
                  <div key={ci} className={`h-5 rounded text-[6px] flex items-center justify-center text-white font-medium ${show ? colors[(ri + ci) % colors.length] : "bg-slate-100"}`}>
                    {show ? (ci === 0 ? name.split(" ")[0] : "") : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InvoicingScreen() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-900">Invoicing & Payroll</h3>
        <div className="flex gap-2">
          <span className="text-[8px] bg-teal-600 text-white px-2 py-1 rounded font-medium">Generate Invoice</span>
          <span className="text-[8px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">Export CSV</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Outstanding", value: "£4,280", color: "text-amber-600" },
          { label: "Paid This Month", value: "£12,450", color: "text-green-600" },
          { label: "Staff Payroll", value: "£8,640", color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[7px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
          <span className="text-[9px] font-semibold text-slate-700">Recent Invoices</span>
        </div>
        {[
          { client: "Denbighshire Council", amount: "£3,240.00", status: "Paid", statusColor: "bg-green-100 text-green-700" },
          { client: "Mrs. E. Price (Private)", amount: "£480.00", status: "Sent", statusColor: "bg-blue-100 text-blue-700" },
          { client: "Wrexham Council", amount: "£2,160.00", status: "Draft", statusColor: "bg-slate-100 text-slate-600" },
        ].map((inv, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-[9px] font-medium text-slate-900">{inv.client}</p>
              <p className="text-[8px] text-slate-400">INV-2026-{String(i + 42).padStart(3, "0")}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold text-slate-900">{inv.amount}</span>
              <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${inv.statusColor}`}>{inv.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[8px] text-slate-400">Connected:</span>
        {["QuickBooks", "Sage", "Xero"].map((s) => (
          <span key={s} className="text-[7px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{s}</span>
        ))}
      </div>
    </div>
  );
}

export function StaffManagementScreen() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-900">Staff Management</h3>
        <span className="text-[8px] bg-teal-600 text-white px-2 py-1 rounded font-medium">Add Staff</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total Staff", value: "24", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "On Shift", value: "8", color: "text-green-600", bg: "bg-green-50" },
          { label: "DBS Due", value: "2", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Training Due", value: "3", color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg p-2 text-center`}>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[7px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
          <span className="text-[9px] font-semibold text-slate-700">Staff Overview</span>
        </div>
        {[
          { name: "Sarah Thomas", role: "Senior Carer", dbs: "Valid", training: "100%", statusColor: "bg-green-100 text-green-700" },
          { name: "James Morgan", role: "Carer", dbs: "Valid", training: "87%", statusColor: "bg-green-100 text-green-700" },
          { name: "Lisa Roberts", role: "Carer", dbs: "Expiring", training: "92%", statusColor: "bg-amber-100 text-amber-700" },
          { name: "Mark Davies", role: "Night Carer", dbs: "Valid", training: "75%", statusColor: "bg-green-100 text-green-700" },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-[7px] font-bold text-teal-700">{s.name.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div>
                <p className="text-[9px] font-medium text-slate-900">{s.name}</p>
                <p className="text-[7px] text-slate-400">{s.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${s.statusColor}`}>DBS: {s.dbs}</span>
              <span className="text-[8px] font-semibold text-slate-700">{s.training}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrainingScreen() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-900">Training & Certificates</h3>
        <span className="text-[8px] bg-teal-600 text-white px-2 py-1 rounded font-medium">Upload Certificate</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Completed", value: "156", color: "text-green-600" },
          { label: "In Progress", value: "12", color: "text-blue-600" },
          { label: "Overdue", value: "3", color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[7px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
          <span className="text-[9px] font-semibold text-slate-700">Training Matrix</span>
        </div>
        {[
          { course: "Safeguarding Adults L2", staff: "24/24", status: "Complete", statusColor: "bg-green-100 text-green-700" },
          { course: "Manual Handling", staff: "22/24", status: "2 due", statusColor: "bg-amber-100 text-amber-700" },
          { course: "Medication Admin", staff: "24/24", status: "Complete", statusColor: "bg-green-100 text-green-700" },
          { course: "First Aid at Work", staff: "21/24", status: "3 overdue", statusColor: "bg-red-100 text-red-700" },
          { course: "Fire Safety", staff: "23/24", status: "1 due", statusColor: "bg-amber-100 text-amber-700" },
        ].map((t, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-[9px] font-medium text-slate-900">{t.course}</p>
              <p className="text-[7px] text-slate-400">{t.staff} staff completed</p>
            </div>
            <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${t.statusColor}`}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComplianceScreen() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-900">Virtual Care Inspector</h3>
        <span className="text-[8px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Last audit: 2 hrs ago</span>
      </div>
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-3 mb-3 border border-teal-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-800">Compliance Score</p>
            <p className="text-lg font-black text-teal-600">94%</p>
          </div>
        </div>
        <div className="w-full bg-teal-200 rounded-full h-2">
          <div className="bg-teal-600 h-2 rounded-full" style={{ width: "94%" }} />
        </div>
      </div>
      <div className="space-y-2">
        {[
          { area: "Care Logs", score: "98%", status: "pass", issues: 0 },
          { area: "MAR Charts", score: "96%", status: "pass", issues: 1 },
          { area: "Staff Training", score: "87%", status: "warn", issues: 3 },
          { area: "Incident Reports", score: "100%", status: "pass", issues: 0 },
          { area: "Care Plans", score: "91%", status: "pass", issues: 2 },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.status === "pass" ? "bg-green-500" : "bg-amber-500"}`} />
              <span className="text-[9px] font-medium text-slate-700">{item.area}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.issues > 0 && (
                <span className="text-[7px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  {item.issues} flag{item.issues > 1 ? "s" : ""}
                </span>
              )}
              <span className="text-[9px] font-bold text-slate-900">{item.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
