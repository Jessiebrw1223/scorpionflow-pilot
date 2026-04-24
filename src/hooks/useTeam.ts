import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { humanizeFunctionError } from "@/lib/humanize-error";

export type TeamRole = "admin" | "collaborator" | "viewer";
export type SubscriptionPlan = "free" | "starter" | "pro" | "business";
export type InvitationStatus = "pending" | "accepted" | "rejected" | "cancelled" | "expired";

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: TeamRole;
  is_active: boolean;
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface AccountSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  billing_cycle: string;
}

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 5,
  starter: 10,
  pro: Infinity,
  business: Infinity,
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

/** Construye la URL completa para que el invitado acepte la invitación. */
export function buildInviteUrl(token: string): string {
  if (typeof window === "undefined") return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

/** Estado real de una invitación, considerando expiración por fecha. */
export function computeInvitationStatus(inv: TeamInvitation): InvitationStatus {
  if (inv.status === "pending" && new Date(inv.expires_at).getTime() < Date.now()) {
    return "expired";
  }
  return inv.status;
}

export interface InviteResult {
  error: string | null;
  invitation?: TeamInvitation;
  inviteUrl?: string;
  emailSent?: boolean;
  emailError?: string;
}

export function useTeam() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AccountSubscription | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [subRes, memRes, invRes] = await Promise.all([
      supabase.from("account_subscriptions").select("*").eq("owner_id", user.id).maybeSingle(),
      supabase.from("team_members").select("*").eq("owner_id", user.id).order("joined_at", { ascending: false }),
      supabase
        .from("team_invitations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (subRes.data) {
      setSubscription(subRes.data as AccountSubscription);
    } else {
      const { data: created } = await supabase
        .from("account_subscriptions")
        .insert({ owner_id: user.id, plan: "free", status: "active" })
        .select()
        .single();
      if (created) setSubscription(created as AccountSubscription);
    }
    setMembers((memRes.data ?? []) as TeamMember[]);
    setInvitations((invRes.data ?? []) as TeamInvitation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const plan: SubscriptionPlan = subscription?.plan ?? "free";
  const limit = PLAN_LIMITS[plan];
  const activeMembers = members.filter((m) => m.is_active).length;
  const pendingInvites = invitations.filter(
    (i) => i.status === "pending" && new Date(i.expires_at) > new Date()
  ).length;
  // Owner cuenta como 1
  const used = 1 + activeMembers + pendingInvites;
  const isUnlimited = limit === Infinity;
  const canInvite = isUnlimited || used < limit;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);

  const inviteUser = async (email: string, role: TeamRole): Promise<InviteResult> => {
    if (!user) return { error: "No user" };
    if (!canInvite) {
      return { error: "limit_reached" };
    }
    const normalized = email.trim().toLowerCase();
    const dupMember = members.find((m) => m.email.toLowerCase() === normalized);
    if (dupMember) return { error: "already_member" };
    const dupInv = invitations.find(
      (i) => i.email.toLowerCase() === normalized && i.status === "pending"
    );
    if (dupInv) return { error: "already_invited" };

    const inviterName =
      (user.user_metadata as any)?.full_name ||
      (user.user_metadata as any)?.name ||
      user.email ||
      null;

    // 1. Crear invitación en DB (genera token único automáticamente)
    const { data: created, error } = await supabase
      .from("team_invitations")
      .insert({
        owner_id: user.id,
        email: normalized,
        role,
        invited_by_name: inviterName,
      })
      .select()
      .single();

    if (error || !created) {
      return { error: error?.message ?? "No se pudo crear la invitación" };
    }

    const invitation = created as TeamInvitation;
    const inviteUrl = buildInviteUrl(invitation.token);

    // 2. Intentar enviar correo (NO bloquea el flujo si falla)
    let emailSent = false;
    let emailError: string | undefined;
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "team-invitation",
            recipientEmail: normalized,
            idempotencyKey: `team-invite-${invitation.id}`,
            templateData: {
              inviterName,
              role,
              inviteUrl,
            },
          },
        }
      );
      if (fnErr) {
        // eslint-disable-next-line no-console
        console.error("[useTeam] send-transactional-email error", fnErr);
        emailError = humanizeFunctionError(
          fnErr,
          fnData,
          "No pudimos enviar el correo. Comparte el enlace manualmente.",
        );
      } else if (fnData && (fnData as any).success === false) {
        emailError = humanizeFunctionError(
          null,
          fnData,
          "El correo fue rechazado. Comparte el enlace manualmente.",
        );
      } else {
        emailSent = true;
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[useTeam] send-transactional-email exception", e);
      emailError = humanizeFunctionError(
        e,
        null,
        "No pudimos enviar el correo. Comparte el enlace manualmente.",
      );
    }

    await refresh();
    return { error: null, invitation, inviteUrl, emailSent, emailError };
  };

  const resendInvitation = async (invitation: TeamInvitation): Promise<InviteResult> => {
    if (!user) return { error: "No user" };
    const inviterName =
      (user.user_metadata as any)?.full_name ||
      (user.user_metadata as any)?.name ||
      user.email ||
      null;
    const inviteUrl = buildInviteUrl(invitation.token);
    let emailSent = false;
    let emailError: string | undefined;
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "team-invitation",
            recipientEmail: invitation.email,
            idempotencyKey: `team-invite-resend-${invitation.id}-${Date.now()}`,
            templateData: {
              inviterName,
              role: invitation.role,
              inviteUrl,
            },
          },
        }
      );
      if (fnErr) {
        // eslint-disable-next-line no-console
        console.error("[useTeam] resend send-transactional-email error", fnErr);
        emailError = humanizeFunctionError(
          fnErr,
          fnData,
          "No pudimos reenviar el correo. Comparte el enlace manualmente.",
        );
      } else if (fnData && (fnData as any).success === false) {
        emailError = humanizeFunctionError(
          null,
          fnData,
          "El correo fue rechazado. Comparte el enlace manualmente.",
        );
      } else {
        emailSent = true;
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[useTeam] resend send-transactional-email exception", e);
      emailError = humanizeFunctionError(
        e,
        null,
        "No pudimos reenviar el correo. Comparte el enlace manualmente.",
      );
    }
    return { error: null, invitation, inviteUrl, emailSent, emailError };
  };

  const cancelInvitation = async (id: string) => {
    await supabase.from("team_invitations").update({ status: "cancelled" }).eq("id", id);
    await refresh();
  };

  const removeMember = async (id: string) => {
    await supabase.from("team_members").delete().eq("id", id);
    await refresh();
  };

  const updateMemberRole = async (id: string, role: TeamRole) => {
    await supabase.from("team_members").update({ role }).eq("id", id);
    await refresh();
  };

  return {
    loading,
    plan,
    planLabel: PLAN_LABELS[plan],
    subscription,
    members,
    invitations: invitations.filter(
      (i) => computeInvitationStatus(i) === "pending"
    ),
    allInvitations: invitations,
    used,
    limit,
    isUnlimited,
    canInvite,
    remaining,
    inviteUser,
    resendInvitation,
    cancelInvitation,
    removeMember,
    updateMemberRole,
    refresh,
  };
}
