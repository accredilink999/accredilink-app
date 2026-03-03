'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const BRANDS = [
  { value: 'accredilink', label: 'Accredilink', color: 'bg-red-100 text-red-700' },
  { value: 'carecallai', label: 'CareCall AI', color: 'bg-teal-100 text-teal-700' },
];

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'x', label: 'X (Twitter)', icon: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'blog', label: 'Blog Article', icon: '📝' },
];

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-amber-100 text-amber-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
];

const TOPIC_SUGGESTIONS = {
  accredilink: [
    'Why home care matters for elderly independence',
    'Meet our amazing care team',
    'Tips for choosing a domiciliary care provider',
    'What is CIW regulation and why it matters',
    'Supporting families through respite care',
    'Community events in Denbighshire',
    'Winter safety tips for the elderly',
    'Our palliative care approach',
  ],
  carecallai: [
    'How to simplify CIW compliance with technology',
    'Top 5 time-saving features for care managers',
    'Why paper-based care logging is holding you back',
    'eMAR: Digital medication management explained',
    'Staff scheduling made simple with AI',
    'Family portal: Keeping loved ones connected',
    'CIW vs CQC compliance: What you need to know',
    'Reduce agency costs with smart rota management',
  ],
};

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
}

export default function SocialMediaHub() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('posts'); // posts, create, generate

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Create/edit state
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState({
    brand: 'accredilink',
    platform: 'facebook',
    title: '',
    content: '',
    hashtags: '',
    scheduled_at: '',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // AI generator state
  const [aiBrand, setAiBrand] = useState('accredilink');
  const [aiPlatform, setAiPlatform] = useState('facebook');
  const [aiTopic, setAiTopic] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [aiError, setAiError] = useState('');

  // Copy state
  const [copiedId, setCopiedId] = useState(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
    }
    setChecking(false);
  }, []);

  const fetchPosts = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPostsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBrand) params.set('brand', filterBrand);
      if (filterPlatform) params.set('platform', filterPlatform);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/social?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch { /* ignore */ }
    setPostsLoading(false);
  }, [filterBrand, filterPlatform, filterStatus]);

  useEffect(() => {
    if (isLoggedIn) fetchPosts();
  }, [isLoggedIn, fetchPosts]);

  const handleSavePost = async () => {
    const token = getToken();
    if (!token || !form.content.trim()) return;
    setSaving(true);
    setSaveMsg('');

    try {
      const method = editingPost ? 'PUT' : 'POST';
      const body = editingPost ? { id: editingPost.id, ...form } : form;

      const res = await fetch('/api/social', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setSaveMsg(editingPost ? 'Post updated!' : 'Post created!');
        setEditingPost(null);
        setForm({ brand: 'accredilink', platform: 'facebook', title: '', content: '', hashtags: '', scheduled_at: '', status: 'draft' });
        fetchPosts();
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg(`Error: ${data.error}`);
      }
    } catch {
      setSaveMsg('Failed to save post.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch('/api/social', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      fetchPosts();
    } catch { /* ignore */ }
    setDeleteConfirm(null);
  };

  const handleMarkPublished = async (post) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch('/api/social', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: post.id,
          status: 'published',
          published_at: new Date().toISOString(),
        }),
      });
      fetchPosts();
    } catch { /* ignore */ }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setForm({
      brand: post.brand,
      platform: post.platform,
      title: post.title || '',
      content: post.content,
      hashtags: post.hashtags || '',
      scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0, 16) : '',
      status: post.status,
    });
    setActiveTab('create');
  };

  const handleCopyContent = async (post) => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = post.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleGenerate = async () => {
    const token = getToken();
    if (!token || !aiTopic.trim()) return;
    setGenerating(true);
    setAiError('');
    setGenerated(null);

    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand: aiBrand,
          platform: aiPlatform,
          topic: aiTopic,
          additionalContext: aiContext || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setGenerated(data.generated);
      } else {
        setAiError(data.error || 'Generation failed');
      }
    } catch {
      setAiError('Failed to generate content. Check your network connection.');
    }
    setGenerating(false);
  };

  const handleUseGenerated = () => {
    if (!generated) return;
    setForm({
      brand: generated.brand,
      platform: generated.platform,
      title: generated.title || '',
      content: generated.content,
      hashtags: generated.hashtags || '',
      scheduled_at: '',
      status: 'draft',
    });
    setEditingPost(null);
    setActiveTab('create');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#B91C1C] rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please log in from the Admin Portal first.</p>
          <Link href="/admin" className="px-6 py-3 bg-[#B91C1C] text-white rounded-lg hover:bg-[#DC2626] transition-colors text-sm font-semibold">
            Go to Admin Portal
          </Link>
        </div>
      </div>
    );
  }

  const suggestions = TOPIC_SUGGESTIONS[aiBrand] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Accredilink Logo" width={40} height={40} className="w-10 h-10 rounded-lg object-contain" />
            <div>
              <h1 className="font-bold text-lg">Social Media Hub</h1>
              <p className="text-xs text-slate-400">Create, schedule & manage content</p>
            </div>
          </div>
          <Link href="/admin" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {[
              { key: 'posts', label: 'All Posts', icon: '📋' },
              { key: 'create', label: editingPost ? 'Edit Post' : 'Create Post', icon: '✏️' },
              { key: 'generate', label: 'AI Generator', icon: '🤖' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#B91C1C] text-[#B91C1C]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ═══ POSTS TAB ═══ */}
        {activeTab === 'posts' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
              >
                <option value="">All Brands</option>
                {BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
              >
                <option value="">All Platforms</option>
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button
                onClick={() => { setActiveTab('create'); setEditingPost(null); setForm({ brand: 'accredilink', platform: 'facebook', title: '', content: '', hashtags: '', scheduled_at: '', status: 'draft' }); }}
                className="ml-auto px-4 py-2 bg-[#B91C1C] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-colors"
              >
                + New Post
              </button>
            </div>

            {/* Posts List */}
            {postsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#B91C1C] rounded-full" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <p className="text-4xl mb-3">📱</p>
                <p className="text-lg font-semibold text-slate-700 mb-1">No posts yet</p>
                <p className="text-sm text-slate-500 mb-4">Create your first post or use the AI generator to get started.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-[#B91C1C] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-colors"
                  >
                    Create Post
                  </button>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    AI Generator
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const brand = BRANDS.find((b) => b.value === post.brand);
                  const platform = PLATFORMS.find((p) => p.value === post.platform);
                  const status = STATUSES.find((s) => s.value === post.status);

                  return (
                    <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${brand?.color || ''}`}>
                            {brand?.label}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {platform?.icon} {platform?.label}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status?.color || ''}`}>
                            {status?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleCopyContent(post)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              copiedId === post.id
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {copiedId === post.id ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Edit
                          </button>
                          {post.status !== 'published' && (
                            <button
                              onClick={() => handleMarkPublished(post)}
                              className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Mark Published
                            </button>
                          )}
                          {deleteConfirm === post.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(post.id)}
                              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {post.title && (
                        <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
                      )}

                      <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">{post.content}</p>

                      {post.hashtags && (
                        <p className="text-xs text-blue-600 mt-2">{post.hashtags}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Created {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {post.scheduled_at && (
                          <span>Scheduled: {new Date(post.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {post.published_at && (
                          <span>Published: {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        )}
                        {post.created_by && <span>by {post.created_by}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ CREATE/EDIT TAB ═══ */}
        {activeTab === 'create' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h2>

              {/* Brand & Platform */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                  >
                    {BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                  >
                    {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Title (optional, mainly for blog) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-slate-400 font-normal">(optional, used for blogs)</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Post title..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700"
                />
              </div>

              {/* Content */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your post content here..."
                  rows={form.platform === 'blog' ? 16 : 6}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 resize-y"
                />
                {form.platform === 'x' && (
                  <p className={`text-xs mt-1 ${form.content.length > 280 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                    {form.content.length}/280 characters
                  </p>
                )}
              </div>

              {/* Hashtags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hashtags</label>
                <input
                  type="text"
                  value={form.hashtags}
                  onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                  placeholder="#CareCallAI #DomiciliaryCare..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700"
                />
              </div>

              {/* Schedule & Status */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Schedule For</label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                  >
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePost}
                  disabled={saving || !form.content.trim()}
                  className="px-6 py-2.5 bg-[#B91C1C] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Save Post'}
                </button>
                {editingPost && (
                  <button
                    onClick={() => {
                      setEditingPost(null);
                      setForm({ brand: 'accredilink', platform: 'facebook', title: '', content: '', hashtags: '', scheduled_at: '', status: 'draft' });
                    }}
                    className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                {saveMsg && (
                  <p className={`text-sm font-medium ${saveMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ AI GENERATOR TAB ═══ */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Side */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">AI Content Generator</h2>
              <p className="text-sm text-slate-500 mb-6">Tell the AI what to write about and it will generate ready-to-publish content.</p>

              {/* Brand & Platform */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Brand</label>
                  <select
                    value={aiBrand}
                    onChange={(e) => setAiBrand(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                  >
                    {BRANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform</label>
                  <select
                    value={aiPlatform}
                    onChange={(e) => setAiPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white"
                  >
                    {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Topic */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic / What to Write About</label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Why home care keeps elderly people independent and happy..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 resize-y"
                />
              </div>

              {/* Suggestions */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Topic suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setAiTopic(s)}
                      className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Context */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Additional Context <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Any extra details, recent events, specific angles..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 resize-y"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !aiTopic.trim()}
                className="w-full px-6 py-3 bg-[#B91C1C] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </span>
                ) : (
                  'Generate Content'
                )}
              </button>

              {aiError && (
                <p className="text-red-600 text-sm mt-3 bg-red-50 p-3 rounded-lg">{aiError}</p>
              )}
            </div>

            {/* Output Side */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Generated Content</h2>

              {!generated && !generating ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🤖</p>
                  <p className="text-sm text-slate-500">Select a brand, platform, and topic, then click Generate to create AI-powered content.</p>
                </div>
              ) : generating ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-slate-300 border-t-[#B91C1C] rounded-full mx-auto mb-4" />
                    <p className="text-sm text-slate-500">Creating your content...</p>
                  </div>
                </div>
              ) : generated ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BRANDS.find((b) => b.value === generated.brand)?.color}`}>
                      {BRANDS.find((b) => b.value === generated.brand)?.label}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {PLATFORMS.find((p) => p.value === generated.platform)?.icon} {PLATFORMS.find((p) => p.value === generated.platform)?.label}
                    </span>
                  </div>

                  {generated.title && (
                    <h3 className="font-semibold text-slate-900 mb-2">{generated.title}</h3>
                  )}

                  <div className="bg-slate-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{generated.content}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleUseGenerated}
                      className="px-4 py-2 bg-[#B91C1C] text-white text-sm font-semibold rounded-lg hover:bg-[#DC2626] transition-colors"
                    >
                      Use This Post
                    </button>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(generated.content);
                        setCopiedId('generated');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        copiedId === 'generated'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {copiedId === 'generated' ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
