import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Event Medical Services',
  description: 'Professional event medical cover for community events, festivals, sports fixtures, and public gatherings across Denbighshire, Conwy, and Wrexham. Qualified pre-hospital emergency care responders.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/services/event-medical-services',
  },
};

export default function EventMedicalServicesPage() {
  return (
    <ServicePageLayout
      title="Event Medical Services"
      slug="event-medical-services"
      description="Professional medical cover for community events, festivals, sporting fixtures, and public gatherings across North Wales."
      icon={
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
        </svg>
      }
      imageSrc="/images/event-medical.jpg"
      ourApproach={`At Accredilink Community Response Taskforce, our Event Medical Services bring the same professionalism, compassion, and clinical excellence that defines our care work into the dynamic environment of community events and public gatherings. We understand that every event — whether a local fête, a major sporting fixture, or a multi-day festival — carries unique risks that require bespoke medical planning.\n\nOur team of qualified pre-hospital emergency care responders and first aiders are experienced in delivering frontline medical support in outdoor and indoor settings. We don't simply provide a first aid kit and a chair — we deliver a fully planned, risk-assessed medical provision tailored to the size, nature, and audience of your event.\n\nAs a not-for-profit organisation rooted in the communities of Denbighshire, Conwy, and Wrexham, we are uniquely invested in the safety and wellbeing of the people who attend local events. Our responders are local people who know the area, the venues, and the community — and that makes a real difference when minutes count.\n\nWe work closely with event organisers, local authorities, and emergency services to ensure seamless coordination. From pre-event risk assessments and medical plans to on-the-day deployment and post-event reporting, we cover every aspect of event medical provision to the highest standards.`}
      features={[
        'Qualified pre-hospital emergency care responders on site',
        'Event-specific risk assessments and medical plans',
        'First aid and trauma management for all event types',
        'Dedicated medical points and treatment areas',
        'Coordination with Welsh Ambulance Service and local emergency services',
        'Coverage for community festivals, fairs, and carnivals',
        'Sporting event medical cover — football, rugby, athletics, cycling',
        'School and charity event first aid provision',
        'Corporate event and conference medical support',
        'Parades, firework displays, and outdoor public gatherings',
        'Multi-day event cover with shift planning and crew rotation',
        'Casualty documentation and clinical record-keeping',
        'Post-event medical reports for organisers and insurers',
        'Scalable provision from small community events to large festivals',
      ]}
      personalChoiceContent={`We believe that every person who attends a community event deserves to feel safe — and if something goes wrong, they deserve compassionate, competent care delivered with dignity and respect.\n\nOur event medical teams treat every casualty as an individual. Whether it's a child with a grazed knee, an elderly attendee feeling unwell, or a serious trauma requiring stabilisation, we provide person-centred care that puts the patient first. We listen, we reassure, and we act with clinical confidence.\n\nWe also understand that events are meant to be enjoyed. Our teams are approachable and visible, giving attendees and organisers confidence that professional help is on hand without creating an intrusive or clinical atmosphere. We integrate into the fabric of the event, working alongside stewards, volunteers, and organisers as part of the wider safety team.\n\nFor event organisers, we provide transparent communication throughout — from the initial planning conversation to post-event debriefs. Your event, your community, your standards — we work to support your vision while ensuring everyone goes home safely.`}
      standardsItems={[
        {
          title: 'Health & Safety at Work Act 1974',
          description: 'All event medical provision complies with UK health and safety legislation, ensuring a safe working environment for responders and a safe experience for attendees.',
        },
        {
          title: 'The Event Safety Guide (HSE Purple Guide)',
          description: 'Our medical plans and risk assessments follow the principles of the HSE Purple Guide for event safety, the industry standard for managing health and safety at events.',
        },
        {
          title: 'Welsh Ambulance Service Coordination',
          description: 'We work in partnership with the Welsh Ambulance Services NHS Trust (WAST) to ensure seamless escalation pathways and coordinated emergency response at all events.',
        },
        {
          title: 'Pre-Hospital Emergency Care Qualifications',
          description: 'All responders hold recognised pre-hospital emergency care qualifications and maintain clinical competency through regular training, supervision, and CPD.',
        },
        {
          title: 'Safeguarding at Events',
          description: 'Our teams are trained in safeguarding vulnerable adults and children. All responders are DBS-checked and follow our safeguarding policies at every deployment.',
        },
        {
          title: 'Clinical Governance & Record-Keeping',
          description: 'Every patient contact is documented with full clinical records, maintained in line with data protection legislation and clinical governance best practice.',
        },
      ]}
      whoIsItFor={`Our Event Medical Services are designed for anyone organising a public or private event across Denbighshire, Conwy, and Wrexham who needs professional medical cover.\n\nThis includes local councils and community groups organising festivals, fairs, parades, and cultural events. Sports clubs and associations hosting matches, tournaments, and competitions. Schools, colleges, and charities running outdoor events, fun runs, and sponsored activities. Corporate organisations hosting team-building days, conferences, or product launches. Private event organisers planning large celebrations, weddings, or gatherings where medical provision is advisable.\n\nIf you are unsure whether your event needs medical cover, we are happy to provide a free consultation. We can advise on the level of provision recommended based on expected attendance, event type, duration, location, and risk factors.\n\nWhether it's a village show with 50 attendees or a multi-day music festival with thousands, we scale our provision to match your needs — and our not-for-profit model means you get professional medical cover at a fair price, with every penny reinvested into community care.`}
    />
  );
}
