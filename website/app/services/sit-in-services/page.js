import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Sit-in Services',
  description: 'Sit-in care services in Denbighshire, Conwy and Wrexham. Companionship and supervision so family carers can take a break.',
};

export default function SitInServices() {
  return (
    <ServicePageLayout
      title="Sit-in Services"
      description="Our sit-in service provides a trusted, friendly carer to stay with your loved one while you step out. Whether you need to attend an appointment, do the shopping, or simply have time to yourself — we're here."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      features={[
        'Companionship and conversation',
        'Supervision for safety and reassurance',
        'Light meal preparation and drinks',
        'Help with medication prompts',
        'Engaging activities — reading, games, TV, gentle exercises',
        'Maintaining the person\'s daily routine',
        'Flexible — from a couple of hours to a full day',
        'Regular or one-off bookings available',
      ]}
      whoIsItFor="Sit-in services are ideal for family carers who need to leave the house for a few hours but don't want their loved one to be alone. It's perfect for doctor's appointments, work commitments, social events, or simply taking time to recharge."
      imageSrc="/images/sitin-services.jpg"
    />
  );
}
