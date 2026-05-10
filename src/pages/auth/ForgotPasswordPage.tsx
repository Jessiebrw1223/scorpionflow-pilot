import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Mail, ArrowLeft, Loader2, KeyRound, Check } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const schema = z.object({ email: z.string().trim().email(t("auth.login.errors.invalidEmail")).max(255) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) { setError(parsed.error.flatten().fieldErrors.email?.[0]); return; }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` });
    setLoading(false);
    setSent(true);
    toast.success(t("auth.forgot.linkSent"), { description: t("auth.forgot.linkSentDesc") });
  };

  return (
    <AuthLayout
      title={sent ? t("auth.forgot.sentTitle") : t("auth.forgot.title")}
      subtitle={sent ? t("auth.forgot.sentSubtitle") : t("auth.forgot.subtitle")}
      footer={
        <Link to="/auth/login" className="inline-flex items-center gap-1.5 fire-link text-primary">
          <ArrowLeft className="w-3.5 h-3.5" /> {t("auth.forgot.back")}
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center text-center py-2 space-y-3">
          <div className="w-14 h-14 rounded-full bg-cost-positive/10 flex items-center justify-center fire-glow">
            <Check className="w-7 h-7 text-cost-positive" />
          </div>
          <p className="text-[13px] text-muted-foreground max-w-xs">{t("auth.forgot.sentBody")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.login.emailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="tu@empresa.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11 bg-secondary/50 border-border focus:border-primary" autoComplete="email" />
            </div>
            {error && <p className="text-[12px] text-destructive">{error}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 fire-button font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><KeyRound className="w-4 h-4" />{t("auth.forgot.submit")}</>
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
