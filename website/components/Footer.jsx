import Link from 'next/link';
import Image from 'next/image';

const serviceLinks = [
  { href: '/services/domiciliary-care', label: 'Domiciliary Care' },
  { href: '/services/respite-care', label: 'Respite Care' },
  { href: '/services/emergency-response', label: 'Emergency Response' },
  { href: '/services/palliative-care', label: 'Palliative Care' },
  { href: '/services/training', label: 'Training' },
];

const quickLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/areas', label: 'Areas We Cover' },
  { href: '/faq', label: 'FAQ' },
  { href: '/compliance', label: 'Compliance & Funding' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact Us' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="Accredilink Logo"
                width={56}
                height={56}
                className="w-14 h-14 rounded-lg object-contain"
              />
              <Image
                src="/images/welsh-dragon.jpg"
                alt="Welsh Dragon"
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-contain"
              />
              <div>
                <p className="font-bold text-white text-base leading-tight">Accredilink</p>
                <p className="text-xs text-slate-400 leading-tight">Community Response Taskforce</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Providing compassionate, professional care services across Denbighshire, Conwy, and Wrexham.
              Regulated by Care Inspectorate Wales.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4 text-welsh-green-light" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              CIW Regulated
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Our Services</h3>
            <ul className="space-y-2.5">
              {serviceLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://care-call-ai-clone.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Staff Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-slate-400">01745 000 000</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-slate-400">info@accredilinkcare.co.uk</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-slate-400">Denbighshire, North Wales</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Accredilink Community Response Taskforce. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Regulated by Care Inspectorate Wales (CIW)
          </p>
        </div>
      </div>
    </footer>
  );
}
