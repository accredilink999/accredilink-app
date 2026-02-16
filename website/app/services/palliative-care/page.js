import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Palliative Care',
  description: 'Palliative and end-of-life care services in Denbighshire, Conwy and Wrexham. Compassionate support ensuring dignity and comfort.',
};

export default function PalliativeCare() {
  return (
    <ServicePageLayout
      title="Palliative Care"
      description="When a loved one is approaching end of life, compassionate and dignified care matters most. Our palliative care team provides specialist support to ensure comfort, peace, and quality of life for both the individual and their family."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      }
      features={[
        'Person-centred end-of-life care planning',
        'Pain and symptom management support',
        'Personal care delivered with dignity and sensitivity',
        'Emotional and psychological support',
        'Family support and bereavement guidance',
        'Night sitting and 24-hour care availability',
        'Coordination with palliative care nurses and GPs',
        'Respecting wishes and advance care plans',
        'Creating a calm, comfortable environment at home',
        'Support through the final days and beyond',
      ]}
      whoIsItFor="Our palliative care is for individuals with a life-limiting illness who wish to remain at home during their final weeks or months. We also support the family — providing reassurance, practical help, and emotional support during an incredibly difficult time."
    />
  );
}
