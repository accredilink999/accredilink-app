import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Wrexham Town | Domiciliary Care Wrexham',
  description: 'Domiciliary care and emergency response in Wrexham town centre and surrounding areas. CIW regulated care provider.',
};

export default function WrexhamTownPage() {
  return (
    <LocationPageLayout
      name="Wrexham Town"
      county="Wrexham"
      description="We provide professional care services in Wrexham town and surrounding suburbs including Gresford, Rossett, Coedpoeth, Acton, and Rhosddu."
      challenges="As the largest town in North Wales, Wrexham has diverse care needs. The town centre and inner suburbs have pockets of deprivation with higher care demands, while the surrounding villages have an ageing population. Wrexham Maelor Hospital generates significant hospital discharge needs, and our rapid response capability supports safe, timely discharges."
      localInfo={{
        hospital: 'Wrexham Maelor Hospital — the main acute hospital for North East Wales with A&E, medical, and surgical wards.',
        gp: 'Numerous GP practices across Wrexham town, Gresford, Rossett, and Coedpoeth.',
        council: 'Wrexham County Borough Council Social Services — based in Wrexham town.',
        funding: 'Contact Wrexham Social Services for a care needs assessment. Hospital discharge teams can also refer.',
      }}
      nearbyAreas={[
        { name: 'Wrexham County', href: '/areas/wrexham' },
        { name: 'Llangollen', href: '/areas/llangollen' },
        { name: 'Denbighshire', href: '/areas/denbighshire' },
      ]}
    />
  );
}
