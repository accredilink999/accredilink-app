import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

// Allow longer execution for CSV download
export const maxDuration = 60;

// In-memory cache for parsed CSV data
let cachedProviders = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Known CQC directory CSV URLs (most recent first)
const CSV_URLS = [
  'https://www.cqc.org.uk/sites/default/files/2026-02/18_February_2026_CQC_directory.csv',
];

function parseCsvRow(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function clean(val) {
  return (val || '').replace(/^"|"$/g, '').trim();
}

// Flexible header mapping — handles multiple CQC CSV formats
function buildColumnMap(rawHeaders) {
  const map = {};
  rawHeaders.forEach((raw, idx) => {
    const h = clean(raw).toLowerCase();
    if (/^location.?id$|^cqc.location/i.test(h)) map.locationId = idx;
    else if (/^location.?name$|^name$/i.test(h) && !map.locationName) map.locationName = idx;
    else if (/provider.?name/i.test(h)) map.providerName = idx;
    else if (/care.?home/i.test(h) && !map.careHome) map.careHome = idx;
    else if (/location.?region$|^region$/i.test(h)) map.region = idx;
    else if (/local.?authority/i.test(h) && !map.localAuthority) map.localAuthority = idx;
    else if (/postal.?code$|^postcode$/i.test(h) && !map.postalCode) map.postalCode = idx;
    else if (/location.?telephone|^phone/i.test(h) && !map.phone) map.phone = idx;
    else if (/location.?web|service.*website|^website$/i.test(h) && !map.website) map.website = idx;
    else if (/provider.?web/i.test(h)) map.providerWebsite = idx;
    else if (/overall.?rating/i.test(h) && !map.rating) map.rating = idx;
    else if (/street.?address|^address$/i.test(h) && !map.address1) map.address1 = idx;
    else if (/address.?line.?2/i.test(h)) map.address2 = idx;
    else if (/^location.?city$|^city$/i.test(h)) map.city = idx;
    else if (/^location.?county$|^county$/i.test(h)) map.county = idx;
    else if (/inspection.?directorate/i.test(h) && !map.directorate) map.directorate = idx;
    else if (/primary.?inspection.?category/i.test(h) && !map.category) map.category = idx;
    else if (/beds/i.test(h) && !map.beds) map.beds = idx;
    else if (/type.?sector|^type$/i.test(h) && !map.typeSector) map.typeSector = idx;
  });
  return map;
}

async function loadProviders() {
  if (cachedProviders && Date.now() - cacheTime < CACHE_TTL) {
    return cachedProviders;
  }

  let csvText = null;

  // Try to discover latest CSV URL from CQC data page
  try {
    const pageRes = await fetch('https://www.cqc.org.uk/about-us/transparency/using-cqc-data', {
      headers: { 'User-Agent': 'CareCallAI/1.0 (hello@carecallai.co.uk)' },
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/https:\/\/www\.cqc\.org\.uk\/sites\/default\/files\/[\d-]+\/[\w_]+CQC_directory\.csv/);
      if (match) {
        const res = await fetch(match[0], {
          headers: { 'User-Agent': 'CareCallAI/1.0 (hello@carecallai.co.uk)' },
        });
        if (res.ok) csvText = await res.text();
      }
    }
  } catch {}

  // Fallback to known URLs
  if (!csvText) {
    for (const url of CSV_URLS) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'CareCallAI/1.0 (hello@carecallai.co.uk)' },
        });
        if (res.ok) {
          csvText = await res.text();
          break;
        }
      } catch {}
    }
  }

  if (!csvText) {
    throw new Error(
      'Unable to download CQC directory automatically. ' +
      'Please download the CSV from https://www.cqc.org.uk/about-us/transparency/using-cqc-data ' +
      'and upload it using the "Upload CQC CSV" section.'
    );
  }

  // Strip BOM if present
  if (csvText.charCodeAt(0) === 0xfeff) csvText = csvText.slice(1);

  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rawHeaders = parseCsvRow(lines[0]);
  const colMap = buildColumnMap(rawHeaders);

  const v = (values, key) => {
    const idx = colMap[key];
    return idx !== undefined ? clean(values[idx]) : '';
  };

  const providers = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCsvRow(lines[i]);

    // Only keep adult social care
    const dir = v(values, 'directorate');
    if (dir && !dir.toLowerCase().includes('adult social care')) continue;

    const website = v(values, 'website') || v(values, 'providerWebsite');

    providers.push({
      locationId: v(values, 'locationId'),
      locationName: v(values, 'locationName'),
      providerName: v(values, 'providerName'),
      careHome: v(values, 'careHome'),
      region: v(values, 'region'),
      localAuthority: v(values, 'localAuthority'),
      postalCode: v(values, 'postalCode'),
      phone: v(values, 'phone'),
      website,
      rating: v(values, 'rating'),
      address: [v(values, 'address1'), v(values, 'address2'), v(values, 'city'), v(values, 'county')].filter(Boolean).join(', '),
      city: v(values, 'city'),
      category: v(values, 'category'),
      beds: v(values, 'beds'),
      typeSector: v(values, 'typeSector'),
      inspectionDirectorate: dir,
    });
  }

  cachedProviders = providers;
  cacheTime = Date.now();
  console.log(`CQC directory loaded: ${providers.length} adult social care providers`);
  return providers;
}

