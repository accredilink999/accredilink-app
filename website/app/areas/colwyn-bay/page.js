import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Colwyn Bay | Domiciliary Care Colwyn Bay',
  description: 'Professional domiciliary care and emergency response services in Colwyn Bay, Conwy. CIW regulated, local carers.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/colwyn-bay',
  },
};

export default function ColwynBayPage() {
  return (
    <LocationPageLayout
      name="Colwyn Bay"
      slug="colwyn-bay"
      county="Conwy"
      description="We provide care and support services across Colwyn Bay (Bae Colwyn) and surrounding areas including Old Colwyn, Rhos-on-Sea, and Mochdre."
      challenges="Colwyn Bay is one of the larger towns in Conwy county with a significant older population. The town's Victorian and Edwardian housing stock includes many properties with stairs and access challenges. Social isolation is a concern for many elderly residents, particularly those who live alone along the seafront or in hillside properties."
      localInfo={{
        hospital: 'Colwyn Bay Community Hospital. Glan Clwyd Hospital and Ysbyty Gwynedd for acute services.',
        gp: 'Multiple GP practices across Colwyn Bay, Old Colwyn, and Rhos-on-Sea.',
        council: 'Conwy County Borough Council Social Services.',
        funding: 'Contact Conwy Social Services for a care needs assessment.',
      }}
      nearbyAreas={[
        { name: 'Llandudno', href: '/areas/llandudno' },
        { name: 'Abergele', href: '/areas/abergele' },
        { name: 'Rhyl', href: '/areas/rhyl' },
        { name: 'Conwy County', href: '/areas/conwy' },
      ]}
    />
  );
}
