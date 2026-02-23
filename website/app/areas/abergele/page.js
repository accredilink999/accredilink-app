import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Abergele | Domiciliary Care Abergele',
  description: 'Professional domiciliary care and support services in Abergele and Towyn, Conwy. CIW regulated local care provider.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/abergele',
  },
};

export default function AbergelePage() {
  return (
    <LocationPageLayout
      name="Abergele"
      slug="abergele"
      county="Conwy"
      description="We provide care services in Abergele, Towyn, Kinmel Bay, and surrounding areas — connecting the Denbighshire and Conwy parts of our coverage."
      challenges="Abergele sits at the junction of Conwy and Denbighshire, serving as a gateway between the coastal and inland communities. The town and neighbouring Towyn/Kinmel Bay have a mix of permanent residents and holiday home communities. Social deprivation in parts of Towyn and Kinmel Bay creates significant care needs."
      localInfo={{
        hospital: 'Abergele Hospital provides outpatient and rehabilitation services. Glan Clwyd Hospital for acute care.',
        gp: 'Abergele Surgery and nearby practices.',
        council: 'Conwy County Borough Council Social Services.',
        funding: 'Contact Conwy Social Services for a care needs assessment.',
      }}
      nearbyAreas={[
        { name: 'Rhyl', href: '/areas/rhyl' },
        { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
        { name: 'Denbigh', href: '/areas/denbigh' },
        { name: 'Conwy County', href: '/areas/conwy' },
      ]}
    />
  );
}
