import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { setAppLanguage, type AppLanguage } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  variant?: "compact" | "pill" | "full";
  className?: string;
}

const LABEL: Record<AppLanguage, string> = { es: "ES", en: "EN" };

export function LanguageSwitcher({ variant = "compact", className }: Props) {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage?.startsWith("en") ? "en" : "es") as AppLanguage;

  const change = (lng: AppLanguage) => {
    if (lng !== current) setAppLanguage(lng);
  };

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-card/60 p-0.5 text-[11px] font-semibold",
          className
        )}
        role="group"
        aria-label={t("languageSwitcher.label")}
      >
        {(["es", "en"] as AppLanguage[]).map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => change(lng)}
            className={cn(
              "px-2.5 py-1 rounded-full transition-colors",
              current === lng
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={current === lng}
          >
            {LABEL[lng]}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {(["es", "en"] as AppLanguage[]).map((lng) => (
          <button
            key={lng}
            type="button"
            onClick={() => change(lng)}
            className={cn(
              "p-3 rounded-lg border-2 text-left transition-sf bg-secondary/40",
              current === lng ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
                  current === lng ? "border-primary" : "border-muted-foreground"
                )}
              >
                {current === lng && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </span>
              <span className="text-[12px] font-medium text-foreground">
                {lng === "es" ? t("settings.language.es") : t("settings.language.en")}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-5">
              {lng === "es" ? t("settings.language.esDesc") : t("settings.language.enDesc")}
            </p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border bg-card/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors",
          className
        )}
        aria-label={t("languageSwitcher.label")}
      >
        <Languages className="w-3.5 h-3.5" />
        {LABEL[current]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(["es", "en"] as AppLanguage[]).map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => change(lng)}
            className={cn("text-[13px] cursor-pointer", current === lng && "font-semibold text-primary")}
          >
            {LABEL[lng]} · {lng === "es" ? t("common.spanish") : t("common.english")}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
