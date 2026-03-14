'use client';

import { useState, useEffect } from 'react';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
}

const TABS = ['Find Companies', 'Import CSV', 'Import History'];

export default function HarvesterPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Search state
  const [localAuthorities, setLocalAuthorities] = useState([]);
  const [county, setCounty] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [serviceType, setServiceType] = useState('domiciliary');
  const [hasWebsite, setHasWebsite] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [enriching, setEnriching] = useState(false);
  const [emails, setEmails] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Paste URLs state
  const [pasteUrls, setPasteUrls] = useState('');

  // CSV Import state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState(null);

  // History state
  const [historyStats, setHistoryStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = '/admin'; return; }
    try {
      const payload = JSON.parse(atob(token));
      if (payload.role !== 'platform_admin' || Date.now() - payload.ts > 86400000) {
        window.location.href = '/admin'; return;
      }
      setIsLoggedIn(true);
    } catch { window.location.href = '/admin'; }
    setChecking(false);
  }, []);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  });

  // Load local authorities on first visit
  useEffect(() => {
    if (!isLoggedIn || localAuthorities.length > 0) return;
    setInitialLoading(true);
    fetch('/api/harvester/search', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLocalAuthorities(data.localAuthorities || []);
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [isLoggedIn]);

  // Search for care companies
  async function searchCompanies(page = 1) {
    if (!county && !nameSearch) return alert('Select a local authority or enter a name to search');
    setSearchLoading(true);
    setSearchError('');
    setImportResult(null);
    setSelected(new Set());

    try {
      const res = await fetch('/api/harvester/search', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ county, serviceType, search: nameSearch, page, perPage: 500, hasWebsite }),
      });
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
        setTotalResults(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setSearchError(data.error || 'Search failed');
        setCompanies([]);
      }
    } catch (err) {
      setSearchError('Search failed: ' + err.message);
    }
    setSearchLoading(false);
  }

  // Paste URLs
  function processPastedUrls() {
    const urls = pasteUrls.split('\n').map(u => u.trim()).filter(u => u.length > 5)
      .map(u => u.startsWith('http') ? u : 'https://' + u);
    if (urls.length === 0) return alert('Paste at least one website URL');
    const newCos = urls.map(url => {
      let domain = url;
      try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}
      return { name: domain, website: url, domain, phone: '', postcode: '', localAuthority: '', region: '', source: 'manual' };
    });
    setCompanies(prev => [...prev, ...newCos]);
    setTotalResults(prev => prev + newCos.length);
    setPasteUrls('');
  }

  function toggleSelect(idx) {
    setSelected(prev => { const n = new Set(prev); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });
  }
  function toggleSelectAll() {
    if (selected.size === companies.length) setSelected(new Set());
    else setSelected(new Set(companies.map((_, i) => i)));
  }

  // Enrich — find emails from websites (parallel, batches of 50)
  async function enrichSelected() {
    const sel = [...selected];
    if (sel.length === 0) return alert('Select companies first');
    setEnriching(true);

    // Build URL-to-index mapping
    const urlMap = [];
    sel.forEach(i => {
      const w = companies[i]?.website;
      if (!w) return;
      const url = w.startsWith('http') ? w : 'https://' + w;
      urlMap.push({ idx: i, url });
    });

    if (urlMap.length === 0) { setEnriching(false); return alert('No websites found for selected companies'); }

    let totalFound = 0;
    for (let b = 0; b < urlMap.length; b += 50) {
      const batch = urlMap.slice(b, b + 50);
      try {
        const res = await fetch('/api/harvester/enrich', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ urls: batch.map(u => u.url) }),
        });
        const data = await res.json();
        if (data.success) {
          const byUrl = {};
          data.results.forEach(r => { byUrl[r.url] = r; });
          batch.forEach(({ idx, url }) => {
            const result = byUrl[url];
            if (result?.emails?.length > 0) {
              totalFound++;
              setEmails(prev => ({ ...prev, [idx]: prev[idx] || result.emails[0] }));
            }
          });
        }
      } catch (err) {
        console.error('Enrich batch failed:', err);
      }
    }
    alert(`Done! Found emails for ${totalFound} of ${urlMap.length} websites.`);
    setEnriching(false);
  }

  // Import to contacts
  async function importSelected() {
    const sel = [...selected];
    if (sel.length === 0) return alert('Select companies first');
    const contacts = [];
    for (const i of sel) {
      const email = emails[i];
      if (!email || !email.includes('@')) continue;
      const co = companies[i];
      contacts.push({
        email: email.toLowerCase().trim(),
        name: co.name || '',
        organisation: co.providerName || co.name || '',
        regulator: 'cqc',
        provider_type: co.careHome === 'Y' ? 'care_home' : 'domiciliary',
        region: co.region || co.localAuthority || county || '',
        registration_number: co.locationId || '',
        data_source: 'cqc_register',
        tags: ['cqc_harvested'],
        status: 'active',
      });
    }
    if (contacts.length === 0) return alert('No selected companies have emails. Use "Find Emails" first or type emails manually.');
    setImporting(true);
    try {
      const res = await fetch('/api/campaigns/contacts', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ contacts }) });
      const data = await res.json();
      setImportResult({ imported: data.imported || contacts.length, skipped: data.skipped || 0 });
    } catch (err) { alert('Import failed: ' + err.message); }
    setImporting(false);
  }

  // CSV import
  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) { setCsvPreview(null); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1, 6).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });
      setCsvPreview({ headers, rows, total: lines.length - 1 });
    };
    reader.readAsText(file);
  }

  async function importCsv() {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvImportResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) { setCsvImporting(false); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const contacts = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        const email = row.email || row['e-mail'] || row['email address'] || row.contact_email || '';
        if (!email.includes('@')) continue;
        contacts.push({
          email: email.toLowerCase().trim(),
          name: row.name || row['service name'] || row['contact name'] || '',
          organisation: row.organisation || row.organization || row['provider name'] || '',
          provider_type: 'domiciliary',
          region: row.region || row['local authority'] || row.county || '',
          data_source: 'csv_import',
          tags: ['csv_imported'],
          status: 'active',
        });
      }
      if (contacts.length === 0) { setCsvImporting(false); return alert('No valid emails found.'); }
      try {
        const res = await fetch('/api/campaigns/contacts', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ contacts }) });
        const data = await res.json();
        setCsvImportResult({ imported: data.imported || contacts.length, skipped: data.skipped || 0 });
      } catch (err) { alert('Import failed: ' + err.message); }
      setCsvImporting(false);
    };
    reader.readAsText(csvFile);
  }

  // History
  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const sources = ['cqc_register', 'ciw_register', 'csv_import', 'web_harvest', 'manual', 'website_subscribe'];
      const stats = {};
      for (const src of sources) {
        const res = await fetch(`/api/campaigns/contacts?data_source=${src}&count_only=true&status=all`, { headers: authHeaders() });
        const data = await res.json();
        stats[src] = data.total || data.count || 0;
      }
      const activeRes = await fetch('/api/campaigns/contacts?count_only=true', { headers: authHeaders() });
      const ad = await activeRes.json();
      const unsubRes = await fetch('/api/campaigns/contacts?count_only=true&status=unsubscribed', { headers: authHeaders() });
      const ud = await unsubRes.json();
      setHistoryStats({ bySource: stats, totalActive: ad.total || ad.count || 0, totalUnsubscribed: ud.total || ud.count || 0 });
    } catch {}
    setHistoryLoading(false);
  }
  useEffect(() => { if (activeTab === 2 && !historyStats) loadHistory(); }, [activeTab]);

  if (checking || !isLoggedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500">Checking authentication...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">&larr; Admin</a>
                <h1 className="text-2xl font-bold text-slate-800">Contact Harvester</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">Find care companies, harvest emails, import to campaigns</p>
            </div>
            <a href="/admin/campaigns" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">View Campaigns &rarr;</a>
          </div>
          <div className="flex gap-1 mt-4">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === i ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 0 && renderSearchTab()}
        {activeTab === 1 && renderCsvTab()}
        {activeTab === 2 && renderHistoryTab()}
      </div>
    </div>
  );

  function renderSearchTab() {
    return (
      <div className="space-y-6">
        {/* Search Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Search Care Companies</h2>
          <p className="text-sm text-slate-500 mb-4">
            Data from the CQC public care directory — {localAuthorities.length > 0 ? `${localAuthorities.length} local authorities loaded` : 'loading...'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Local Authority / Area</label>
              {localAuthorities.length > 0 ? (
                <select value={county} onChange={e => setCounty(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">All areas</option>
                  {localAuthorities.map(la => (
                    <option key={la} value={la}>{la}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={county} onChange={e => setCounty(e.target.value)}
                  placeholder={initialLoading ? 'Loading areas...' : 'Type area name...'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Service Type</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="domiciliary">Domiciliary Care</option>
                <option value="care_home">Care Homes</option>
                <option value="">All Types</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Name / Postcode Search</label>
              <input type="text" value={nameSearch} onChange={e => setNameSearch(e.target.value)}
                placeholder="e.g. Sunrise or LL16" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={hasWebsite} onChange={e => setHasWebsite(e.target.checked)} className="rounded" />
              Only show companies with a website (for email harvesting)
            </label>
            <button onClick={() => searchCompanies(1)} disabled={searchLoading}
              className="ml-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchLoading && (
            <p className="text-sm text-slate-500 mt-3">First search downloads the CQC directory (~15MB) — subsequent searches are instant...</p>
          )}
        </div>

        {/* Paste URLs */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Or Paste Website URLs</h3>
          <p className="text-xs text-slate-500 mb-3">Paste care company website URLs, one per line. We&apos;ll scan them for email addresses.</p>
          <div className="flex gap-3">
            <textarea value={pasteUrls} onChange={e => setPasteUrls(e.target.value)}
              placeholder={"www.example-care.co.uk\nwww.another-care.com"} rows={3}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={processPastedUrls} disabled={!pasteUrls.trim()}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm font-medium self-end">Add</button>
          </div>
        </div>

        {searchError && <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">{searchError}</div>}

        {/* Results */}
        {companies.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">{totalResults.toLocaleString()} companies found</h3>
                <p className="text-sm text-slate-500">Page {currentPage} of {totalPages} &middot; {selected.size} selected</p>
              </div>
              <div className="flex gap-2">
                <button onClick={enrichSelected} disabled={enriching || selected.size === 0}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-xs font-medium">
                  {enriching ? 'Finding emails...' : `Find Emails (${selected.size})`}
                </button>
                <button onClick={importSelected} disabled={importing || selected.size === 0}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-xs font-medium">
                  {importing ? 'Importing...' : `Import (${selected.size})`}
                </button>
              </div>
            </div>

            {importResult && (
              <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                Imported {importResult.imported} contacts {importResult.skipped > 0 && `(${importResult.skipped} skipped)`}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 text-left"><input type="checkbox" checked={companies.length > 0 && selected.size === companies.length} onChange={toggleSelectAll} className="rounded" /></th>
                    <th className="p-3 text-left text-slate-600 font-medium">Company</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Area</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Type</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Website</th>
                    <th className="p-3 text-left text-slate-600 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((co, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3"><input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} className="rounded" /></td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{co.name}</div>
                        {co.providerName && co.providerName !== co.name && <div className="text-xs text-slate-400">{co.providerName}</div>}
                        {co.phone && <div className="text-xs text-slate-400">{co.phone}</div>}
                      </td>
                      <td className="p-3 text-xs text-slate-600">
                        {co.localAuthority || co.region || '—'}
                        {co.postcode && <div className="text-slate-400">{co.postcode}</div>}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${co.careHome === 'Y' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {co.careHome === 'Y' ? 'Care Home' : 'Dom Care'}
                        </span>
                      </td>
                      <td className="p-3">
                        {co.website ? (
                          <a href={co.website.startsWith('http') ? co.website : `https://${co.website}`} target="_blank" rel="noopener noreferrer"
                            className="text-teal-600 hover:underline text-xs break-all max-w-[180px] block truncate">
                            {co.domain || co.website}
                          </a>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="p-3">
                        <input type="email" value={emails[i] || ''} onChange={e => setEmails(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Enter or enrich..." className="w-44 border border-slate-300 rounded px-2 py-1 text-xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <button onClick={() => searchCompanies(currentPage - 1)} disabled={currentPage <= 1 || searchLoading}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50">&larr; Previous</button>
                <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
                <button onClick={() => searchCompanies(currentPage + 1)} disabled={currentPage >= totalPages || searchLoading}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50">Next &rarr;</button>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        {companies.length === 0 && !searchLoading && !searchError && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Search', desc: 'Select an area and service type' },
                { step: '2', title: 'Select', desc: 'Choose companies you want to contact' },
                { step: '3', title: 'Find Emails', desc: 'We scan their websites for emails' },
                { step: '4', title: 'Import', desc: 'Add to your campaign contacts' },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-2">{item.step}</div>
                  <h4 className="font-medium text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <strong>PECR Compliance:</strong> B2B marketing emails are permitted under UK PECR when relevant to the recipient&apos;s business.
              All campaigns include an unsubscribe link and sender address.
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderCsvTab() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Import Contacts from CSV</h2>
          <p className="text-sm text-slate-500 mb-4">
            Upload a CSV with an <code className="bg-slate-100 px-1 rounded">email</code> column. Optional: <code className="bg-slate-100 px-1 rounded">name</code>, <code className="bg-slate-100 px-1 rounded">organisation</code>, <code className="bg-slate-100 px-1 rounded">region</code>.
          </p>
          <div className="flex items-center gap-4">
            <input type="file" accept=".csv" onChange={handleCsvFile}
              className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
            {csvFile && (
              <button onClick={importCsv} disabled={csvImporting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
                {csvImporting ? 'Importing...' : 'Import'}
              </button>
            )}
          </div>
          {csvPreview && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2">Preview ({csvPreview.total} rows):</p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50">{csvPreview.headers.map(h => <th key={h} className="p-2 text-left text-slate-600 font-medium border-b">{h}</th>)}</tr></thead>
                  <tbody>{csvPreview.rows.map((row, i) => <tr key={i} className="border-b border-slate-100">{csvPreview.headers.map(h => <td key={h} className="p-2 text-slate-700 max-w-[200px] truncate">{row[h]}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {csvImportResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Imported {csvImportResult.imported} contacts {csvImportResult.skipped > 0 && `(${csvImportResult.skipped} skipped)`}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderHistoryTab() {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Contact Statistics</h2>
            <button onClick={loadHistory} disabled={historyLoading} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50">
              {historyLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {historyStats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{historyStats.totalActive}</div>
                  <div className="text-sm text-green-600">Active Contacts</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-700">{historyStats.totalUnsubscribed}</div>
                  <div className="text-sm text-amber-600">Unsubscribed</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{Object.values(historyStats.bySource).reduce((a, b) => a + b, 0)}</div>
                  <div className="text-sm text-blue-600">Total All Sources</div>
                </div>
              </div>
              <h3 className="font-medium text-slate-800 mb-3">By Source</h3>
              <div className="space-y-2">
                {[
                  { key: 'cqc_register', label: 'CQC Directory', color: 'bg-teal-500' },
                  { key: 'ciw_register', label: 'CIW Register', color: 'bg-red-500' },
                  { key: 'csv_import', label: 'CSV Import', color: 'bg-purple-500' },
                  { key: 'web_harvest', label: 'Web Harvest', color: 'bg-blue-500' },
                  { key: 'website_subscribe', label: 'Website Subscribe', color: 'bg-green-500' },
                  { key: 'manual', label: 'Manual', color: 'bg-slate-500' },
                ].map(s => {
                  const count = historyStats.bySource[s.key] || 0;
                  if (count === 0) return null;
                  const total = Math.max(Object.values(historyStats.bySource).reduce((a, b) => a + b, 0), 1);
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32">{s.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className={`${s.color} h-full rounded-full`} style={{ width: `${Math.round((count / total) * 100)}%` }} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium w-12 text-right">{count}</span>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </>
          ) : historyLoading ? <p className="text-slate-500 text-sm">Loading...</p> : <p className="text-slate-500 text-sm">No data yet</p>}
        </div>
      </div>
    );
  }
}
