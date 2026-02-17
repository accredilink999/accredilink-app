'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/services/event-medical-services', label: 'Event Medical' },
  { href: '/about', label: 'About' },
  { href: '/areas', label: 'Areas' },
  { href: '/blog', label: 'Blog' },
  { href: '/apps-that-care', label: 'Apps That Care' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
  { href: '/compliance', label: 'Compliance' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top accent bar */}
      <div className="bg-gradient-to-r from-welsh-red via-white to-welsh-green h-0.5" />

      {/* Info strip */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-0.5 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1">
              <svg className="w-3 h-3 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              01824 538688
            </span>
            <span className="hidden md:flex items-center gap-1">
              <svg className="w-3 h-3 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              CIW Regulated
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Compassionate Care Across North Wales
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Denbighshire, Conwy & Wrexham
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              24/7 Emergency Response
            </span>
          </div>
        </div>
      </div>

      {/* Single main row: logo + nav + CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/images/welsh-dragon.png"
              alt="Welsh Dragon"
              width={24}
              height={24}
              className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] lg:w-[24px] lg:h-[24px] object-contain"
            />
            <Image
              src="/images/logo.png"
              alt="Accredilink Logo"
              width={44}
              height={44}
              className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] lg:w-[44px] lg:h-[44px] rounded-lg object-contain"
            />
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 text-base sm:text-lg lg:text-xl leading-none">Accredilink</p>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-none mt-0.5">Community Response Taskforce</p>
            </div>
          </Link>

          {/* Desktop nav — inline */}
          <nav className="hidden lg:flex items-center gap-0.5 mx-4">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-welsh-red bg-red-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: CTA + mobile toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center px-3.5 py-1 bg-welsh-red text-white text-[13px] font-medium rounded-md hover:bg-welsh-red-light transition-colors"
            >
              Get Care Support
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-2 space-y-0.5">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'text-welsh-red bg-red-50'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-1.5 border-t border-slate-100 mt-1.5">
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-welsh-red hover:bg-red-50 rounded-md"
              >
                Get Care Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
