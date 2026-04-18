// Business intelligence helpers — works with REAL data passed in (no more mocks).

// ============================================================
// ESTADOS DUALES: ejecución (tiempo) vs financiero (dinero)
// Nunca mezclar. "En tiempo" puede coexistir con "Crítico financiero".
// ============================================================

export type ExecutionStatus = "on_time" | "at_risk" | "delayed" | "completed" | "cancelled" | "not_evaluable";
export type FinancialHealth = "healthy" | "risk" | "critical" | "no_data";

export interface ExecutionStatusInfo {
  key: ExecutionStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
}

export interface FinancialHealthInfo {
  key: FinancialHealth;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  description: string;
}

/**
 * Estado de ejecución basado SOLO en tiempo / cronograma.
 * Principio: "Si no se puede calcular, no se debe mostrar."
 *
 * - Sin fechas (ni del proyecto ni inferibles desde tareas) → NO_EVALUABLE
 * - Con fechas → compara progreso real vs progreso esperado
 *      real >= esperado            → EN TIEMPO
 *      real >= esperado - 0.15     → EN RIESGO
 *      en otro caso                → ATRASADO
 * - Si hay tareas vencidas siempre baja al menos a EN RIESGO.
 */
export function getExecutionStatus(opts: {
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  progress: number;                           // 0-100
  hasOverdueTasks?: boolean;
  taskDates?: (string | null | undefined)[]; // due_date de tareas, para inferir cronograma
}): ExecutionStatusInfo {
  if (opts.status === "completed") {
    return {
      key: "completed",
      label: "Completado",
      color: "text-status-progress",
      bg: "bg-status-progress/10",
      border: "border-status-progress/40",
      description: "Proyecto entregado.",
    };
  }
  if (opts.status === "cancelled") {
    return {
      key: "cancelled",
      label: "Cancelado",
      color: "text-muted-foreground",
      bg: "bg-muted/20",
      border: "border-muted/40",
      description: "Proyecto cancelado.",
    };
  }

  // Resolver fechas: explícitas del proyecto → o inferidas desde tareas
  let startDate = opts.startDate ? new Date(opts.startDate) : null;
  let endDate = opts.endDate ? new Date(opts.endDate) : null;

  if ((!startDate || !endDate) && opts.taskDates && opts.taskDates.length > 0) {
    const validDates = opts.taskDates
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime())
      .filter((t) => Number.isFinite(t));
    if (validDates.length > 0) {
      if (!endDate) endDate = new Date(Math.max(...validDates));
      if (!startDate) startDate = new Date(Math.min(...validDates));
    }
  }

  // Sin cronograma → no evaluable. NUNCA decir "En tiempo".
  if (!startDate || !endDate || endDate.getTime() <= startDate.getTime()) {
    return {
      key: "not_evaluable",
      label: "No evaluable",
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      border: "border-muted/50",
      description: "Se calcula cuando definas fechas de inicio y fin.",
    };
  }

  const today = new Date();
  const total = endDate.getTime() - startDate.getTime();
  const elapsed = Math.max(0, today.getTime() - startDate.getTime());
  const expectedPct = Math.min(1, elapsed / total) * 100;
  const realPct = Math.max(0, Math.min(100, opts.progress || 0));
  const endPassed = today > endDate;

  // Atrasado duro: pasó la fecha final y aún no termina
  if (endPassed && realPct < 100) {
    return {
      key: "delayed",
      label: "Atrasado",
      color: "text-cost-negative",
      bg: "bg-cost-negative/10",
      border: "border-cost-negative/40",
      description: "Pasó la fecha de entrega y el proyecto no está completo.",
    };
  }

  const gap = expectedPct - realPct; // positivo = vas por debajo de lo esperado

  if (gap > 15) {
    return {
      key: "delayed",
      label: "Atrasado",
      color: "text-cost-negative",
      bg: "bg-cost-negative/10",
      border: "border-cost-negative/40",
      description: `Vas ${gap.toFixed(0)}% por debajo de lo esperado para esta fecha.`,
    };
  }

  if (gap > 0 || opts.hasOverdueTasks) {
    return {
      key: "at_risk",
      label: "En riesgo",
      color: "text-cost-warning",
      bg: "bg-cost-warning/10",
      border: "border-cost-warning/40",
      description: opts.hasOverdueTasks
        ? "Hay tareas vencidas que pueden retrasar la entrega."
        : `Vas ligeramente por debajo del avance esperado (${gap.toFixed(0)}%).`,
    };
  }

  return {
    key: "on_time",
    label: "En tiempo",
    color: "text-cost-positive",
    bg: "bg-cost-positive/10",
    border: "border-cost-positive/40",
    description: "Tu avance va acorde al cronograma definido.",
  };
}

