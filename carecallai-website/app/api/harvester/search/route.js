import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../campaigns/auth';

export const maxDuration = 60;

// In-memory cache
let cachedProviders = null;
let cacheTime = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

const CQC_CSV_URL = 'https://www.cqc.org.uk/sites/default/files/2026-02/18_February_2026_CQC_directory.csv';

// CSV columns (line 5 of file):
// Name, Also known as, Address, Postcode, Phone number, Service's website, Service types,
// Date of latest check, Specialisms/services, Provider name, Local authority, Region,
// Location URL, CQC Location ID, CQC Provider ID

function parseCsvRow(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values;
}

async function loadProviders() {
  if (cachedProviders && Date.now() - cacheTime < CACHE_TTL) {
    return cachedProviders;
  }

  const res = await fetch(CQC_CSV_URL, {
    headers: { 'User-Agent': 'CareCallAI/1.0 (hello@carecallai.co.uk)' },
  });

  if (!res.ok) throw new Error(`CQC CSV download failed: ${res.status}`);

  const text = await res.text();
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Find the header row (skip metadata rows at top)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].startsWith('Name,') || lines[i].startsWith('"Name"')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Could not find CSV headers');

  // Column indices based on known header order
  // Name(0), Also known as(1), Address(2), Postcode(3), Phone(4), Website(5),
  // Service types(6), Date of latest check(7), Specialisms(8), Provider name(9),
  // Local authority(10), Region(11), Location URL(12), CQC Location ID(13), CQC Provider ID(14)

  const providers = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const v = parseCsvRow(lines[i]);

    const serviceTypes = (v[6] || '').toLowerCase();
    // Only keep domiciliary care and care home services
    const isDom = serviceTypes.includes('homecare') || serviceTypes.includes('home care')
      || serviceTypes.includes('domiciliary') || serviceTypes.includes('supported living')
      || serviceTypes.includes('extra care');
    const isCareHome = serviceTypes.includes('care home') || serviceTypes.includes('nursing home')
      || serviceTypes.includes('residential');

    if (!isDom && !isCareHome) continue;

    providers.push({
      name: v[0] || '',
      address: v[2] || '',
      postcode: v[3] || '',
      phone: v[4] || '',
      website: v[5] || '',
      serviceTypes: v[6] || '',
      lastCheck: v[7] || '',
      specialisms: v[8] || '',
      providerName: v[9] || '',
      localAuthority: v[10] || '',
      region: v[11] || '',
      cqcUrl: v[12] || '',
      locationId: v[13] || '',
      careHome: isCareHome ? 'Y' : 'N',
      isDom,
    });
  }

  cachedProviders = providers;
  cacheTime = Date.now();
  console.log(`CQC CSV loaded: ${providers.length} care providers (from ${lines.length} total rows)`);
  return providers;
}

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { county, serviceType, search, page = 1, perPage = 30, hasWebsite } = await request.json();

  try {
    const all = await loadProviders();

    let filtered = all;

    // Filter by county / local authority
    if (county) {
      const c = county.toLowerCase();
      filtered = filtered.filter(p =>
        p.localAuthority.toLowerCase().includes(c) ||
        p.region.toLowerCase().includes(c)
      );
    }

    // Filter by service type
    if (serviceType === 'domiciliary') {
      filtered = filtered.filter(p => p.isDom);
    } else if (serviceType === 'care_home') {
      filtered = filtered.filter(p => p.careHome === 'Y');
    }

    // Filter by name / postcode search
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.providerName.toLowerCase().includes(s) ||
        p.postcode.toLowerCase().includes(s) ||
        p.address.toLowerCase().includes(s)
      );
    }

    // Filter to only those with websites (for email enrichment)
    if (hasWebsite) {
      filtered = filtered.filter(p => p.website && p.website.length > 3);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const companies = filtered.slice(start, start + perPage).map(p => ({
      name: p.name,
      website: p.website,
      domain: p.website ? (() => { try { return new URL(p.website.startsWith('http') ? p.website : 'https://' + p.website).hostname.replace(/^www\./, ''); } catch { return ''; } })() : '',
      phone: p.phone,
      postcode: p.postcode,
      address: p.address,
      providerName: p.providerName,
      localAuthority: p.localAuthority,
      region: p.region,
      serviceTypes: p.serviceTypes,
      specialisms: p.specialisms,
      lastCheck: p.lastCheck,
      cqcUrl: p.cqcUrl,
      locationId: p.locationId,
      careHome: p.careHome,
      source: 'cqc_directory',
    }));

    return NextResponse.json({
      success: true,
      total,
      page,
      perPage,
      totalPages,
      companies,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Also support GET for fetching available local authorities / regions
export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const all = await loadProviders();
    const authorities = new Set();
    const regions = new Set();
    all.forEach(p => {
      if (p.localAuthority) authorities.add(p.localAuthority);
      if (p.region) regions.add(p.region);
    });

    return NextResponse.json({
      success: true,
      totalProviders: all.length,
      localAuthorities: [...authorities].sort(),
      regions: [...regions].sort(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
