import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Respite Care',
  description: 'Respite care services in Denbighshire, Conwy and Wrexham. CIW-regulated short-term relief for family carers while your loved one receives professional, person-centred care.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/services/respite-care',
  },
};

export default function RespiteCare() {
  return (
    <ServicePageLayout
      title="Respite Care"
      slug="respite-care"
      description="Caring for a loved one is rewarding but demanding. Our respite care service gives family carers a well-deserved break, knowing their loved one is in safe, professional, and compassionate hands — fully regulated by Care Inspectorate Wales and delivered to the same high standards as all of our care services."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      }
      ourApproach="The Social Services and Well-being (Wales) Act 2014 recognises carers as individuals with their own needs and rights. It places a duty on local authorities to assess and support carers, and respite care is one of the most important forms of that support. At Accredilink, we take carer wellbeing seriously — because when the carer is supported, the person they care for benefits too.

Our respite service is not a lesser version of care. We provide the same thorough assessment, personalised care planning, and quality of support as our regular domiciliary care. Before respite begins, we meet with the family to understand the person's routines, preferences, medical needs, and the things that matter most to them. We aim for a seamless handover so the person being cared for feels comfortable and reassured.

We can provide respite at short notice for emergencies, or on a planned, regular basis so that carers can schedule their own time with confidence. Whether it is a few hours for a medical appointment, a weekend away, or longer-term support during a difficult period, we are here to help."
      features={[
        'Short-term care cover for hours, days, or longer periods',
        'Full personal care — washing, dressing, toileting, and grooming',
        'Medication prompting, administration, and management',
        'Companionship, emotional support, and meaningful engagement',
        'Maintaining the person\'s daily routines and preferences',
        'Meal preparation and nutritional support',
        'Light housekeeping and household management',
        'Mobility assistance and fall prevention',
        'Regular updates and communication with family members',
        'Flexible scheduling — planned or emergency respite at short notice',
        'Overnight, weekend, and bank holiday availability',
        'Support for individuals with dementia, learning disabilities, or complex needs',
        'Seamless handover with existing care arrangements',
        'Respite packages tailored to carer and service user needs',
      ]}
      personalChoiceContent="Respite care is about giving carers a break without compromising on the quality or familiarity of care the person receives. We understand that handing over care to someone new can feel difficult, which is why we take time to build trust before respite begins.

The person being cared for is always involved in decisions about their care. We respect their right to maintain their routines, make their own choices about daily life, and have their preferences honoured — from what time they get up, to what they eat, to how they spend their day. Under the Social Services and Well-being (Wales) Act 2014, we are committed to ensuring the individual's voice is central to their care, even during temporary arrangements.

For carers, we recognise that your knowledge of the person you care for is invaluable. We work in partnership with you, respecting your expertise while bringing our professional training and experience to provide the support needed."
      standardsItems={[
        {
          title: 'CIW Regulated Service',
          description: 'Our respite care is provided under our Care Inspectorate Wales registration and is subject to the same rigorous standards and inspection as all of our care services. We meet all requirements set out in the Regulation and Inspection of Social Care (Wales) Act 2016.',
        },
        {
          title: 'Carer Assessment Rights',
          description: 'Under the Social Services and Well-being (Wales) Act 2014, carers have a legal right to an assessment of their own needs. Respite care is often identified as a key support through this process. We work with local authorities in Denbighshire, Conwy, and Wrexham to support carers through this pathway.',
        },
        {
          title: 'Continuity of Care',
          description: 'We assign consistent, familiar carers wherever possible to ensure the person receiving care feels safe and comfortable. Our care plans are detailed and shared with the respite team so that nothing is missed during the handover.',
        },
        {
          title: 'Trained & Registered Staff',
          description: 'All of our respite carers are registered with Social Care Wales, hold relevant qualifications, and have completed the All Wales Induction Framework. They receive ongoing training in areas relevant to the individuals they support.',
        },
        {
          title: 'Safeguarding',
          description: 'All respite carers hold enhanced DBS checks and are trained in the Wales Safeguarding Procedures. We have robust safeguarding policies and work closely with local authority teams to protect vulnerable individuals at all times.',
        },
        {
          title: 'Quality Monitoring',
          description: 'We carry out regular spot checks, supervision visits, and service user feedback reviews to ensure our respite care consistently meets the standards expected by CIW, the people we support, and their families.',
        },
      ]}
      whoIsItFor="Respite care is for family carers who need a break — whether for a few hours, a holiday, a medical procedure, or during an emergency. It is also for the person being cared for, who benefits from professional support, fresh interaction, and continuity of their care plan.

You may be eligible for respite through your local authority following a carer's assessment under the Social Services and Well-being (Wales) Act 2014. We work with Denbighshire, Conwy, and Wrexham councils to deliver funded respite packages, and we also accept private arrangements for those who wish to organise their own support.

There is no minimum or maximum — whether you need a single afternoon or ongoing weekly respite, we build the package around your family's needs."
      imageSrc="/images/respite-care.jpg"
    />
  );
}
