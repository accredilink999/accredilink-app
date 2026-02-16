import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Emergency Response',
  description: 'Emergency care response services in Denbighshire, Conwy and Wrexham. Rapid response with trained emergency care responders available around the clock.',
};

export default function EmergencyResponse() {
  return (
    <ServicePageLayout
      title="Emergency Response"
      description="What sets us apart: Accredilink has its own trained emergency care responders on shift. When an urgent care situation arises, our team provides rapid, professional response — combining care expertise with pre-hospital emergency skills."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      features={[
        'Trained emergency care responders on shift',
        'Rapid response to urgent care situations',
        'Pre-hospital emergency care skills',
        'Falls response and welfare checks',
        'Urgent medication administration',
        'Emergency personal care',
        'Hospital discharge support at short notice',
        'Crisis intervention and stabilisation',
        'Coordination with NHS and emergency services',
        'Available outside normal care hours',
      ]}
      whoIsItFor="Our emergency response service is for anyone who needs urgent care support — whether it's a fall at home, an unexpected health event, a sudden change in care needs, or a carer who is unable to attend. Local authorities and health boards also use our rapid response capability for urgent community care needs."
    />
  );
}
