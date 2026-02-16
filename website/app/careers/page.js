import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Careers',
  description: 'Join the Accredilink team. Care worker, emergency responder, and training roles across Denbighshire, Conwy and Wrexham.',
};

const benefits = [
  {
    title: 'Training & Development',
    description: 'Full induction, ongoing training, and the opportunity to gain qualifications in care and pre-hospital emergency care.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Competitive Pay',
    description: 'We value our staff. Competitive hourly rates, mileage payments, and enhancements for unsocial hours.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Supportive Team',
    description: 'A friendly, close-knit team with strong management support. You\'re never on your own — we look after our people.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Modern Technology',
    description: 'Our staff use our purpose-built app for shift management, check-ins, care logging, and real-time communication.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Flexible Working',
    description: 'We offer a range of shift patterns to fit around your life — mornings, evenings, weekends, and full-time options.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Make a Difference',
    description: 'This isn\'t just a job — it\'s a chance to genuinely improve lives in your community every single day.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const roles = [
  {
    title: 'Care Support Workers',
    description: 'Deliver personal care and support to clients in their homes. Full training provided — experience welcome but not essential.',
  },
  {
    title: 'Emergency Care Responders',
    description: 'Join our rapid response team. Requires pre-hospital emergency care qualifications or willingness to train.',
  },
  {
    title: 'Senior Care Workers',
    description: 'Lead shifts, mentor new staff, and ensure the highest standards of care delivery.',
  },
  {
    title: 'Training & Development',
    description: 'Deliver care training and emergency care courses. Requires relevant qualifications and teaching experience.',
  },
];

export default function CareersPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(22,101,52,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Join Our Team</h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                We're always looking for compassionate, dedicated people to join the Accredilink team.
                Whether you're experienced or new to care, we'd love to hear from you.
              </p>
            </div>
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg hidden lg:block">
              <Image src="/images/careers.jpg" alt="Join the Accredilink care team" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Why Work With Us?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(benefit => (
              <div key={benefit.title} className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-welsh-green flex items-center justify-center flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Roles We Recruit For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {roles.map(role => (
              <div key={role.title} className="p-6 bg-white rounded-2xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">{role.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-welsh-green to-welsh-green-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Apply?</h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Send us your CV and a brief cover note. We welcome applications from experienced carers
            and those new to the sector — full training is provided.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-welsh-green font-semibold rounded-xl hover:bg-green-50 transition-colors"
            >
              Contact Us to Apply
            </Link>
            <a
              href="mailto:careers@accredilink.co.uk"
              className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Email: careers@accredilink.co.uk
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
