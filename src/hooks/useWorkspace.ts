import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type WorkspaceRole = "owner" | "admin" | "collaborator" | "viewer";

export interface WorkspaceContext {
  /** ID del propietario del workspace al que pertenece el usuario actual.
   *  Si el usuario es dueño de su propio workspace, equivale a user.id. */
  ownerId: string | null;
  /** Rol efectivo del usuario actual dentro del workspace. */
  role: WorkspaceRole | null;
  /** Nombre legible del propietario del workspace (para banners y bienvenida). */
  ownerName: string | null;
  /** True si el usuario es el dueño de su propio workspace. */
  isOwner: boolean;
  /** True si el usuario fue invitado a un workspace ajeno. */
  isGuest: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  collaborator: 2,
  viewer: 1,
};

/**
 * Resuelve el workspace activo del usuario.
 * Prioridad: si el usuario es miembro de un workspace ajeno, lo usa.
 * En caso contrario, usa su propio workspace (es owner).
 */
export function useWorkspace(): WorkspaceContext {
  const { user, loading: authLoading } = useAuth();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setOwnerId(null);
      setRole(null);
      setOwnerName(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. ¿Es miembro activo de algún workspace ajeno?
    const { data: memberships } = await supabase
      .from("team_members")
      .select("owner_id, role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const otherWorkspaces = (memberships ?? []).filter(
      (m) => m.owner_id !== user.id,
    );

    if (otherWorkspaces.length > 0) {
      // Elige el de mayor rango de permisos
      const best = otherWorkspaces.sort(
        (a, b) =>
          (ROLE_RANK[b.role as WorkspaceRole] ?? 0) -
          (ROLE_RANK[a.role as WorkspaceRole] ?? 0),
      )[0];
      setOwnerId(best.owner_id);
      setRole(best.role as WorkspaceRole);

      // Resolver nombre del owner
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", best.owner_id)
        .maybeSingle();
      setOwnerName(
        ownerProfile?.full_name ||
          ownerProfile?.email?.split("@")[0] ||
          "tu equipo",
      );
    } else {
      // Workspace propio
      setOwnerId(user.id);
      setRole("owner");
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      setOwnerName(
        (meta?.full_name as string) ||
          (meta?.name as string) ||
          user.email?.split("@")[0] ||
          "tu workspace",
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  const isOwner = !!user && ownerId === user.id;
  const isGuest = !!user && ownerId !== null && ownerId !== user.id;

  return {
    ownerId,
    role,
    ownerName,
    isOwner,
    isGuest,
    loading: loading || authLoading,
    refresh,
  };
}

export const WORKSPACE_ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Propietario",
  admin: "Admin",
  collaborator: "Colaborador",
  viewer: "Visualizador",
};

export function canWriteWorkspace(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin" || role === "collaborator";
}

export function canAdminWorkspace(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin";
}
