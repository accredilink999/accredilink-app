"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowRight,
  CheckCircle,
  Users,
  ShieldCheck,
  Pill,
  ClipboardList,
  Calendar,
  Bot,
  Send,
  Loader2,
  Star,
  Gift,
  Heart,
  Moon,
  Droplets,
  PersonStanding,
  Activity,
  Wrench,
  BedDouble,
  UserCheck,
  Flame,
  Brain,
} from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const coreFeatures = [
  {
    icon: ClipboardList,
    title: "Digital Care Planning",
    desc: "Person-centred care plans with clinical assessments — Waterlow, MUST, Abbey Pain Scale, falls risk and mental capacity assessments. Review scheduling and version history.",
    tag: "Clinical",
  },
  {
    icon: Pill,
    title: "eMAR & Controlled Drugs",
    desc: "Full electronic MAR with controlled drugs register, witness signatures, running balance, PRN protocols, covert medication records and stock management.",
    tag: "Medication",
  },
  {
    icon: Bot,
    title: "AI Shift Handover",
    desc: "Auto-generated handover summaries from each shift's care logs, incidents and medication changes. Staff see flagged events when they start their shift.",
    tag: "Handover",
  },
  {
    icon: Droplets,
    title: "Fluid, Food & Nutrition",
    desc: "Record every drink and meal offered, accepted or refused. Auto-calculate daily intake totals. Flag residents below hydration thresholds. IDDSI-compliant texture tracking.",
    tag: "Monitoring",
  },
  {
    icon: Moon,
    title: "Night Checks & Welfare Rounds",
    desc: "Configurable check intervals (1-4 hours). Record sleep quality, continence, repositioning and position. Ultra-simple dark-mode interface for minimal disruption.",
    tag: "Overnight",
  },
  {
    icon: Activity,
    title: "Body Maps & Wound Tracking",
    desc: "Digital body maps to mark, photograph and monitor wounds, pressure sores and bruises. Photo timeline to track healing progress over time.",
    tag: "Clinical",
  },
  {
    icon: BedDouble,
    title: "Room & Occupancy Management",
    desc: "Real-time room/bed dashboard showing occupied, vacant and reserved beds. Pre-admission assessments, admissions, transfers and discharge planning.",
    tag: "Operations",
  },
  {
    icon: PersonStanding,
    title: "Falls Monitoring & Trends",
    desc: "Multifactorial falls risk assessments. AI pattern detection showing time-of-day, location hotspots and contributing factors. Evidence of interventions for inspectors.",
    tag: "Safety",
  },
  {
    icon: UserCheck,
    title: "Visitor Management",
    desc: "Digital sign-in/sign-out for visitors, contractors and professionals. Safeguarding alerts for restricted visitors. Real-time fire register of everyone in the building.",
    tag: "Security",
  },
  {
    icon: Calendar,
    title: "Activities & Wellbeing",
    desc: "Plan group and 1:1 activities with attendance tracking. Mood and engagement logging. Life history and 'This is Me' documents for person-centred dementia care.",
    tag: "Wellbeing",
  },
  {
    icon: Wrench,
    title: "Environment & Maintenance",
    desc: "Maintenance request tracking, fire door checks, fire drill records, COSHH register, housekeeping schedules, temperature monitoring and equipment service dates.",
    tag: "Premises",
  },
  {
    icon: Heart,
    title: "Family Portal",
    desc: "Real-time portal showing actual care data — not just photos. Families see care logs, activities, meals and wellbeing updates. Reduces phone calls by hours per week.",
    tag: "Families",
  },
  {
    icon: Flame,
    title: "Fire Safety & IPC",
    desc: "Daily and weekly fire safety checks, fire alarm tests, fire risk assessments and drill records. Infection prevention and control audits with outbreak management protocols.",
    tag: "Compliance",
  },
  {
    icon: ShieldCheck,
    title: "CIW & CQC Inspection Ready",
    desc: "Pre-populated CIW annual return and statement of purpose. CQC KLOE-aligned evidence reports. Audit trails for every action. Pull any resident's complete history in seconds.",
    tag: "Compliance",
  },
  {
    icon: Users,
    title: "Staff Rota, Training & Supervision",
    desc: "Shift scheduling with dependency-based staffing levels. Training matrix with mandatory modules. 12-weekly supervision tracking. DBS monitoring with expiry alerts.",
    tag: "Staffing",
  },
  {
    icon: Brain,
    title: "Clinical Assessments Suite",
    desc: "Waterlow (pressure sore risk), MUST (malnutrition), Abbey Pain Scale, Barthel Index, NEWS2 scoring, DoLS records, DNACPR and advance care planning.",
    tag: "Clinical",
  },
];

const painPoints = [
  { problem: "Juggling 3-4 separate systems", solution: "One platform for clinical care, operations, environment and compliance" },
  { problem: "Paper MAR charts and fluid charts", solution: "Digital records with full audit trail — no more lost paperwork" },
  { problem: "Night staff don't use the software", solution: "Ultra-simple dark-mode interface designed for minimal taps" },
  { problem: "Scrambling before CIW/CQC inspections", solution: "Inspection-ready reports generated instantly, any time" },
  { problem: "Families phoning constantly for updates", solution: "Real-time family portal showing actual care data" },
  { problem: "Verbal handovers losing critical information", solution: "AI-generated handover with auto-flagged events" },
];