/**
 * Salud financiera basada SOLO en dinero (presupuesto, costos, aportes).
 * No considera plazos.
 */
export function getFinancialHealth(opts: {
  budget: number;
  actualCost: number;
  contributions?: number;
}): FinancialHealthInfo {
  const budget = Number(opts.budget) || 0;
  const cost = Number(opts.actualCost) || 0;
  const contrib = Number(opts.contributions) || 0;

  if (budget === 0 && cost === 0) {
    return {
      key: "no_data",
      label: "Sin datos",
      emoji: "⚪",
      color: "text-muted-foreground",
      bg: "bg-muted/20",
      border: "border-muted/40",
      description: "Aún no hay presupuesto ni costos registrados.",
    };
  }

  const realProfit = budget - cost - contrib;
  const usedPct = budget > 0 ? (cost / budget) * 100 : 100;

  if (realProfit < 0) {
    return {
      key: "critical",
      label: "Crítico",
      emoji: "🔴",
      color: "text-cost-negative",
      bg: "bg-cost-negative/10",
      border: "border-cost-negative/40",
      description: "Estás perdiendo dinero en este proyecto.",
    };
  }
  if (usedPct >= 85) {
    return {
      key: "risk",
      label: "Riesgo",
      emoji: "🟡",
      color: "text-cost-warning",
      bg: "bg-cost-warning/10",
      border: "border-cost-warning/40",
      description: "Has consumido la mayor parte del presupuesto. Vigila los costos.",
    };
  }
  return {
    key: "healthy",
    label: "Rentable",
    emoji: "🟢",
    color: "text-cost-positive",
    bg: "bg-cost-positive/10",
    border: "border-cost-positive/40",
    description: "El proyecto está dejando ganancia.",
  };
}

/**
 * Cap visual para evitar mostrar márgenes irreales (-1100%) que rompen confianza.
 * Si el porcentaje cae fuera de [-100, +100] devuelve un mensaje contextual.
 */
export function formatSafeMargin(marginPct: number): { text: string; isExtreme: boolean; capped: number } {
  if (!Number.isFinite(marginPct)) {
    return { text: "Sin datos suficientes", isExtreme: false, capped: 0 };
  }
  if (marginPct < -100) {
    return {
      text: "Estás gastando mucho más de lo que cobraste",
      isExtreme: true,
      capped: -100,
    };
  }
  if (marginPct > 200) {
    return {
      text: "Margen muy alto · revisa que el costo esté bien registrado",
      isExtreme: true,
      capped: 200,
    };
  }
  return { text: `${marginPct.toFixed(1)}%`, isExtreme: false, capped: marginPct };
}

/**
 * ROI en lenguaje humano: "Por cada S/1 invertido recibes/pierdes S/X.XX".
 * Capeado para no mostrar valores absurdos.
 */
export function formatROI(budget: number, actualCost: number): { text: string; tone: "good" | "warn" | "bad" | "neutral" } {
  if (actualCost <= 0) {
    return { text: "Aún no hay gastos registrados", tone: "neutral" };
  }
  const ratio = budget / actualCost;
  if (ratio >= 1) {
    return {
      text: `Por cada S/ 1 invertido, recibes S/ ${ratio.toFixed(2)}`,
      tone: ratio >= 1.3 ? "good" : "warn",
    };
  }
  // pérdida: muestra cuánto pierdes por sol
  const loss = 1 - ratio;
  return {
    text: `Por cada S/ 1 invertido, pierdes S/ ${loss.toFixed(2)}`,
    tone: "bad",
  };
}


export interface BusinessSnapshot {
  projectsAtRisk: number;
  projectsOnTime: number;
  projectsOverBudget: number;
  blockedTasks: number;
  overdueTasks: number;
  overloadedResources: number;
  totalResources: number;
  estimatedProfit: number;
  healthScore: number; // 0-100
  healthLevel: "control" | "risk" | "critical";
  healthReason: string;
}

