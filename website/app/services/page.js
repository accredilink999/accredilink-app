import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Our Services',
  description: 'Domiciliary care, emergency response, respite, palliative care, sit-in services, social care, and training across Denbighshire, Conwy and Wrexham.',
};

const services = [
  {
    title: 'Domiciliary Care',
    description: 'Personal care, medication support, and daily living assistance delivered in the comfort of your own home by our trained carers.',
    href: '/services/domiciliary-care',
    color: 'bg-red-50 text-welsh-red',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'Respite Care',
    description: 'Short-term relief for family carers. We step in so you can take a break, knowing your loved one is in safe, caring hands.',
    href: '/services/respite-care',
    color: 'bg-pink-50 text-pink-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: 'Sit-in Services',
    description: 'Companionship and supervision for your loved one while you attend appointments, run errands, or simply take some time for yourself.',
    href: '/services/sit-in-services',
    color: 'bg-purple-50 text-purple-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Emergency Response',
    description: 'Rapid response care with our own trained emergency care responders, available around the clock for urgent situations.',
    href: '/services/emergency-response',
    color: 'bg-amber-50 text-amber-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Social Care',
    description: 'Community-based support to help individuals maintain independence, build social connections, and improve overall wellbeing.',
    href: '/services/social-care',
    color: 'bg-blue-50 text-blue-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: 'Palliative Care',
    description: 'Compassionate end-of-life support ensuring dignity, comfort, and peace for patients and their families during the most difficult times.',
    href: '/services/palliative-care',
    color: 'bg-green-50 text-welsh-green',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    title: 'Training',
    description: 'Professional care training and pre-hospital emergency care courses for individuals, carers, and organisations.',
    href: '/services/training',
    color: 'bg-teal-50 text-teal-700',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Our Services</h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                We offer a comprehensive range of care, support, and training services
                across Denbighshire, Conwy, and Wrexham.
              </p>
            </div>
            <div className="hidden lg:block relative h-72 rounded-2xl overflow-hidden">
              <Image src="/images/services-overview.jpg" alt="Our care services" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map(service => (
              <Link
                key={service.href}
                href={service.href}
                className="group flex gap-5 p-6 rounded-2xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
              >
                <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-welsh-red transition-colors">
                    {service.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-welsh-red">
                    Learn more
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
