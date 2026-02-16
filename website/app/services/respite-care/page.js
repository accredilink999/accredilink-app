import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Respite Care',
  description: 'Respite care services in Denbighshire, Conwy and Wrexham. Short-term relief for family carers while your loved one receives professional care.',
};

export default function RespiteCare() {
  return (
    <ServicePageLayout
      title="Respite Care"
      description="Caring for a loved one is rewarding but demanding. Our respite care service gives family carers a well-deserved break, knowing their loved one is in safe, professional, and compassionate hands."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      }
      features={[
        'Short-term care cover for hours, days, or longer periods',
        'Full personal care and medication support',
        'Companionship and emotional support',
        'Maintaining routines and familiar activities',
        'Meal preparation and household support',
        'Regular updates to family members',
        'Flexible scheduling — planned or emergency respite',
        'Overnight and weekend availability',
      ]}
      whoIsItFor="Respite care is for family carers who need a break — whether for a few hours, a holiday, or during an emergency. It's also for the person being cared for, who benefits from fresh interaction and professional support. There's no minimum or maximum — we work around your needs."
      imageSrc="/images/respite-care.jpg"
    />
  );
}
