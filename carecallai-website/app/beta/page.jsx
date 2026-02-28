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
  MapPin,
  Bot,
  Receipt,
  Smartphone,
  Send,
  Loader2,
  Star,
  Gift,
  Heart,
} from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const comingFeatures = [
  { icon: Building2, title: "Resident Management", desc: "Room assignments, bed tracking, occupancy dashboards and resident profiles tailored for care homes" },
  { icon: ClipboardList, title: "Shift Handovers", desc: "Digital handover notes between shifts — no more lost information when teams change over" },
  { icon: ShieldCheck, title: "Facility Compliance", desc: "CIW and CQC compliance checks built specifically for residential settings, including fire safety and building audits" },
  { icon: Pill, title: "Medication Rounds", desc: "eMAR charts optimised for medication rounds across an entire home, with room-by-room administration" },
  { icon: Users, title: "Visitor & Family Management", desc: "Visitor sign-in, family portal access and relative communication tools" },
  { icon: Calendar, title: "Activity Planning", desc: "Plan and log resident activities, social events and outings with attendance tracking" },
];

const includedFeatures = [
  { icon: Calendar, title: "Full Scheduling & Rota" },
  { icon: ClipboardList, title: "Digital Care Logging" },
  { icon: Pill, title: "eMAR Charts" },
  { icon: Users, title: "Staff Management & HR" },
  { icon: ShieldCheck, title: "Virtual Care Inspector" },
  { icon: MapPin, title: "GPS Check-In" },
  { icon: Bot, title: "AI Assistant" },
  { icon: Receipt, title: "Invoicing & Payroll" },
  { icon: Smartphone, title: "Mobile App (iOS & Android)" },
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
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={200}>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                Everything in CareCallAI, purpose-built for residential care homes. Join our Beta programme
                to get full access, shape the product and receive <strong className="text-white">6 months free</strong> when
                we launch.
              </p>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#register" className="px-8 py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/30 text-lg animate-pulse-glow">
                  Register Interest
                </a>
                <a href="#features" className="px-8 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-lg backdrop-blur">
                  See What&apos;s Coming <ArrowRight className="w-5 h-5" />
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
              { icon: Gift, value: "6 Months Free", label: "On completion of the beta programme", color: "text-blue-600", bg: "bg-blue-100" },
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

      {/* Coming features for care homes */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                <Building2 className="w-4 h-4" />
                New for Residential Care
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">What&apos;s coming in CareCallAI Home</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Purpose-built features for residential care homes, nursing homes and supported living — designed with input from beta testers like you.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingFeatures.map((feature, i) => (
              <AnimateOnScroll key={i} delay={i * 80} animation="scale">
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all h-full">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Already included */}
      <section className="py-16 sm:py-24 bg-blue-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Plus everything already in CareCallAI</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Beta testers get full access to every existing feature from day one — scheduling, care logging, eMAR, compliance, invoicing and more.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {includedFeatures.map((feature, i) => (
              <AnimateOnScroll key={i} delay={i * 60} animation="fade-up">
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{feature.title}</span>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-16 sm:py-24 bg-white">
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
              <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
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
                    What are you looking for in care home software? (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your current challenges, what software you use, or what features matter most to you..."
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
