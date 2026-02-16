import Link from 'next/link';

export const metadata = {
  title: 'Meet the Team',
  description: 'Meet the team behind Accredilink Community Response Taskforce. Local, qualified, and passionate about care in North Wales.',
};

export default function MeetTheTeamPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Meet the Team</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            A dedicated, local team committed to delivering outstanding care in our communities.
          </p>
        </div>
      </section>

      {/* CEO Message */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 bg-gradient-to-br from-red-50 to-green-50 rounded-2xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">A Message From Our Director</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed italic">
              <p>
                "I founded Accredilink Community Response Taskforce because I believe our communities
                in North Wales deserve better. Better care, faster response, and a provider that truly
                understands the people and places we serve.
              </p>
              <p>
                Our team is not just qualified — they are passionate. Many of our carers live in the same
                communities as the people they support. They know the back roads, they speak the language,
                and they genuinely care about making a difference.
              </p>
              <p>
                What makes us unique is our emergency care capability. Having our own trained emergency
                responders means we can do more than just provide routine care — we can be there when it
                really matters. That's what a community response taskforce should be."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Structure */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Our Team</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                role: 'Management & Leadership',
                description: 'Our registered manager, responsible individual, and office team oversee all operations, quality, and compliance.',
                icon: '🏢',
              },
              {
                role: 'Care Coordinators',
                description: 'Experienced coordinators who match carers to clients, manage rotas, and ensure continuity of care.',
                icon: '📋',
              },
              {
                role: 'Senior Care Workers',
                description: 'Experienced carers who lead shifts, mentor new staff, and maintain the highest standards of care delivery.',
                icon: '⭐',
              },
              {
                role: 'Care Support Workers',
                description: 'Our frontline team — compassionate, trained, and dedicated to delivering excellent person-centred care every day.',
                icon: '💙',
              },
              {
                role: 'Emergency Care Responders',
                description: 'Specialists trained in pre-hospital emergency care, providing rapid response to urgent situations.',
                icon: '🚨',
              },
              {
                role: 'Training Team',
                description: 'Qualified trainers delivering care courses and pre-hospital emergency care training to our staff and external organisations.',
                icon: '📚',
              },
            ].map(member => (
              <div key={member.role} className="p-6 bg-white rounded-2xl border border-slate-200">
                <span className="text-3xl mb-3 block">{member.icon}</span>
                <h3 className="font-semibold text-slate-900 mb-2">{member.role}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Our Staff Say */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">What Our Team Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { value: 'Making a real difference to people\'s lives in our own community', highlight: 'Purpose' },
              { value: 'Working for a provider that invests in training and professional development', highlight: 'Growth' },
              { value: 'Being part of a supportive team where you\'re never left on your own', highlight: 'Support' },
            ].map(item => (
              <div key={item.highlight} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <span className="inline-block px-3 py-1 bg-welsh-red text-white text-xs font-bold rounded-full mb-3">{item.highlight}</span>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{item.value}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-welsh-green to-welsh-green-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Want to Join Us?</h2>
          <p className="text-lg text-green-100 mb-8">
            We're always looking for compassionate, dedicated people to join our team.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-welsh-green font-semibold rounded-xl hover:bg-green-50 transition-colors"
          >
            View Careers
          </Link>
        </div>
      </section>
    </>
  );
}
