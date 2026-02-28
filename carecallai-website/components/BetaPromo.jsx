import Link from "next/link";
import { Building2, ArrowRight, Gift } from "lucide-react";

/**
 * Compact promo banner for CareCallAI Home beta programme.
 * Drop this into any page to advertise the beta.
 *
 * variant: "inline" (default) — fits between content sections
 *          "sidebar" — smaller, for sidebar or narrow spaces
 */
export default function BetaPromo({ variant = "inline" }) {
  if (variant === "sidebar") {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">CareCallAI Home</span>
          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">BETA</span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Run a care home? Join our beta — get full access and <strong className="text-blue-700">6 months free</strong>.
        </p>
        <Link
          href="/beta"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Register Interest <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-r from-blue-50 via-white to-teal-50 border-y border-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">CareCallAI Home</span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">BETA</span>
            </div>
            <p className="text-xs text-slate-500">
              Run a care home? Join the beta programme — full access + <strong className="text-blue-700">6 months free</strong> on launch
            </p>
          </div>
        </div>
        <Link
          href="/beta"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          Register Interest <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
