import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact Us | Home Care Services Denbighshire, Conwy & Wrexham',
  description: 'Get in touch with Accredilink Community Response Taskforce for domiciliary care, respite care, emergency response and specialist care services in Denbighshire, Conwy and Wrexham. Call 01824 538688.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/contact',
  },
  openGraph: {
    title: 'Contact Accredilink CRT | Care Services in North Wales',
    description: 'Discuss your care needs with our team. Free, no-obligation assessments. Call 01824 538688 or email enquiries@accredilinkcare.co.uk.',
    url: 'https://accredilinkcare.co.uk/contact',
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
