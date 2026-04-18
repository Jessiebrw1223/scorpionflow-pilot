import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      // Fallback: crear una si por algún motivo no existe
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

  const inviteUser = async (email: string, role: TeamRole) => {
    if (!user) throw new Error("No user");
    if (!canInvite) {
      return { error: "limit_reached" as const };
    }
    const normalized = email.trim().toLowerCase();
    // Validar duplicados
    const dupMember = members.find((m) => m.email.toLowerCase() === normalized);
    if (dupMember) return { error: "already_member" as const };
    const dupInv = invitations.find(
      (i) => i.email.toLowerCase() === normalized && i.status === "pending"
    );
    if (dupInv) return { error: "already_invited" as const };

    const { error } = await supabase.from("team_invitations").insert({
      owner_id: user.id,
      email: normalized,
      role,
      invited_by_name: user.user_metadata?.full_name ?? user.email ?? null,
    });
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
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
    invitations: invitations.filter((i) => i.status === "pending"),
    allInvitations: invitations,
    used,
    limit,
    isUnlimited,
    canInvite,
    remaining,
    inviteUser,
    cancelInvitation,
    removeMember,
    updateMemberRole,
    refresh,
  };
}
