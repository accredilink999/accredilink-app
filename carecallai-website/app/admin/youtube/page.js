'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const TABS = ['Scripts', 'AI Script Generator', 'Topic Library', 'Video Studio'];

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  generating_video: 'bg-blue-100 text-blue-700',
  video_ready: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  draft: 'Draft',
  generating_video: 'Generating Video',
  video_ready: 'Video Ready',
  published: 'Published',
};

const VIDEO_TYPE_LABELS = {
  compliance_tutorial: 'Compliance Tutorial',
  feature_demo: 'Feature Demo',
  industry_tips: 'Industry Tips',
  training_content: 'Training Content',
  case_study: 'Case Study',
  news_update: 'News Update',
};

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'educational', label: 'Educational' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Care Providers' },
  { value: 'ciw', label: 'CIW (Wales)' },
  { value: 'cqc', label: 'CQC (England)' },
  { value: 'care_home', label: 'Care Homes' },
  { value: 'domiciliary', label: 'Domiciliary Care' },
];

const TOPIC_LIBRARY = {
  compliance: {
    label: 'Compliance & Regulation',
    emoji: '\u{1F4CB}',
    topics: [
      { title: 'How to Prepare for a CIW Inspection in 2026', videoType: 'compliance_tutorial', desc: 'Step-by-step CIW inspection preparation guide for domiciliary care agencies' },
      { title: 'RISCA Regulation 36: Staff Supervision Every 12 Weeks', videoType: 'compliance_tutorial', desc: 'Meeting the 12-weekly supervision requirement under RISCA' },
      { title: 'CQC Key Lines of Enquiry Explained', videoType: 'compliance_tutorial', desc: 'What CQC inspectors look for and how to prepare your evidence' },
      { title: 'Digital Care Records: What CIW & CQC Actually Require', videoType: 'compliance_tutorial', desc: 'Clarifying digital record-keeping requirements for compliance' },
      { title: 'Safeguarding Audit Trails: Building Better Evidence', videoType: 'compliance_tutorial', desc: 'Creating robust safeguarding documentation for inspections' },
    ],
  },
  features: {
    label: 'Feature Demos',
    emoji: '\u{1F5A5}\uFE0F',
    topics: [
      { title: 'CareCallAI in 5 Minutes: Full Platform Tour', videoType: 'feature_demo', desc: 'Quick overview of all CareCallAI features for new users' },
      { title: 'eMAR: Safer Medication Management Demo', videoType: 'feature_demo', desc: 'How electronic MAR charts eliminate paper errors' },
      { title: 'Clinical Assessments: Waterlow, MUST, NEWS2 Demo', videoType: 'feature_demo', desc: 'Running clinical assessments on mobile devices' },
      { title: 'Smart Rota & Scheduling Demo', videoType: 'feature_demo', desc: 'Pattern-based shift deployment and gap detection' },
      { title: 'Family Portal: Keeping Relatives Connected', videoType: 'feature_demo', desc: 'How families stay informed about their loved ones care' },
    ],
  },
  industry: {
    label: 'Industry & Trends',
    emoji: '\u{1F4C8}',
    topics: [
      { title: 'Digital Transformation in UK Care: 2026 State of Play', videoType: 'industry_tips', desc: 'Where the care sector stands with digital adoption' },
      { title: 'Staff Retention Crisis: 5 Practical Solutions', videoType: 'industry_tips', desc: 'Evidence-based strategies to reduce staff turnover' },
      { title: 'Paper vs Digital: The True Cost Comparison', videoType: 'industry_tips', desc: 'Breaking down hidden costs of paper-based records' },
      { title: 'AI in Care Management: What Actually Works', videoType: 'industry_tips', desc: 'Separating AI hype from practical care applications' },
    ],
  },
  training: {
    label: 'Training & Best Practice',
    emoji: '\u{1F393}',
    topics: [
      { title: 'Care Logging Best Practices for Domiciliary Staff', videoType: 'training_content', desc: 'How to write effective, compliant digital care logs' },
      { title: 'Understanding the Waterlow Pressure Risk Assessment', videoType: 'training_content', desc: 'Training guide for completing Waterlow assessments correctly' },
      { title: 'eMAR Training Guide for Care Staff', videoType: 'training_content', desc: 'Staff training on electronic medication administration' },
      { title: 'Incident Reporting: Getting It Right First Time', videoType: 'training_content', desc: 'How to complete incident reports accurately and promptly' },
    ],
  },
  case_studies: {
    label: 'Case Studies',
    emoji: '\u{1F3C6}',
    topics: [
      { title: 'From Paper to Digital: A Welsh Care Agency Story', videoType: 'case_study', desc: 'Real migration journey from paper to CareCallAI' },
      { title: 'How One Agency Saved 15 Hours Per Week', videoType: 'case_study', desc: 'Real time savings from digital care management' },
      { title: 'Passing CIW Inspection with Digital Records', videoType: 'case_study', desc: 'How digital records helped achieve a good rating' },
    ],
  },
};