export interface SnapshotInput {
  projects: { id: string; name: string; status: string; budget: number; actual_cost: number }[];
  tasks: { id: string; status: string; due_date: string | null; blocks_project?: boolean }[];
  overloadedResources?: number;
  totalResources?: number;
  clientsNoFollowup?: number;
  staleQuotations?: number;
}

export function getBusinessSnapshot(input: SnapshotInput): BusinessSnapshot {
  const { projects, tasks } = input;
  const projectsAtRisk = projects.filter((p) => p.status === "at_risk").length;
  const projectsOnTime = projects.filter((p) => p.status === "on_track").length;
  const projectsOverBudget = projects.filter((p) => p.status === "over_budget").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const today = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < today
  ).length;

  const estimatedProfit = projects.reduce(
    (sum, p) => sum + (Number(p.budget) - Number(p.actual_cost)),
    0
  );

  const overloadedResources = input.overloadedResources ?? 0;
  const totalResources = input.totalResources ?? 0;

  let score = 100;
  score -= projectsOverBudget * 18;
  score -= projectsAtRisk * 10;
  score -= blockedTasks * 4;
  score -= overloadedResources * 6;
  score -= (input.clientsNoFollowup ?? 0) * 3;
  score -= (input.staleQuotations ?? 0) * 2;
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
    totalResources,
    estimatedProfit,
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

export interface ActionsInput {
  projects: { id: string; name: string; status: string; budget: number; actual_cost: number }[];
  tasks: { id: string; title: string; status: string; blocks_project?: boolean }[];
  clientsNoFollowup: { id: string; name: string; days: number }[];
  staleQuotations: { id: string; title: string; days: number }[];
}

export function getRecommendedActions(opts: ActionsInput): RecommendedAction[] {
  const list: RecommendedAction[] = [];

  // Critical: cost overrun projects (real data)
  opts.projects
    .filter((p) => p.status === "over_budget" || Number(p.actual_cost) > Number(p.budget))
    .forEach((p) => {
      const pct =
        p.budget > 0 ? ((Number(p.actual_cost) / Number(p.budget)) * 100).toFixed(0) : "100";
      list.push({
        id: `overrun-${p.id}`,
        icon: "money",
        priority: "critical",
        title: `${p.name} en sobrecosto`,
        description: `Has gastado ${pct}% del presupuesto. Revisa qué partidas puedes ajustar.`,
        actionLabel: "Revisar costos",
        link: "/costs",
      });
    });

  // High: blocked tasks (real data)
  const blocked = opts.tasks.filter((t) => t.status === "blocked");
  if (blocked.length > 0) {
    list.push({
      id: `blocked-tasks`,
      icon: "task",
      priority: "high",
      title: `${blocked.length} tarea(s) bloqueada(s)`,
      description: blocked.slice(0, 2).map((t) => t.title).join(" · "),
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
      description: `${c.days} día(s) sin contacto. No dejes enfriar la oportunidad.`,
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
      title: `${opts.staleQuotations.length} cotización(es) sin cerrar`,
      description: opts.staleQuotations
        .slice(0, 2)
        .map((q) => `${q.title} (${q.days}d)`)
        .join(" · "),
      actionLabel: "Hacer seguimiento",
      link: "/cotizaciones",
    });
  }

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
    return {
      label: "Sin seguimiento",
      color: "text-cost-negative bg-cost-negative/10 border-cost-negative/30",
      dot: "bg-cost-negative",
    };
  }
  if (client.commercial_status === "active" || days <= 7) {
    return {
      label: "Activo",
      color: "text-cost-positive bg-cost-positive/10 border-cost-positive/30",
      dot: "bg-cost-positive",
    };
  }
  return {
    label: "Pendiente",
    color: "text-cost-warning bg-cost-warning/10 border-cost-warning/30",
    dot: "bg-cost-warning",
  };
}

export const PROJECT_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  on_track: {
    label: "En tiempo",
    color: "text-cost-positive",
    bg: "bg-cost-positive/10",
    border: "border-cost-positive/40",
    dot: "bg-cost-positive",
  },
  at_risk: {
    label: "En riesgo",
    color: "text-cost-warning",
    bg: "bg-cost-warning/10",
    border: "border-cost-warning/40",
    dot: "bg-cost-warning",
  },
  over_budget: {
    label: "Sobre presupuesto",
    color: "text-cost-negative",
    bg: "bg-cost-negative/10",
    border: "border-cost-negative/40",
    dot: "bg-cost-negative",
  },
  completed: {
    label: "Completado",
    color: "text-status-progress",
    bg: "bg-status-progress/10",
    border: "border-status-progress/40",
    dot: "bg-status-progress",
  },
  cancelled: {
    label: "Cancelado",
    color: "text-muted-foreground",
    bg: "bg-muted/20",
    border: "border-muted/40",
    dot: "bg-muted-foreground",
  },
};

