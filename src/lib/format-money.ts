// Formato de moneda reactivo a la configuración de negocio del usuario.
// La fuente de verdad es useUserSettings (currency: PEN | USD).
//
// Uso en componentes React:   const money = useMoney();   money(1234.5)
// Uso fuera de React:         formatMoneyWith("USD", 1234.5)

import { useMemo } from "react";
import { useUserSettings, getCachedSettings, type Currency } from "@/hooks/useUserSettings";

const LOCALE_BY_CURRENCY: Record<Currency, string> = {
  PEN: "es-PE",
  USD: "en-US",
};

const SYMBOL_BY_CURRENCY: Record<Currency, string> = {
  PEN: "S/",
  USD: "$",
};

function buildFormatter(currency: Currency, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  });
}

export function formatMoneyWith(currency: Currency, value: number, opts?: Intl.NumberFormatOptions) {
  const safe = Number.isFinite(value) ? value : 0;
  return buildFormatter(currency, opts).format(safe);
}

/** Para usar fuera de componentes React (helpers, mocks, etc.) — lee la última configuración cacheada */
export function formatMoney(value: number, opts?: Intl.NumberFormatOptions) {
  const { currency } = getCachedSettings();
  return formatMoneyWith(currency, value, opts);
}

export function getCurrencySymbol(): string {
  return SYMBOL_BY_CURRENCY[getCachedSettings().currency];
}

/** Hook reactivo: re-renderiza cuando cambia la moneda en Configuración */
export function useMoney() {
  const { settings } = useUserSettings();
  const currency = settings.currency;

  return useMemo(() => {
    const fmt = buildFormatter(currency);
    const fmtCompact = buildFormatter(currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const symbol = SYMBOL_BY_CURRENCY[currency];
    const fn = (value: number) => fmt.format(Number.isFinite(value) ? value : 0);
    fn.compact = (value: number) => fmtCompact.format(Number.isFinite(value) ? value : 0);
    fn.currency = currency;
    fn.symbol = symbol;
    return fn;
  }, [currency]);
}
