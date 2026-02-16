import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Domiciliary Care',
  description: 'Professional domiciliary care services in Denbighshire, Conwy and Wrexham. CIW-regulated personal care, medication support, and daily living assistance in your own home.',
};

export default function DomiciliaryCare() {
  return (
    <ServicePageLayout
      title="Domiciliary Care"
      description="Our domiciliary care service provides professional, person-centred support in the comfort of your own home. From personal care to medication management, our trained carers help you maintain your independence and quality of life — delivered to the highest standards set by Care Inspectorate Wales."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      }
      ourApproach="At Accredilink, we understand that receiving care at home is about much more than completing tasks — it is about preserving dignity, respecting personal routines, and supporting the individual to live as independently as possible. Every visit is planned around what matters most to you, not what is most convenient for us.

Our domiciliary care team are trained to the standards required under the Regulation and Inspection of Social Care (Wales) Act 2016 and work within the framework of the Social Services and Well-being (Wales) Act 2014. This means our care is outcomes-focused: we work with you to identify what you want to achieve and build your support around those goals.

We carry out thorough assessments before care begins, involving the individual, their family, and any relevant health or social care professionals. Care plans are reviewed regularly and updated whenever circumstances change — because good care adapts to the person, not the other way around. Our carers are matched to individuals based on skills, personality, and language where possible, including Welsh language provision."
      features={[
        'Personal care — washing, bathing, dressing, grooming, and toileting support',
        'Medication prompting, administration, and management',
        'Meal preparation and support with eating and drinking',
        'Light housekeeping, laundry, and maintaining a safe home environment',
        'Shopping, errands, and household tasks',
        'Mobility assistance, transfers, and fall prevention',
        'Companionship, conversation, and emotional support',
        'Night-time care, waking nights, and sleep-in support',
        'Continence care and catheter/stoma support',
        'Support with appointments, outings, and community access',
        'Reablement and recovery support following hospital discharge',
        'Specialist care for dementia, Parkinson\'s, MS, and other conditions',
        'End-of-life care in partnership with district nurses and palliative teams',
        'Technology-enabled care and telecare support where appropriate',
      ]}
      personalChoiceContent="We believe that the people we support should always be at the centre of decisions about their own care. Under the Social Services and Well-being (Wales) Act 2014, every individual has the right to have their voice heard and to be involved in planning and reviewing their care and support.

At Accredilink, this is not just a legal requirement — it is how we work. Before care begins, we sit down with you and your family to understand your preferences, your routines, your cultural and religious needs, and what independence means to you. You choose what time your carer arrives, what support you want, and how your care is delivered.

We actively promote your right to take positive risks and make your own choices about daily life. If you want to continue cooking your own meals with a little help, or walk to the shops rather than have someone go for you, we will support that — because independence is something we protect, not replace."
      standardsItems={[
        {
          title: 'Care Inspectorate Wales (CIW) Regulated',
          description: 'Accredilink is registered with and regulated by Care Inspectorate Wales. Our domiciliary care services are subject to regular inspection against national standards, ensuring the quality and safety of care we provide meets the requirements set out in Welsh law.',
        },
        {
          title: 'Social Services and Well-being (Wales) Act 2014',
          description: 'Our care is delivered in line with this Act, which places the individual at the centre of their care. We focus on what matters to you — your personal outcomes, wellbeing, and the things that are important in your daily life.',
        },
        {
          title: 'Regulation and Inspection of Social Care (Wales) Act 2016',
          description: 'This Act governs how care services in Wales are registered, regulated, and inspected. All of our care workers are registered with Social Care Wales, hold relevant qualifications, and undertake continuous professional development.',
        },
        {
          title: 'All Wales Induction Framework',
          description: 'Every new carer at Accredilink completes the All Wales Induction Framework for Health and Social Care before delivering unsupervised care. This covers core competencies including safeguarding, infection control, communication, health and safety, and person-centred care.',
        },
        {
          title: 'Safeguarding & Duty of Care',
          description: 'We follow the Wales Safeguarding Procedures and work closely with local authority safeguarding teams in Denbighshire, Conwy, and Wrexham. All staff have enhanced DBS checks and receive regular safeguarding training. We have a zero-tolerance approach to abuse and neglect.',
        },
        {
          title: 'Welsh Language Standards',
          description: 'We are committed to the Active Offer under the More Than Just Words framework, ensuring Welsh-speaking individuals can receive care in their preferred language. We actively recruit Welsh-speaking carers across our coverage area.',
        },
      ]}
      whoIsItFor="Our domiciliary care is for anyone who needs support to continue living safely and comfortably at home. This includes older adults who need help with daily activities, people living with physical disabilities or long-term health conditions, those recovering from illness, surgery, or a hospital stay, and individuals with cognitive conditions such as dementia.

We also support younger adults with complex care needs and work alongside families who are providing informal care but need professional support at certain times of the day or week. Our service is available to people funded by the local authority, health board, or who are arranging and funding their own care privately.

There is no minimum care package — whether you need a 30-minute morning visit or 24-hour live-in care, we will build a package around your needs."
      imageSrc="/images/domiciliary-care.jpg"
    />
  );
}
