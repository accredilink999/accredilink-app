import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Emergency Care Response — 24/7 North Wales',
  description: 'Emergency care response services in Denbighshire, Conwy and Wrexham. Rapid response with trained emergency care responders available around the clock.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/services/emergency-response',
  },
};

export default function EmergencyResponse() {
  return (
    <ServicePageLayout
      title="Emergency Response"
      slug="emergency-response"
      description="What sets us apart: Accredilink has its own trained emergency care responders on shift. When an urgent care situation arises, our team provides rapid, professional response — combining domiciliary care expertise with pre-hospital emergency care skills to deliver a service that is unique in North Wales."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      ourApproach="Most domiciliary care providers can only offer planned, routine visits. Accredilink is different. We maintain a team of trained emergency care responders who are available to attend urgent situations quickly — whether it is a fall at home, a sudden deterioration in health, a carer who cannot attend, or a crisis that requires immediate professional support.

Our emergency responders hold qualifications in pre-hospital emergency care (PHEC) alongside their domiciliary care training. This dual skill set means they can assess a situation, provide immediate first aid or basic life support if needed, and deliver the personal care and support the individual requires — all in a single response.

We work closely with local authority emergency duty teams, NHS out-of-hours services, and the Welsh Ambulance Service to ensure a coordinated approach. Our response service is designed to keep people safe at home, reduce unnecessary hospital admissions, and provide rapid support when the unexpected happens. Every emergency response is documented and followed up to ensure continuity of care."
      features={[
        'Trained emergency care responders available on shift',
        'Rapid response to urgent care situations across Denbighshire, Conwy, and Wrexham',
        'Pre-hospital emergency care (PHEC) qualified staff',
        'Falls response — assessment, safe lifting, and welfare checks',
        'Urgent medication administration',
        'Emergency personal care when a regular carer cannot attend',
        'Hospital discharge support at short notice — including evenings and weekends',
        'Crisis intervention and immediate stabilisation',
        'Basic life support (BLS) and first aid capability',
        'Welfare checks for individuals causing concern',
        'Coordination with NHS, ambulance services, and emergency duty teams',
        'Available outside normal care hours — evenings, nights, weekends, and bank holidays',
        'Post-incident follow-up and care plan updates',
        'Detailed incident reporting and communication with families and professionals',
      ]}
      personalChoiceContent="Even in an emergency, the individual's dignity and choices are respected. Our responders are trained to communicate calmly, explain what is happening, and involve the person in decisions about their care wherever possible. We do not override someone's wishes simply because the situation is urgent.

Where an individual has an advance care plan, a Do Not Attempt Resuscitation (DNAR) order, or has expressed specific wishes about how they want to be cared for in an emergency, we follow those instructions. We work with the person and their family to understand and document these preferences in advance, so our team is prepared.

We also recognise that an emergency can be frightening for families. We keep relatives informed, provide clear updates, and ensure that follow-up support is in place after the immediate situation is resolved."
      standardsItems={[
        {
          title: 'CIW Regulated & Inspected',
          description: 'Our emergency response service operates under our Care Inspectorate Wales registration. All care delivered during an emergency response meets the same regulatory standards as our planned care, as set out in the Regulation and Inspection of Social Care (Wales) Act 2016.',
        },
        {
          title: 'Pre-Hospital Emergency Care (PHEC) Training',
          description: 'Our emergency responders hold qualifications in pre-hospital emergency care, including basic life support, trauma assessment, and emergency first aid. This training is maintained through regular refresher courses and practical assessments.',
        },
        {
          title: 'Social Services and Well-being (Wales) Act 2014',
          description: 'Our emergency response service supports the Act\'s goals of helping people achieve their personal wellbeing outcomes by providing rapid intervention that keeps individuals safe at home and avoids unnecessary hospital admissions.',
        },
        {
          title: 'Safeguarding in Emergencies',
          description: 'All emergency responders are trained in the Wales Safeguarding Procedures and are equipped to recognise and report safeguarding concerns that may become apparent during an urgent visit. We liaise directly with local authority safeguarding teams when needed.',
        },
        {
          title: 'Incident Reporting & Governance',
          description: 'Every emergency response is fully documented with detailed incident reports. Significant events are reported to CIW as required under regulations. We carry out internal reviews to learn from incidents and continually improve our response capability.',
        },
        {
          title: 'Partnership Working',
          description: 'We maintain strong working relationships with Betsi Cadwaladr University Health Board, the Welsh Ambulance Service, and local authority teams across Denbighshire, Conwy, and Wrexham to ensure joined-up emergency care.',
        },
      ]}
      whoIsItFor="Our emergency response service is for anyone who needs urgent care support — whether it is a fall at home, an unexpected health event, a sudden change in care needs, or a carer who is unable to attend at short notice.

It is used by individuals who receive regular care from us and need additional urgent support, as well as people who are referred to us by local authorities, health boards, or NHS services for one-off emergency assistance.

Local authority emergency duty teams and Betsi Cadwaladr University Health Board also commission our rapid response capability for urgent community care needs, including hospital discharge facilitation outside of normal hours and welfare checks on vulnerable individuals."
      imageSrc="/images/emergency-response.jpg"
    />
  );
}
