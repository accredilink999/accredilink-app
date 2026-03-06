'use client';

import { useState, useEffect } from 'react';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
}

const CQC_REGIONS = [
  'London',
  'South East',
  'South West',
  'East of England',
  'East Midlands',
  'West Midlands',
  'North East',
  'North West',
  'Yorkshire and The Humber',
];

const RATING_COLORS = {
  Outstanding: 'bg-green-600 text-white',
  Good: 'bg-green-100 text-green-700',
  'Requires improvement': 'bg-amber-100 text-amber-700',
  Inadequate: 'bg-red-100 text-red-700',
};

const TABS = ['CQC Search', 'CIW Import', 'Import History'];

export default function HarvesterPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // CQC Search state
  const [cqcRegion, setCqcRegion] = useState('');
  const [cqcCareHome, setCqcCareHome] = useState('');
  const [cqcLocalAuth, setCqcLocalAuth] = useState('');
  const [cqcPage, setCqcPage] = useState(1);
  const [cqcPerPage] = useState(20);
  const [cqcResults, setCqcResults] = useState(null);
  const [cqcLoading, setCqcLoading] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [locationDetails, setLocationDetails] = useState({});
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResults, setEnrichResults] = useState({});
  const [manualEmails, setManualEmails] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // CIW Import state
  const [ciwFile, setCiwFile] = useState(null);
  const [ciwPreview, setCiwPreview] = useState(null);
  const [ciwImporting, setCiwImporting] = useState(false);
  const [ciwImportResult, setCiwImportResult] = useState(null);

  // Import History state
  const [historyStats, setHistoryStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Auth check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/admin';
      return;
    }
    try {
      const payload = JSON.parse(atob(token));
      if (payload.role !== 'platform_admin' || Date.now() - payload.ts > 86400000) {
        window.location.href = '/admin';
        return;
      }
      setIsLoggedIn(true);
    } catch {
      window.location.href = '/admin';
    }
    setChecking(false);
  }, []);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  // CQC Search
  async function searchCQC(page = 1) {
    setCqcLoading(true);
    setCqcPage(page);
    setImportResult(null);
    try {
      const params = new URLSearchParams({ page, perPage: cqcPerPage });
      if (cqcRegion) params.set('region', cqcRegion);
      if (cqcCareHome) params.set('careHome', cqcCareHome);
      if (cqcLocalAuth) params.set('localAuthority', cqcLocalAuth);

      const res = await fetch(`/api/harvester/cqc?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setCqcResults(data);
        setSelectedLocations(new Set());
      } else {
        alert(data.error || 'Search failed');
      }
    } catch (err) {
      alert('Search failed: ' + err.message);
    }
    setCqcLoading(false);
  }

  // Fetch location details
  async function fetchLocationDetail(locationId) {
    if (locationDetails[locationId]) {
      setExpandedLocation(expandedLocation === locationId ? null : locationId);
      return;
    }
    try {
      const res = await fetch(`/api/harvester/cqc/${locationId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setLocationDetails(prev => ({ ...prev, [locationId]: data.location }));
        setExpandedLocation(locationId);
      }
    } catch (err) {
      console.error('Failed to fetch details:', err);
    }
  }

  // Toggle selection
  function toggleSelect(locationId) {
    setSelectedLocations(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) next.delete(locationId);
      else next.add(locationId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!cqcResults?.locations) return;
    if (selectedLocations.size === cqcResults.locations.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(cqcResults.locations.map(l => l.locationId)));
    }
  }

  // Enrich selected — find emails from websites
  async function enrichSelected() {
    const selected = cqcResults?.locations?.filter(l => selectedLocations.has(l.locationId)) || [];
    if (selected.length === 0) return alert('Select locations first');

    setEnriching(true);

    // First, fetch details for all selected that we don't have yet
    const needDetails = selected.filter(l => !locationDetails[l.locationId]);
    for (const loc of needDetails) {
      try {
        const res = await fetch(`/api/harvester/cqc/${loc.locationId}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) {
          setLocationDetails(prev => ({ ...prev, [loc.locationId]: data.location }));
        }
      } catch {}
    }

    // Collect website URLs
    const allDetails = { ...locationDetails };
    for (const loc of needDetails) {
      if (!allDetails[loc.locationId]) continue;
    }

    const urls = selected
      .map(l => {
        const detail = allDetails[l.locationId] || locationDetails[l.locationId];
        return detail?.website;
      })
      .filter(Boolean);

    if (urls.length === 0) {
      setEnriching(false);
      return alert('No websites found for selected locations. Fetch details first.');
    }

    // Send to enrichment API (max 20 at a time)
    try {
      const res = await fetch('/api/harvester/enrich', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ urls: urls.slice(0, 20) }),
      });
      const data = await res.json();
      if (data.success) {
        const byUrl = {};
        data.results.forEach(r => { byUrl[r.url] = r; });

        // Map back to location IDs
        const newEnrich = {};
        selected.forEach(l => {
          const detail = allDetails[l.locationId] || locationDetails[l.locationId];
          if (detail?.website) {
            const normalUrl = detail.website.startsWith('http') ? detail.website : 'https://' + detail.website;
            const result = byUrl[detail.website] || byUrl[normalUrl];
            if (result?.emails?.length > 0) {
              newEnrich[l.locationId] = result.emails;
              // Auto-fill first email
              setManualEmails(prev => ({
                ...prev,
                [l.locationId]: prev[l.locationId] || result.emails[0],
              }));
            }
          }
        });
        setEnrichResults(prev => ({ ...prev, ...newEnrich }));

        const found = Object.keys(newEnrich).length;
        alert(`Email enrichment complete: found emails for ${found} of ${selected.length} locations`);
      }
    } catch (err) {
      alert('Enrichment failed: ' + err.message);
    }
    setEnriching(false);
  }

  // Import selected to email contacts
  async function importSelected() {
    const selected = cqcResults?.locations?.filter(l => selectedLocations.has(l.locationId)) || [];
    if (selected.length === 0) return alert('Select locations first');

    // Build contacts — only import ones that have an email
    const contacts = [];
    for (const loc of selected) {
      const email = manualEmails[loc.locationId];
      if (!email || !email.includes('@')) continue;

      const detail = locationDetails[loc.locationId] || {};
      contacts.push({
        email: email.toLowerCase().trim(),
        name: loc.locationName || detail.locationName || '',
        organisation: loc.providerName || detail.providerName || loc.locationName || '',
        regulator: 'cqc',
        provider_type: loc.careHome === 'Y' ? 'care_home' : 'domiciliary',
        region: loc.region || detail.region || '',
        registration_number: loc.locationId,
        data_source: 'cqc_register',
        tags: ['cqc_harvested'],
        status: 'active',
      });
    }

    if (contacts.length === 0) {
      return alert('No selected locations have email addresses. Add emails manually or use Enrich first.');
    }

    setImporting(true);
    try {
      const res = await fetch('/api/campaigns/contacts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ contacts }),
      });
      const data = await res.json();
      if (data.success || data.imported !== undefined) {
        setImportResult({
          imported: data.imported || contacts.length,
          skipped: data.skipped || 0,
          total: contacts.length,
        });
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    setImporting(false);
  }

  // CIW CSV import
  function handleCiwFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCiwFile(file);
    setCiwImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setCiwPreview({ headers: [], rows: [], total: 0 });
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });
      setCiwPreview({ headers, rows, total: lines.length - 1 });
    };
    reader.readAsText(file);
  }

  async function importCiwCsv() {
    if (!ciwFile) return;
    setCiwImporting(true);
    setCiwImportResult(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setCiwImporting(false);
        return alert('No data rows found');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const contacts = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        // Map CIW columns to our schema
        const email = row.email || row['e-mail'] || row['email address'] || row.contact_email || '';
        if (!email.includes('@')) continue;

        contacts.push({
          email: email.toLowerCase().trim(),
          name: row.name || row['service name'] || row['contact name'] || row.contact_name || '',
          organisation: row.organisation || row.organization || row['provider name'] || row.provider || row['service name'] || '',
          regulator: 'ciw',
          provider_type: (row.type || row['service type'] || row.provider_type || '').toLowerCase().includes('home')
            ? 'care_home' : 'domiciliary',
          region: row.region || row['local authority'] || row.area || 'Wales',
          registration_number: row['registration number'] || row.registration_number || row['reg number'] || '',
          data_source: 'ciw_register',
          tags: ['ciw_harvested'],
          status: 'active',
        });
      }

      if (contacts.length === 0) {
        setCiwImporting(false);
        return alert('No valid email addresses found in CSV. Ensure the file has an "email" column.');
      }

      try {
        const res = await fetch('/api/campaigns/contacts', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ contacts }),
        });
        const data = await res.json();
        setCiwImportResult({
          imported: data.imported || contacts.length,
          skipped: data.skipped || 0,
          total: contacts.length,
          source: 'CIW Register',
        });
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
      setCiwImporting(false);
    };
    reader.readAsText(ciwFile);
  }

  // Import History — fetch contact stats
  async function loadHistory() {
    setHistoryLoading(true);
    try {
      // Get counts by source
      const sources = ['cqc_register', 'ciw_register', 'csv_import', 'manual'];
      const stats = {};

      for (const source of sources) {
        const res = await fetch(
          `/api/campaigns/contacts?data_source=${source}&count_only=true&status=all`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        stats[source] = data.total || data.count || 0;
      }

      // Get total active
      const activeRes = await fetch('/api/campaigns/contacts?count_only=true', { headers: authHeaders() });
      const activeData = await activeRes.json();

      // Get total unsubscribed
      const unsubRes = await fetch('/api/campaigns/contacts?count_only=true&status=unsubscribed', { headers: authHeaders() });
      const unsubData = await unsubRes.json();

      setHistoryStats({
        bySource: stats,
        totalActive: activeData.total || activeData.count || 0,
        totalUnsubscribed: unsubData.total || unsubData.count || 0,
      });
    } catch (err) {
      console.error('Failed to load history:', err);
    }
    setHistoryLoading(false);
  }

  // Load history when tab is selected
  useEffect(() => {
    if (activeTab === 2 && !historyStats) loadHistory();
  }, [activeTab]);

  if (checking || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">&larr; Admin</a>
                <h1 className="text-2xl font-bold text-slate-800">Contact Harvester</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Search CQC &amp; CIW directories, find provider emails, import to campaigns
              </p>
            </div>
            <a
              href="/admin/campaigns"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              View Campaigns &rarr;
            </a>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === i
                    ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 0 && renderCQCTab()}
        {activeTab === 1 && renderCIWTab()}
        {activeTab === 2 && renderHistoryTab()}
      </div>
    </div>
  );

  // ─── TAB 1: CQC Search ──────────────────────────────────────────
  function renderCQCTab() {
    return (
      <div className="space-y-6">
        {/* Search Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Search CQC Register (England)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Search the Care Quality Commission&apos;s public register for care providers. Find their contact details and import into your email campaigns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Region</label>
              <select
                value={cqcRegion}
                onChange={e => setCqcRegion(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Regions</option>
                {CQC_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Service Type</label>
              <select
                value={cqcCareHome}
                onChange={e => setCqcCareHome(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="Y">Care Homes</option>
                <option value="N">Domiciliary / Non-Residential</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Local Authority</label>
              <input
                type="text"
                value={cqcLocalAuth}
                onChange={e => setCqcLocalAuth(e.target.value)}
                placeholder="e.g. Manchester"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => searchCQC(1)}
                disabled={cqcLoading}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                {cqcLoading ? 'Searching...' : 'Search CQC'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {cqcResults && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {cqcResults.total.toLocaleString()} providers found
                </h3>
                <p className="text-sm text-slate-500">
                  Page {cqcResults.page} of {cqcResults.totalPages} &middot; {selectedLocations.size} selected
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={enrichSelected}
                  disabled={enriching || selectedLocations.size === 0}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-xs font-medium"
                >
                  {enriching ? 'Finding emails...' : `Enrich Selected (${selectedLocations.size})`}
                </button>
                <button
                  onClick={importSelected}
                  disabled={importing || selectedLocations.size === 0}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-xs font-medium"
                >
                  {importing ? 'Importing...' : `Import Selected (${selectedLocations.size})`}
                </button>
              </div>
            </div>

            {importResult && (
              <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                Imported {importResult.imported} contacts ({importResult.skipped} skipped/duplicates)
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={cqcResults.locations.length > 0 && selectedLocations.size === cqcResults.locations.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left text-slate-600 font-medium">Provider</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Location</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Region</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Type</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Email</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cqcResults.locations.map(loc => {
                    const detail = locationDetails[loc.locationId];
                    const isExpanded = expandedLocation === loc.locationId;
                    const foundEmails = enrichResults[loc.locationId] || [];

                    return (
                      <tr key={loc.locationId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedLocations.has(loc.locationId)}
                            onChange={() => toggleSelect(loc.locationId)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{loc.locationName}</div>
                          {loc.providerName && loc.providerName !== loc.locationName && (
                            <div className="text-xs text-slate-500">{loc.providerName}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {loc.postalCode || '—'}
                          {detail && (
                            <div className="text-xs text-slate-400">
                              {detail.postalAddressTownCity}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{loc.region || '—'}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            loc.careHome === 'Y' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {loc.careHome === 'Y' ? 'Care Home' : 'Dom Care'}
                          </span>
                        </td>
                        <td className="p-3">
                          <input
                            type="email"
                            value={manualEmails[loc.locationId] || ''}
                            onChange={e => setManualEmails(prev => ({
                              ...prev,
                              [loc.locationId]: e.target.value,
                            }))}
                            placeholder={foundEmails.length > 0 ? foundEmails[0] : 'Enter email...'}
                            className="w-40 border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                          {foundEmails.length > 1 && (
                            <div className="text-xs text-purple-600 mt-1">
                              +{foundEmails.length - 1} more found
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => fetchLocationDetail(loc.locationId)}
                            className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                          {detail?.website && (
                            <a
                              href={detail.website.startsWith('http') ? detail.website : `https://${detail.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Website
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Expanded detail row */}
              {expandedLocation && locationDetails[expandedLocation] && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  {(() => {
                    const d = locationDetails[expandedLocation];
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 block">Address</span>
                          <span className="text-slate-800">
                            {[d.postalAddressLine1, d.postalAddressLine2, d.postalAddressTownCity, d.postalAddressCounty, d.postalCode]
                              .filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Phone</span>
                          <span className="text-slate-800">{d.phone || 'Not listed'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Website</span>
                          {d.website ? (
                            <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-teal-600 hover:underline break-all"
                            >
                              {d.website}
                            </a>
                          ) : (
                            <span className="text-slate-400">Not listed</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 block">CQC Rating</span>
                          {d.currentRatings?.overall ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              RATING_COLORS[d.currentRatings.overall.rating] || 'bg-slate-100 text-slate-600'
                            }`}>
                              {d.currentRatings.overall.rating}
                            </span>
                          ) : (
                            <span className="text-slate-400">Not rated</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 block">Local Authority</span>
                          <span className="text-slate-800">{d.localAuthority || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Registration</span>
                          <span className="text-slate-800">{d.registrationStatus || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CQC ID</span>
                          <span className="text-slate-800 font-mono text-xs">{d.locationId}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Last Inspection</span>
                          <span className="text-slate-800">
                            {d.lastInspection?.date
                              ? new Date(d.lastInspection.date).toLocaleDateString('en-GB')
                              : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Pagination */}
            {cqcResults.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => searchCQC(cqcPage - 1)}
                  disabled={cqcPage <= 1 || cqcLoading}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
                >
                  &larr; Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {cqcResults.page} of {cqcResults.totalPages}
                </span>
                <button
                  onClick={() => searchCQC(cqcPage + 1)}
                  disabled={cqcPage >= cqcResults.totalPages || cqcLoading}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        {!cqcResults && !cqcLoading && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Search', desc: 'Filter CQC providers by region, type, and local authority' },
                { step: '2', title: 'Enrich', desc: 'Auto-scan provider websites to find contact email addresses' },
                { step: '3', title: 'Review', desc: 'Check and edit emails, add any manually if needed' },
                { step: '4', title: 'Import', desc: 'Send to your email campaigns contact list for targeted outreach' },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-2">
                    {item.step}
                  </div>
                  <h4 className="font-medium text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <strong>PECR Compliance:</strong> B2B emails to corporate subscribers are permitted under UK PECR regulations
              provided emails are relevant to their business and include your identity and an unsubscribe link.
              All campaign emails automatically include an unsubscribe link and CareCallAI&apos;s company address.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── TAB 2: CIW Import ──────────────────────────────────────────
  function renderCIWTab() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Import CIW Contacts (Wales)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Care Inspectorate Wales does not have a public API. You can obtain provider data by:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-1">Option 1: Request Data Extract</h4>
              <p className="text-sm text-slate-600 mb-2">
                Email CIW to request a data extract of registered care providers in your target area.
              </p>
              <a
                href="mailto:CIWInformation@gov.wales?subject=Data%20Extract%20Request%20-%20Registered%20Care%20Providers&body=Dear%20CIW%20Information%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20data%20extract%20of%20registered%20care%20providers%20including%20service%20name%2C%20contact%20email%2C%20service%20type%2C%20and%20local%20authority.%0A%0AThank%20you."
                className="inline-block px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Email CIWInformation@gov.wales
              </a>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-1">Option 2: CIW Online Directory</h4>
              <p className="text-sm text-slate-600 mb-2">
                Browse the CIW directory online and export the results you need.
              </p>
              <a
                href="https://digital.careinspectorate.wales/directory/search"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
              >
                Open CIW Directory
              </a>
            </div>
          </div>
        </div>

        {/* CSV Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Upload CSV File</h3>
          <p className="text-sm text-slate-500 mb-4">
            Your CSV should include columns for: <code className="bg-slate-100 px-1 rounded">email</code>,{' '}
            <code className="bg-slate-100 px-1 rounded">name</code> or <code className="bg-slate-100 px-1 rounded">service name</code>,{' '}
            <code className="bg-slate-100 px-1 rounded">organisation</code> or <code className="bg-slate-100 px-1 rounded">provider name</code>,{' '}
            <code className="bg-slate-100 px-1 rounded">local authority</code> (optional),{' '}
            <code className="bg-slate-100 px-1 rounded">service type</code> (optional).
            Rows without a valid email will be skipped.
          </p>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleCiwFileSelect}
              className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {ciwFile && (
              <button
                onClick={importCiwCsv}
                disabled={ciwImporting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                {ciwImporting ? 'Importing...' : 'Import to Contacts'}
              </button>
            )}
          </div>

          {/* Preview */}
          {ciwPreview && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2">
                Preview ({ciwPreview.total} total rows):
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      {ciwPreview.headers.map(h => (
                        <th key={h} className="p-2 text-left text-slate-600 font-medium border-b">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ciwPreview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {ciwPreview.headers.map(h => (
                          <td key={h} className="p-2 text-slate-700 max-w-[200px] truncate">{row[h] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {ciwImportResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Successfully imported {ciwImportResult.imported} contacts from {ciwImportResult.source}
              {ciwImportResult.skipped > 0 && ` (${ciwImportResult.skipped} skipped/duplicates)`}
            </div>
          )}
        </div>

        {/* Column mapping reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Column Mapping Reference</h3>
          <p className="text-sm text-slate-500 mb-3">
            The importer automatically recognises these column headers:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-2 text-left text-slate-600">Our Field</th>
                  <th className="p-2 text-left text-slate-600">Accepted CSV Headers</th>
                  <th className="p-2 text-left text-slate-600">Required?</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="p-2 font-medium">Email</td>
                  <td className="p-2"><code>email</code>, <code>e-mail</code>, <code>email address</code>, <code>contact_email</code></td>
                  <td className="p-2 text-green-600 font-medium">Yes</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-2 font-medium">Name</td>
                  <td className="p-2"><code>name</code>, <code>service name</code>, <code>contact name</code>, <code>contact_name</code></td>
                  <td className="p-2 text-slate-400">No</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-2 font-medium">Organisation</td>
                  <td className="p-2"><code>organisation</code>, <code>organization</code>, <code>provider name</code>, <code>provider</code></td>
                  <td className="p-2 text-slate-400">No</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-2 font-medium">Region</td>
                  <td className="p-2"><code>region</code>, <code>local authority</code>, <code>area</code></td>
                  <td className="p-2 text-slate-400">No (defaults to &quot;Wales&quot;)</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-2 font-medium">Service Type</td>
                  <td className="p-2"><code>type</code>, <code>service type</code>, <code>provider_type</code></td>
                  <td className="p-2 text-slate-400">No (defaults to &quot;domiciliary&quot;)</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-2 font-medium">Registration #</td>
                  <td className="p-2"><code>registration number</code>, <code>registration_number</code>, <code>reg number</code></td>
                  <td className="p-2 text-slate-400">No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ─── TAB 3: Import History ───────────────────────────────────────
  function renderHistoryTab() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Contact Statistics</h2>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {historyLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {historyStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{historyStats.totalActive}</div>
                  <div className="text-sm text-green-600">Active Contacts</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-700">{historyStats.totalUnsubscribed}</div>
                  <div className="text-sm text-amber-600">Unsubscribed</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{historyStats.bySource.cqc_register || 0}</div>
                  <div className="text-sm text-blue-600">From CQC</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{historyStats.bySource.ciw_register || 0}</div>
                  <div className="text-sm text-red-600">From CIW</div>
                </div>
              </div>

              {/* Breakdown */}
              <h3 className="font-medium text-slate-800 mb-3">Contacts by Source</h3>
              <div className="space-y-2">
                {[
                  { key: 'cqc_register', label: 'CQC Register', color: 'bg-blue-500' },
                  { key: 'ciw_register', label: 'CIW Register', color: 'bg-red-500' },
                  { key: 'csv_import', label: 'CSV Import', color: 'bg-purple-500' },
                  { key: 'manual', label: 'Manual Entry', color: 'bg-slate-500' },
                ].map(source => {
                  const count = historyStats.bySource[source.key] || 0;
                  const total = Object.values(historyStats.bySource).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={source.key} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28">{source.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div
                          className={`${source.color} h-full rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-700 font-medium w-16 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : historyLoading ? (
            <p className="text-slate-500 text-sm">Loading statistics...</p>
          ) : (
            <p className="text-slate-500 text-sm">No data yet</p>
          )}
        </div>

        {/* PECR / GDPR info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-3">Email Compliance (PECR / GDPR)</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <div>
                <strong>B2B Exception:</strong> Under UK PECR (Privacy and Electronic Communications Regulations),
                unsolicited marketing emails to corporate subscribers (businesses) are permitted without prior consent,
                provided the email is relevant to their business activities.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <div>
                <strong>Unsubscribe Link:</strong> All campaign emails automatically include an unsubscribe link.
                When clicked, the contact is immediately removed from future mailings and a confirmation page is shown.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <div>
                <strong>Sender Identity:</strong> All emails include CareCallAI&apos;s name and registered address
                (The Hummingbird, 27-29 High St, Denbigh LL16 3HY).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <div>
                <strong>List-Unsubscribe Header:</strong> Emails include the <code className="bg-slate-100 px-1 rounded">List-Unsubscribe</code> header
                so email clients can show a native unsubscribe button.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <div>
                <strong>Data Source Tracking:</strong> Every imported contact is tagged with its source
                (CQC Register, CIW Register, CSV Import, Manual) for audit purposes.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
