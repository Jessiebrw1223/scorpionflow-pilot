// Crea una suscripción mensual (preapproval) en Mercado Pago para el plan Business — S/90/mes.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mpFetch, corsHeaders, BUSINESS_PLAN } from "../_shared/mercadopago.ts";

const log = (s: string, d?: unknown) =>
  console.log(`[create-mp-checkout] ${s}${d ? " " + JSON.stringify(d) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;
    log("user", { userId });

    const origin = req.headers.get("origin") ?? "https://scorpion-flow.com";
    const backUrl = `${origin}/settings?tab=subscription&mp=return`;

    // Webhook URL (Edge Function pública)
    const projectRef = (Deno.env.get("SUPABASE_URL") ?? "").match(/https:\/\/([^.]+)/)?.[1];
    const notificationUrl = projectRef
      ? `https://${projectRef}.supabase.co/functions/v1/mercadopago-webhook`
      : undefined;

    const preapproval = await mpFetch("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: BUSINESS_PLAN.reason,
        external_reference: userId,
        payer_email: userEmail,
        back_url: backUrl,
        notification_url: notificationUrl,
        status: "pending",
        auto_recurring: {
          frequency: BUSINESS_PLAN.frequency,
          frequency_type: BUSINESS_PLAN.frequency_type,
          transaction_amount: BUSINESS_PLAN.amount,
          currency_id: BUSINESS_PLAN.currency,
        },
      }),
    });

    log("preapproval created", { id: preapproval?.id });

    // Guardar referencia (estado pending — NO activamos Business hasta el webhook)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("account_subscriptions")
      .upsert({
        owner_id: userId,
        payment_provider: "mercadopago",
        mp_preapproval_id: preapproval.id,
        mp_customer_email: userEmail,
        status: "pending",
        billing_cycle: "monthly",
        // No cambiamos `plan` todavía — sigue siendo "free" hasta que el webhook confirme.
      }, { onConflict: "owner_id" });

    return new Response(
      JSON.stringify({ url: preapproval.init_point ?? preapproval.sandbox_init_point, preapproval_id: preapproval.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    console.error("[create-mp-checkout] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
