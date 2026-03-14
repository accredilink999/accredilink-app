import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../campaigns/auth';

// This endpoint is kept for backwards compatibility.
// With the CSV-based approach, all details are included in search results.
// If called, it returns a stub response — the frontend auto-populates details from search.

export async function GET(request, { params }) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { locationId } = await params;
  if (!locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });

  // Details are now included in search results from the CSV data.
  // Return a minimal response for backwards compat.
  return NextResponse.json({
    success: true,
    location: {
      locationId,
      note: 'Details are included in search results. No separate fetch needed.',
    },
  });
}
