import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Llangollen | Domiciliary Care Llangollen',
  description: 'Care services in Llangollen and the Dee Valley. Domiciliary care, respite, and emergency response. CIW regulated.',
};

export default function LlangollenPage() {
  return (
    <LocationPageLayout
      name="Llangollen"
      county="Denbighshire"
      description="We provide care services in Llangollen and across the Dee Valley, including Corwen, Glyndyfrdwy, and surrounding rural communities."
      challenges="Llangollen and the Dee Valley are among the most rural parts of our coverage area. Scattered communities, narrow roads, and long distances between properties make care delivery challenging — but our experienced local team knows these valleys well. Many older residents live in isolated properties and depend on reliable, consistent care visits."
      localInfo={{
        hospital: 'The nearest hospital is Wrexham Maelor Hospital (approximately 20 minutes). Llangollen Health Centre provides local GP and community health services.',
        gp: 'Llangollen Health Centre and Corwen Health Centre.',
        council: 'Denbighshire County Council Social Services.',
        funding: 'Contact Denbighshire Social Services for a care needs assessment.',
      }}
      nearbyAreas={[
        { name: 'Wrexham', href: '/areas/wrexham' },
        { name: 'Ruthin', href: '/areas/ruthin' },
        { name: 'Denbigh', href: '/areas/denbigh' },
      ]}
    />
  );
}
