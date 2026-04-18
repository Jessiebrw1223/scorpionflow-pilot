import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import { toast } from "sonner";
import type { TeamRole } from "@/hooks/useTeam";
import type { InviteResult } from "@/hooks/useTeam";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: TeamRole) => Promise<InviteResult>;
}

type Step = "form" | "result";

export function InviteMemberDialog({ open, onOpenChange, onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("collaborator");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setRole("collaborator");
    setStep("form");
    setResult(null);
    setCopied(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const res = await onInvite(email, role);
    setSubmitting(false);

    if (res.error === "already_member") {
      toast.error("Este usuario ya forma parte de tu equipo.");
      return;
    }
    if (res.error === "already_invited") {
      toast.error("Ya enviaste una invitación a este email.");
      return;
    }
    if (res.error === "limit_reached") {
      toast.error("Has alcanzado el límite de tu plan.");
      return;
    }
    if (res.error) {
      toast.error(res.error);
      return;
    }

    setResult(res);
    setStep("result");
    if (res.emailSent) {
      toast.success("Invitación enviada por correo");
    } else {
      toast.warning("Invitación creada. Comparte el enlace manualmente.");
    }
  };

  const handleCopy = async () => {
    if (!result?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Invitar a tu equipo</DialogTitle>
              <DialogDescription>
                La claridad no sirve si no es compartida. Invita a las personas con las que tomas decisiones.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email del colaborador</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="persona@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin · Control total</SelectItem>
                    <SelectItem value="collaborator">Colaborador · Acceso operativo</SelectItem>
                    <SelectItem value="viewer">Visualizador · Solo lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="scorpion-gradient text-primary-foreground border-0">
                  {submitting ? "Enviando..." : "Enviar invitación"}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "result" && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {result.emailSent ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Invitación enviada
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Invitación creada
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {result.emailSent ? (
                  <>
                    Enviamos un correo a <strong>{result.invitation?.email}</strong> con
                    el enlace para unirse al equipo.
                  </>
                ) : (
                  <>
                    No pudimos enviar el correo, pero la invitación está activa.
                    Comparte el enlace manualmente con{" "}
                    <strong>{result.invitation?.email}</strong>.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Enlace de invitación
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={result.inviteUrl ?? ""}
                    className="font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Este enlace es de un solo uso y expira en 14 días.
                </p>
              </div>

              {!result.emailSent && result.emailError && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-600 dark:text-orange-400 flex gap-2">
                  <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">Detalle del error de envío</div>
                    <div className="opacity-80">{result.emailError}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                  }}
                >
                  Invitar a otra persona
                </Button>
                <Button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="scorpion-gradient text-primary-foreground border-0"
                >
                  Listo
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
