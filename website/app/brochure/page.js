'use client';

import { useState } from 'react';
import Link from 'next/link';

const content = {
  en: {
    langSwitch: 'Cymraeg',
    heroTitle: 'CareCall AI',
    heroSubtitle: 'Intelligent Care Management for Welsh & English Providers',
    heroDescription: 'The all-in-one digital platform built specifically for CIW and CQC compliance. Manage staff, service users, care plans, training, and invoicing — all from one place.',
    trialCta: 'Start 14-Day Free Trial',
    contactCta: 'Book a Demo',

    aboutTitle: 'About CareCall AI',
    aboutText: 'CareCall AI is developed by Accredilink Community Response Taskforce, a CIW-regulated care provider based in Denbigh, North Wales. We built this platform because we needed it ourselves — and found nothing on the market that combined all the tools a Welsh care provider needs in one place. CareCall AI is the result of real-world care experience combined with modern AI technology.',

    featuresTitle: 'Features',
    features: [
      { title: 'Staff Rota & Shift Management', desc: 'Build rotas, manage shift patterns, handle swaps and cover. Automated blank shift generation and pattern deployment.' },
      { title: 'Bilingual Care Plans (EN/CY)', desc: 'Full care plans with Welsh language support. AI-powered translation for CIW Welsh Language Standards compliance.' },
      { title: 'Daily Care Logging', desc: 'Customisable care log forms with body map, mood tracking, and configurable fields per service user.' },
      { title: 'eMAR Medication Tracking', desc: 'Electronic medication administration records with alerts, stock management, and audit trails.' },
      { title: 'AI Course Builder & Training', desc: 'Generate staff training courses using AI. Track completions, certificates, and training matrix compliance.' },
      { title: 'Staff Supervision Tracking', desc: '12-weekly supervision reminders and records for RISCA Regulation 36 / CQC Regulation 18 compliance.' },
      { title: 'Invoicing & Payroll', desc: 'Generate invoices, track payments, manage recurring billing, and calculate staff payroll from shift data.' },
      { title: 'Family Portal', desc: 'Give families secure view-only access to care logs, daily updates, and wellbeing information.' },
      { title: 'Safeguarding Reporting', desc: 'Structured safeguarding incident reports with body maps, follow-up tracking, and audit history.' },
      { title: 'Mobile App', desc: 'iOS and Android apps via Capacitor. Staff can log care, view rotas, and communicate on the go.' },
      { title: 'CIW Compliance Dashboard', desc: 'Pre-populated CIW regulation forms with built-in guidance. Track compliance across all RISCA regulations.' },
      { title: 'AI-Powered Insights', desc: 'Natural language AI assistant for care queries, report generation, and data analysis.' },
    ],

    complianceTitle: 'CIW & CQC Compliance',
    complianceText: 'CareCall AI is designed from the ground up for regulatory compliance. Every feature maps directly to RISCA (Regulation and Inspection of Social Care (Wales) Act 2016) and CQC (Care Quality Commission) standards. Our built-in guidance helps your team understand exactly what inspectors are looking for.',
    compliancePoints: [
      'Pre-populated regulation filing forms',
      'Built-in CIW/CQC guidance per regulation',
      'Supervision tracking (Reg 36 / Reg 18)',
      'Welsh Language Standards support',
      'Training matrix with certificate tracking',
      'Safeguarding incident reporting',
    ],

    pricingTitle: 'Pricing',
    pricingText: 'Plans start from £49/month for up to 10 staff. Professional plan at £99/month includes all features for up to 50 staff. Enterprise pricing available for larger organisations.',

    contactTitle: 'Get in Touch',
    contactText: 'Ready to see CareCall AI in action? Start your free trial or book a personalised demo with our team.',
    phone: '01824 538688',
    email: 'info@accredilink.co.uk',
    address: 'Unit 4, Smithfield Business Park, Denbigh, LL16 3RJ',
  },
  cy: {
    langSwitch: 'English',
    heroTitle: 'CareCall AI',
    heroSubtitle: 'Rheoli Gofal Deallus ar gyfer Darparwyr Cymraeg a Saesneg',
    heroDescription: 'Y platfform digidol cynhwysfawr wedi\'i adeiladu\'n benodol ar gyfer cydymffurfiaeth AGC a CQC. Rheolwch staff, defnyddwyr gwasanaeth, cynlluniau gofal, hyfforddiant, ac anfonebu — i gyd o un lle.',
    trialCta: 'Dechrau Treial Am Ddim 14 Diwrnod',
    contactCta: 'Trefnu Demo',

    aboutTitle: 'Am CareCall AI',
    aboutText: 'Mae CareCall AI yn cael ei ddatblygu gan Accredilink Community Response Taskforce, darparwr gofal wedi\'i reoleiddio gan AGC yn Ninbych, Gogledd Cymru. Fe wnaethom adeiladu\'r platfform hwn oherwydd bod ei angen arnom ein hunain — ac na chawsom unrhyw beth ar y farchnad oedd yn cyfuno\'r holl offer sydd eu hangen ar ddarparwr gofal Cymreig mewn un lle.',

    featuresTitle: 'Nodweddion',
    features: [
      { title: 'Rota Staff a Rheoli Sifftiau', desc: 'Adeiladu rotas, rheoli patrymau sifftiau, trin cyfnewid a gwarchod. Cynhyrchu sifftiau gwag awtomatig a defnyddio patrymau.' },
      { title: 'Cynlluniau Gofal Dwyieithog (CY/EN)', desc: 'Cynlluniau gofal llawn gyda chefnogaeth Cymraeg. Cyfieithu AI ar gyfer cydymffurfiaeth Safonau Iaith Gymraeg AGC.' },
      { title: 'Cofnodi Gofal Dyddiol', desc: 'Ffurflenni cofnodi gofal addasadwy gyda map corff, tracio hwyliau, a meysydd ffurfweddadwy fesul defnyddiwr gwasanaeth.' },
      { title: 'eMAR Tracio Meddyginiaeth', desc: 'Cofnodion gweinyddu meddyginiaeth electronig gyda rhybuddion, rheoli stoc, a llwybrau archwilio.' },
      { title: 'Adeiladwr Cyrsiau AI a Hyfforddiant', desc: 'Cynhyrchu cyrsiau hyfforddi staff gan ddefnyddio AI. Tracio cwblhadau, tystysgrifau, a chydymffurfiaeth matrics hyfforddiant.' },
      { title: 'Tracio Goruchwyliaeth Staff', desc: 'Nodiadau a chofnodion goruchwyliaeth 12 wythnosol ar gyfer cydymffurfiaeth Rheoliad 36 RISCA / Rheoliad 18 CQC.' },
      { title: 'Anfonebu a Chyflogres', desc: 'Cynhyrchu anfonebau, tracio taliadau, rheoli bilio cylchol, a chyfrifo cyflogres staff o ddata sifftiau.' },
      { title: 'Porth Teuluoedd', desc: 'Rhoi mynediad diogel darllen-yn-unig i deuluoedd at gofnodion gofal, diweddariadau dyddiol, a gwybodaeth llesiant.' },
      { title: 'Adrodd Diogelu', desc: 'Adroddiadau digwyddiad diogelu strwythuredig gyda mapiau corff, tracio dilyniant, a hanes archwilio.' },
      { title: 'Ap Symudol', desc: 'Apiau iOS ac Android. Gall staff gofnodi gofal, gweld rotas, a chyfathrebu ar y ffordd.' },
      { title: 'Dangosfwrdd Cydymffurfiaeth AGC', desc: 'Ffurflenni rheoliad AGC wedi\'u llenwi ymlaen llaw gydag arweiniad adeiledig. Tracio cydymffurfiaeth ar draws holl reoliadau RISCA.' },
      { title: 'Mewnwelediadau AI', desc: 'Cynorthwyydd AI iaith naturiol ar gyfer ymholiadau gofal, cynhyrchu adroddiadau, a dadansoddi data.' },
    ],

    complianceTitle: 'Cydymffurfiaeth AGC a CQC',
    complianceText: 'Mae CareCall AI wedi\'i ddylunio o\'r gwaelod i fyny ar gyfer cydymffurfiaeth reoleiddiol. Mae pob nodwedd yn mapio\'n uniongyrchol i safonau RISCA (Deddf Rheoleiddio ac Arolygu Gofal Cymdeithasol (Cymru) 2016) a CQC.',
    compliancePoints: [
      'Ffurflenni ffeilio rheoliadau wedi\'u llenwi ymlaen llaw',
      'Arweiniad AGC/CQC adeiledig fesul rheoliad',
      'Tracio goruchwyliaeth (Rheo 36 / Rheo 18)',
      'Cefnogaeth Safonau Iaith Gymraeg',
      'Matrics hyfforddiant gyda thracio tystysgrifau',
      'Adrodd digwyddiadau diogelu',
    ],

    pricingTitle: 'Prisiau',
    pricingText: 'Mae cynlluniau\'n dechrau o £49/mis ar gyfer hyd at 10 aelod o staff. Cynllun Proffesiynol am £99/mis yn cynnwys yr holl nodweddion ar gyfer hyd at 50 o staff. Prisiau menter ar gael ar gyfer sefydliadau mwy.',

    contactTitle: 'Cysylltwch',
    contactText: 'Yn barod i weld CareCall AI ar waith? Dechreuwch eich treial am ddim neu trefnwch demo personol gyda\'n tîm.',
    phone: '01824 538688',
    email: 'info@accredilink.co.uk',
    address: 'Uned 4, Parc Busnes Smithfield, Dinbych, LL16 3RJ',
  },
};

