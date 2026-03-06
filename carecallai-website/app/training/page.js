'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TrainingPortal() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checking, setChecking] = useState(true);

  // Auth state
  const [authMode, setAuthMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [employer, setEmployer] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [completions, setCompletions] = useState([]);

  // Test state
  const [activeCourse, setActiveCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);

  // View state
  const [view, setView] = useState('courses'); // courses | test | result | certificates
  const [toast, setToast] = useState('');

  const canvasRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Check session on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('training_token');
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken));
        if (payload.role === 'training_user' && Date.now() - payload.ts < 7 * 86400000) {
          setUser(payload);
          setToken(savedToken);
        }
      } catch {}
    }
    setChecking(false);
  }, []);

  // Load courses when logged in
  useEffect(() => {
    if (user) {
      loadCourses();
      loadCompletions();
    }
  }, [user]);

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const res = await fetch('/api/training?public=1');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) {
      showToast('Failed to load courses');
    }
    setLoadingCourses(false);
  }

  async function loadCompletions() {
    try {
      const res = await fetch('/api/training/completions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompletions(data.completions || []);
    } catch {}
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const body = authMode === 'register'
        ? { action: 'register', email, password, full_name: fullName, employer, job_role: jobRole }
        : { action: 'login', email, password };

      const res = await fetch('/api/training/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      sessionStorage.setItem('training_token', data.token);
      setUser(JSON.parse(atob(data.token)));
      setToken(data.token);
    } catch (err) {
      setAuthError(err.message);
    }
    setAuthLoading(false);
  }

  function logout() {
    sessionStorage.removeItem('training_token');
    setUser(null);
    setToken(null);
    setView('courses');
  }

  async function startTest(course) {
    setLoadingTest(true);
    setActiveCourse(course);
    setAnswers({});
    setTestSubmitted(false);
    setTestResult(null);

    try {
      const res = await fetch(`/api/training/questions?course_id=${course.id}`);
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        showToast('No questions available for this course yet');
        setLoadingTest(false);
        return;
      }
      setQuestions(data.questions);
      setView('test');
    } catch {
      showToast('Failed to load test');
    }
    setLoadingTest(false);
  }

  async function submitTest() {
    if (Object.keys(answers).length < questions.length) {
      showToast('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const orderedAnswers = questions.map((_, i) => answers[i] ?? -1);
      const res = await fetch('/api/training/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: activeCourse.id,
          answers: orderedAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTestResult(data);
      setTestSubmitted(true);
      setView('result');
      loadCompletions();
    } catch (err) {
      showToast('Failed to submit: ' + err.message);
    }
    setSubmitting(false);
  }

  function generateCertificate(completion, courseTitle) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 850;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 850);
    grad.addColorStop(0, '#f0fdfa');
    grad.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 850);

    // Border
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 1140, 790);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1120, 770);

    // Corner decorations
    const corners = [[50, 50], [1140, 50], [50, 790], [1140, 790]];
    corners.forEach(([x, y]) => {
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Header
    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CareCallAI', 600, 100);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText('Certificate of Completion', 600, 160);

    // Divider
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 185);
    ctx.lineTo(900, 185);
    ctx.stroke();

    // Body text
    ctx.fillStyle = '#475569';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('This is to certify that', 600, 240);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(user?.full_name || 'Learner', 600, 300);

    ctx.fillStyle = '#475569';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('has successfully completed the training course', 600, 360);

    ctx.fillStyle = '#0d9488';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText(courseTitle, 600, 420);

    // Score
    ctx.fillStyle = '#475569';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(`Score: ${completion.score}%  |  Pass Mark: ${activeCourse?.pass_mark || 80}%`, 600, 480);

    // Date
    const dateStr = new Date(completion.completed_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    ctx.fillText(`Date: ${dateStr}`, 600, 520);

    // Certificate number
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(`Certificate No: ${completion.certificate_number}`, 600, 570);

    // Divider
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(300, 600);
    ctx.lineTo(900, 600);
    ctx.stroke();

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Georgia, serif';
    ctx.fillText('CareCallAI - Free Staff Training for CIW & CQC Compliance', 600, 650);
    ctx.fillText('carecallai.co.uk/training', 600, 675);

    // Validity note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Georgia, serif';
    ctx.fillText('This certificate confirms completion of an online assessment. It does not replace formal accredited training.', 600, 730);
    ctx.fillText('Verify at carecallai.co.uk/training with certificate number above.', 600, 750);

    // Download
    const link = document.createElement('a');
    link.download = `CareCallAI-Certificate-${completion.certificate_number}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ─── AUTH SCREEN ───
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <canvas ref={canvasRef} className="hidden" />

        {/* Nav */}
        <nav className="border-b border-slate-700/50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎓</span> CareCallAI Training
            </Link>
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
              &larr; Back to website
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Info */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Free Care Staff Training
              </h1>
              <p className="text-lg text-slate-300 mb-6">
                Complete mandatory training assessments and earn free certificates.
                Covering CIW and CQC compliance topics for domiciliary care and care home staff.
              </p>
              <div className="space-y-3">
                {[
                  '15 training modules covering mandatory topics',
                  'Free certificates on passing (80%+ score)',
                  'Covers Safeguarding, Mental Capacity Act, Moving & Handling, First Aid & more',
                  'Aligned with AWIF (All Wales Induction Framework)',
                  'Perfect for new starters and annual refreshers',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-teal-400 mt-0.5">✓</span>
                    <span className="text-slate-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Auth Form */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
              <div className="flex mb-6 bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${authMode === 'register' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Register Free
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Full Name *</label>
                      <input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Employer</label>
                        <input
                          value={employer}
                          onChange={e => setEmployer(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          placeholder="Care company"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Job Role</label>
                        <input
                          value={jobRole}
                          onChange={e => setJobRole(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                          placeholder="Care Worker"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-400 outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>

                {authError && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Free Account'}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center mt-4">
                100% free. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN PORTAL ───
  const categoryLabels = { mandatory: 'Mandatory', awif: 'AWIF', specialist: 'Specialist' };
  const categoryColors = {
    mandatory: 'bg-red-500/10 text-red-400 border-red-500/30',
    awif: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    specialist: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  function getCourseCompletion(courseId) {
    return completions.find(c => c.course_id === courseId && c.passed);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <canvas ref={canvasRef} className="hidden" />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎓</span> CareCallAI Training
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Welcome, {user.full_name}</span>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Sub-nav */}
      <div className="border-b border-slate-700/50 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {[
            { id: 'courses', label: 'Training Courses', icon: '📚' },
            { id: 'certificates', label: 'My Certificates', icon: '🏆' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                view === t.id || (view === 'test' && t.id === 'courses') || (view === 'result' && t.id === 'courses')
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* COURSES VIEW */}
        {view === 'courses' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Available Training Courses</h2>
              <p className="text-slate-400">Watch the video, then take the test to earn your free certificate. Pass mark: 80%.</p>
            </div>

            {loadingCourses ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(c => {
                  const passed = getCourseCompletion(c.id);
                  return (
                    <div key={c.id} className={`bg-slate-800/50 border rounded-xl p-5 transition-all hover:border-slate-500 ${passed ? 'border-green-600/50' : 'border-slate-700'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[c.category]}`}>
                          {categoryLabels[c.category]}
                        </span>
                        {passed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            ✓ Passed
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white mb-2">{c.title}</h3>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{c.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">⏱ {c.duration_minutes} min</span>
                        <div className="flex gap-2">
                          {c.youtube_url && (
                            <a
                              href={c.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30 transition-colors"
                            >
                              ▶ Watch
                            </a>
                          )}
                          <button
                            onClick={() => startTest(c)}
                            disabled={loadingTest}
                            className="px-3 py-1.5 bg-teal-600/20 text-teal-400 rounded-lg text-xs hover:bg-teal-600/30 transition-colors disabled:opacity-50"
                          >
                            {passed ? '🔄 Retake' : '📝 Take Test'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingCourses && courses.length === 0 && (
              <div className="text-center py-12 text-slate-500">No courses available yet. Check back soon!</div>
            )}
          </div>
        )}

        {/* TEST VIEW */}
        {view === 'test' && activeCourse && (
          <div>
            <div className="mb-6">
              <button onClick={() => setView('courses')} className="text-sm text-slate-400 hover:text-white mb-2 inline-block">
                &larr; Back to courses
              </button>
              <h2 className="text-2xl font-bold text-white">{activeCourse.title}</h2>
              <p className="text-slate-400">Answer all questions below. You need {activeCourse.pass_mark}% to pass.</p>
            </div>

            {loadingTest ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, qi) => (
                  <div key={q.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                    <p className="font-medium text-white mb-4">
                      <span className="text-teal-400 mr-2">Q{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {(q.options || []).map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                            answers[qi] === oi
                              ? 'bg-teal-600/20 border-teal-500 text-teal-300'
                              : 'bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <p className="text-sm text-slate-400">
                    {Object.keys(answers).length} of {questions.length} answered
                  </p>
                  <button
                    onClick={submitTest}
                    disabled={submitting || Object.keys(answers).length < questions.length}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT VIEW */}
        {view === 'result' && testResult && (
          <div className="max-w-xl mx-auto">
            <div className={`text-center p-8 rounded-2xl border ${
              testResult.passed
                ? 'bg-green-900/20 border-green-600/50'
                : 'bg-red-900/20 border-red-600/50'
            }`}>
              <div className="text-6xl mb-4">{testResult.passed ? '🎉' : '😔'}</div>
              <h2 className={`text-2xl font-bold mb-2 ${testResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.passed ? 'Congratulations!' : 'Not Quite'}
              </h2>
              <p className="text-slate-300 mb-4">
                {testResult.passed
                  ? `You passed ${testResult.course_title} with a score of ${testResult.score}%!`
                  : `You scored ${testResult.score}%. You needed ${activeCourse?.pass_mark || 80}% to pass.`}
              </p>
              <p className="text-slate-400 text-sm mb-6">
                {testResult.correct} out of {testResult.total} correct
              </p>

              {testResult.passed && testResult.certificate_number && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Certificate: {testResult.certificate_number}
                  </p>
                  <button
                    onClick={() => generateCertificate(testResult.completion, testResult.course_title)}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors"
                  >
                    📜 Download Certificate
                  </button>
                </div>
              )}

              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => setView('courses')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
                >
                  Back to Courses
                </button>
                {!testResult.passed && (
                  <button
                    onClick={() => startTest(activeCourse)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
                  >
                    🔄 Try Again
                  </button>
                )}
              </div>
            </div>

            {/* Show correct answers after submission */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold text-white">Review Your Answers</h3>
              {questions.map((q, qi) => {
                const userAnswer = answers[qi];
                const isCorrect = userAnswer === q.correct_index;
                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-900/10 border-green-700/30' : 'bg-red-900/10 border-red-700/30'}`}>
                    <p className="font-medium text-white mb-2">
                      <span className={`mr-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? '✓' : '✗'} Q{qi + 1}.
                      </span>
                      {q.question}
                    </p>
                    <div className="space-y-1 ml-6">
                      {(q.options || []).map((opt, oi) => (
                        <p key={oi} className={`text-sm ${
                          oi === q.correct_index ? 'text-green-400 font-medium' :
                          oi === userAnswer && !isCorrect ? 'text-red-400 line-through' :
                          'text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {oi === q.correct_index && ' ✓'}
                        </p>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-slate-400 mt-2 ml-6 italic">💡 {q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CERTIFICATES VIEW */}
        {view === 'certificates' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">My Certificates</h2>
            <p className="text-slate-400 mb-6">Download certificates for courses you've passed.</p>

            {completions.filter(c => c.passed).length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-slate-400">No certificates yet. Pass a course test to earn your first certificate!</p>
                <button
                  onClick={() => setView('courses')}
                  className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm text-white transition-colors"
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {completions.filter(c => c.passed).map(comp => (
                  <div key={comp.id} className="bg-slate-800/50 border border-green-700/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{comp.training_courses?.title || 'Course'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-green-400">Score: {comp.score}%</span>
                        <span className="text-xs text-slate-500">
                          {new Date(comp.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">{comp.certificate_number}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveCourse({ pass_mark: 80 });
                        generateCertificate(comp, comp.training_courses?.title || 'Course');
                      }}
                      className="px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg text-sm hover:bg-teal-600/30 transition-colors"
                    >
                      📜 Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 mt-12 px-6 py-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-slate-500">
            CareCallAI Training Portal - Free staff training for CIW & CQC compliance.
            These assessments support learning and do not replace formal accredited training programmes.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            <Link href="/" className="hover:text-teal-400 transition-colors">carecallai.co.uk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
