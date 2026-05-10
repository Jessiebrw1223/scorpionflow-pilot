import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    password: z.string()
      .min(8, t("auth.register.errors.minPassword")).max(72)
      .regex(/[A-Z]/, t("auth.register.errors.needsUpper"))
      .regex(/[0-9]/, t("auth.register.errors.needsNumber"))
      .regex(/[^A-Za-z0-9]/, t("auth.register.errors.needsSymbol")),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t("auth.register.errors.noMatch"), path: ["confirmPassword"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const fld = parsed.error.flatten().fieldErrors;
      setErrors({ password: fld.password?.[0] || "", confirmPassword: fld.confirmPassword?.[0] || "" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(t("auth.reset.couldNotUpdate"), { description: error.message }); return; }
    toast.success(t("auth.reset.updated"), { description: t("auth.reset.updatedDesc") });
    navigate("/auth/login");
  };

  return (
    <AuthLayout title={t("auth.reset.title")} subtitle={t("auth.reset.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.reset.newPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-9 h-11 bg-secondary/50 border-border focus:border-primary" />
          </div>
          {errors.password && <p className="text-[12px] text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.reset.confirm")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9 h-11 bg-secondary/50 border-border focus:border-primary" />
          </div>
          {errors.confirmPassword && <p className="text-[12px] text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11 fire-button font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><ShieldCheck className="w-4 h-4" />{t("auth.reset.submit")}</>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
