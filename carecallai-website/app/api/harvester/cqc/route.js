import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

const CQC_BASE = 'https://api.cqc.org.uk/public/v1';

export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('perPage') || '20';
  const careHome = searchParams.get('careHome') || '';
  const region = searchParams.get('region') || '';
  const localAuthority = searchParams.get('localAuthority') || '';
  const inspectionDirectorate = searchParams.get('inspectionDirectorate') || 'Adult social care';

  const params = new URLSearchParams({
    page,
    perPage,
    partnerCode: 'CareCallAI',
  });

  if (careHome) params.set('careHome', careHome);
  if (region) params.set('region', region);
  if (localAuthority) params.set('localAuthority', localAuthority);
  if (inspectionDirectorate) params.set('inspectionDirectorate', inspectionDirectorate);

  try {
    const res = await fetch(`${CQC_BASE}/locations?${params}`, {
      headers: { 'User-Agent': 'CareCallAI/1.0 (hello@carecallai.co.uk)' },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `CQC API error: ${res.status} ${text}` }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      total: data.total || 0,
      page: parseInt(page),
      perPage: parseInt(perPage),
      totalPages: Math.ceil((data.total || 0) / parseInt(perPage)),
      locations: (data.locations || []).map(loc => ({
        locationId: loc.locationId,
        locationName: loc.locationName,
        providerId: loc.providerId,
        providerName: loc.providerName || null,
        postalCode: loc.postalCode,
        region: loc.region || null,
        careHome: loc.careHome || null,
        inspectionDirectorate: loc.inspectionDirectorate || null,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch CQC data' }, { status: 500 });
  }
}
