import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Llandudno | Domiciliary Care Llandudno',
  description: 'Domiciliary care, respite, and emergency response services in Llandudno. CIW regulated care provider serving North Wales.',
};

export default function LlandudnoPage() {
  return (
    <LocationPageLayout
      name="Llandudno"
      county="Conwy"
      description="We provide professional care services in Llandudno and the surrounding area including Deganwy, Craig-y-Don, and Penrhyn Bay."
      challenges="Llandudno is one of the most popular retirement destinations in Wales, with a high proportion of residents aged 65 and over. Many retirees have moved from other parts of the UK and may lack local family support. The hilly terrain and Victorian property types can create mobility challenges. Our team provides consistent, compassionate care to help residents remain independent in their homes."
      localInfo={{
        hospital: 'Llandudno General Hospital provides a range of outpatient and community services. Ysbyty Gwynedd (Bangor) for acute care.',
        gp: 'GP practices in Llandudno, Craig-y-Don, and Penrhyn Bay.',
        council: 'Conwy County Borough Council Social Services.',
        funding: 'Contact Conwy Social Services for a care needs assessment and funding enquiry.',
      }}
      nearbyAreas={[
        { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
        { name: 'Conwy County', href: '/areas/conwy' },
        { name: 'Abergele', href: '/areas/abergele' },
      ]}
    />
  );
}
