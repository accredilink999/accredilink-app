import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Ruthin | Domiciliary Care Ruthin, Denbighshire',
  description: 'Domiciliary care, respite, and emergency response services in Ruthin and the surrounding Vale of Clwyd. CIW regulated local care provider.',
};

export default function RuthinPage() {
  return (
    <LocationPageLayout
      name="Ruthin"
      county="Denbighshire"
      description="We provide professional care services in the beautiful medieval town of Ruthin (Rhuthun) and across the surrounding Vale of Clwyd countryside."
      challenges="Ruthin is a picturesque but rural market town in the heart of the Vale of Clwyd. The surrounding area includes scattered farming communities and villages where residents may be many miles from the nearest services. Older residents in these rural areas face challenges with isolation, limited transport, and difficulty accessing healthcare. Our local team provides consistent, reliable care across Ruthin and its surrounding villages."
      localInfo={{
        hospital: 'Ruthin Community Hospital provides some outpatient and rehabilitation services. Glan Clwyd Hospital is approximately 20 minutes away for acute care.',
        gp: 'Ruthin Medical Partnership (Glasdir Surgery). Nearby surgeries in Denbigh and Corwen.',
        council: 'Denbighshire County Council. Ruthin County Hall hosts many council services.',
        funding: 'Contact Denbighshire Social Services for a care needs assessment. Welsh Government sets financial limits on care charges.',
      }}
      nearbyAreas={[
        { name: 'Denbigh', href: '/areas/denbigh' },
        { name: 'Llangollen', href: '/areas/llangollen' },
        { name: 'Wrexham', href: '/areas/wrexham' },
      ]}
    />
  );
}
