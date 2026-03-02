import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { organizationId, action = 'cancel' } = await req.json();

    if (!organizationId) {
      return json({ error: 'Missing organizationId' }, 400);
    }

    // Verify user is owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return json({ error: 'Only the organisation owner can cancel the subscription' }, 403);
    }

    // Get org
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_subscription_id')
      .eq('id', organizationId)
      .single();

    if (!org?.stripe_subscription_id) {
      return json({ error: 'No active subscription found' }, 400);
    }

    if (action === 'cancel') {
      // Cancel at period end (not immediately)
      const sub = await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return json({
        success: true,
        cancel_at_period_end: true,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        message: 'Your subscription will be cancelled at the end of the current billing period.',
      });
    }

    if (action === 'reactivate') {
      // Undo the cancellation
      const sub = await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      return json({
        success: true,
        cancel_at_period_end: false,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        message: 'Your subscription has been reactivated.',
      });
    }

    return json({ error: 'Invalid action. Use "cancel" or "reactivate".' }, 400);
  } catch (err) {
    console.error('cancel-subscription error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});
