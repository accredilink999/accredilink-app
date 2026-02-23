import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Denbighshire | Domiciliary Care Denbighshire',
  description: 'Professional domiciliary care, emergency response, and support services across Denbighshire. CIW regulated. Covering Denbigh, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, and Llangollen.',
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/denbighshire',
  },
};

export default function DenbighshirePage() {
  return (
    <LocationPageLayout
      name="Denbighshire"
      slug="denbighshire"
      county="Denbighshire (Sir Ddinbych)"
      description="We provide a full range of professional care and support services across Denbighshire — from the coast at Rhyl and Prestatyn to the rural Dee Valley around Llangollen and Corwen."
      challenges="Denbighshire has a growing older population, with many people living in rural and semi-rural communities where accessing services can be challenging. Transport links are limited in inland areas, and the mix of coastal towns and isolated rural properties requires a care provider who knows the area well. Our local team understands Denbighshire's geography and communities — from the care homes and sheltered housing in Rhyl to the scattered farmhouses of the Clwydian Range."
      localInfo={{
        hospital: 'Glan Clwyd Hospital (Bodelwyddan) is the main district general hospital. Ruthin Community Hospital and Denbigh Infirmary also provide local services.',
        gp: 'GP practices across the county including surgeries in Denbigh, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, and Llangollen.',
        council: 'Denbighshire County Council Social Services — responsible for adult social care assessments and funding decisions.',
        funding: 'Care funding may be available through Denbighshire County Council following a needs assessment. See our funding guidance page for more details.',
      }}
      nearbyAreas={[
        { name: 'Denbigh', href: '/areas/denbigh' },
        { name: 'Ruthin', href: '/areas/ruthin' },
        { name: 'Rhyl', href: '/areas/rhyl' },
        { name: 'Prestatyn', href: '/areas/prestatyn' },
        { name: 'Llangollen', href: '/areas/llangollen' },
        { name: 'Conwy', href: '/areas/conwy' },
        { name: 'Wrexham', href: '/areas/wrexham' },
      ]}
    />
  );
}
