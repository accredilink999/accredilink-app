"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

const tiers = [
  {
    name: "Starter",
    price: { monthly: 49, annual: 39 },
    users: "Up to 15 users",
    extraUser: "£3/user",
    popular: false,
    features: [
      { name: "Basic rota & scheduling", included: true },
      { name: "Care logging", included: true },
      { name: "Mobile app for carers", included: true },
      { name: "Basic staff management", included: true },
      { name: "CSV data export", included: true },
      { name: "Email support", included: true },
      { name: "Medication / MAR charts", included: false },
      { name: "Invoicing", included: false },
      { name: "Compliance reports", included: false },
      { name: "Push notifications", included: false },
      { name: "AI Assistant", included: false },
    ],
  },
  {
    name: "Professional",
    price: { monthly: 99, annual: 79 },
    users: "Up to 50 users",
    extraUser: "£2/user",
    popular: true,
    features: [
      { name: "Full rota with shift patterns", included: true },
      { name: "Care logging", included: true },
      { name: "Mobile app for carers", included: true },
      { name: "Full staff management", included: true },
      { name: "CSV + PDF export", included: true },
      { name: "Email + chat support", included: true },
      { name: "Medication / MAR charts", included: true },
      { name: "Basic invoicing", included: true },
      { name: "Basic audit logs", included: true },
      { name: "Push notifications", included: true },
      { name: "AI Assistant", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: { monthly: 199, annual: 159 },
    users: "Up to 150 users",
    extraUser: "£1.50/user",
    popular: false,
    features: [
      { name: "Multi-area scheduling + templates", included: true },
      { name: "Care logging", included: true },
      { name: "Mobile app for carers", included: true },
      { name: "Full staff + expenses", included: true },
      { name: "API access", included: true },
      { name: "Priority support", included: true },
      { name: "Medication / MAR charts", included: true },
      { name: "Full invoicing + payroll", included: true },
      { name: "CIW/CQC compliance reports", included: true },
      { name: "Push notifications", included: true },
      { name: "AI Assistant", included: true },
    ],
  },
  {
    name: "Compliance+",
    price: { monthly: 299, annual: 239 },
    users: "Unlimited users",
    extraUser: null,
    popular: false,
    features: [
      { name: "Everything in Enterprise", included: true },
      { name: "Care logging", included: true },
      { name: "Mobile app for carers", included: true },
      { name: "Full staff management", included: true },
      { name: "Full API + webhooks", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Medication / MAR charts", included: true },
      { name: "Full invoicing + payroll", included: true },
      { name: "Dedicated compliance suite", included: true },
      { name: "Push notifications", included: true },
      { name: "AI Assistant + custom training", included: true },
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
          <span className="text-teal-600 text-xs font-semibold">Save 20%</span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                href="/demo"
                className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors mb-6 ${
                  tier.popular
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                Start Free Trial
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
                        f.included ? "text-slate-700" : "text-slate-400"
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
