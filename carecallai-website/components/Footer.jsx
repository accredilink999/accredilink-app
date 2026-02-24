import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Mobile App", href: "/features/mobile-app" },
    { name: "AI Assistant", href: "/features/ai-assistant" },
    { name: "Book a Demo", href: "/demo" },
  ],
  Solutions: [
    { name: "Scheduling & Rota", href: "/features/scheduling" },
    { name: "Care Logging", href: "/features/care-logging" },
    { name: "MAR Charts", href: "/features/medication-management" },
    { name: "Staff Management", href: "/features/staff-management" },
    { name: "Invoicing & Payroll", href: "/features/invoicing-payroll" },
  ],
  Compliance: [
    { name: "CIW Compliance", href: "/compliance/ciw" },
    { name: "CQC Compliance", href: "/compliance/cqc" },
    { name: "vs Connecteam", href: "/comparisons/vs-connecteam" },
    { name: "vs Birdie", href: "/comparisons/vs-birdie" },
    { name: "vs CarePlanner", href: "/comparisons/vs-careplanner" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <span className="text-lg font-bold text-white">
                CareCall<span className="text-teal-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              All-in-one home care management software for UK domiciliary care agencies.
            </p>
            <div className="space-y-2 text-sm">
              <a href="tel:+441234567890" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Phone className="w-4 h-4" /> 01234 567 890
              </a>
              <a href="mailto:hello@carecallai.com" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Mail className="w-4 h-4" /> hello@carecallai.com
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Wales, United Kingdom
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-white mb-4">{heading}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CareCallAI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-teal-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-teal-400 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
