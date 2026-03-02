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

    const { organizationId } = await req.json();
    if (!organizationId) {
      return json({ error: 'Missing organizationId' }, 400);
    }

    // Verify user is admin/owner of this org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return json({ error: 'Not authorized to view billing' }, 403);
    }

    // Get org details
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return json({ error: 'Organization not found' }, 404);
    }

    const result: Record<string, unknown> = {
      organization: {
        id: org.id,
        name: org.name,
        plan: org.plan,
        is_active: org.is_active,
        trial_ends_at: org.trial_ends_at,
        invite_code: org.invite_code,
      },
      subscription: null,
      paymentMethod: null,
      invoices: [],
    };

    // If no Stripe customer, return basic info
    if (!org.stripe_customer_id) {
      return json(result);
    }

    // Fetch subscription details
    if (org.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id, {
          expand: ['default_payment_method'],
        });

        result.subscription = {
          id: sub.id,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          plan: sub.metadata?.plan || org.plan,
          billing: sub.metadata?.billing || 'monthly',
          amount: sub.items?.data?.[0]?.price?.unit_amount
            ? sub.items.data[0].price.unit_amount / 100
            : null,
          currency: sub.items?.data?.[0]?.price?.currency || 'gbp',
          interval: sub.items?.data?.[0]?.price?.recurring?.interval || 'month',
        };

        // Payment method from subscription
        if (sub.default_payment_method && typeof sub.default_payment_method === 'object') {
          const pm = sub.default_payment_method;
          if (pm.card) {
            result.paymentMethod = {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            };
          }
        }
      } catch (subErr) {
        console.error('Subscription fetch error:', subErr);
      }
    }

    // If no payment method from subscription, try customer default
    if (!result.paymentMethod) {
      try {
        const methods = await stripe.paymentMethods.list({
          customer: org.stripe_customer_id,
          type: 'card',
          limit: 1,
        });
        if (methods.data.length > 0) {
          const card = methods.data[0].card!;
          result.paymentMethod = {
            brand: card.brand,
            last4: card.last4,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
          };
        }
      } catch {
        // No payment method
      }
    }

    // Fetch recent invoices
    try {
      const invoices = await stripe.invoices.list({
        customer: org.stripe_customer_id,
        limit: 10,
      });

      result.invoices = invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: new Date(inv.created * 1000).toISOString(),
        amount: (inv.amount_paid || inv.total || 0) / 100,
        currency: inv.currency,
        status: inv.status,
        pdf: inv.invoice_pdf,
        hosted_url: inv.hosted_invoice_url,
      }));
    } catch {
      // No invoices
    }

    // Get member count
    const { count } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    result.memberCount = count || 0;

    return json(result);
  } catch (err) {
    console.error('get-billing-details error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});
