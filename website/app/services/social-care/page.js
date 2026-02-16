import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Social Care',
  description: 'Social care services in Denbighshire, Conwy and Wrexham. Community support to maintain independence and improve wellbeing.',
};

export default function SocialCare() {
  return (
    <ServicePageLayout
      title="Social Care"
      description="Our social care services support individuals to maintain their independence, build meaningful connections, and improve their overall wellbeing within their community. We believe that good care goes beyond physical needs."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      features={[
        'Community-based support and engagement',
        'Accompanied outings and social activities',
        'Support with daily living and independence skills',
        'Help accessing community resources and services',
        'Emotional support and companionship',
        'Wellbeing monitoring and reporting',
        'Support with budgeting and household management',
        'Advocacy and liaison with statutory services',
      ]}
      whoIsItFor="Our social care is for individuals who may be isolated, vulnerable, or in need of support to live independently in the community. This includes people with learning disabilities, mental health conditions, older adults at risk of loneliness, and anyone who needs help engaging with the world around them."
    />
  );
}
