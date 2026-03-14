'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainingAdmin() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('courses');
  const [toast, setToast] = useState('');

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);

  // Questions state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Course form state
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('mandatory');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState(15);
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formPassMark, setFormPassMark] = useState(80);
  const [formStatus, setFormStatus] = useState('draft');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formPinCode, setFormPinCode] = useState('');

  // Question form state
  const [qQuestion, setQQuestion] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qSortOrder, setQSortOrder] = useState(0);

  // AI Generator state
  const [genNumQuestions, setGenNumQuestions] = useState(10);
  const [genDifficulty, setGenDifficulty] = useState('standard');
  const [genScriptText, setGenScriptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [genSelectedIds, setGenSelectedIds] = useState(new Set());
  const [savingGenerated, setSavingGenerated] = useState(false);
  const [genSourceInfo, setGenSourceInfo] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, withQuestions: 0 });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function apiFetch(url, options = {}) {
    const token = sessionStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  // Auth check
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token));
        if (payload.role === 'platform_admin' && Date.now() - payload.ts < 86400000) {
          setIsLoggedIn(true);
        }
      } catch {}
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !checking) router.push('/admin');
  }, [isLoggedIn, checking, router]);

  // Load courses
  useEffect(() => {
    if (isLoggedIn) loadCourses();
  }, [isLoggedIn]);

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const res = await apiFetch('/api/training');
      setCourses(res.courses || []);
      const published = (res.courses || []).filter(c => c.status === 'published').length;
      setStats({
        total: (res.courses || []).length,
        published,
        draft: (res.courses || []).length - published,
      });
    } catch (e) {
      showToast('Failed to load courses: ' + e.message);
    }
    setLoadingCourses(false);
  }

  async function loadQuestions(courseId) {
    setLoadingQuestions(true);
    try {
      const res = await apiFetch(`/api/training/questions?course_id=${courseId}`);
      setQuestions(res.questions || []);
    } catch (e) {
      showToast('Failed to load questions: ' + e.message);
    }
    setLoadingQuestions(false);
  }

  function resetCourseForm() {
    setFormTitle(''); setFormSlug(''); setFormCategory('mandatory');
    setFormDescription(''); setFormDuration(15); setFormYoutubeUrl('');
    setFormPassMark(80); setFormStatus('draft'); setFormSortOrder(0);
    setFormPinCode(''); setEditingCourse(null);
  }

  function editCourse(c) {
    setFormTitle(c.title); setFormSlug(c.slug); setFormCategory(c.category);
    setFormDescription(c.description || ''); setFormDuration(c.duration_minutes);
    setFormYoutubeUrl(c.youtube_url || ''); setFormPassMark(c.pass_mark);
    setFormStatus(c.status); setFormSortOrder(c.sort_order);
    setFormPinCode(c.pin_code || ''); setEditingCourse(c); setShowCourseForm(true);
  }

  async function saveCourse() {
    const payload = {
      title: formTitle, slug: formSlug, category: formCategory,
      description: formDescription, duration_minutes: formDuration,
      youtube_url: formYoutubeUrl || null, pass_mark: formPassMark,
      status: formStatus, sort_order: formSortOrder, pin_code: formPinCode || null,
    };
    try {
      if (editingCourse) {
        await apiFetch('/api/training', { method: 'PUT', body: JSON.stringify({ id: editingCourse.id, ...payload }) });
        showToast('Course updated');
      } else {
        await apiFetch('/api/training', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Course created');
      }
      setShowCourseForm(false);
      resetCourseForm();
      loadCourses();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }

  async function deleteCourse(id) {
    if (!confirm('Delete this course and all its questions?')) return;
    try {
      await apiFetch('/api/training', { method: 'DELETE', body: JSON.stringify({ id }) });
      showToast('Course deleted');
      loadCourses();
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }

  function resetQuestionForm() {
    setQQuestion(''); setQOptions(['', '', '', '']); setQCorrectIndex(0);
    setQExplanation(''); setQSortOrder(0); setEditingQuestion(null);
  }

  function editQuestion(q) {
    setQQuestion(q.question);
    setQOptions(q.options?.length ? [...q.options] : ['', '', '', '']);
    setQCorrectIndex(q.correct_index); setQExplanation(q.explanation || '');
    setQSortOrder(q.sort_order); setEditingQuestion(q); setShowQuestionForm(true);
  }

  async function saveQuestion() {
    const validOptions = qOptions.filter(o => o.trim());
    if (validOptions.length < 2) { showToast('At least 2 options required'); return; }
    const payload = {
      course_id: selectedCourse.id, question: qQuestion,
      options: validOptions, correct_index: qCorrectIndex,
      explanation: qExplanation, sort_order: qSortOrder,
    };
    try {
      if (editingQuestion) {
        await apiFetch('/api/training/questions', { method: 'PUT', body: JSON.stringify({ id: editingQuestion.id, ...payload }) });
        showToast('Question updated');
      } else {
        await apiFetch('/api/training/questions', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Question added');
      }
      setShowQuestionForm(false);
      resetQuestionForm();
      loadQuestions(selectedCourse.id);
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await apiFetch('/api/training/questions', { method: 'DELETE', body: JSON.stringify({ id }) });
      showToast('Question deleted');
      loadQuestions(selectedCourse.id);
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  }

  // AI Question Generator
  async function generateQuestions() {
    if (!selectedCourse) { showToast('Select a course first'); return; }
    setGenerating(true);
    setGeneratedQuestions([]);
    setGenSelectedIds(new Set());
    setGenSourceInfo('');
    try {
      const res = await apiFetch('/api/training/generate', {
        method: 'POST',
        body: JSON.stringify({
          course_title: selectedCourse.title,
          youtube_url: selectedCourse.youtube_url || '',
          script_text: genScriptText || '',
          num_questions: genNumQuestions,
          difficulty: genDifficulty,
        }),
      });
      setGeneratedQuestions(res.questions || []);
      setGenSelectedIds(new Set((res.questions || []).map((_, i) => i)));
      const srcLabel = res.source_type === 'youtube_transcript'
        ? `Generated from YouTube transcript (${res.content_length} chars)`
        : res.source_type === 'script'
        ? `Generated from pasted script (${res.content_length} chars)`
        : 'Generated from AI knowledge of this topic';
      setGenSourceInfo(srcLabel);
      showToast(`${(res.questions || []).length} questions generated!`);
    } catch (e) {
      showToast('Generation failed: ' + e.message);
    }
    setGenerating(false);
  }

  function toggleGenQuestion(idx) {
    setGenSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function saveGeneratedQuestions() {
    if (genSelectedIds.size === 0) { showToast('Select at least one question'); return; }
    setSavingGenerated(true);
    let saved = 0;
    const startOrder = questions.length;
    for (const idx of [...genSelectedIds].sort((a, b) => a - b)) {
      const gq = generatedQuestions[idx];
      if (!gq) continue;
      try {
        await apiFetch('/api/training/questions', {
          method: 'POST',
          body: JSON.stringify({
            course_id: selectedCourse.id,
            question: gq.question,
            options: gq.options,
            correct_index: gq.correct_index,
            explanation: gq.explanation || '',
            sort_order: startOrder + saved + 1,
          }),
        });
        saved++;
      } catch {}
    }
    showToast(`${saved} questions saved!`);
    setGeneratedQuestions([]);
    setGenSelectedIds(new Set());
    loadQuestions(selectedCourse.id);
    setSavingGenerated(false);
  }

  function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  if (checking) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" /></div>;
  if (!isLoggedIn) return null;

  const categoryColors = {
    mandatory: 'bg-red-100 text-red-700 border-red-200',
    awif: 'bg-blue-100 text-blue-700 border-blue-200',
    specialist: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-slate-400 hover:text-white transition-colors text-sm">&larr; Admin</a>
            <span className="text-slate-600">|</span>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎓</span> Training Course Manager
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">{stats.total} courses</span>
            <span className="text-green-400">{stats.published} published</span>
            <span className="text-yellow-400">{stats.draft} draft</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex gap-1 px-6">
          {[
            { id: 'courses', label: 'All Courses', icon: '📚' },
            { id: 'questions', label: 'Question Editor', icon: '❓' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* COURSES TAB */}
        {tab === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Training Courses</h2>
              <div className="flex gap-2">
                <button onClick={loadCourses} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                  🔄 Refresh
                </button>
                <button
                  onClick={() => { resetCourseForm(); setShowCourseForm(true); }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Course
                </button>
              </div>
            </div>

            {loadingCourses ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="space-y-3">
                {courses.map(c => (
                  <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{c.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[c.category] || categoryColors.mandatory}`}>
                            {c.category}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || statusColors.draft}`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{c.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>⏱ {c.duration_minutes} min</span>
                          <span>📊 Pass: {c.pass_mark}%</span>
                          <span>🔗 {c.slug}</span>
                          {c.youtube_url && <span>▶️ YouTube linked</span>}
                          {c.pin_code && <span className="font-mono text-teal-400">🔑 {c.pin_code}</span>}
                          <span>📋 #{c.sort_order}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => { setSelectedCourse(c); setTab('questions'); loadQuestions(c.id); }}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs hover:bg-blue-600/30 transition-colors"
                        >
                          ❓ Questions
                        </button>
                        <button
                          onClick={() => editCourse(c)}
                          className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteCourse(c.id)}
                          className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30 transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-12 text-slate-500">No courses yet. Click "Add Course" to create one.</div>
                )}
              </div>
            )}

            {/* Course Form Modal */}
            {showCourseForm && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Title *</label>
                        <input
                          value={formTitle}
                          onChange={e => { setFormTitle(e.target.value); if (!editingCourse) setFormSlug(generateSlug(e.target.value)); }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          placeholder="Safeguarding Adults"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Slug *</label>
                        <input
                          value={formSlug}
                          onChange={e => setFormSlug(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          placeholder="safeguarding-adults"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Category</label>
                          <select
                            value={formCategory}
                            onChange={e => setFormCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          >
                            <option value="mandatory">Mandatory</option>
                            <option value="awif">AWIF</option>
                            <option value="specialist">Specialist</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Status</label>
                          <select
                            value={formStatus}
                            onChange={e => setFormStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Description</label>
                        <textarea
                          value={formDescription}
                          onChange={e => setFormDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none h-20 resize-none"
                          placeholder="Course description..."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Duration (min)</label>
                          <input
                            type="number"
                            value={formDuration}
                            onChange={e => setFormDuration(parseInt(e.target.value) || 15)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Pass Mark (%)</label>
                          <input
                            type="number"
                            value={formPassMark}
                            onChange={e => setFormPassMark(parseInt(e.target.value) || 80)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Sort Order</label>
                          <input
                            type="number"
                            value={formSortOrder}
                            onChange={e => setFormSortOrder(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">YouTube URL</label>
                        <input
                          value={formYoutubeUrl}
                          onChange={e => setFormYoutubeUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Video Pin Code</label>
                        <p className="text-xs text-slate-500 mb-1">Place this code in the video. Learners must enter it before taking the test.</p>
                        <div className="flex gap-2">
                          <input
                            value={formPinCode}
                            onChange={e => setFormPinCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none font-mono tracking-widest"
                            placeholder="e.g. A7K3M2"
                            maxLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                              let code = '';
                              for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
                              setFormPinCode(code);
                            }}
                            className="px-3 py-2 bg-teal-600/20 text-teal-400 rounded-lg text-xs hover:bg-teal-600/30 transition-colors whitespace-nowrap"
                          >
                            Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => { setShowCourseForm(false); resetCourseForm(); }} className="px-4 py-2 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={saveCourse}
                        disabled={!formTitle || !formSlug}
                        className="px-4 py-2 bg-teal-600 rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingCourse ? 'Update' : 'Create'} Course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUESTIONS TAB */}
        {tab === 'questions' && (
          <div>
            {/* Course selector */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Select Course</label>
              <select
                value={selectedCourse?.id || ''}
                onChange={e => {
                  const c = courses.find(x => x.id === e.target.value);
                  setSelectedCourse(c || null);
                  if (c) loadQuestions(c.id);
                  else setQuestions([]);
                }}
                className="w-full max-w-md px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
              >
                <option value="">Choose a course...</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedCourse.title}</h2>
                    <p className="text-sm text-slate-400">{questions.length} question{questions.length !== 1 ? 's' : ''} &middot; Pass mark: {selectedCourse.pass_mark}%</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { resetQuestionForm(); setQSortOrder(questions.length + 1); setShowQuestionForm(true); }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>

                {/* AI Question Generator */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/40 rounded-xl p-5 mb-6">
                  <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-lg">🤖</span> AI Question Generator
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Generate test questions from the course YouTube video transcript, a pasted script, or AI knowledge of the topic.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Number of Questions</label>
                      <select
                        value={genNumQuestions}
                        onChange={e => setGenNumQuestions(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-400 outline-none"
                      >
                        <option value={5}>5 questions</option>
                        <option value={10}>10 questions</option>
                        <option value={15}>15 questions</option>
                        <option value={20}>20 questions</option>
                        <option value={25}>25 questions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
                      <select
                        value={genDifficulty}
                        onChange={e => setGenDifficulty(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-400 outline-none"
                      >
                        <option value="standard">Standard (knowledge checks)</option>
                        <option value="advanced">Advanced (scenario-based)</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={generateQuestions}
                        disabled={generating}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {generating ? (
                          <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating...</>
                        ) : (
                          <><span>🤖</span> Generate Questions</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Paste script/transcript (optional — if empty, will try YouTube URL or use AI knowledge)
                    </label>
                    <textarea
                      value={genScriptText}
                      onChange={e => setGenScriptText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-400 outline-none h-24 resize-none"
                      placeholder="Paste your video script or transcript here... Leave empty to auto-extract from YouTube or generate from topic knowledge."
                    />
                  </div>

                  {selectedCourse?.youtube_url && !genScriptText && (
                    <p className="text-xs text-blue-400 mt-2">
                      📡 Will attempt to extract transcript from: {selectedCourse.youtube_url}
                    </p>
                  )}
                </div>

                {/* Generated Questions Review */}
                {generatedQuestions.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-purple-300">Generated Questions — Review & Save</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{genSourceInfo}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (genSelectedIds.size === generatedQuestions.length) setGenSelectedIds(new Set());
                            else setGenSelectedIds(new Set(generatedQuestions.map((_, i) => i)));
                          }}
                          className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                        >
                          {genSelectedIds.size === generatedQuestions.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          onClick={saveGeneratedQuestions}
                          disabled={savingGenerated || genSelectedIds.size === 0}
                          className="px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingGenerated ? (
                            <><div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                          ) : (
                            <>✓ Save {genSelectedIds.size} Selected</>
                          )}
                        </button>
                        <button
                          onClick={() => { setGeneratedQuestions([]); setGenSelectedIds(new Set()); }}
                          className="px-3 py-1.5 bg-slate-700 text-red-400 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                        >
                          Discard All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {generatedQuestions.map((gq, gi) => (
                        <div
                          key={gi}
                          className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                            genSelectedIds.has(gi)
                              ? 'bg-purple-900/20 border-purple-600/50'
                              : 'bg-slate-900/50 border-slate-700 opacity-60'
                          }`}
                          onClick={() => toggleGenQuestion(gi)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              genSelectedIds.has(gi) ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-500'
                            }`}>
                              {genSelectedIds.has(gi) && '✓'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white mb-2">
                                <span className="text-purple-400 mr-1">Q{gi + 1}.</span> {gq.question}
                              </p>
                              <div className="grid grid-cols-2 gap-1.5 mb-2">
                                {(gq.options || []).map((opt, oi) => (
                                  <div key={oi} className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                                    oi === gq.correct_index
                                      ? 'bg-green-900/30 border-green-600/50 text-green-400'
                                      : 'bg-slate-800 border-slate-600 text-slate-400'
                                  }`}>
                                    {String.fromCharCode(65 + oi)}. {opt} {oi === gq.correct_index && ' ✓'}
                                  </div>
                                ))}
                              </div>
                              {gq.explanation && (
                                <p className="text-xs text-slate-500 italic">💡 {gq.explanation}</p>
                              )}
                              {gq.difficulty && (
                                <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                                  gq.difficulty === 'advanced' ? 'bg-orange-900/30 text-orange-400' :
                                  gq.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                                  'bg-slate-700 text-slate-400'
                                }`}>{gq.difficulty}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loadingQuestions ? (
                  <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full" /></div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, i) => (
                      <div key={q.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white mb-2">
                              <span className="text-teal-400 mr-2">Q{i + 1}.</span>
                              {q.question}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {(q.options || []).map((opt, oi) => (
                                <div
                                  key={oi}
                                  className={`text-sm px-3 py-1.5 rounded-lg border ${
                                    oi === q.correct_index
                                      ? 'bg-green-900/30 border-green-600 text-green-400'
                                      : 'bg-slate-900 border-slate-600 text-slate-400'
                                  }`}
                                >
                                  {oi === q.correct_index && '✓ '}{opt}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="text-xs text-slate-500 italic">💡 {q.explanation}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button onClick={() => editQuestion(q)} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600">✏️</button>
                            <button onClick={() => deleteQuestion(q.id)} className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30">🗑</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {questions.length === 0 && (
                      <div className="text-center py-8 text-slate-500">No questions yet. Click "Add Question" to create one.</div>
                    )}
                  </div>
                )}

                {/* Question Form Modal */}
                {showQuestionForm && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-4">{editingQuestion ? 'Edit Question' : 'Add Question'}</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Question *</label>
                            <textarea
                              value={qQuestion}
                              onChange={e => setQQuestion(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none h-20 resize-none"
                              placeholder="What is the first thing you should do when..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Answer Options (tick the correct one)</label>
                            {qOptions.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2 mb-2">
                                <button
                                  onClick={() => setQCorrectIndex(i)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    qCorrectIndex === i
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : 'border-slate-500 hover:border-slate-400'
                                  }`}
                                >
                                  {qCorrectIndex === i && '✓'}
                                </button>
                                <input
                                  value={opt}
                                  onChange={e => {
                                    const next = [...qOptions];
                                    next[i] = e.target.value;
                                    setQOptions(next);
                                  }}
                                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                                  placeholder={`Option ${i + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Explanation (shown after answering)</label>
                            <textarea
                              value={qExplanation}
                              onChange={e => setQExplanation(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none h-16 resize-none"
                              placeholder="This is correct because..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Sort Order</label>
                            <input
                              type="number"
                              value={qSortOrder}
                              onChange={e => setQSortOrder(parseInt(e.target.value) || 0)}
                              className="w-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                          <button onClick={() => { setShowQuestionForm(false); resetQuestionForm(); }} className="px-4 py-2 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                            Cancel
                          </button>
                          <button
                            onClick={saveQuestion}
                            disabled={!qQuestion.trim() || qOptions.filter(o => o.trim()).length < 2}
                            className="px-4 py-2 bg-teal-600 rounded-lg text-sm font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editingQuestion ? 'Update' : 'Add'} Question
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedCourse && (
              <div className="text-center py-12 text-slate-500">Select a course above to manage its questions.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
