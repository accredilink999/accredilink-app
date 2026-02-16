import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Rhyl | Domiciliary Care Rhyl, Denbighshire',
  description: 'Professional domiciliary care, respite, and emergency response services in Rhyl and surrounding coastal areas. CIW regulated, local team.',
};

export default function RhylPage() {
  return (
    <LocationPageLayout
      name="Rhyl"
      county="Denbighshire"
      description="We provide comprehensive care services in Rhyl and the surrounding North Wales coast. As the largest town in Denbighshire, Rhyl has significant care needs and our team is here to help."
      challenges="Rhyl is one of the most deprived areas in Wales, with higher than average rates of disability, chronic illness, and social isolation. The town has a significant older population and many residents live alone. The combination of health deprivation, limited mobility, and social isolation creates a strong need for reliable, compassionate domiciliary care. We serve Rhyl and the wider coastal strip including Kinmel Bay and Towyn."
      localInfo={{
        hospital: 'Glan Clwyd Hospital (Bodelwyddan) is the nearest district general hospital, approximately 10 minutes away. The Royal Alexandra Hospital in Rhyl provides community health services.',
        gp: 'Multiple GP practices in Rhyl including Lakeside Medical Practice, Clarence Medical Centre, and others.',
        council: 'Denbighshire County Council Social Services. Rhyl has a One Stop Shop for council services.',
        funding: 'Denbighshire County Council manages care funding applications. Many Rhyl residents qualify for funded or partially-funded care.',
      }}
      nearbyAreas={[
        { name: 'Prestatyn', href: '/areas/prestatyn' },
        { name: 'Denbigh', href: '/areas/denbigh' },
        { name: 'Abergele', href: '/areas/abergele' },
        { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
      ]}
    />
  );
}
