import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id;
        const plan = session.metadata?.plan || 'professional';

        if (orgId) {
          // Fetch the subscription to check if it's in trial
          let trialEnd = null;
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            if (sub.status === 'trialing' && sub.trial_end) {
              trialEnd = new Date(sub.trial_end * 1000).toISOString();
            }
          }

          await supabase
            .from('organizations')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              is_active: true,
              trial_ends_at: trialEnd, // null if no trial, ISO date if trialing
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);

          console.log(`Checkout completed for org ${orgId}, plan: ${plan}, trial_ends: ${trialEnd}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          const isActive = ['active', 'trialing'].includes(subscription.status);
          const plan = subscription.metadata?.plan || 'professional';

          await supabase
            .from('organizations')
            .update({
              plan,
              is_active: isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);

          console.log(`Subscription updated for org ${orgId}: ${subscription.status}, plan: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          await supabase
            .from('organizations')
            .update({
              plan: 'cancelled',
              is_active: false,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);

          console.log(`Subscription cancelled for org ${orgId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find org by stripe_customer_id
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('stripe_customer_id', customerId)
          .single();

        if (org) {
          console.log(`Payment failed for org ${org.id} (${org.name})`);
          // Could send notification email here using _shared/sendEmail.ts
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