export const TASK_PRIORITY_META: Record<
  string,
  { label: string; color: string; bg: string; emoji: string }
> = {
  low: { label: "Baja", color: "text-muted-foreground", bg: "bg-muted/20", emoji: "⚪" },
  medium: { label: "Media", color: "text-status-progress", bg: "bg-status-progress/10", emoji: "🔵" },
  high: { label: "Alta", color: "text-cost-warning", bg: "bg-cost-warning/10", emoji: "🟠" },
  critical: { label: "Crítica", color: "text-destructive", bg: "bg-destructive/10", emoji: "🔴" },
};

export const TASK_STATUS_META: Record<string, { label: string; color: string }> = {
  todo: { label: "Por hacer", color: "bg-status-todo" },
  in_progress: { label: "En progreso", color: "bg-status-progress" },
  in_review: { label: "En revisión", color: "bg-status-review" },
  done: { label: "Completada", color: "bg-status-done" },
  blocked: { label: "Bloqueada", color: "bg-status-blocked" },
};

// Tipo de nodo en la jerarquía de planificación
export const NODE_TYPE_META: Record<
  string,
  { label: string; short: string; emoji: string; color: string; bg: string; level: number; mode: "agile" | "traditional" }
> = {
  epic:     { label: "Épica",              short: "Épica",      emoji: "🟣", color: "text-accent",          bg: "bg-accent/10",          level: 0, mode: "agile" },
  story:    { label: "Historia de Usuario", short: "HU",        emoji: "🔵", color: "text-status-progress", bg: "bg-status-progress/10", level: 1, mode: "agile" },
  task:     { label: "Tarea",              short: "Tarea",      emoji: "⚙️", color: "text-muted-foreground",bg: "bg-muted/30",           level: 2, mode: "agile" },
  phase:    { label: "Fase",               short: "Fase",       emoji: "📍", color: "text-primary",         bg: "bg-primary/10",         level: 0, mode: "traditional" },
  subphase: { label: "Subfase",            short: "Subfase",    emoji: "📌", color: "text-status-progress", bg: "bg-status-progress/10", level: 1, mode: "traditional" },
  activity: { label: "Actividad",          short: "Actividad",  emoji: "▫️", color: "text-muted-foreground",bg: "bg-muted/30",           level: 2, mode: "traditional" },
};

// Devuelve los tipos de nodo disponibles según modo, ordenados por nivel jerárquico
export function getNodeTypesForMode(mode: "agile" | "traditional"): string[] {
  return mode === "agile" ? ["epic", "story", "task"] : ["phase", "subphase", "activity"];
}

// Modos de planificación
export const PLANNING_MODE_META: Record<
  string,
  { label: string; description: string; emoji: string; color: string }
> = {
  agile:       { label: "Ágil",         description: "Épica → Historia → Tarea",      emoji: "🟢", color: "text-cost-positive" },
  traditional: { label: "Tradicional",  description: "Fase → Subfase → Actividad (EDT)", emoji: "🟠", color: "text-primary" },
};

// Impacto de la tarea en el negocio: conecta ejecución con resultado
export const TASK_IMPACT_META: Record<
  string,
  { label: string; short: string; color: string; bg: string; emoji: string; description: string }
> = {
  time: {
    label: "Impacta tiempo",
    short: "Tiempo",
    color: "text-status-progress",
    bg: "bg-status-progress/10",
    emoji: "⏱️",
    description: "Si se atrasa, retrasa el cronograma del proyecto.",
  },
  cost: {
    label: "Impacta costo",
    short: "Costo",
    color: "text-cost-warning",
    bg: "bg-cost-warning/10",
    emoji: "💰",
    description: "Si se desvía, impacta directamente el presupuesto y la rentabilidad.",
  },
  delivery: {
    label: "Impacta entrega",
    short: "Entrega",
    color: "text-primary",
    bg: "bg-primary/10",
    emoji: "🎯",
    description: "Si falla, afecta la entrega o calidad final al cliente.",
  },
};
