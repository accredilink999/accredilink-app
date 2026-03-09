import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const siteUrl = Deno.env.get('SITE_URL') || 'https://carecallai.co.uk';
const appUrl = Deno.env.get('APP_URL') || 'https://app.carecallai.co.uk';

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Price IDs resolved at request time (not module load) to avoid stale cache
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
    // Authenticate the user
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { plan, organizationId, billing = 'monthly' } = await req.json();

    if (!plan || !organizationId) {
      return jsonResponse({ error: 'Missing plan or organizationId' }, 400);
    }

    const billingPeriod = billing === 'annual' ? 'annual' : 'monthly';

    // Get or create Stripe customer
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return jsonResponse({ error: 'Organization not found' }, 404);
    }

    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { organization_id: organizationId, user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);
    }

    // ── Guard: check Stripe directly for existing subscriptions ──
    // Prevents double-payment if webhook hasn't updated DB yet
    const [activeSubs, trialingSubs, incompleteSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: 'incomplete', limit: 1 }),
    ]);

    const existingSub = activeSubs.data[0] || trialingSubs.data[0];
    if (existingSub) {
      console.log(`[checkout] Customer ${customerId} already has ${existingSub.status} subscription ${existingSub.id} — redirecting to portal`);

      // Sync to DB in case webhook was missed
      const subPlan = existingSub.metadata?.plan || plan;
      await supabase.from('organizations').update({
        stripe_subscription_id: existingSub.id,
        plan: subPlan,
        subscription_status: existingSub.status,
      }).eq('id', organizationId);

      // Return billing portal so they can manage (not create another)
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/Settings`,
      });
      return jsonResponse({
        url: portalSession.url,
        existing: true,
        message: 'You already have an active subscription.',
      });
    }

    // If there's an incomplete (abandoned) checkout, cancel it first
    if (incompleteSubs.data[0]) {
      console.log(`[checkout] Cancelling incomplete subscription ${incompleteSubs.data[0].id}`);
      try {
        await stripe.subscriptions.cancel(incompleteSubs.data[0].id);
      } catch (_) { /* ignore if already cancelled */ }
    }

    const planPrices = getPlanPrices();
    const priceId = planPrices[plan]?.[billingPeriod];

    console.log(`[checkout] plan=${plan} billing=${billingPeriod} priceId=${priceId ? priceId.substring(0, 12) + '...' : 'EMPTY'}`);

    if (!priceId) {
      const envKeys = ['STRIPE_PRICE_STARTER_MONTHLY', 'STRIPE_PRICE_STARTER_ANNUAL',
        'STRIPE_PRICE_PROFESSIONAL_MONTHLY', 'STRIPE_PRICE_PROFESSIONAL_ANNUAL',
        'STRIPE_PRICE_ENTERPRISE_MONTHLY', 'STRIPE_PRICE_ENTERPRISE_ANNUAL'];
      const available = envKeys.map(k => `${k}=${Deno.env.get(k) ? 'SET' : 'EMPTY'}`);
      console.error(`[checkout] Price not found. Env check: ${available.join(', ')}`);

      return jsonResponse({
        error: `Stripe price not configured for ${plan} (${billingPeriod}). Set STRIPE_PRICE_${plan.toUpperCase()}_${billingPeriod.toUpperCase()} secret.`,
        message: 'Payment processing is being set up. Please contact us to get started.',
      }, 400);
    }

    // Check if this org already had a trial (no double trials) — check DB + Stripe history
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('stripe_subscription_id')
      .eq('id', organizationId)
      .single();

    // Also check Stripe for any cancelled subs (they had a trial before)
    const cancelledSubs = await stripe.subscriptions.list({
      customer: customerId, status: 'canceled', limit: 1,
    });
    const hadPreviousSubscription = !!existingOrg?.stripe_subscription_id || cancelledSubs.data.length > 0;

    // Create Stripe Checkout Session — 7-day trial with card upfront
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: 'always',
      success_url: `${appUrl}/Settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/Settings?checkout=cancelled`,
      metadata: {
        organization_id: organizationId,
        plan,
        billing: billingPeriod,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          plan,
          billing: billingPeriod,
        },
        // 7-day free trial for new customers only
        ...(hadPreviousSubscription ? {} : { trial_period_days: 7 }),
      },
    });

    return jsonResponse({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
});
