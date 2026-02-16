import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Domiciliary Care',
  description: 'Professional domiciliary care services in Denbighshire, Conwy and Wrexham. Personal care, medication support, and daily living assistance in your own home.',
};

export default function DomiciliaryCare() {
  return (
    <ServicePageLayout
      title="Domiciliary Care"
      description="Our domiciliary care service provides professional, person-centred support in the comfort of your own home. From personal care to medication management, our trained carers help you maintain your independence and quality of life."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      }
      features={[
        'Personal care — washing, dressing, grooming, and toileting support',
        'Medication prompting and administration',
        'Meal preparation and nutritional support',
        'Light housekeeping and laundry',
        'Shopping and errands',
        'Mobility assistance and fall prevention',
        'Companionship and social interaction',
        'Night-time care and sleep-in support',
        'Continence care',
        'Support with appointments and outings',
      ]}
      whoIsItFor="Our domiciliary care is for anyone who needs support to continue living safely and comfortably at home. This includes older adults, people with disabilities, those recovering from illness or surgery, and anyone who needs extra help with daily activities. We tailor every care plan to the individual."
    />
  );
}
