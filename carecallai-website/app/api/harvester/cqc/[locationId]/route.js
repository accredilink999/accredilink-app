import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../campaigns/auth';

const CQC_BASE = 'https://api.cqc.org.uk/public/v1';

export async function GET(request, { params }) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { locationId } = await params;
  if (!locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });

  try {
    const res = await fetch(`${CQC_BASE}/locations/${locationId}?partnerCode=CareCallAI`, {
      headers: { 'User-Agent': 'CareCallAI/1.0 (hello@carecallai.co.uk)' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `CQC API error: ${res.status}` }, { status: 502 });
    }

    const loc = await res.json();

    return NextResponse.json({
      success: true,
      location: {
        locationId: loc.locationId,
        locationName: loc.locationName,
        providerId: loc.providerId,
        providerName: loc.providerName || null,
        type: loc.type || null,
        registrationStatus: loc.registrationStatus || null,
        postalAddressLine1: loc.postalAddressLine1 || null,
        postalAddressLine2: loc.postalAddressLine2 || null,
        postalAddressTownCity: loc.postalAddressTownCity || null,
        postalAddressCounty: loc.postalAddressCounty || null,
        postalCode: loc.postalCode || null,
        region: loc.region || null,
        localAuthority: loc.localAuthority || null,
        phone: loc.mainPhoneNumber || null,
        website: loc.website || null,
        careHome: loc.careHome || null,
        inspectionDirectorate: loc.inspectionDirectorate || null,
        currentRatings: loc.currentRatings || null,
        lastInspection: loc.lastInspection || null,
        registrationDate: loc.registrationDate || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to fetch location details' }, { status: 500 });
  }
}
