import { projects, tasks, resources, personnelResources } from "@/lib/mock-data";

export interface BusinessSnapshot {
  projectsAtRisk: number;
  projectsOnTime: number;
  projectsOverBudget: number;
  blockedTasks: number;
  overdueTasks: number;
  overloadedResources: number;
  totalResources: number;
  healthScore: number; // 0-100
  healthLevel: "control" | "risk" | "critical";
  healthReason: string;
}

export function getBusinessSnapshot(opts?: {
  clientsNoFollowup?: number;
  staleQuotations?: number;
}): BusinessSnapshot {
  const projectsAtRisk = projects.filter((p) => p.status === "at_risk").length;
  const projectsOnTime = projects.filter((p) => p.status === "on_track").length;
  const projectsOverBudget = projects.filter((p) => p.status === "over_budget").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const today = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && new Date(t.dueDate) < today
  ).length;
  const overloadedResources = personnelResources.filter((r) => r.utilization > 90).length;

  // health score
  let score = 100;
  score -= projectsOverBudget * 18;
  score -= projectsAtRisk * 10;
  score -= blockedTasks * 4;
  score -= overloadedResources * 6;
  score -= (opts?.clientsNoFollowup ?? 0) * 3;
  score -= (opts?.staleQuotations ?? 0) * 2;
  score = Math.max(0, Math.min(100, score));

  const healthLevel: BusinessSnapshot["healthLevel"] =
    score >= 75 ? "control" : score >= 50 ? "risk" : "critical";

  const reasons: string[] = [];
  if (projectsOverBudget > 0) reasons.push(`${projectsOverBudget} proyecto(s) en sobrecosto`);
  if (overloadedResources > 0) reasons.push(`${overloadedResources} recurso(s) saturado(s)`);
  if (blockedTasks > 0) reasons.push(`${blockedTasks} tarea(s) bloqueada(s)`);
  if (projectsAtRisk > 0) reasons.push(`${projectsAtRisk} proyecto(s) en riesgo`);
  const healthReason = reasons.length ? reasons.join(" + ") : "Operación estable y bajo control";

  return {
    projectsAtRisk,
    projectsOnTime,
    projectsOverBudget,
    blockedTasks,
    overdueTasks,
    overloadedResources,
    totalResources: personnelResources.length,
    healthScore: score,
    healthLevel,
    healthReason,
  };
}

export interface RecommendedAction {
  id: string;
  icon: "phone" | "alert" | "users" | "money" | "task" | "spark";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  actionLabel: string;
  link: string;
}

export function getRecommendedActions(opts: {
  clientsNoFollowup: { id: string; name: string; days: number }[];
  staleQuotations: { id: string; title: string; days: number }[];
}): RecommendedAction[] {
  const list: RecommendedAction[] = [];

  // Critical: cost overrun projects
  projects
    .filter((p) => p.status === "over_budget")
    .forEach((p) =>
      list.push({
        id: `overrun-${p.id}`,
        icon: "money",
        priority: "critical",
        title: `Proyecto ${p.name} en sobrecosto`,
        description: `Gastado ${(p.spent / p.budget * 100).toFixed(0)}% del presupuesto. Revisa recursos asignados.`,
        actionLabel: "Revisar costos",
        link: "/costs",
      })
    );

  // Critical: overloaded people
  personnelResources
    .filter((r) => r.utilization >= 90)
    .forEach((r) =>
      list.push({
        id: `overload-${r.id}`,
        icon: "users",
        priority: "high",
        title: `${r.firstName} ${r.lastName} al ${r.utilization}%`,
        description: "Recurso saturado. Redistribuye carga para evitar burnout y retrasos.",
        actionLabel: "Reasignar",
        link: "/resources",
      })
    );

  // High: blocked tasks
  const blocked = tasks.filter((t) => t.status === "blocked");
  if (blocked.length > 0) {
    list.push({
      id: `blocked-tasks`,
      icon: "task",
      priority: "high",
      title: `${blocked.length} tarea(s) bloqueada(s)`,
      description: blocked
        .slice(0, 2)
        .map((t) => t.title)
        .join(" · "),
      actionLabel: "Desbloquear",
      link: "/tasks",
    });
  }

  // Medium: clients without follow-up
  opts.clientsNoFollowup.slice(0, 3).forEach((c) =>
    list.push({
      id: `nofw-${c.id}`,
      icon: "phone",
      priority: c.days > 14 ? "high" : "medium",
      title: `Contacta a ${c.name}`,
      description: `${c.days} día(s) sin seguimiento comercial. No dejes enfriar la oportunidad.`,
      actionLabel: "Contactar ahora",
      link: "/clientes",
    })
  );

  // Medium: stale quotations
  if (opts.staleQuotations.length > 0) {
    list.push({
      id: `stale-quotes`,
      icon: "spark",
      priority: "medium",
      title: `Tienes ${opts.staleQuotations.length} cotización(es) sin cerrar`,
      description: opts.staleQuotations
        .slice(0, 2)
        .map((q) => `${q.title} (${q.days}d)`)
        .join(" · "),
      actionLabel: "Hacer seguimiento",
      link: "/cotizaciones",
    });
  }

  // Sort by priority
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return list.sort((a, b) => order[a.priority] - order[b.priority]);
}

export const CLIENT_TYPE_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  hotel: { label: "Hotel", emoji: "🏨", color: "text-status-progress" },
  spa: { label: "Spa", emoji: "💆", color: "text-accent" },
  business: { label: "Negocio", emoji: "💼", color: "text-primary" },
  industrial: { label: "Industrial", emoji: "🏭", color: "text-cost-warning" },
  tech: { label: "Tecnología", emoji: "💻", color: "text-status-progress" },
  retail: { label: "Retail", emoji: "🛍️", color: "text-accent" },
  healthcare: { label: "Salud", emoji: "🏥", color: "text-cost-positive" },
  education: { label: "Educación", emoji: "🎓", color: "text-status-progress" },
  government: { label: "Gobierno", emoji: "🏛️", color: "text-muted-foreground" },
  manufacturing: { label: "Manufactura", emoji: "⚙️", color: "text-cost-warning" },
  logistics: { label: "Logística", emoji: "🚛", color: "text-primary" },
  finance: { label: "Finanzas", emoji: "💰", color: "text-cost-positive" },
  international: { label: "Internacional", emoji: "🌍", color: "text-status-progress" },
  other: { label: "Otro", emoji: "📌", color: "text-muted-foreground" },
};

export const CLIENT_TYPES = Object.keys(CLIENT_TYPE_META);

export function daysSince(date: string | null | undefined): number {
  if (!date) return 999;
  const d = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function inferCommercialBadge(client: {
  commercial_status?: string | null;
  last_contact_at?: string | null;
}): { label: string; color: string; dot: string } {
  const days = daysSince(client.last_contact_at);
  if (client.commercial_status === "no_followup" || days > 14) {
    return { label: "Sin seguimiento", color: "text-cost-negative bg-cost-negative/10 border-cost-negative/30", dot: "bg-cost-negative" };
  }
  if (client.commercial_status === "active" || days <= 7) {
    return { label: "Activo", color: "text-cost-positive bg-cost-positive/10 border-cost-positive/30", dot: "bg-cost-positive" };
  }
  return { label: "Pendiente", color: "text-cost-warning bg-cost-warning/10 border-cost-warning/30", dot: "bg-cost-warning" };
}
