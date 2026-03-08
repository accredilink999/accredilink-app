import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('HOMECARE_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'HOMECARE_API_KEY not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch all reviews from homecare.co.uk API
    const res = await fetch(`https://api.homecare.co.uk/index.cfm/reviews/?API_key=${apiKey}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return jsonResponse({ error: `API returned ${res.status}` }, res.status);
    }

    const apiData = await res.json();
    const reviews = apiData.reviews || apiData.data?.reviews || apiData || [];
    const reviewList = Array.isArray(reviews) ? reviews : [];

    let matched = 0;
    let created = 0;

    for (const review of reviewList) {
      const reviewEmail = (review.email || review.reviewer_email || '').toLowerCase().trim();
      const reviewName = review.name || review.reviewer_name || '';
      const reviewId = String(review.id || review.review_id || '');

      if (!reviewEmail && !reviewName) continue;

      // Check if we already have this review stored by homecare_review_id
      if (reviewId) {
        const { data: existing } = await sb
          .from('client_reviews')
          .select('id')
          .eq('homecare_review_id', reviewId)
          .maybeSingle();

        if (existing) continue; // Already synced
      }

      // Try to match to a pending invite by email
      const { data: pending } = await sb
        .from('client_reviews')
        .select('*')
        .eq('reviewer_email', reviewEmail)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        // Update the pending record with the completed review data
        await sb.from('client_reviews').update({
          status: 'completed',
          rating: review.rating || review.score || null,
          comment: review.comment || review.description || review.review || null,
          review_date: review.date || review.created_at || new Date().toISOString(),
          homecare_review_id: reviewId || null,
          completed_at: new Date().toISOString(),
        }).eq('id', pending.id);
        matched++;
      } else if (reviewId) {
        // No pending invite — create an unlinked completed review record
        await sb.from('client_reviews').insert({
          reviewer_name: reviewName,
          reviewer_email: reviewEmail || null,
          rating: review.rating || review.score || null,
          comment: review.comment || review.description || review.review || null,
          review_date: review.date || review.created_at || new Date().toISOString(),
          homecare_review_id: reviewId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          source: 'homecare.co.uk',
        });
        created++;
      }
    }

    return jsonResponse({
      success: true,
      total_api_reviews: reviewList.length,
      matched_to_clients: matched,
      created_unlinked: created,
    });
  } catch (err) {
    console.error('syncReviews error:', err);
    return jsonResponse({ error: err.message || 'Failed to sync reviews' }, 500);
  }
});