export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  const careHome = searchParams.get('careHome') || '';
  const region = searchParams.get('region') || '';
  const localAuthority = searchParams.get('localAuthority') || '';
  const search = searchParams.get('search') || '';
  const hasWebsite = searchParams.get('hasWebsite') || '';

  try {
    const allProviders = await loadProviders();

    let filtered = allProviders;
    if (careHome) filtered = filtered.filter(p => p.careHome === careHome);
    if (region) filtered = filtered.filter(p => p.region === region);
    if (localAuthority) {
      const la = localAuthority.toLowerCase();
      filtered = filtered.filter(p => p.localAuthority?.toLowerCase().includes(la));
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.locationName?.toLowerCase().includes(s) ||
        p.providerName?.toLowerCase().includes(s) ||
        p.postalCode?.toLowerCase().includes(s)
      );
    }
    if (hasWebsite === 'Y') {
      filtered = filtered.filter(p => p.website && p.website.length > 3);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const locations = filtered.slice(start, start + perPage);

    return NextResponse.json({
      success: true,
      total,
      page,
      perPage,
      totalPages,
      locations,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Accept client-uploaded CSV data
export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { csvText } = await request.json();
  if (!csvText) return NextResponse.json({ error: 'csvText is required' }, { status: 400 });

  try {
    let text = csvText;
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const rawHeaders = parseCsvRow(lines[0]);
    const colMap = buildColumnMap(rawHeaders);
    const v = (values, key) => {
      const idx = colMap[key];
      return idx !== undefined ? clean(values[idx]) : '';
    };

    const providers = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCsvRow(lines[i]);
      const dir = v(values, 'directorate');
      if (dir && !dir.toLowerCase().includes('adult social care')) continue;
      const website = v(values, 'website') || v(values, 'providerWebsite');
      providers.push({
        locationId: v(values, 'locationId'),
        locationName: v(values, 'locationName'),
        providerName: v(values, 'providerName'),
        careHome: v(values, 'careHome'),
        region: v(values, 'region'),
        localAuthority: v(values, 'localAuthority'),
        postalCode: v(values, 'postalCode'),
        phone: v(values, 'phone'),
        website,
        rating: v(values, 'rating'),
        address: [v(values, 'address1'), v(values, 'address2'), v(values, 'city'), v(values, 'county')].filter(Boolean).join(', '),
        city: v(values, 'city'),
        category: v(values, 'category'),
        beds: v(values, 'beds'),
        typeSector: v(values, 'typeSector'),
        inspectionDirectorate: dir,
      });
    }

    // Update cache with uploaded data
    cachedProviders = providers;
    cacheTime = Date.now();

    return NextResponse.json({ success: true, total: providers.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
