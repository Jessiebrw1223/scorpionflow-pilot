import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BusinessStatusBlock } from "@/components/dashboard/BusinessStatusBlock";
import { RecommendedActionsPanel } from "@/components/dashboard/RecommendedActionsPanel";
import { AlertsBanner } from "@/components/dashboard/AlertsBanner";
import {
  getBusinessSnapshot,
  getRecommendedActions,
  daysSince,
  getExecutionStatus,
  getFinancialHealth,
  getProjectHealth,
} from "@/lib/business-intelligence";
import { useAutoAlertEngine } from "@/hooks/useNotifications";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMoney } from "@/lib/format-money";

export default function Dashboard() {
  const { user } = useAuth();
  const PEN = useMoney();
  const { settings } = useUserSettings();

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

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-dash"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, progress, budget, actual_cost, start_date, end_date, client_id, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: tasksData = [] } = useQuery({
    queryKey: ["tasks-dash"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, blocks_project, project_id");
      if (error) throw error;
      return data as any[];
    },
  });

  // Intelligence calculations
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
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          budget: Number(p.budget),
          actual_cost: Number(p.actual_cost),
        })),
        tasks: tasksData,
        clientsNoFollowup: noFollowupClients.length,
        staleQuotations: staleQuotes.length,
      }),
    [projects, tasksData, noFollowupClients, staleQuotes]
  );

  const actions = useMemo(
    () =>
      getRecommendedActions({
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          budget: Number(p.budget),
          actual_cost: Number(p.actual_cost),
        })),
        tasks: tasksData,
        clientsNoFollowup: noFollowupClients,
        staleQuotations: staleQuotes,
      }),
    [projects, tasksData, noFollowupClients, staleQuotes]
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

  const wonAmount = quotations
    .filter((q) => q.status === "won")
    .reduce((s, q) => s + Number(q.total), 0);
  const totalProfit = snapshot.estimatedProfit;
  const profitPositive = totalProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 fire-text">
            <Zap className="w-5 h-5 text-primary fire-icon" />
            Centro de Control
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {clients.length} clientes · {quotations.length} cotizaciones · {projects.length} proyectos · {PEN.format(wonAmount)} ganados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "surface-card px-3 py-1.5 flex items-center gap-2",
            profitPositive ? "border-cost-positive/40" : "border-cost-negative/40"
          )}>
            {profitPositive ? (
              <TrendingUp className="w-4 h-4 text-cost-positive" />
            ) : (
              <TrendingDown className="w-4 h-4 text-cost-negative" />
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Ganancia estimada</div>
              <div className={cn(
                "text-sm font-bold font-mono-data leading-tight",
                profitPositive ? "text-cost-positive" : "text-cost-negative"
              )}>
                {PEN.format(totalProfit)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <Activity className="w-3.5 h-3.5 text-cost-positive" />
            <span className="text-cost-positive font-medium">Sistema operativo</span>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      <AlertsBanner />

      {/* Business Status Block */}
      <BusinessStatusBlock snapshot={snapshot} />

      {/* Recommended Actions */}
      <RecommendedActionsPanel actions={actions} />

      {/* Projects + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-header">¿Cómo van mis proyectos?</h2>
            <Link to="/projects" className="text-[12px] text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="surface-card p-6 text-center text-muted-foreground text-[13px]">
                Aún no tienes proyectos. Convierte una cotización ganada en proyecto desde{" "}
                <Link to="/cotizaciones" className="text-primary hover:underline">Cotizaciones</Link>.
              </div>
            ) : (
              projects.slice(0, 5).map((p) => {
                const meta = PROJECT_STATUS_META[p.status] || PROJECT_STATUS_META.on_track;
                const margin = Number(p.budget) - Number(p.actual_cost);
                const marginPct = Number(p.budget) > 0
                  ? ((margin / Number(p.budget)) * 100).toFixed(0)
                  : "0";
                return (
                  <Link key={p.id} to="/projects" className="block">
                    <div className={cn("surface-card surface-card-hover p-3 border-l-4", meta.border)}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-foreground truncate">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {p.clients?.name || "Sin cliente"}
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded",
                          meta.bg, meta.color
                        )}>
                          {meta.label}
                        </span>
                      </div>
                      <Progress value={p.progress} className="h-1.5 mb-2" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-mono-data">{p.progress}% completado</span>
                        <span className={cn(
                          "font-mono-data font-semibold",
                          margin >= 0 ? "text-cost-positive" : "text-cost-negative"
                        )}>
                          {margin >= 0 ? "+" : ""}{PEN.format(margin)} ({marginPct}%)
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="section-header">Actividad reciente</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
