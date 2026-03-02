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

function getPlanPrices(): Record<string, Record<string, string>> {
  return {
    starter: {
      monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || Deno.env.get('STRIPE_PRICE_STARTER') || '',
      annual: Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL') || '',
    },
    professional: {
      monthly: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY') || Deno.env.get('STRIPE_PRICE_PROFESSIONAL') || '',
      annual: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_ANNUAL') || '',
    },
    enterprise: {
      monthly: Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') || Deno.env.get('STRIPE_PRICE_ENTERPRISE') || '',
      annual: Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL') || '',
    },
  };
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

    const { organizationId, newPlan, billing = 'monthly' } = await req.json();

    if (!organizationId || !newPlan) {
      return json({ error: 'Missing organizationId or newPlan' }, 400);
    }

    // Verify user is owner of this org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return json({ error: 'Only the organisation owner can change the plan' }, 403);
    }

    // Get org
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_subscription_id, stripe_customer_id, plan')
      .eq('id', organizationId)
      .single();

    if (!org?.stripe_subscription_id) {
      return json({ error: 'No active subscription found' }, 400);
    }

    // Get new price ID
    const billingPeriod = billing === 'annual' ? 'annual' : 'monthly';
    const prices = getPlanPrices();
    const newPriceId = prices[newPlan]?.[billingPeriod];

    if (!newPriceId) {
      return json({ error: `Price not configured for ${newPlan} (${billingPeriod})` }, 400);
    }

    // Get current subscription to find the item ID
    const currentSub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    const currentItemId = currentSub.items.data[0]?.id;

    if (!currentItemId) {
      return json({ error: 'Subscription has no items' }, 400);
    }

    // Update subscription (prorate)
    const updatedSub = await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{
        id: currentItemId,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      metadata: {
        organization_id: organizationId,
        plan: newPlan,
        billing: billingPeriod,
      },
      // If it was set to cancel, uncancel it
      cancel_at_period_end: false,
    });

    // Update org record
    await supabase
      .from('organizations')
      .update({
        plan: newPlan,
        is_active: true,
      })
      .eq('id', organizationId);

    return json({
      success: true,
      plan: newPlan,
      billing: billingPeriod,
      amount: updatedSub.items.data[0]?.price?.unit_amount
        ? updatedSub.items.data[0].price.unit_amount / 100
        : null,
      current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
    });
  } catch (err) {
    console.error('change-subscription error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});
