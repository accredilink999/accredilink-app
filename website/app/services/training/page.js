import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Care Training Courses — Denbighshire & North Wales',
  description: 'Care training and pre-hospital emergency care courses in Denbighshire, Conwy and Wrexham. Accredited professional development for individuals and organisations.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/services/training',
  },
};

export default function Training() {
  return (
    <ServicePageLayout
      title="Training"
      slug="training"
      description="We don't just deliver care — we train others to do the same. Accredilink offers professional training in both care skills and pre-hospital emergency care, equipping individuals and organisations with the knowledge and confidence to respond effectively. Our courses are designed to meet the standards required by Care Inspectorate Wales and Social Care Wales."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
      ourApproach="Good training saves lives and improves the quality of care. At Accredilink, our training programmes are delivered by experienced practitioners who work in care and emergency response every day — not just classroom trainers reading from a manual. This means our courses are practical, realistic, and directly relevant to the situations learners will face.

Our care training is aligned with the All Wales Induction Framework for Health and Social Care, the requirements of Social Care Wales, and the qualifications framework for the Welsh care sector. We help care workers achieve and maintain the competencies needed to deliver safe, person-centred care in line with the Regulation and Inspection of Social Care (Wales) Act 2016.

Our pre-hospital emergency care (PHEC) training goes beyond standard first aid. These courses are designed for individuals who may need to respond to medical emergencies in community settings — including care workers, event staff, community first responders, and anyone who wants to develop life-saving skills. Our PHEC courses cover trauma management, medical emergencies, basic life support, and scene management, delivered through a combination of classroom teaching, practical scenarios, and assessed competencies."
      features={[
        'Care certificate training and induction programmes',
        'All Wales Induction Framework delivery',
        'Moving and handling — people and objects',
        'Medication management, administration, and safe handling',
        'First aid at work (FAW) and emergency first aid at work (EFAW)',
        'Basic life support (BLS) and automated external defibrillator (AED) use',
        'Pre-hospital emergency care (PHEC) — Levels 2, 3, and 4',
        'Trauma management and catastrophic bleeding control',
        'Safeguarding adults and children — all levels',
        'Dementia awareness and person-centred dementia care',
        'Palliative and end-of-life care awareness',
        'Infection prevention and control (IPC)',
        'Food safety and hygiene',
        'Mental health awareness and mental health first aid',
        'Health and safety in care settings',
        'Bespoke training packages designed for your organisation',
      ]}
      personalChoiceContent="We believe training should empower, not just inform. Our courses are designed to help learners think critically, make good decisions, and deliver care that respects the individual — not just follow a checklist.

Person-centred care is woven through every course we deliver. Whether it is a moving and handling session or a dementia awareness workshop, learners are taught to consider the person behind the care need — their preferences, their dignity, their right to make choices about their own life. This is not an add-on; it is the foundation of everything we teach.

For pre-hospital emergency care training, learners are taught to communicate with patients calmly, gain informed consent, and respect patient autonomy even in high-pressure situations. Our PHEC courses emphasise that clinical skill without compassion is not good care."
      standardsItems={[
        {
          title: 'Social Care Wales Approved',
          description: 'Our care training programmes are designed to meet the requirements of Social Care Wales for workforce registration and ongoing professional development. Completion of our courses contributes to the qualifications and learning needed to maintain registration.',
        },
        {
          title: 'All Wales Induction Framework',
          description: 'We deliver the full All Wales Induction Framework for Health and Social Care, ensuring new workers in the sector are equipped with the core knowledge and competencies required before they begin delivering unsupervised care.',
        },
        {
          title: 'Regulation and Inspection of Social Care (Wales) Act 2016',
          description: 'This Act requires care providers to ensure their staff are qualified, competent, and supported through ongoing training. Our programmes help providers meet these legal obligations and demonstrate compliance during CIW inspections.',
        },
        {
          title: 'Pre-Hospital Emergency Care Council (PHECC) Standards',
          description: 'Our pre-hospital emergency care courses are delivered in line with nationally recognised standards for pre-hospital care education. Courses include practical assessment and certification upon successful completion.',
        },
        {
          title: 'Continuous Professional Development (CPD)',
          description: 'Social Care Wales requires registered workers to demonstrate ongoing learning and development. Our training programmes are designed to support CPD requirements, with certificates and learning records provided for every course.',
        },
        {
          title: 'Quality Assurance',
          description: 'All training is delivered by qualified, experienced trainers. Courses are regularly reviewed and updated to reflect changes in legislation, best practice guidance, and sector requirements. We welcome feedback and use it to improve our delivery.',
        },
      ]}
      whoIsItFor="Our training is for care workers, support staff, family carers, community groups, and organisations who want to upskill their teams. Whether you are new to care or looking to gain advanced emergency care skills, we offer courses at all levels.

Care providers can commission us to deliver training to their staff as part of their CIW compliance and workforce development requirements. We also train individuals who are looking to enter the care sector or who want to update their qualifications.

Our pre-hospital emergency care courses are open to anyone — including community first responders, event medical staff, sports coaches, teachers, and members of the public who want to be prepared for emergencies. We can deliver training at your premises, at our own facilities, or at a venue of your choice across Denbighshire, Conwy, and Wrexham."
      imageSrc="/images/training.jpg"
    />
  );
}
