'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/areas', label: 'Areas' },
  { href: '/blog', label: 'Blog' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Logo + Staff Login + Mobile toggle */}
        <div className="flex items-center justify-between py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-4 flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Accredilink Logo"
              width={140}
              height={140}
              className="w-[60px] h-[60px] sm:w-[100px] sm:h-[100px] lg:w-[140px] lg:h-[140px] rounded-xl object-contain"
            />
            <Image
              src="/images/welsh-dragon.jpg"
              alt="Welsh Dragon"
              width={100}
              height={100}
              className="w-[40px] h-[40px] sm:w-[70px] sm:h-[70px] lg:w-[100px] lg:h-[100px] rounded-xl object-contain"
            />
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 text-2xl sm:text-3xl lg:text-4xl leading-tight">Accredilink</p>
              <p className="text-sm sm:text-base lg:text-lg text-slate-500 leading-tight">Community Response Taskforce</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="https://care-call-ai-clone.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-welsh-green text-white text-sm font-medium rounded-lg hover:bg-welsh-green-light transition-colors"
            >
              Staff Login
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desktop nav row */}
        <nav className="hidden lg:flex items-center gap-1 pb-3 border-t border-slate-100 pt-3">
          {navLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'text-welsh-red bg-red-50'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://care-call-ai-clone.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2.5 text-sm font-medium text-welsh-green hover:bg-green-50 rounded-lg"
            >
              Staff Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