export default function BrochurePage() {
  const [lang, setLang] = useState('en');
  const t = content[lang];

  return (
    <div className="bg-white">
      {/* Language toggle */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {lang === 'en' ? 'Service Brochure' : 'Taflen Gwasanaeth'} — CareCall AI
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {lang === 'en' ? 'Print / PDF' : 'Argraffu / PDF'}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'cy' : 'en')}
              className="px-3 py-1 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              {t.langSwitch}
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-welsh-red via-white to-welsh-green h-1 w-24 mx-auto rounded-full mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold">{t.heroTitle}</h1>
          <p className="text-xl sm:text-2xl text-slate-300 mt-4 font-medium">{t.heroSubtitle}</p>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">{t.heroDescription}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://carecallai-website.vercel.app/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-welsh-green text-white font-medium rounded-lg hover:bg-welsh-green-light transition-colors"
            >
              {t.trialCta}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              {t.contactCta}
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.aboutTitle}</h2>
          <p className="text-slate-600 leading-relaxed">{t.aboutText}</p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">{t.featuresTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-welsh-green/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.complianceTitle}</h2>
          <p className="text-slate-600 mb-6">{t.complianceText}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {t.compliancePoints.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm text-slate-700">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.pricingTitle}</h2>
          <p className="text-slate-600 mb-6">{t.pricingText}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            {lang === 'en' ? 'View Full Pricing' : 'Gweld Prisiau Llawn'} &rarr;
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.contactTitle}</h2>
          <p className="text-slate-600 mb-6">{t.contactText}</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-slate-600">
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t.phone}
            </span>
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t.email}
            </span>
            <span className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t.address}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
