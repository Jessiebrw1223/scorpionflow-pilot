import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { tasks, projects, costFormatter } from "@/lib/mock-data";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BusinessStatusBlock } from "@/components/dashboard/BusinessStatusBlock";
import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { AlertsBanner } from "@/components/dashboard/AlertsBanner";
import {
  getBusinessSnapshot,
  getRecommendedActions,
  daysSince,
} from "@/lib/business-intelligence";
import { useAutoAlertEngine } from "@/hooks/useNotifications";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-min-dash"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, last_contact_at, commercial_status");
      if (error) throw error;
      return data;
    },
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations-min-dash"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("id, title, status, status_changed_at, total");
      if (error) throw error;
      return data;
    },
  });

  // intelligence calculations
  const noFollowupClients = useMemo(
    () =>
      clients
        .filter((c) => {
          const d = daysSince(c.last_contact_at);
          return c.commercial_status === "no_followup" || d > 7;
        })
        .map((c) => ({ id: c.id, name: c.name, days: daysSince(c.last_contact_at) })),
    [clients]
  );

  const staleQuotes = useMemo(
    () =>
      quotations
        .filter((q) => q.status !== "won" && q.status !== "lost")
        .map((q) => ({
          id: q.id,
          title: q.title,
          days: daysSince(q.status_changed_at),
          status: q.status,
        }))
        .filter((q) => q.days > 5),
    [quotations]
  );

  const snapshot = useMemo(
    () =>
      getBusinessSnapshot({
        clientsNoFollowup: noFollowupClients.length,
        staleQuotations: staleQuotes.length,
      }),
    [noFollowupClients, staleQuotes]
  );

  const actions = useMemo(
    () =>
      getRecommendedActions({
        clientsNoFollowup: noFollowupClients,
        staleQuotations: staleQuotes,
      }),
    [noFollowupClients, staleQuotes]
  );

  // Auto-generate alerts in background
  useAutoAlertEngine({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      last_contact_at: c.last_contact_at,
      commercial_status: c.commercial_status,
    })),
    quotations: quotations.map((q) => ({
      id: q.id,
      title: q.title,
      status: q.status,
      status_changed_at: q.status_changed_at,
    })),
  });

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const wonAmount = quotations
    .filter((q) => q.status === "won")
    .reduce((s, q) => s + Number(q.total), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 fire-text">
            <Zap className="w-5 h-5 text-primary fire-icon" />
            Centro de Control
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Vista general · {clients.length} clientes · {quotations.length} cotizaciones · {costFormatter.format(wonAmount)} ganados
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <Activity className="w-3.5 h-3.5 text-cost-positive" />
          <span className="text-cost-positive font-medium">Sistema Operativo</span>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      <AlertsBanner />

      {/* Business Status Block - lo primero que el usuario ve */}
      <BusinessStatusBlock snapshot={snapshot} />

      {/* Recommended Actions */}
      <RecommendedActionsPanel actions={actions} />

      {/* Projects + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="section-header">Estado de Proyectos</h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectStatusCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="section-header">Actividad Reciente</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
