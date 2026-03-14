'use client';

import { useState, useEffect } from 'react';

export default function HomecareReviews() {
  const [reviews, setReviews] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/homecare/public-reviews');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setReviews(data.reviews || []);
        setScore(data.score || null);
      } catch {
        // Silently fail — section just won't show
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-welsh-red uppercase tracking-wider mb-3">What Our Clients Say</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Rated{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              {score ? `${score} out of 5` : 'Excellent'}
            </span>
            {' '}on homecare.co.uk
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Real reviews from the families and clients we support every day.
          </p>

          {/* Overall stars */}
          {score && (
            <div className="flex items-center justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`w-7 h-7 ${s <= Math.round(score) ? 'text-amber-400' : 'text-slate-200'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
              <span className="ml-2 text-lg font-bold text-slate-700">{score}/5</span>
            </div>
          )}
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 5).map((review, i) => (
            <div
              key={review.id || i}
              className={`bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all duration-300 ${i >= 3 ? 'hidden lg:block' : ''} ${i === 4 ? 'hidden xl:block' : ''}`}
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className={`w-5 h-5 ${s <= Math.round(review.score || review.rating || 5) ? 'text-amber-400' : 'text-slate-200'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>

              {/* Title */}
              {review.title && (
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{review.title}</h3>
              )}

              {/* Review text */}
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 mb-4">
                &ldquo;{review.content || review.comment || review.text || 'Great service!'}&rdquo;
              </p>

              {/* Author & date */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-900">{review.author || 'Verified Reviewer'}</p>
                  {review.relationship && (
                    <p className="text-xs text-slate-500">{review.relationship}</p>
                  )}
                </div>
                {review.date && (
                  <p className="text-xs text-slate-400">
                    {new Date(review.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* homecare.co.uk badge */}
        <div className="text-center mt-10">
          <a
            href="https://www.homecare.co.uk/homecare/agency.cfm/id/65432259136"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-6 py-4 hover:shadow-lg hover:border-amber-400 transition-all group"
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                Read all reviews on homecare.co.uk
              </p>
              <p className="text-xs text-slate-500">Independent reviews from real clients</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
