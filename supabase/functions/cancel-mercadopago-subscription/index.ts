// Cancela la suscripción Mercado Pago del usuario autenticado.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mpFetch, corsHeaders } from "../_shared/mercadopago.ts";

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
    const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row } = await admin.from("account_subscriptions")
      .select("mp_preapproval_id").eq("owner_id", userId).maybeSingle();
    if (!row?.mp_preapproval_id) {
      return new Response(JSON.stringify({ error: "No tienes una suscripción Mercado Pago activa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await mpFetch(`/preapproval/${row.mp_preapproval_id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    });

    // Marcar como cancelación programada — conserva acceso hasta current_period_end.
    // El webhook de MP confirmará el estado final cuando se procese.
    await admin.from("account_subscriptions").update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    }).eq("owner_id", userId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    console.error("[cancel-mp] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
