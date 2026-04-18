import { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Eye,
  Trash2,
  X,
  Crown,
  Sparkles,
  Lock,
  Copy,
  Send,
  CheckCircle2,
  Clock,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useTeam,
  type TeamRole,
  type TeamInvitation,
  type InvitationStatus,
  buildInviteUrl,
  computeInvitationStatus,
} from "@/hooks/useTeam";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { UpgradePlanDialog } from "@/components/team/UpgradePlanDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Admin",
  collaborator: "Colaborador",
  viewer: "Visualizador",
};

const ROLE_ICON: Record<TeamRole, React.ElementType> = {
  admin: Shield,
  collaborator: Users,
  viewer: Eye,
};

const STATUS_META: Record<
  InvitationStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "border-yellow-500/40 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
  },
  accepted: {
    label: "Aceptada",
    icon: CheckCircle2,
    className: "border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10",
  },
  expired: {
    label: "Expirada",
    icon: CircleAlert,
    className: "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10",
  },
  cancelled: {
    label: "Cancelada",
    icon: X,
    className: "border-muted-foreground/30 text-muted-foreground bg-secondary",
  },
  rejected: {
    label: "Rechazada",
    icon: X,
    className: "border-muted-foreground/30 text-muted-foreground bg-secondary",
  },
};

export default function TeamPage() {
  const navigate = useNavigate();
  const {
    loading,
    plan,
    planLabel,
    members,
    invitations,
    used,
    limit,
    isUnlimited,
    canInvite,
    remaining,
    inviteUser,
    resendInvitation,
    cancelInvitation,
    removeMember,
  } = useTeam();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const handleInviteClick = () => {
    if (!canInvite) {
      setUpsellOpen(true);
      return;
    }
    setInviteOpen(true);
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(token));
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleResend = async (inv: TeamInvitation) => {
    const res = await resendInvitation(inv);
    if (res.emailSent) {
      toast.success("Correo reenviado");
    } else {
      toast.warning(
        "No se pudo reenviar el correo. Comparte el enlace manualmente."
      );
    }
  };

  const usagePercent = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const progressColor =
    usagePercent >= 100
      ? "bg-destructive"
      : usagePercent >= 80
      ? "bg-orange-500"
      : "scorpion-gradient";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Equipo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invita a tu equipo. Comparte la misma información. Toma decisiones alineadas.
          </p>
        </div>
        <Button
          onClick={handleInviteClick}
          className="scorpion-gradient text-primary-foreground border-0 fire-glow"
          size="lg"
        >
          {canInvite ? <UserPlus className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          Invitar usuario
        </Button>
      </div>

      {/* Plan usage card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Plan {planLabel}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {isUnlimited ? "Ilimitado" : `${used} / ${limit} usuarios`}
            </Badge>
          </div>
          {!isUnlimited && (
            <button
              onClick={() => navigate("/settings?tab=subscription")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Mejorar plan
            </button>
          )}
        </div>

        {!isUnlimited ? (
          <>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {remaining > 0
                ? `Te quedan ${remaining} ${remaining === 1 ? "usuario" : "usuarios"} por invitar.`
                : "Has alcanzado el límite de usuarios de tu plan."}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tu plan permite usuarios ilimitados. Invita a todo tu equipo sin restricciones.
          </p>
        )}
      </div>

      {/* Members list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Miembros activos</h2>
          <span className="text-xs text-muted-foreground">{members.length + 1} total</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : (
          <div className="divide-y divide-border">
            <MemberRow
              name="Tú (Propietario)"
              email=""
              role="admin"
              isOwner
            />
            {members.map((m) => (
              <MemberRow
                key={m.id}
                name={m.full_name || m.email}
                email={m.email}
                role={m.role}
                onRemove={async () => {
                  await removeMember(m.id);
                  toast.success("Miembro removido");
                }}
              />
            ))}
            {members.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aún no hay otros miembros. Invita a tu equipo para colaborar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invitaciones pendientes
              <Badge variant="secondary" className="text-[10px]">{invitations.length}</Badge>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {invitations.map((inv) => {
              const status = computeInvitationStatus(inv);
              const meta = STATUS_META[status];
              const StatusIcon = meta.icon;
              return (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{inv.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_LABEL[inv.role]} · Enviada el{" "}
                        {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] gap-1 ${meta.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(inv.token)}
                      title="Copiar enlace"
                      className="h-8"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResend(inv)}
                      title="Reenviar correo"
                      className="h-8"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <button
                      onClick={async () => {
                        await cancelInvitation(inv.id);
                        toast.success("Invitación cancelada");
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      title="Cancelar invitación"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roles helper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["admin", "collaborator", "viewer"] as TeamRole[]).map((r) => {
          const Icon = ROLE_ICON[r];
          const desc =
            r === "admin"
              ? "Control total: gestiona equipo, proyectos y datos."
              : r === "collaborator"
              ? "Acceso operativo: trabaja en proyectos y tareas."
              : "Solo lectura: consulta sin modificar.";
          return (
            <div key={r} className="rounded-lg border border-border bg-card p-4">
              <Icon className="w-4 h-4 text-primary mb-2" />
              <div className="text-sm font-semibold mb-1">{ROLE_LABEL[r]}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          );
        })}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={inviteUser}
      />
      <UpgradePlanDialog
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        currentPlan={plan}
        used={used}
        limit={limit}
      />
    </div>
  );
}

function MemberRow({
  name,
  email,
  role,
  isOwner,
  onRemove,
}: {
  name: string;
  email: string;
  role: TeamRole;
  isOwner?: boolean;
  onRemove?: () => void;
}) {
  const initial = (name || email || "?").charAt(0).toUpperCase();
  const RoleIcon = ROLE_ICON[role];
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full scorpion-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate flex items-center gap-2">
            {name}
            {isOwner && (
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-primary/40 text-primary">
                <Crown className="w-2.5 h-2.5 mr-1" />Owner
              </Badge>
            )}
          </div>
          {email && <div className="text-xs text-muted-foreground truncate">{email}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RoleIcon className="w-3.5 h-3.5" />
          {ROLE_LABEL[role]}
        </div>
        {!isOwner && onRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
