import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { TeamRole } from "@/hooks/useTeam";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: TeamRole) => Promise<{ error: string | null }>;
}

export function InviteMemberDialog({ open, onOpenChange, onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("collaborator");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const { error } = await onInvite(email, role);
    setSubmitting(false);
    if (error === "already_member") {
      toast.error("Este usuario ya forma parte de tu equipo.");
      return;
    }
    if (error === "already_invited") {
      toast.error("Ya enviaste una invitación a este email.");
      return;
    }
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Invitación enviada");
    setEmail("");
    setRole("collaborator");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="scorpion-gradient text-primary-foreground border-0">
              {submitting ? "Enviando..." : "Enviar invitación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
