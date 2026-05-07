// Configuración compartida Mercado Pago - ScorpionFlow Beta
// IMPORTANTE: el ACCESS_TOKEN solo se usa en backend (Edge Functions).

export const MP_API = "https://api.mercadopago.com";

export const BUSINESS_PLAN = {
  id: "business",
  amount: 90,
  currency: "PEN",
  reason: "ScorpionFlow Business — Beta",
  frequency: 1,
  frequency_type: "months" as const,
};

export function getMpToken(): string {
  const t = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
  return t;
}

export async function mpFetch(path: string, init: RequestInit = {}) {
  const token = getMpToken();
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    // No exponer token en logs.
    console.error("[mercadopago] API error", { status: res.status, path, data });
    throw new Error(
      typeof data === "object" && data?.message
        ? data.message
        : `Mercado Pago respondió ${res.status}`,
    );
  }
  return data;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
