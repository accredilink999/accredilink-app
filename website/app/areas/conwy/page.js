import LocationPageLayout from '@/components/LocationPageLayout';

export const metadata = {
  title: 'Care Services in Conwy | Domiciliary Care Conwy County',
  description: 'Professional domiciliary care and emergency response across Conwy county. Covering Colwyn Bay, Llandudno, Abergele, Conwy Town, Llanrwst, and surrounding areas.',
};

export default function ConwyPage() {
  return (
    <LocationPageLayout
      name="Conwy"
      county="Conwy County Borough"
      description="Our care services extend across Conwy county — from the popular coastal towns of Llandudno and Colwyn Bay to the rural Conwy Valley communities around Llanrwst and Betws-y-Coed."
      challenges="Conwy county has one of the highest proportions of older residents in Wales. The mix of busy coastal towns and remote valley communities presents unique care challenges. Seasonal population changes in tourist areas can affect service availability, while rural Conwy Valley communities often have limited access to health and social care. Our team knows these communities and is equipped to provide reliable, consistent care."
      localInfo={{
        hospital: 'Llandudno General Hospital and Abergele Hospital provide local services. Glan Clwyd Hospital (Bodelwyddan) and Ysbyty Gwynedd (Bangor) for acute care.',
        gp: 'GP practices in Colwyn Bay, Llandudno, Abergele, Conwy, Llanrwst, Penmaenmawr, and Old Colwyn.',
        council: 'Conwy County Borough Council Social Services — handles adult care assessments and commissioning.',
        funding: 'Care funding may be available through Conwy County Borough Council following a needs assessment. Welsh Government also provides financial limits on care charges.',
      }}
      nearbyAreas={[
        { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
        { name: 'Llandudno', href: '/areas/llandudno' },
        { name: 'Abergele', href: '/areas/abergele' },
        { name: 'Denbighshire', href: '/areas/denbighshire' },
        { name: 'Wrexham', href: '/areas/wrexham' },
      ]}
    />
  );
}
