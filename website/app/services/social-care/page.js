import ServicePageLayout from '@/components/ServicePageLayout';

export const metadata = {
  title: 'Social Care',
  description: 'Social care services in Denbighshire, Conwy and Wrexham. Community-based support to maintain independence, build connections, and improve wellbeing.',
};

export default function SocialCare() {
  return (
    <ServicePageLayout
      title="Social Care"
      description="Our social care services support individuals to maintain their independence, build meaningful connections, and improve their overall wellbeing within their community. We believe that good care goes beyond physical needs — it includes emotional wellbeing, social participation, and the opportunity to live a fulfilling life."
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      ourApproach="The Social Services and Well-being (Wales) Act 2014 defines wellbeing broadly — it is not just about health, but also about social and economic wellbeing, participation in work, education, and recreation, and having control over day-to-day life. Our social care service is designed to support all of these dimensions.

We take a strengths-based approach, focusing on what the individual can do and what they want to achieve, rather than defining them by their needs or limitations. Our support workers help people build on their existing skills and connections to increase their independence and confidence over time.

Every support plan is co-produced with the individual. We use outcome-focused planning to identify personal goals — whether that is learning to manage a household budget, attending a community group, developing new skills, or rebuilding social connections that have been lost due to illness, disability, or life circumstances. Our approach is collaborative, respectful, and focused on long-term progress rather than creating dependency."
      features={[
        'Community-based support and social engagement',
        'Accompanied outings to shops, cafes, parks, and community events',
        'Support with daily living and independence skills',
        'Help accessing community resources, clubs, and services',
        'Emotional support, companionship, and active listening',
        'Wellbeing monitoring and progress reporting',
        'Support with budgeting, household management, and life skills',
        'Advocacy and liaison with statutory services',
        'Support to attend education, training, or volunteering opportunities',
        'Helping individuals maintain and build social networks',
        'Support with tenancy management and independent living',
        'Cultural and recreational activity support',
        'Digital inclusion — help using technology and staying connected',
        'Transition support for young people moving into adult services',
      ]}
      personalChoiceContent="Social care is fundamentally about empowering individuals to make their own choices and lead the life they want. At Accredilink, we never assume we know what is best for someone — we ask, we listen, and we work together.

The Social Services and Well-being (Wales) Act 2014 enshrines the right of every individual to have voice and control over their care and support. In practice, this means the person we support decides their goals, chooses the activities they want to take part in, and determines how their support is delivered. Our role is to facilitate, encourage, and provide the practical help needed to make those choices a reality.

We also recognise the importance of positive risk-taking. Living a full life involves taking chances — trying new things, going new places, meeting new people. We support individuals to take informed, proportionate risks that help them grow and develop, rather than wrapping people in unnecessary restrictions."
      standardsItems={[
        {
          title: 'CIW Regulated',
          description: 'Our social care services are registered with and regulated by Care Inspectorate Wales, meeting all requirements under the Regulation and Inspection of Social Care (Wales) Act 2016. We are subject to regular inspection and continuous improvement processes.',
        },
        {
          title: 'Social Services and Well-being (Wales) Act 2014',
          description: 'Our entire approach is built on this Act. We focus on personal outcomes, the five ways of working (prevention, integration, collaboration, involvement, and long-term impact), and ensuring every individual has voice and control over their support.',
        },
        {
          title: 'Well-being of Future Generations (Wales) Act 2015',
          description: 'Our social care work contributes to the goals of this Act — particularly a healthier, more equal, more cohesive Wales with resilient communities. We support individuals to participate in and contribute to their local community.',
        },
        {
          title: 'Staff Qualifications & Registration',
          description: 'All social care support workers are registered with Social Care Wales and hold relevant qualifications. They receive ongoing training in areas including mental health awareness, learning disability support, safeguarding, and person-centred active support.',
        },
        {
          title: 'Safeguarding & Protection',
          description: 'We follow the Wales Safeguarding Procedures and work closely with local authority safeguarding boards in Denbighshire, Conwy, and Wrexham. All staff are DBS-checked and trained to identify and report concerns.',
        },
        {
          title: 'Outcome-Focused Practice',
          description: 'We measure the quality of our service not just by what we do, but by the outcomes we help people achieve. We use regular reviews and feedback to track progress toward personal goals and adjust support plans accordingly.',
        },
      ]}
      whoIsItFor="Our social care is for individuals who may be isolated, vulnerable, or in need of support to live independently in the community. This includes people with learning disabilities, autistic individuals, people with mental health conditions, older adults at risk of loneliness, and anyone who needs help engaging with the world around them.

We also support young people transitioning from children's services into adult social care, individuals leaving institutional settings and moving into the community, and people who need help rebuilding their lives after a period of crisis or illness.

Our social care can be commissioned by local authorities, funded through direct payments, or arranged privately. We work across Denbighshire, Conwy, and Wrexham to deliver flexible, person-centred community support."
      imageSrc="/images/social-care.jpg"
    />
  );
}
