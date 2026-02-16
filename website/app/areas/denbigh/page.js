import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Denbigh | Domiciliary Care Denbigh, North Wales',
  description: 'Domiciliary care, emergency response, and support services in Denbigh and surrounding areas. Local carers, CIW regulated.',
};

export default function DenbighPage() {
  return (
    <LocationPageLayout
      name="Denbigh"
      county="Denbighshire"
      description="Based in the heart of Denbighshire, we provide professional care services in and around the historic market town of Denbigh (Dinbych). Our team knows this area intimately."
      challenges="Denbigh is a small market town surrounded by rural communities in the Vale of Clwyd. Many residents are elderly and live in scattered properties in the surrounding countryside, where reaching care services can be difficult. The town itself has an ageing population with growing demand for domiciliary care, respite, and emergency response. As a locally-based provider, we are well-placed to serve Denbigh and its surrounding villages."
      localInfo={{
        hospital: 'Denbigh Infirmary provides outpatient services. Glan Clwyd Hospital (Bodelwyddan) is the nearest district general hospital, approximately 15 minutes away.',
        gp: 'Denbigh Medical Practice (Bryn Heulog), Llangwyfan Surgery. Nearby surgeries in Henllan and St Asaph.',
        council: 'Denbighshire County Council — Denbigh is the county town and home to council offices.',
        funding: 'Contact Denbighshire Social Services for a care needs assessment. Funding may be available depending on assessed need.',
      }}
      nearbyAreas={[
        { name: 'Ruthin', href: '/areas/ruthin' },
        { name: 'St Asaph', href: '/areas/denbighshire' },
        { name: 'Rhyl', href: '/areas/rhyl' },
        { name: 'Llangollen', href: '/areas/llangollen' },
        { name: 'Prestatyn', href: '/areas/prestatyn' },
      ]}
    />
  );
}
