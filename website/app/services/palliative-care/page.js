import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Palliative Care',
  description: 'Palliative and end-of-life care services in Denbighshire, Conwy and Wrexham. Compassionate, CIW-regulated support ensuring dignity, comfort, and personal choice.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/services/palliative-care',
  },
};

export default function PalliativeCare() {
  return (
    <ServicePageLayout
      title="Palliative Care"
      slug="palliative-care"
      description="When a loved one is approaching end of life, compassionate and dignified care matters most. Our palliative care team provides specialist support to ensure comfort, peace, and quality of life for both the individual and their family — delivered with sensitivity, professionalism, and deep respect for personal wishes."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      }
      ourApproach="Providing palliative and end-of-life care is a privilege that we take seriously. At Accredilink, our palliative care service is designed to ensure that individuals who wish to remain at home during the final stage of their life can do so with dignity, comfort, and the support they need — on their terms.

We work alongside district nurses, palliative care specialists, GPs, and hospice teams to deliver a coordinated, multi-disciplinary approach. Our carers are trained to understand the physical, emotional, and spiritual needs of individuals at end of life, and to provide care that is gentle, unhurried, and deeply respectful.

We follow the principles outlined in the Welsh Government's End of Life Care Delivery Plan and work within the framework set out by the All Wales Standards for Palliative Care. Our goal is to help people live as well as possible for as long as possible, and to ensure that their final days are spent in comfort, surrounded by the people they love, in the place they call home."
      features={[
        'Person-centred end-of-life care planning and advance care plans',
        'Pain and symptom management support in partnership with clinical teams',
        'Personal care delivered with dignity, sensitivity, and patience',
        'Emotional and psychological support for the individual',
        'Family support, respite for family carers, and bereavement guidance',
        'Night sitting and waking night services',
        '24-hour care availability when needed',
        'Coordination with palliative care nurses, district nurses, and GPs',
        'Respecting and following advance care plans and DNAR decisions',
        'Creating a calm, comfortable, and familiar environment at home',
        'Spiritual and cultural care in line with the person\'s beliefs',
        'Practical support — meals, housekeeping, and medication management',
        'Support through the final days and in the immediate period after death',
        'Signposting to bereavement services and ongoing family support',
      ]}
      personalChoiceContent="End-of-life care is perhaps the most personal form of care there is. At Accredilink, we place the individual's wishes at the heart of everything we do. Where someone has made an advance care plan, recorded their preferences through Advance Decisions to Refuse Treatment (ADRT), or expressed wishes about how and where they want to be cared for, we honour those decisions completely.

We support individuals to maintain control over their daily life for as long as possible — choosing when to eat, when to rest, who visits, and how their environment is arranged. We never rush care or impose routines. If someone wants to sit in the garden, listen to music, or have their pet beside them, we make it happen.

Under the Mental Capacity Act 2005, where an individual lacks capacity to make a specific decision, we follow the best interests process and involve family members, advocates, and clinical teams to ensure decisions are made in the person's best interests and in line with their known wishes and values."
      standardsItems={[
        {
          title: 'CIW Regulated',
          description: 'Our palliative care is delivered under our Care Inspectorate Wales registration and is subject to the same regulatory standards and inspection as all of our services. We meet all requirements of the Regulation and Inspection of Social Care (Wales) Act 2016.',
        },
        {
          title: 'All Wales Standards for Palliative Care',
          description: 'We work within the All Wales Standards for Palliative Care and the Welsh Government\'s End of Life Care Delivery Plan, ensuring that our approach to end-of-life care meets nationally recognised standards for quality, compassion, and professionalism.',
        },
        {
          title: 'Advance Care Planning',
          description: 'We actively support advance care planning conversations and ensure that documented wishes — including DNAR decisions and Advance Decisions to Refuse Treatment — are recorded, shared with the care team, and followed.',
        },
        {
          title: 'Multi-Disciplinary Working',
          description: 'We work as part of a multi-disciplinary team alongside Betsi Cadwaladr University Health Board, hospice services, district nursing teams, and GPs to ensure seamless, joined-up care for every individual.',
        },
        {
          title: 'Staff Training & Competency',
          description: 'Our palliative care team receive specialist training in end-of-life care, pain and symptom recognition, communication skills, bereavement awareness, and the emotional demands of this work. All staff are registered with Social Care Wales.',
        },
        {
          title: 'Mental Capacity & Best Interests',
          description: 'Where individuals lack capacity for specific decisions, we follow the Mental Capacity Act 2005 and the associated Code of Practice. We always assume capacity, support decision-making, and involve families and professionals in best interests decisions.',
        },
      ]}
      whoIsItFor="Our palliative care is for individuals with a life-limiting illness who wish to remain at home during their final weeks or months. This includes people with terminal cancer, advanced heart failure, respiratory disease, neurological conditions, and other life-limiting diagnoses.

We also support the family — providing reassurance, practical help, and emotional support during an incredibly difficult time. Family members can be confident that their loved one is receiving compassionate, professional care at all hours, allowing them to focus on being present rather than managing care tasks.

Our palliative care can be arranged through Betsi Cadwaladr University Health Board, local authority funding, continuing healthcare (CHC) packages, or privately. We work closely with clinical teams to ensure a smooth transition into palliative care at home."
      imageSrc="/images/palliative-care.jpg"
    />
  );
}
