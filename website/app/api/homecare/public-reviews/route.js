import { NextResponse } from 'next/server';

const BASE_URL = 'https://api.homecare.co.uk/index.cfm';

// GET — public endpoint returning last 5 reviews + overall score (no auth required)
export async function GET() {
  const apiKey = process.env.HOMECARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reviews: [], score: null });
  }

  try {
    const [reviewsRes, scoreRes] = await Promise.all([
      fetch(`${BASE_URL}/reviews/?API_key=${apiKey}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 }, // cache for 1 hour
      }),
      fetch(`${BASE_URL}/reviews/scores?API_key=${apiKey}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      }),
    ]);

    const reviewsData = await reviewsRes.json();
    const scoreData = await scoreRes.json();

    // Extract reviews array (API may return in different shapes)
    const allReviews = reviewsData.reviews || reviewsData.data || (Array.isArray(reviewsData) ? reviewsData : []);

    // Take last 5 reviews, sanitise for public display
    const reviews = allReviews.slice(0, 5).map((r) => ({
      id: r.id || r.review_id || null,
      title: r.title || null,
      content: r.content || r.comment || r.text || r.description || null,
      score: r.score || r.rating || null,
      author: r.author || r.name || r.reviewer_name || 'Verified Reviewer',
      relationship: r.relationship || null,
      date: r.date || r.created_at || null,
    }));

    // Extract overall score
    const score = scoreData.score || scoreData.averageScore || scoreData.rating || null;

    return NextResponse.json({ reviews, score });
  } catch (err) {
    console.error('Public reviews fetch error:', err);
    return NextResponse.json({ reviews: [], score: null });
  }
}
