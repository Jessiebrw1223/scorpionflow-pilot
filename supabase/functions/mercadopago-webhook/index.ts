// Webhook de Mercado Pago. Activa/desactiva el plan Business según estado real.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mpFetch, corsHeaders } from "../_shared/mercadopago.ts";

const log = (s: string, d?: unknown) =>
  console.log(`[mp-webhook] ${s}${d ? " " + JSON.stringify(d) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    log("received", { type: body?.type ?? url.searchParams.get("type"), id: body?.data?.id ?? url.searchParams.get("id") });

    const type = (body?.type ?? url.searchParams.get("type") ?? "").toString();
    const id = (body?.data?.id ?? url.searchParams.get("id") ?? "").toString();
    if (!id) return new Response("ok", { status: 200, headers: corsHeaders });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let preapprovalId: string | null = null;
    let preapprovalStatus: string | null = null;
    let lastPaymentId: string | null = null;
    let externalReference: string | null = null;

    if (type === "preapproval" || type === "subscription_preapproval") {
      const pre = await mpFetch(`/preapproval/${id}`);
      preapprovalId = pre?.id ?? null;
      preapprovalStatus = pre?.status ?? null;
      externalReference = pre?.external_reference ?? null;
    } else if (type === "payment") {
      const pay = await mpFetch(`/v1/payments/${id}`);
      lastPaymentId = String(pay?.id ?? "");
      preapprovalId = pay?.metadata?.preapproval_id ?? pay?.preapproval_id ?? null;
      externalReference = pay?.external_reference ?? null;
      // Si tenemos preapproval_id, recuperamos su estado actual.
      if (preapprovalId) {
        const pre = await mpFetch(`/preapproval/${preapprovalId}`);
        preapprovalStatus = pre?.status ?? null;
        externalReference = externalReference ?? pre?.external_reference ?? null;
      } else if (pay?.status === "approved") {
        preapprovalStatus = "authorized";
      } else {
        preapprovalStatus = pay?.status ?? null;
      }
    } else {
      log("ignored type", { type });
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (!externalReference) {
      // Buscar por preapproval_id si no llegó la referencia
      if (preapprovalId) {
        const { data: row } = await admin.from("account_subscriptions")
          .select("owner_id").eq("mp_preapproval_id", preapprovalId).maybeSingle();
        externalReference = row?.owner_id ?? null;
      }
    }
    if (!externalReference) {
      log("no owner", { preapprovalId });
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Mapear estado MP -> nuestro estado y plan
    let plan: "free" | "business" = "free";
    let status: string = "pending";
    let cancelAtPeriodEnd = false;

    switch (preapprovalStatus) {
      case "authorized":
        plan = "business";
        status = "active";
        break;
      case "paused":
        plan = "business";
        status = "paused";
        break;
      case "cancelled":
        plan = "free";
        status = "cancelled";
        cancelAtPeriodEnd = true;
        break;
      case "pending":
        status = "pending";
        break;
      case "rejected":
      case "expired":
        plan = "free";
        status = preapprovalStatus;
        break;
      default:
        status = preapprovalStatus ?? "pending";
    }

    const update: Record<string, unknown> = {
      payment_provider: "mercadopago",
      status,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    };
    if (preapprovalId) update.mp_preapproval_id = preapprovalId;
    if (lastPaymentId) update.mp_last_payment_id = lastPaymentId;
    if (plan === "business" || plan === "free") update.plan = plan;

    const { error: upErr } = await admin.from("account_subscriptions")
      .update(update).eq("owner_id", externalReference);
    if (upErr) {
      // Si no existía fila, insertamos
      await admin.from("account_subscriptions").upsert({
        owner_id: externalReference, ...update,
      }, { onConflict: "owner_id" });
    }

    // Audit en subscription_events
    await admin.from("subscription_events").insert({
      owner_id: externalReference,
      event_type: `mp.${type}.${preapprovalStatus ?? "unknown"}`,
      to_plan: plan,
      billing_cycle: "monthly",
      metadata: { preapprovalId, lastPaymentId, mpStatus: preapprovalStatus },
    });

    log("updated", { externalReference, plan, status });
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("[mp-webhook] ERROR", e instanceof Error ? e.message : e);
    // Devolvemos 200 para evitar reintentos infinitos cuando es error nuestro de parseo
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
