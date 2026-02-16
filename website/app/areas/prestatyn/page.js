import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Prestatyn | Domiciliary Care Prestatyn',
  description: 'Domiciliary care and support services in Prestatyn, Denbighshire. CIW regulated local care provider covering the North Wales coast.',
};

export default function PrestatynPage() {
  return (
    <LocationPageLayout
      name="Prestatyn"
      county="Denbighshire"
      description="We provide professional care services in Prestatyn and the surrounding coastal area, supporting residents to live safely and independently at home."
      challenges="Prestatyn is a popular coastal town with a significant retired population. Many older residents have relocated here for retirement and may not have local family support networks. The town's ageing population creates growing demand for domiciliary care, companionship, and emergency response services."
      localInfo={{
        hospital: 'Glan Clwyd Hospital (Bodelwyddan) is approximately 15 minutes away. Prestatyn Community Health Centre provides local health services.',
        gp: 'Prestatyn Medical Group and other local practices.',
        council: 'Denbighshire County Council Social Services.',
        funding: 'Contact Denbighshire Social Services for a care needs assessment.',
      }}
      nearbyAreas={[
        { name: 'Rhyl', href: '/areas/rhyl' },
        { name: 'Denbigh', href: '/areas/denbigh' },
        { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
      ]}
    />
  );
}
