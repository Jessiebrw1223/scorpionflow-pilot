/**
 * Convierte errores técnicos (Edge Functions, network, Stripe, Supabase)
 * en mensajes humanos accionables.
 *
 * Regla de oro: el usuario JAMÁS debe ver "Edge function returned non-2xx",
 * "FunctionsHttpError", stack traces ni IDs internos.
 */

const TECHNICAL_PATTERNS: Array<{ match: RegExp; friendly: string }> = [
  // Edge functions — específicos primero
  { match: /Function not found|404.*function/i,friendly: "El servicio aún no está disponible. Espera unos segundos y vuelve a intentarlo." },
  { match: /edge function.*non-?2xx/i,         friendly: "El servicio respondió con un error. Vuelve a intentarlo en unos segundos." },
  { match: /FunctionsHttpError/i,              friendly: "El servicio respondió con un error. Vuelve a intentarlo en unos segundos." },
  { match: /FunctionsRelayError/i,             friendly: "Hubo un problema de conexión con el servicio. Reintenta en un momento." },
  { match: /FunctionsFetchError/i,             friendly: "No pudimos contactar al servicio. Revisa tu conexión e intenta de nuevo." },
  { match: /Failed to (fetch|send) a request/i,friendly: "No pudimos contactar al servicio. Revisa tu conexión e intenta de nuevo." },
  { match: /Failed to fetch/i,                 friendly: "No pudimos contactar al servicio. Revisa tu conexión e intenta de nuevo." },

  // Stripe
  { match: /STRIPE_SECRET_KEY no configurada/i,friendly: "Los pagos no están activos en tu cuenta. Contacta al soporte." },
  { match: /STRIPE_WEBHOOK_SECRET/i,           friendly: "La sincronización de pagos no está lista. Contacta al soporte." },
  { match: /portal.*no.*activado|No configuration provided/i, friendly: "El portal de facturación no está activado en Stripe. Actívalo en Stripe → Settings → Billing → Customer portal." },
  { match: /No such customer/i,                friendly: "No encontramos tu suscripción activa." },
  { match: /No such subscription/i,            friendly: "No encontramos una suscripción activa para gestionar." },
  { match: /No tienes una suscripción activa/i,friendly: "Aún no tienes una suscripción activa. Suscríbete primero a un plan." },
  { match: /resource_missing/i,                friendly: "No encontramos el recurso solicitado." },
  { match: /Plan inválido/i,                   friendly: "El plan seleccionado no es válido." },
  { match: /No autenticado|Sesión inválida/i,  friendly: "Tu sesión expiró. Vuelve a iniciar sesión." },

  // Supabase / DB
  { match: /JWT expired/i,                     friendly: "Tu sesión expiró. Vuelve a iniciar sesión." },
  { match: /permission denied/i,               friendly: "No tienes permisos para esta acción." },
  { match: /violates row-level security/i,     friendly: "No tienes permisos para esta acción." },
  { match: /duplicate key/i,                   friendly: "Este registro ya existe." },
  { match: /violates not-null/i,               friendly: "Falta completar campos obligatorios." },
  { match: /violates foreign key/i,            friendly: "Este registro está vinculado a otros datos. Revisa antes de continuar." },
  { match: /timeout|timed out/i,               friendly: "La operación tardó demasiado. Intenta de nuevo." },

  // Realtime
  { match: /cannot add.*postgres_changes.*subscribe/i, friendly: "Hubo un problema sincronizando datos en tiempo real. Recarga la página." },

  // Errores típicos de tipos / runtime
  { match: /Cannot read propert.*of (undefined|null)/i, friendly: "No pudimos cargar esta información. Recarga la página." },
  { match: /trim is not a function/i,          friendly: "Algunos datos están incompletos. Recarga e intenta de nuevo." },

  // Network
  { match: /NetworkError|ERR_NETWORK/i,        friendly: "Sin conexión. Revisa tu internet." },
];

export function humanizeError(err: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (!err) return fallback;
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
  if (!raw) return fallback;

  for (const { match, friendly } of TECHNICAL_PATTERNS) {
    if (match.test(raw)) return friendly;
  }

  // Si el mensaje tiene pinta técnica (códigos, stacks), usa fallback
  const looksTechnical = /[{}\[\]<>]|0x[0-9a-f]+|at \w+\(|line \d+/i.test(raw);
  if (looksTechnical) return fallback;

  // Si es corto y legible, devuélvelo
  if (raw.length < 140) return raw;

  return fallback;
}
