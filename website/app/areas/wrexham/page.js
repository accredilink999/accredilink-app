import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Wrexham | Domiciliary Care Wrexham',
  description: 'Professional domiciliary care and emergency response across Wrexham county borough. Covering Wrexham town, Chirk, Ruabon, Cefn Mawr, Overton, and surrounding areas.',
};

export default function WrexhamPage() {
  return (
    <LocationPageLayout
      name="Wrexham"
      county="Wrexham County Borough"
      description="We provide care and support services across Wrexham county borough — from the centre of Wrexham to the border communities of Chirk, Overton, and the Ceiriog Valley."
      challenges="Wrexham is the largest town in North Wales and serves as a regional hub. The borough includes both urban and deeply rural areas, with communities stretching from the Welsh-English border to the foothills of the Berwyn mountains. Many older residents live in former mining villages and rural hamlets where public transport is limited. Our team provides reliable, consistent care across the whole borough."
      localInfo={{
        hospital: 'Wrexham Maelor Hospital is the main acute hospital for the area, providing A&E, medical, and surgical services.',
        gp: 'Numerous GP practices across Wrexham town, Chirk, Ruabon, Cefn Mawr, Coedpoeth, Gresford, and surrounding villages.',
        council: 'Wrexham County Borough Council Social Services — responsible for adult social care needs assessments and care funding.',
        funding: 'Care may be funded by Wrexham County Borough Council following a social care needs assessment. See our funding guidance page.',
      }}
      nearbyAreas={[
        { name: 'Wrexham Town', href: '/areas/wrexham-town' },
        { name: 'Llangollen', href: '/areas/llangollen' },
        { name: 'Denbighshire', href: '/areas/denbighshire' },
        { name: 'Conwy', href: '/areas/conwy' },
      ]}
    />
  );
}
