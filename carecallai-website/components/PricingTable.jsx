"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

const tiers = [
  {
    name: "Starter",
    price: { monthly: 99, annual: 79 },
    users: "Up to 15 staff",
    extraUser: "£5/user",
    popular: false,
    features: [
      { name: "Welsh & English bilingual", included: true, highlight: true },
      { name: "Rota & scheduling", included: true },
      { name: "Care logging & daily notes", included: true },
      { name: "Mobile app (iOS, Android, PWA)", included: true },
      { name: "Staff management & HR", included: true },
      { name: "Service user profiles", included: true },
      { name: "Basic invoicing", included: true },
      { name: "Push notifications", included: true },
      { name: "Email support", included: true },
      { name: "Staff training & courses", included: false },
      { name: "Medication / eMAR", included: false },
      { name: "AI Assistant", included: false },
      { name: "Clinical Suite", included: false },
      { name: "CIW/CQC compliance suite", included: false },
    ],
  },
  {
    name: "Professional",
    price: { monthly: 199, annual: 159 },
    users: "Up to 30 staff",
    extraUser: "£3/user",
    popular: true,
    features: [
      { name: "Everything in Starter, plus:", included: true },
      { name: "Welsh & English bilingual", included: true, highlight: true },
      { name: "Staff training & course management", included: true, highlight: true },
      { name: "Medication / eMAR charts", included: true },
      { name: "Full rota with shift patterns", included: true },
      { name: "Full invoicing", included: true },
      { name: "AI Assistant", included: true },
      { name: "Family portal", included: true },
      { name: "GPS check-in & tracking", included: true },
      { name: "Email + chat support", included: true },
      { name: "Clinical Suite", included: false },
      { name: "CIW/CQC compliance suite", included: false },
      { name: "Payroll & expenses", included: false },
      { name: "Multi-area management", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: { monthly: 349, annual: 279 },
    users: "Unlimited staff",
    extraUser: null,
    popular: false,
    features: [
      { name: "Everything in Professional, plus:", included: true },
      { name: "Clinical Suite (NEWS2, SALT, Waterlow, MUST)", included: true, highlight: true },
      { name: "CIW/CQC compliance suite", included: true, highlight: true },
      { name: "Welsh Language Standards compliant", included: true, highlight: true },
      { name: "12-weekly supervision tracking", included: true, highlight: true },
      { name: "Full payroll & expenses", included: true },
      { name: "Multi-area scheduling", included: true },
      { name: "Shift templates & patterns", included: true },
      { name: "Training matrix & certificates", included: true },
      { name: "Audit logs & reports", included: true },
      { name: "Priority phone support", included: true },
      { name: "Dedicated onboarding", included: true },
      { name: "Custom AI training", included: true },
    ],
  },
];

export default function PricingTable() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? "text-slate-900" : "text-slate-500"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            annual ? "bg-teal-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              annual ? "translate-x-7" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-slate-900" : "text-slate-500"}`}>
          Annual{" "}
          <span className="text-teal-600 text-xs font-semibold">2 months free</span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tiers.map((tier, i) => (
          <AnimateOnScroll key={tier.name} delay={i * 100}>
            <div
              className={`relative bg-white rounded-2xl border p-6 h-full flex flex-col ${
                tier.popular
                  ? "border-teal-500 shadow-xl ring-2 ring-teal-500"
                  : "border-slate-200 shadow-sm"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
              <div className="mt-4 mb-1">
                <span className="text-4xl font-bold text-slate-900">
                  £{annual ? tier.price.annual : tier.price.monthly}
                </span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <p className="text-sm text-slate-500 mb-1">{tier.users}</p>
              {tier.extraUser && (
                <p className="text-xs text-slate-400 mb-4">
                  Then {tier.extraUser} per additional user
                </p>
              )}
              {!tier.extraUser && <p className="text-xs text-slate-400 mb-4">&nbsp;</p>}

              <Link
                href="/signup"
                className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors mb-6 ${
                  tier.popular
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                Start 7-Day Free Trial
              </Link>

              <ul className="space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f.name} className="flex items-start gap-2">
                    {f.included ? (
                      <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        f.highlight && f.included
                          ? "text-teal-700 font-semibold"
                          : f.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {f.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  );
}