export default function YouTubeScriptsPage() {
  const router = useRouter();

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  // Navigation
  const [activeTab, setActiveTab] = useState(0);
  // Scripts tab
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedScript, setExpandedScript] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingScript, setEditingScript] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  // AI Generator
  const [aiVideoType, setAiVideoType] = useState('compliance_tutorial');
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('all');
  const [aiDuration, setAiDuration] = useState(360);
  const [aiTone, setAiTone] = useState('professional');
  const [aiContext, setAiContext] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  // Video Studio (HeyGen)
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [bgColor, setBgColor] = useState('#0d9488');
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(null);
  // Browser Video Generator
  const [bvScriptId, setBvScriptId] = useState('');
  const [bvGenerating, setBvGenerating] = useState(false);
  const [bvProgress, setBvProgress] = useState(0);
  const [bvProgressLabel, setBvProgressLabel] = useState('');
  const [bvVideoUrl, setBvVideoUrl] = useState(null);
  const [bvVoices, setBvVoices] = useState([]);
  const [bvSelectedVoice, setBvSelectedVoice] = useState('');
  const [bvRate, setBvRate] = useState(1.0);
  const [bvNarrate, setBvNarrate] = useState(true);
  const [bvPreviewing, setBvPreviewing] = useState(false);
  const [bvSlideIndex, setBvSlideIndex] = useState(0);
  const [bvSlides, setBvSlides] = useState([]);
  // Global
  const [error, setError] = useState('');
  // Toast
  const [toast, setToast] = useState('');

  // ---- Auth check ----
  useEffect(() => {
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) { setChecking(false); return; }
      const payload = JSON.parse(atob(token));
      if (payload.role === 'platform_admin' && Date.now() - payload.ts < 86400000) {
        setIsLoggedIn(true);
      }
    } catch { /* invalid token */ }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !checking) {
      router.push('/admin');
    }
  }, [isLoggedIn, checking, router]);

  // ---- Load browser voices ----
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      if (voices.length > 0) {
        setBvVoices(voices);
        if (!bvSelectedVoice) setBvSelectedVoice(voices[0].name);
      }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ---- Load scripts ----
  const loadScripts = useCallback(async () => {
    setScriptsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('video_type', typeFilter);
      const url = `/api/youtube${params.toString() ? '?' + params.toString() : ''}`;
      const data = await apiFetch(url);
      setScripts(data.scripts || data || []);
    } catch (err) {
      setError('Failed to load scripts: ' + err.message);
    }
    setScriptsLoading(false);
  }, [statusFilter, typeFilter]);

  // ---- Effects ----
  useEffect(() => {
    if (isLoggedIn && activeTab === 0) loadScripts();
  }, [activeTab, isLoggedIn, statusFilter, typeFilter, loadScripts]);

  // ---- Helper functions ----
  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  function calculateTimestamps(script) {
    if (!script) return [];
    const timestamps = [];
    let currentTime = 0;

    if (script.hook) {
      timestamps.push({ time: currentTime, label: 'HOOK', text: script.hook, type: 'hook' });
      currentTime += script.hook_duration || 10;
    }

    if (script.sections && Array.isArray(script.sections)) {
      script.sections.forEach((section) => {
        timestamps.push({
          time: currentTime,
          label: section.title || 'Section',
          text: section.script || section.text || '',
          visual_notes: section.visualNotes || section.visual_notes || '',
          type: 'section',
        });
        currentTime += section.duration || 60;
      });
    }

    if (script.cta) {
      timestamps.push({ time: currentTime, label: 'CALL TO ACTION', text: script.cta, type: 'cta' });
      currentTime += script.cta_duration || 15;
    }

    if (script.outro) {
      timestamps.push({ time: currentTime, label: 'OUTRO', text: script.outro, type: 'outro' });
    }

    return timestamps;
  }

  function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function copyToClipboard(text, label) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setToast(`${label || 'Text'} copied to clipboard`);
      setTimeout(() => setToast(''), 2500);
    }).catch(() => {
      setToast('Failed to copy');
      setTimeout(() => setToast(''), 2500);
    });
  }

  // ---- Script CRUD ----
  async function saveScript(scriptData) {
    try {
      const data = await apiFetch('/api/youtube', {
        method: 'POST',
        body: JSON.stringify(scriptData),
      });
      setSaveMsg('Script saved as draft successfully.');
      setTimeout(() => setSaveMsg(''), 3000);
      loadScripts();
      return data;
    } catch (err) {
      setError('Failed to save script: ' + err.message);
      return null;
    }
  }

  async function updateScript(id, updates) {
    setSavingEdit(true);
    try {
      await apiFetch('/api/youtube', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      });
      setEditingScript(null);
      setEditForm({});
      loadScripts();
    } catch (err) {
      setError('Failed to update script: ' + err.message);
    }
    setSavingEdit(false);
  }

  async function deleteScript(id) {
    try {
      await apiFetch('/api/youtube', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setConfirmDelete(null);
      loadScripts();
    } catch (err) {
      setError('Failed to delete script: ' + err.message);
    }
  }

  async function duplicateScript(script) {
    try {
      const body = {
        title: (script.title || 'Untitled') + ' (Copy)',
        youtube_title: script.youtube_title || '',
        video_type: script.video_type || 'compliance_tutorial',
        status: 'draft',
        estimated_duration: script.estimated_duration || 0,
        word_count: script.word_count || 0,
        hook: script.hook || '',
        hook_duration: script.hook_duration || 10,
        sections: script.sections || [],
        cta: script.cta || '',
        cta_duration: script.cta_duration || 15,
        outro: script.outro || '',
        thumbnail_text: script.thumbnail_text || '',
        tags: script.tags || [],
        youtube_description: script.youtube_description || '',
        full_script: script.full_script || '',
        notes: script.notes || '',
        target_audience: script.target_audience || 'all',
        tone: script.tone || 'professional',
      };
      await apiFetch('/api/youtube', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      loadScripts();
    } catch (err) {
      setError('Failed to duplicate script: ' + err.message);
    }
  }

  // ---- AI Generator ----
  async function generateScript() {
    setAiGenerating(true);
    setAiError('');
    setAiResult(null);
    try {
      const data = await apiFetch('/api/youtube/generate', {
        method: 'POST',
        body: JSON.stringify({
          videoType: aiVideoType,
          topic: aiTopic,
          targetAudience: aiAudience,
          targetDuration: aiDuration,
          tone: aiTone,
          additionalContext: aiContext,
        }),
      });
      setAiResult(data.generated || data);
    } catch (err) {
      setAiError('AI generation failed: ' + err.message);
    }
    setAiGenerating(false);
  }

  // ---- Video Studio ----
  async function generateVideo(scriptId) {
    setVideoGenerating(true);
    setVideoError('');
    try {
      await apiFetch('/api/youtube/video', {
        method: 'POST',
        body: JSON.stringify({
          script_id: scriptId,
          avatar_id: avatarId,
          background_color: bgColor,
        }),
      });
      loadScripts();
    } catch (err) {
      setVideoError('Failed to generate video: ' + err.message);
    }
    setVideoGenerating(false);
  }

  async function checkVideoStatus(scriptId) {
    setCheckingStatus(scriptId);
    try {
      const data = await apiFetch(`/api/youtube/video?script_id=${scriptId}`);
      if (data.status === 'video_ready' || data.video_url) {
        loadScripts();
      }
    } catch (err) {
      setError('Failed to check status: ' + err.message);
    }
    setCheckingStatus(null);
  }

  // ---- Topic Library helper ----
  function useTopic(topic) {
    setAiVideoType(topic.videoType || 'compliance_tutorial');
    setAiTopic(topic.title || '');
    setActiveTab(1);
  }

  // ---- Get AI suggestions based on video type ----
  function getTopicSuggestions(videoType) {
    const suggestions = [];
    Object.values(TOPIC_LIBRARY).forEach((category) => {
      category.topics.forEach((topic) => {
        if (topic.videoType === videoType) {
          suggestions.push(topic.title);
        }
      });
    });
    return suggestions.slice(0, 3);
  }

  // ---- Filtered scripts ----
  const filteredScripts = scripts.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchYtTitle = (s.youtube_title || '').toLowerCase().includes(q);
      if (!matchTitle && !matchYtTitle) return false;
    }
    return true;
  });

  // ---- Loading / redirect ----
  if (checking) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  // ==========================
  //       TAB 0: SCRIPTS
  // ==========================
  function renderScriptsTab() {
    return (
      <div>
        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-medium text-slate-600">Status:</label>
          {[
            { key: 'all', label: 'All' },
            { key: 'draft', label: 'Draft' },
            { key: 'generating_video', label: 'Generating Video' },
            { key: 'video_ready', label: 'Video Ready' },
            { key: 'published', label: 'Published' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === s.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Video type filter + search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="all">All Video Types</option>
              {Object.entries(VIDEO_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Loading */}
        {scriptsLoading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading scripts...</p>
          </div>
        )}

        {/* Empty state */}
        {!scriptsLoading && filteredScripts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <p className="text-sm text-slate-500">No scripts found.</p>
            <button
              onClick={() => setActiveTab(1)}
              className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Generate your first script
            </button>
          </div>
        )}

        {/* Script cards */}
        <div className="space-y-3">
          {filteredScripts.map((script) => (
            <div key={script.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
              {/* Edit mode */}
              {editingScript === script.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Title</label>
                    <input
                      type="text"
                      value={editForm.youtube_title || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, youtube_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                      value={editForm.status || 'draft'}
                      onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateScript(script.id, editForm)}
                      disabled={savingEdit}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingScript(null); setEditForm({}); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Display mode */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{script.title || 'Untitled'}</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">
                          {VIDEO_TYPE_LABELS[script.video_type] || script.video_type || 'Unknown'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[script.status] || STATUS_COLORS.draft}`}>
                          {STATUS_LABELS[script.status] || 'Draft'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                        {script.estimated_duration > 0 && (
                          <span>Duration: {formatDuration(script.estimated_duration)}</span>
                        )}
                        {script.word_count > 0 && (
                          <span>Words: {script.word_count.toLocaleString()}</span>
                        )}
                        <span>Created: {formatDate(script.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingScript(script.id);
                          setEditForm({
                            title: script.title || '',
                            youtube_title: script.youtube_title || '',
                            status: script.status || 'draft',
                            notes: script.notes || '',
                          });
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateScript(script)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => copyToClipboard(script.full_script || '', 'Script')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                      >
                        Copy Script
                      </button>
                      <button
                        onClick={() => {
                          setSelectedScriptId(String(script.id));
                          setActiveTab(3);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors"
                      >
                        Generate Video
                      </button>
                      {confirmDelete === script.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600 font-medium">Delete?</span>
                          <button
                            onClick={() => deleteScript(script.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(script.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expand / Collapse */}
                  <button
                    onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-2"
                  >
                    {expandedScript === script.id ? 'Hide Details' : 'Show Details'}
                  </button>

                  {/* Expanded section */}
                  {expandedScript === script.id && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {script.youtube_title && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Title</label>
                          <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg p-3">{script.youtube_title}</p>
                        </div>
                      )}

                      {script.hook && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Hook Preview</label>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{script.hook}</p>
                        </div>
                      )}

                      {script.sections && Array.isArray(script.sections) && script.sections.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Sections</label>
                          <div className="space-y-2">
                            {(() => {
                              let sectionTime = (script.hook_duration || 10);
                              return script.sections.map((section, idx) => {
                                const ts = formatTimestamp(sectionTime);
                                sectionTime += section.duration || 60;
                                return (
                                  <div key={idx} className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-teal-600 font-mono">[{ts}]</p>
                                    <p className="text-sm font-medium text-slate-800">{section.title || `Section ${idx + 1}`}</p>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {script.cta && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Call to Action</label>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{script.cta}</p>
                        </div>
                      )}

                      {/* Video player if video_url exists */}
                      {script.video_url && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Video</label>
                          <a
                            href={script.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium mb-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Watch Video
                          </a>
                          <video
                            src={script.video_url}
                            controls
                            className="w-full max-w-lg rounded-lg border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================
  //   TAB 1: AI SCRIPT GENERATOR
  // ==========================
  function renderGeneratorTab() {
    const suggestions = getTopicSuggestions(aiVideoType);
    const timestamps = aiResult ? calculateTimestamps(aiResult) : [];

    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">AI Script Generator</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Input */}
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
            {/* Video Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video Type</label>
              <select
                value={aiVideoType}
                onChange={(e) => { setAiVideoType(e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {Object.entries(VIDEO_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
                placeholder="What should the video be about?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
              {suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1.5">Suggestions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setAiTopic(s)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          aiTopic === s
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <select
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Duration slider */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duration: {Math.floor(aiDuration / 60)} minutes
              </label>
              <input
                type="range"
                min={180}
                max={600}
                step={30}
                value={aiDuration}
                onChange={(e) => setAiDuration(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>3 min</span>
                <span>10 min</span>
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Context (optional)</label>
              <textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                rows={3}
                placeholder="Any extra details, specific points to cover, or style notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateScript}
              disabled={aiGenerating || !aiTopic}
              className="w-full px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {aiGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Script
                </>
              )}
            </button>

            {/* Error */}
            {aiError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{aiError}</div>
            )}
          </div>

          {/* Right Panel: Output */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            {/* Placeholder */}
            {!aiResult && !aiGenerating && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <p className="text-sm text-slate-400">Generate a script to see it here</p>
              </div>
            )}

            {/* Generating spinner */}
            {aiGenerating && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Generating your script...</p>
              </div>
            )}

            {/* Result */}
            {aiResult && !aiGenerating && (
              <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                {/* YouTube Title */}
                {(aiResult.youtubeTitle || aiResult.youtube_title) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Title</label>
                    <p className="text-lg font-bold text-slate-900">{aiResult.youtubeTitle || aiResult.youtube_title}</p>
                  </div>
                )}

                {/* Thumbnail Text */}
                {(aiResult.thumbnailText || aiResult.thumbnail_text) && (
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <p className="text-white font-bold text-lg uppercase tracking-wide">{aiResult.thumbnailText || aiResult.thumbnail_text}</p>
                  </div>
                )}

                {/* Tags */}
                {aiResult.tags && Array.isArray(aiResult.tags) && aiResult.tags.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Script Preview with timestamps */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Script Preview</label>
                  <div className="space-y-2">
                    {timestamps.map((ts, idx) => (
                      <div key={idx}>
                        {ts.type === 'hook' && (
                          <div className="bg-slate-100 rounded-lg p-3">
                            <p className="text-xs text-slate-500 font-mono mb-1">[{formatTimestamp(ts.time)}] {ts.label}</p>
                            <p className="text-sm text-slate-800">{ts.text}</p>
                          </div>
                        )}
                        {ts.type === 'section' && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <p className="text-xs text-teal-600 font-mono mb-1">[{formatTimestamp(ts.time)}]</p>
                            <p className="text-sm font-semibold text-slate-800 mb-1">{ts.label}</p>
                            <p className="text-sm text-slate-700">{ts.text}</p>
                            {ts.visual_notes && (
                              <div className="mt-2 border-l-2 border-teal-400 pl-3">
                                <p className="text-xs text-teal-600 font-medium">Visual Notes:</p>
                                <p className="text-xs text-slate-500">{ts.visual_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {ts.type === 'cta' && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                            <p className="text-xs text-teal-600 font-mono mb-1">[{formatTimestamp(ts.time)}] {ts.label}</p>
                            <p className="text-sm text-slate-800">{ts.text}</p>
                          </div>
                        )}
                        {ts.type === 'outro' && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 font-mono mb-1">[{formatTimestamp(ts.time)}] {ts.label}</p>
                            <p className="text-sm text-slate-700">{ts.text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {timestamps.length === 0 && (aiResult.fullScript || aiResult.full_script) && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiResult.fullScript || aiResult.full_script}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* YouTube Description */}
                {(aiResult.youtubeDescription || aiResult.youtube_description) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Description</label>
                    <textarea
                      readOnly
                      value={aiResult.youtubeDescription || aiResult.youtube_description}
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={async () => {
                      const data = await saveScript({
                        title: aiResult.title || aiTopic || 'Untitled Script',
                        youtube_title: aiResult.youtubeTitle || aiResult.youtube_title || '',
                        video_type: aiResult.video_type || aiVideoType,
                        status: 'draft',
                        estimated_duration: aiResult.estimatedDuration || aiResult.estimated_duration || aiDuration,
                        word_count: aiResult.wordCount || aiResult.word_count || 0,
                        hook: aiResult.hook || '',
                        sections: aiResult.sections || [],
                        cta: aiResult.cta || '',
                        outro: aiResult.outro || '',
                        thumbnail_text: aiResult.thumbnailText || aiResult.thumbnail_text || '',
                        tags: aiResult.tags || [],
                        youtube_description: aiResult.youtubeDescription || aiResult.youtube_description || '',
                        full_script: aiResult.fullScript || aiResult.full_script || '',
                        target_audience: aiAudience,
                        tone: aiTone,
                      });
                      if (data) {
                        setActiveTab(0);
                      }
                    }}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => copyToClipboard(aiResult.fullScript || aiResult.full_script || '', 'Full script')}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Copy Full Script
                  </button>
                  <button
                    onClick={() => copyToClipboard(aiResult.youtubeDescription || aiResult.youtube_description || '', 'Description')}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Copy Description
                  </button>
                </div>

                {/* Save message */}
                {saveMsg && (
                  <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{saveMsg}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  //   TAB 2: TOPIC LIBRARY
  // ==========================
  function renderTopicLibraryTab() {
    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Topic Library</h2>
        <p className="text-sm text-slate-500 mb-6">Browse pre-built video topic ideas organised by category. Click &quot;Use This Topic&quot; to load it into the AI Script Generator.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(TOPIC_LIBRARY).map(([key, category]) => (
            <div key={key} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{category.emoji}</span>
                <h3 className="text-base font-bold text-slate-900">{category.label}</h3>
              </div>
              <div className="space-y-3">
                {category.topics.map((topic, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-800 mb-0.5">{topic.title}</p>
                    <p className="text-xs text-slate-500 mb-2">{topic.desc}</p>
                    <button
                      onClick={() => useTopic(topic)}
                      className="text-xs px-3 py-1 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 font-medium transition-colors"
                    >
                      Use This Topic
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================
  //   BROWSER VIDEO HELPERS
  // ==========================

  function extractBullets(text) {
    if (!text) return [];
    const sentences = text.replace(/([.!?])\s+/g, '$1|').split('|').filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  function buildSlides(script) {
    const slides = [];
    // Title / Hook
    slides.push({
      type: 'title',
      text: script.youtube_title || script.title || 'CareCallAI',
      subtitle: script.video_type ? (VIDEO_TYPE_LABELS[script.video_type] || '') : '',
      narration: script.hook || '',
      duration: script.hook_duration || 10,
    });
    // Content sections
    const sections = script.sections || [];
    (typeof sections === 'string' ? JSON.parse(sections) : sections).forEach(sec => {
      slides.push({
        type: 'section',
        title: sec.title || '',
        bullets: extractBullets(sec.script),
        narration: sec.script || '',
        duration: sec.duration || 30,
        visualNote: sec.visualNotes || sec.visual_notes || '',
      });
    });
    // CTA
    if (script.cta) {
      slides.push({
        type: 'cta',
        text: script.cta,
        narration: script.cta,
        duration: script.cta_duration || 15,
      });
    }
    // Outro
    slides.push({
      type: 'outro',
      text: 'Thanks for watching!',
      subtitle: 'carecallai.co.uk',
      narration: script.outro || 'Thanks for watching. Visit carecallai.co.uk to learn more.',
      duration: 8,
    });
    return slides;
  }

  function renderSlideToCanvas(ctx, slide, w, h) {
    // Clear
    ctx.clearRect(0, 0, w, h);

    if (slide.type === 'title') {
      // Teal-blue gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0d9488');
      grad.addColorStop(1, '#2563eb');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      wrapText(ctx, slide.text, w / 2, h / 2 - 40, w - 120, 58);
      // Subtitle
      if (slide.subtitle) {
        ctx.font = '24px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(slide.subtitle, w / 2, h / 2 + 60);
      }
      // Branding
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('CareCallAI', w / 2, h - 40);

    } else if (slide.type === 'section') {
      // Dark background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);
      // Teal accent bar
      const barGrad = ctx.createLinearGradient(0, 0, w, 0);
      barGrad.addColorStop(0, '#0d9488');
      barGrad.addColorStop(1, '#2563eb');
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, 0, w, 6);
      // Section title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(slide.title, 60, 80);
      // Bullets
      ctx.font = '26px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      slide.bullets.forEach((bullet, i) => {
        const y = 150 + i * 55;
        // Teal dot
        ctx.beginPath();
        ctx.arc(70, y - 8, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#0d9488';
        ctx.fill();
        // Text
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '24px sans-serif';
        wrapText(ctx, bullet, 95, y, w - 160, 32);
      });
      // Visual note
      if (slide.visualNote) {
        ctx.font = 'italic 18px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(slide.visualNote, w / 2, h - 40);
      }
      // Branding
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'right';
      ctx.fillText('CareCallAI', w - 30, h - 20);

    } else if (slide.type === 'cta') {
      // Emerald gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#0d9488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // CTA text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      wrapText(ctx, slide.text, w / 2, h / 2 - 30, w - 120, 46);
      // Button mockup
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      roundRect(ctx, w / 2 - 150, h / 2 + 60, 300, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Visit carecallai.co.uk', w / 2, h / 2 + 92);

    } else if (slide.type === 'outro') {
      // Teal gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0d9488');
      grad.addColorStop(1, '#0f766e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(slide.text, w / 2, h / 2 - 20);
      ctx.font = '28px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(slide.subtitle || '', w / 2, h / 2 + 40);
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('CareCallAI', w / 2, h - 40);
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let yPos = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, yPos);
        line = words[i] + ' ';
        yPos += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, yPos);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function speakText(text, voice, rate) {
    return new Promise(resolve => {
      if (!text || !window.speechSynthesis) { resolve(); return; }
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (voice) utter.voice = voice;
      utter.rate = rate || 1.0;
      utter.onend = resolve;
      utter.onerror = resolve;
      speechSynthesis.speak(utter);
    });
  }

  function waitMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function generateBrowserVideo() {
    const script = scripts.find(s => String(s.id) === String(bvScriptId));
    if (!script) return;

    setBvGenerating(true);
    setBvProgress(0);
    setBvProgressLabel('Building slides...');
    setBvVideoUrl(null);

    try {
      const slides = buildSlides(script);
      const W = 1280, H = 720;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Capture stream
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const voice = bvVoices.find(v => v.name === bvSelectedVoice) || bvVoices[0] || null;
      recorder.start();

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setBvProgress(Math.round(((i) / slides.length) * 100));
        setBvProgressLabel(`Slide ${i + 1}/${slides.length}: ${slide.type === 'section' ? slide.title : slide.type}`);

        // Render slide
        renderSlideToCanvas(ctx, slide, W, H);

        // Narrate or wait
        if (bvNarrate && slide.narration && voice) {
          await speakText(slide.narration, voice, bvRate);
          // Small pause between slides
          await waitMs(800);
        } else {
          // Silent mode — wait for slide duration
          await waitMs(slide.duration * 1000);
        }
      }

      // Hold final slide for a moment
      await waitMs(1500);
      setBvProgress(100);
      setBvProgressLabel('Finalising video...');

      // Stop recording
      await new Promise(resolve => {
        recorder.onstop = resolve;
        recorder.stop();
      });

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setBvVideoUrl(url);
      setBvProgressLabel('Video ready!');
      setToast('Video generated successfully!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setBvProgressLabel('Error: ' + err.message);
    }
    setBvGenerating(false);
  }

  function previewSlides() {
    const script = scripts.find(s => String(s.id) === String(bvScriptId));
    if (!script) return;
    const slides = buildSlides(script);
    setBvSlides(slides);
    setBvSlideIndex(0);
    setBvPreviewing(true);
  }

  // ==========================
  //   TAB 3: VIDEO STUDIO
  // ==========================
  function renderVideoStudioTab() {
    const selectedScript = scripts.find((s) => String(s.id) === String(selectedScriptId));
    const generatingScripts = scripts.filter((s) => s.status === 'generating_video');
    const completedScripts = scripts.filter((s) => s.video_url);
    const availableScripts = scripts.filter((s) => s.status !== 'published');

    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Video Studio</h2>

        {/* ===== BROWSER VIDEO GENERATOR (FREE) ===== */}
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-800">Browser Video Generator (Free)</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">No API needed</span>
          </div>
          <p className="text-xs text-slate-500">Create branded slide videos with text-to-speech narration directly in your browser. No external services required.</p>

          {/* Script selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Script</label>
            <select
              value={bvScriptId}
              onChange={(e) => { setBvScriptId(e.target.value); setBvPreviewing(false); setBvVideoUrl(null); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="">-- Select a script --</option>
              {availableScripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || 'Untitled'} ({STATUS_LABELS[s.status] || 'Draft'})
                </option>
              ))}
            </select>
          </div>

          {/* Voice & speed */}
          {bvScriptId && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
                  <select
                    value={bvSelectedVoice}
                    onChange={(e) => setBvSelectedVoice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                  >
                    {bvVoices.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                    {bvVoices.length === 0 && <option value="">No voices available</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Speed: {bvRate}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={bvRate}
                    onChange={(e) => setBvRate(parseFloat(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0.5x</span><span>1.0x</span><span>2.0x</span>
                  </div>
                </div>
              </div>

              {/* Narration toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bvNarrate}
                  onChange={(e) => setBvNarrate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">Narrate aloud during generation</span>
                <span className="text-xs text-slate-400">(plays through speakers)</span>
              </label>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={previewSlides}
                  disabled={bvGenerating}
                  className="flex-1 px-4 py-2.5 border border-teal-300 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-50 disabled:opacity-50 transition-colors"
                >
                  Preview Slides
                </button>
                <button
                  onClick={generateBrowserVideo}
                  disabled={bvGenerating || bvVoices.length === 0}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {bvGenerating ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : 'Generate Video'}
                </button>
              </div>
            </>
          )}

          {/* Slide Preview */}
          {bvPreviewing && bvSlides.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700">Slide Preview</h4>
                <span className="text-xs text-slate-500">Slide {bvSlideIndex + 1} of {bvSlides.length}</span>
              </div>
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d');
                    renderSlideToCanvas(ctx, bvSlides[bvSlideIndex], 640, 360);
                  }
                }}
                width={640}
                height={360}
                className="w-full rounded-lg border border-slate-200"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setBvSlideIndex(Math.max(0, bvSlideIndex - 1))}
                  disabled={bvSlideIndex === 0}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  &#9664; Prev
                </button>
                <span className="text-xs font-medium text-slate-600 px-3 py-1 rounded-full bg-slate-100">
                  {bvSlides[bvSlideIndex].type === 'section' ? bvSlides[bvSlideIndex].title : bvSlides[bvSlideIndex].type}
                </span>
                <button
                  onClick={() => setBvSlideIndex(Math.min(bvSlides.length - 1, bvSlideIndex + 1))}
                  disabled={bvSlideIndex === bvSlides.length - 1}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  Next &#9654;
                </button>
              </div>
              {/* Narration text */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Narration:</p>
                <p className="text-sm text-slate-700 leading-relaxed">{bvSlides[bvSlideIndex].narration || '(no narration)'}</p>
              </div>
            </div>
          )}

          {/* Progress */}
          {bvGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{bvProgressLabel}</span>
                <span>{bvProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${bvProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Download */}
          {bvVideoUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-semibold text-green-800">Video ready!</p>
              </div>
              <video src={bvVideoUrl} controls className="w-full rounded-lg border border-green-200" />
              <a
                href={bvVideoUrl}
                download={`carecallai-video-${Date.now()}.webm`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download WebM
              </a>
            </div>
          )}
        </div>

        {/* ===== HEYGEN VIDEO GENERATOR ===== */}
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-800">HeyGen Avatar Video (Paid)</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">API required</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Generate Video from Script</h3>

          {/* Select Script */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Script</label>
            <select
              value={selectedScriptId}
              onChange={(e) => setSelectedScriptId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="">-- Select a script --</option>
              {availableScripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || 'Untitled'} ({STATUS_LABELS[s.status] || 'Draft'})
                </option>
              ))}
            </select>
          </div>

          {/* Selected script info */}
          {selectedScript && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-semibold text-slate-900">{selectedScript.title}</p>
              {selectedScript.youtube_title && (
                <p className="text-xs text-slate-500 mt-0.5">YT: {selectedScript.youtube_title}</p>
              )}
              <div className="flex gap-3 mt-1 text-xs text-slate-500">
                {selectedScript.estimated_duration > 0 && (
                  <span>Duration: {formatDuration(selectedScript.estimated_duration)}</span>
                )}
                {selectedScript.word_count > 0 && (
                  <span>Words: {selectedScript.word_count.toLocaleString()}</span>
                )}
              </div>
            </div>
          )}

          {/* Avatar ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Avatar ID</label>
            <input
              type="text"
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              placeholder="Enter HeyGen avatar ID"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Background colour */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Background Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 w-32"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => {
              if (selectedScriptId) generateVideo(selectedScriptId);
            }}
            disabled={videoGenerating || !selectedScriptId}
            className="w-full px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {videoGenerating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Generate Video
              </>
            )}
          </button>

          {/* Video Error */}
          {videoError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{videoError}</div>
          )}

          {/* Note */}
          <p className="text-xs text-slate-400">
            You need a HeyGen API key configured. Videos take 5-15 minutes to generate.
          </p>
        </div>

        {/* Video Queue */}
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Video Queue</h3>
          {generatingScripts.length === 0 ? (
            <p className="text-sm text-slate-400">No videos currently generating.</p>
          ) : (
            <div className="space-y-3">
              {generatingScripts.map((script) => (
                <div key={script.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{script.title || 'Untitled'}</p>
                      <p className="text-xs text-blue-600">Generating...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => checkVideoStatus(script.id)}
                    disabled={checkingStatus === script.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {checkingStatus === script.id ? 'Checking...' : 'Check Status'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Videos */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Completed Videos</h3>
          {completedScripts.length === 0 ? (
            <p className="text-sm text-slate-400">No completed videos yet.</p>
          ) : (
            <div className="space-y-4">
              {completedScripts.map((script) => (
                <div key={script.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{script.title || 'Untitled'}</p>
                      {script.youtube_title && (
                        <p className="text-xs text-slate-500">{script.youtube_title}</p>
                      )}
                    </div>
                    <a
                      href={script.video_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors"
                    >
                      Download
                    </a>
                  </div>
                  <video
                    src={script.video_url}
                    controls
                    className="w-full rounded-lg border border-slate-200"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-2">
                Video URLs expire after 7 days. Download videos promptly.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================
  //       MAIN RENDER
  // ==========================
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <a href="/admin" className="text-slate-400 hover:text-white text-sm">&larr; Admin</a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">YouTube Scripts</h1>
              <p className="text-slate-400 text-sm">AI-powered video content for CareCallAI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === idx
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[999999] bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 0 && renderScriptsTab()}
        {activeTab === 1 && renderGeneratorTab()}
        {activeTab === 2 && renderTopicLibraryTab()}
        {activeTab === 3 && renderVideoStudioTab()}
      </div>

      {/* Utility styles */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
