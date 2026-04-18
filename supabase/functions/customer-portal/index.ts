// Stripe Customer Portal — Permite al usuario gestionar su suscripción
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error } = await supabase.auth.getClaims(token);
    if (error || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;
    const userEmail = claims.claims.email as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: subRow } = await admin
      .from("account_subscriptions")
      .select("stripe_customer_id")
      .eq("owner_id", userId)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    let customerId = subRow?.stripe_customer_id ?? null;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (existing.data.length === 0) {
        return new Response(
          JSON.stringify({ error: "No tienes una suscripción activa todavía." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      customerId = existing.data[0].id;
    }

    const origin = req.headers.get("origin") ?? "https://scorpion-flow.com";
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings?tab=subscription`,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    console.error("[customer-portal]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
