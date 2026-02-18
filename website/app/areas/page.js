import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Areas We Cover',
  description: 'Accredilink provides care services across Denbighshire, Conwy and Wrexham in North Wales. Find out if we cover your area.',
};

const areas = [
  {
    name: 'Denbighshire',
    welsh: 'Sir Ddinbych',
    towns: ['Denbigh', 'Ruthin', 'Rhyl', 'Prestatyn', 'St Asaph', 'Corwen', 'Llangollen', 'Bodelwyddan'],
    color: 'bg-red-50 border-red-200 text-welsh-red',
    dotColor: 'bg-welsh-red',
  },
  {
    name: 'Conwy',
    welsh: 'Conwy',
    towns: ['Colwyn Bay', 'Llandudno', 'Abergele', 'Conwy Town', 'Llanrwst', 'Penmaenmawr', 'Deganwy', 'Towyn'],
    color: 'bg-green-50 border-green-200 text-welsh-green',
    dotColor: 'bg-welsh-green',
  },
  {
    name: 'Wrexham',
    welsh: 'Wrecsam',
    towns: ['Wrexham Town', 'Chirk', 'Cefn Mawr', 'Ruabon', 'Overton', 'Coedpoeth', 'Gresford', 'Rossett'],
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    dotColor: 'bg-amber-600',
  },
];

export default function AreasPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Areas We Cover</h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                We provide care services across three counties in North Wales — Denbighshire, Conwy, and Wrexham.
              </p>
            </div>
            <div className="relative h-48 sm:h-56 lg:h-72 rounded-2xl overflow-hidden mt-6 lg:mt-0">
              <Image src="/images/welsh-landscape.jpg" alt="Beautiful North Wales landscape" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {areas.map(area => (
              <div key={area.name} className={`rounded-2xl border-2 p-6 ${area.color} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${area.dotColor} flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{area.name}</h2>
                    <p className="text-sm opacity-70">{area.welsh}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {area.towns.map(town => (
                    <div key={town} className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${area.dotColor} flex-shrink-0`} />
                      <span className="text-sm text-slate-700">{town}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4">...and surrounding villages and communities</p>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
              We cover urban and rural areas, including remote communities. If you're not sure whether
              we cover your area, please <Link href="/contact" className="text-welsh-red font-medium hover:underline">get in touch</Link> —
              we'll do our best to help.
            </p>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 text-center">Our Coverage Area</h2>
          <div className="aspect-video bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative">
            {/* Static map image placeholder — replace with real image or interactive map */}
            <iframe
              title="Coverage area map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-3.95%2C52.85%2C-2.85%2C53.4&layer=mapnik"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
          <p className="text-center text-sm text-slate-500 mt-3">
            Serving Denbighshire, Conwy, and Wrexham in North Wales
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Need Care in Your Area?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Contact us today for a free, no-obligation discussion about your care needs.
          </p>
          <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors">
            Get in Touch
          </Link>
          <p className="text-sm text-slate-500 mt-6">
            Call <strong>01824 538688</strong> or email{' '}
            <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">enquiries@accredilinkcare.co.uk</a>
          </p>
        </div>
      </section>
    </>
  );
}
