// Stripe Webhook — Sincroniza eventos de suscripción con la base de datos
// IMPORTANTE: Esta función es pública (sin JWT) y valida la firma de Stripe
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

type PlanId = "free" | "starter" | "pro" | "business";

function inferPlanFromAmount(amountCents: number, interval: string): PlanId {
  // Mapeo según los precios definidos en create-checkout
  if (interval === "year") {
    if (amountCents <= 12000) return "starter";
    if (amountCents <= 30000) return "pro";
    return "business";
  }
  // monthly
  if (amountCents <= 1500) return "starter";
  if (amountCents <= 3500) return "pro";
  return "business";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey) {
    return new Response("STRIPE_SECRET_KEY missing", { status: 500 });
  }
  if (!webhookSecret) {
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET no configurado todavía");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] firma inválida", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const ownerId = session.metadata?.owner_id;
        const plan = (session.metadata?.plan as PlanId) ?? "starter";
        const billing = session.metadata?.billing ?? "monthly";

        if (ownerId && session.customer && session.subscription) {
          await admin
            .from("account_subscriptions")
            .upsert(
              {
                owner_id: ownerId,
                plan,
                billing_cycle: billing,
                status: "active",
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                cancel_at_period_end: false,
              },
              { onConflict: "owner_id" }
            );
          console.log(`[stripe-webhook] checkout completado: ${ownerId} → ${plan}`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const ownerId = sub.metadata?.owner_id;
        const item = sub.items.data[0];
        const amount = item?.price?.unit_amount ?? 0;
        const interval = item?.price?.recurring?.interval ?? "month";
        const plan = (sub.metadata?.plan as PlanId) ?? inferPlanFromAmount(amount, interval);
        const billing = interval === "year" ? "annual" : "monthly";
        const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status;

        // Conversión segura de current_period_end (puede venir undefined/null en algunos eventos)
        const periodEndUnix =
          (sub as any).current_period_end ??
          item?.current_period_end ??
          null;
        const currentPeriodEndIso =
          typeof periodEndUnix === "number" && Number.isFinite(periodEndUnix)
            ? new Date(periodEndUnix * 1000).toISOString()
            : null;

        if (ownerId) {
          await admin
            .from("account_subscriptions")
            .upsert(
              {
                owner_id: ownerId,
                plan: status === "active" ? plan : "free",
                billing_cycle: billing,
                status,
                stripe_customer_id: sub.customer as string,
                stripe_subscription_id: sub.id,
                current_period_end: currentPeriodEndIso,
                cancel_at_period_end: sub.cancel_at_period_end,
              },
              { onConflict: "owner_id" }
            );
        } else {
          // Fallback: buscar por stripe_customer_id
          await admin
            .from("account_subscriptions")
            .update({
              plan: status === "active" ? plan : "free",
              billing_cycle: billing,
              status,
              stripe_subscription_id: sub.id,
              current_period_end: currentPeriodEndIso,
              cancel_at_period_end: sub.cancel_at_period_end,
            })
            .eq("stripe_customer_id", sub.customer as string);
        }
        console.log(`[stripe-webhook] subscription.${event.type.split(".").pop()} → ${plan} period_end=${currentPeriodEndIso}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await admin
          .from("account_subscriptions")
          .update({
            plan: "free",
            status: "cancelled",
            stripe_subscription_id: null,
            cancel_at_period_end: false,
          })
          .eq("stripe_customer_id", sub.customer as string);
        console.log(`[stripe-webhook] subscription cancelada: ${sub.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          await admin
            .from("account_subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_customer_id", invoice.customer as string);
        }
        break;
      }

      default:
        // ignorar otros eventos
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] error procesando evento", event.type, msg);
    return new Response(`Handler error: ${msg}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
