import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Training Services',
  description: 'Care training and pre-hospital emergency care courses in Denbighshire, Conwy and Wrexham. Professional development for individuals and organisations.',
};

export default function Training() {
  return (
    <ServicePageLayout
      title="Training"
      description="We don't just deliver care — we train others to do the same. Accredilink offers professional training in both care skills and pre-hospital emergency care, equipping individuals and organisations with the knowledge and confidence to respond effectively."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
      features={[
        'Care certificate training and induction programmes',
        'Moving and handling training',
        'Medication management and administration',
        'First aid and basic life support (BLS)',
        'Pre-hospital emergency care (PHEC) courses',
        'Safeguarding adults and children',
        'Dementia awareness and care',
        'Palliative and end-of-life care training',
        'Infection prevention and control',
        'Bespoke training packages for organisations',
      ]}
      whoIsItFor="Our training is for care workers, support staff, family carers, community groups, and organisations who want to upskill their teams. Whether you're new to care or looking to gain advanced emergency care skills, we offer courses at all levels. We can deliver training at your premises or ours."
    />
  );
}
