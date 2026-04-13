"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Building2 } from "lucide-react";

const features = [
  { name: "Scheduling & Rota", href: "/features/scheduling" },
  { name: "Care Logging", href: "/features/care-logging" },
  { name: "Medication / MAR Charts", href: "/features/medication-management" },
  { name: "GPS Check-In & Tracking", href: "/features/gps-tracking" },
  { name: "Staff Management", href: "/features/staff-management" },
  { name: "Compliance & Auditing", href: "/features/compliance" },
  { name: "Invoicing & Payroll", href: "/features/invoicing-payroll" },
  { name: "Mobile App", href: "/features/mobile-app" },
  { name: "AI Assistant", href: "/features/ai-assistant" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="CareCall AI" className="w-9 h-9 rounded-lg" />
            <span className="text-xl font-bold text-slate-900">
              CareCall<span className="text-teal-600">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <div
              className="relative"
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors">
                Features <ChevronDown className="w-4 h-4" />
              </button>
              {featuresOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <Link
                    href="/features"
                    className="block px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    All Features
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  {features.map((f) => (
                    <Link
                      key={f.href}
                      href={f.href}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                    >
                      {f.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/compliance/ciw"
              className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              Compliance
            </Link>
            <Link
              href="/beta"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              Home
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold ml-0.5">BETA</span>
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/forum"
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Support Forum
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-700"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/features"
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            {features.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="block px-6 py-1.5 text-sm text-slate-500 hover:text-teal-600"
                onClick={() => setMobileOpen(false)}
              >
                {f.name}
              </Link>
            ))}
            <Link
              href="/pricing"
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/compliance/ciw"
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Compliance
            </Link>
            <Link
              href="/beta"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              <Building2 className="w-4 h-4" />
              CareCallAI Home
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">BETA</span>
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/forum"
              className="block px-3 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Support Forum
            </Link>
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link
                href="/login"
                className="block px-3 py-2 text-sm font-medium text-center text-slate-700 border border-slate-300 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block px-3 py-2 text-sm font-semibold text-center text-white bg-teal-600 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