export default function BetaProgrammePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    homeSize: "",
    careType: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          department: "beta",
          agencySize: form.homeSize,
          message: `[BETA PROGRAMME - CareCallAI Home]\n\nCare Type: ${form.careType}\nHome Size: ${form.homeSize}\n\n${form.message}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-teal-900 py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float-delayed" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center">
            <AnimateOnScroll animation="fade-down">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/10 animate-bounce-gentle">
                <Star className="w-4 h-4" />
                Beta Programme — Limited Places Available
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                CareCallAI <span className="text-blue-400">Home</span>
              </h1>
              <p className="text-lg text-blue-200 mb-2">Residential Care Home Management Software</p>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={200}>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                Purpose-built for residential care homes, nursing homes and supported living.
                Not a bolt-on to domiciliary care — a dedicated platform designed around how care homes actually work.
                Join the Beta to shape the product and receive <strong className="text-white">6 months free</strong> on launch.
              </p>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#register" className="px-8 py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/30 text-lg animate-pulse-glow">
                  Register Interest
                </a>
                <a href="#features" className="px-8 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-lg backdrop-blur">
                  See All Features <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Gift, value: "6 Months Free", label: "On launch after completing the beta programme", color: "text-blue-600", bg: "bg-blue-100" },
              { icon: CheckCircle, value: "Full Access", label: "Use every feature throughout development", color: "text-teal-600", bg: "bg-teal-100" },
              { icon: Heart, value: "Shape the Product", label: "Your feedback directly influences the final product", color: "text-rose-600", bg: "bg-rose-100" },
            ].map((item, i) => (
              <AnimateOnScroll key={i} delay={i * 100} animation="scale">
                <div className="group">
                  <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.label}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Sound familiar?</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Care home managers tell us the same things. CareCallAI Home is built to solve them.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {painPoints.map((item, i) => (
              <AnimateOnScroll key={i} delay={i * 60} animation="fade-up">
                <div className="bg-white rounded-xl p-5 border border-slate-200 h-full">
                  <p className="text-sm text-red-600 font-medium mb-1 line-through decoration-red-300">{item.problem}</p>
                  <p className="text-sm text-slate-800 font-semibold flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    {item.solution}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* All features */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                <Building2 className="w-4 h-4" />
                Built for Residential Care
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything a care home needs in one platform</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Clinical care, operations, environment, compliance and family communication — no more juggling separate systems.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreFeatures.map((feature, i) => (
              <AnimateOnScroll key={i} delay={i * 50} animation="scale">
                <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{feature.title}</h3>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{feature.tag}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* How it differs */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 border border-blue-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">
                Not a domiciliary care app with a new label
              </h2>
              <p className="text-slate-600 text-center mb-6">
                CareCallAI Home is built from the ground up for residential settings. Here&apos;s what makes it different.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { dom: "GPS check-in for home visits", home: "On-site welfare rounds and night checks" },
                  { dom: "Visit-based care logging", home: "24/7 continuous care monitoring" },
                  { dom: "Client invoicing for councils", home: "Room occupancy and bed management" },
                  { dom: "Mileage and travel tracking", home: "Environment, fire safety and COSHH" },
                  { dom: "One-off calls and scheduling", home: "Shift handovers with AI summaries" },
                  { dom: "Individual medication visits", home: "Medication rounds across entire home" },
                ].map((row, i) => (
                  <div key={i} className="flex gap-3 bg-white rounded-lg p-3 border border-slate-200">
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs font-medium mb-0.5">Dom Care</p>
                      <p className="text-slate-500 line-through decoration-slate-300">{row.dom}</p>
                    </div>
                    <div className="w-px bg-slate-200" />
                    <div className="flex-1">
                      <p className="text-blue-600 text-xs font-medium mb-0.5">CareCallAI Home</p>
                      <p className="text-slate-900 font-medium">{row.home}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Register your interest</h2>
              <p className="text-slate-600">Places are limited. Fill in your details and we&apos;ll be in touch to discuss the programme.</p>
            </div>
          </AnimateOnScroll>

          {submitted ? (
            <AnimateOnScroll animation="scale">
              <div className="text-center py-12 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Registration Received</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Thank you for your interest in the CareCallAI Home Beta Programme. We&apos;ll be in touch within 2 working days to discuss next steps.
                </p>
              </div>
            </AnimateOnScroll>
          ) : (
            <AnimateOnScroll animation="fade-up" delay={200}>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Care Home Name *</label>
                    <input
                      required
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type of Care *</label>
                    <select
                      required
                      value={form.careType}
                      onChange={(e) => setForm({ ...form, careType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="residential">Residential Care Home</option>
                      <option value="nursing">Nursing Home</option>
                      <option value="supported-living">Supported Living</option>
                      <option value="dementia">Dementia Care</option>
                      <option value="mixed">Mixed / Multiple</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Beds / Residents</label>
                    <select
                      value={form.homeSize}
                      onChange={(e) => setForm({ ...form, homeSize: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="1-10">1-10 beds</option>
                      <option value="11-25">11-25 beds</option>
                      <option value="26-50">26-50 beds</option>
                      <option value="51-100">51-100 beds</option>
                      <option value="100+">100+ beds</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    What are your biggest challenges with current software? (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your current systems, what's not working, or what features matter most to your care home..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none bg-white"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Register Interest</>
                  )}
                </button>
                <p className="text-xs text-center text-slate-500">
                  By registering you agree to our{" "}
                  <Link href="/privacy" className="underline hover:text-slate-700">privacy policy</Link>.
                  We&apos;ll only contact you about the Beta Programme.
                </p>
              </form>
            </AnimateOnScroll>
          )}
        </div>
      </section>
    </>
  );
}
