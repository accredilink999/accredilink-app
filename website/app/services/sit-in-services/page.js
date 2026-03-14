import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Sit-in Care & Companionship — North Wales',
  description: 'Sit-in care services in Denbighshire, Conwy and Wrexham. Professional companionship and supervision so family carers can take a break with peace of mind.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/services/sit-in-services',
  },
};

export default function SitInServices() {
  return (
    <ServicePageLayout
      title="Sit-in Services"
      slug="sit-in-services"
      description="Our sit-in service provides a trusted, friendly carer to stay with your loved one while you step out. Whether you need to attend an appointment, do the shopping, or simply have time to yourself — we provide professional, person-centred companionship and supervision so you can leave with complete peace of mind."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      ourApproach="A sit-in service may sound straightforward, but at Accredilink we treat it with the same professionalism and care planning as any other service. Our sit-in carers are not simply 'watching over' someone — they are providing meaningful engagement, companionship, and reassurance while maintaining the person's routines and dignity.

Before a sit-in begins, we carry out an assessment to understand the person's needs, preferences, and any risks that need to be managed. This includes medication schedules, mobility needs, communication preferences, dietary requirements, and the activities the person enjoys. This information is documented in a care plan that the sit-in carer follows at every visit.

We know that trust is everything when it comes to letting someone new into your home. That is why we prioritise consistency — wherever possible, you will see the same familiar carer each time. Our staff are trained, DBS-checked, and registered with Social Care Wales, giving you confidence that your loved one is in safe hands."
      features={[
        'Companionship, conversation, and emotional support',
        'Supervision for safety and reassurance',
        'Light meal and drink preparation',
        'Medication prompting at scheduled times',
        'Engaging activities — reading, puzzles, games, music, gentle exercises',
        'Maintaining the person\'s daily routine and preferences',
        'Monitoring wellbeing and reporting any concerns',
        'Support with mobility and transfers within the home',
        'Assistance with toileting if needed',
        'Flexible durations — from a couple of hours to a full day',
        'Regular or one-off bookings to suit your schedule',
        'Emergency sit-in cover at short notice where possible',
        'Welsh language provision available',
        'Detailed handover and feedback after each visit',
      ]}
      personalChoiceContent="Even during a sit-in visit, the person receiving care remains in control. We respect their choices about how they spend their time — whether they want to chat, watch television, potter in the garden, or simply have quiet company while they rest.

Our carers are trained in person-centred approaches and understand that everyone is different. Some people welcome lively conversation and activities; others prefer a calm, unobtrusive presence. We match our approach to the individual, not the other way around.

Under the Social Services and Well-being (Wales) Act 2014, individuals have the right to be involved in decisions about their care and to have their preferences respected. This applies to every interaction, including sit-in visits. We ask about preferences in advance and adapt as we get to know the person better."
      standardsItems={[
        {
          title: 'CIW Registered Service',
          description: 'Our sit-in service operates under our Care Inspectorate Wales registration. It meets the same regulatory standards as all our care services under the Regulation and Inspection of Social Care (Wales) Act 2016.',
        },
        {
          title: 'Trained & Vetted Carers',
          description: 'Every sit-in carer holds an enhanced DBS check, is registered with Social Care Wales, and has completed the All Wales Induction Framework for Health and Social Care. They are trained in safeguarding, first aid, and person-centred care.',
        },
        {
          title: 'Risk Assessment & Care Planning',
          description: 'Each sit-in arrangement is underpinned by a personalised care plan and risk assessment. This ensures that the carer has all the information they need to provide safe, appropriate support during the visit.',
        },
        {
          title: 'Supporting Carers',
          description: 'Sit-in services support the goals of the Social Services and Well-being (Wales) Act 2014 by giving informal carers the break they need to maintain their own health and wellbeing. Carers have a right to an assessment and to access support like this.',
        },
        {
          title: 'Safeguarding Procedures',
          description: 'All staff follow the Wales Safeguarding Procedures and are trained to recognise and report concerns. Our robust reporting processes ensure that any safeguarding issues are dealt with swiftly and appropriately.',
        },
        {
          title: 'Feedback & Continuous Improvement',
          description: 'We actively seek feedback from both the person being cared for and their family after sit-in visits. This feedback is used to continually improve the quality and responsiveness of our service.',
        },
      ]}
      whoIsItFor="Sit-in services are ideal for family carers who need to leave the house for a few hours but do not want their loved one to be alone. It is perfect for attending medical appointments, going to work, running errands, attending social events, or simply taking time to recharge.

It is also suitable for individuals who live alone and would benefit from regular companionship and social interaction, helping to reduce isolation and improve mental wellbeing.

You can arrange a sit-in on a regular weekly basis, as a one-off booking, or at short notice when unexpected situations arise. Sit-in services may also be available through local authority or health board funding following an assessment of needs."
      imageSrc="/images/sitin-services.jpg"
    />
  );
}
