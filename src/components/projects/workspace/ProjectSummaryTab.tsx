import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Receipt, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ListChecks, ArrowRight, Building2, HandCoins, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  getFinancialHealth,
  getExecutionStatus,
  formatSafeMargin,
} from "@/lib/business-intelligence";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface Props {
  project: any;
  tasks: any[];
  onTabChange: (tab: string) => void;
}

export default function ProjectSummaryTab({ project, tasks, onTabChange }: Props) {
  // Aportes para ganancia REAL (mismo cálculo que Costos)
  const { data: contributions = [] } = useQuery({
    queryKey: ["project-contributions", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_contributions")
        .select("amount")
        .eq("project_id", project.id);
      if (error) throw error;
      return data;
    },
  });
  const totalContributions = contributions.reduce((s, c: any) => s + Number(c.amount || 0), 0);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const blockingProject = tasks.filter((t) => t.blocks_project).length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date()
  ).length;

  // === Estados DUALES: nunca mezclar tiempo con dinero ===
  const execution = getExecutionStatus({
    status: project.status,
    startDate: project.start_date,
    endDate: project.end_date,
    progress: Number(project.progress) || 0,
    hasOverdueTasks: overdueTasks > 0,
    taskDates: tasks.map((t) => t.due_date),
  });
  const financial = getFinancialHealth({
    budget: Number(project.budget),
    actualCost: Number(project.actual_cost),
    contributions: totalContributions,
  });

  // === Métricas financieras (con cap visual) ===
  const realProfit = Number(project.budget) - Number(project.actual_cost) - totalContributions;
  const marginPct = Number(project.budget) > 0 ? (realProfit / Number(project.budget)) * 100 : 0;
  const safeMargin = formatSafeMargin(marginPct);
  const losing = realProfit < 0;
  const usedPct = Number(project.budget) > 0
    ? Math.min(100, (Number(project.actual_cost) / Number(project.budget)) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* ============================================================
          1. GANANCIA / PÉRDIDA — lo PRIMERO que el usuario debe ver
          ============================================================ */}
      <div className={cn("surface-card p-6 border-l-4", financial.border)}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {losing ? "Pérdida real (hoy)" : "Ganancia real (hoy)"}
              {totalContributions > 0 && " · descontando tu aporte"}
            </div>
            <div className={cn("text-4xl font-bold font-mono-data", losing ? "text-cost-negative" : "text-cost-positive")}>
              {realProfit >= 0 ? "+" : ""}{PEN.format(realProfit)}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1">
              {safeMargin.isExtreme ? (
                <span className="text-cost-negative font-medium">{safeMargin.text}</span>
              ) : (
                <>Margen real: <span className={cn("font-mono-data font-semibold", marginPct >= 20 ? "text-cost-positive" : marginPct >= 0 ? "text-cost-warning" : "text-cost-negative")}>{safeMargin.text}</span></>
              )}
            </div>
            {totalContributions > 0 && (
              <div className="text-[11px] text-primary mt-1 inline-flex items-center gap-1">
                <HandCoins className="w-3 h-3" /> Incluye {PEN.format(totalContributions)} de aporte propio
              </div>
            )}
          </div>
          {losing ? (
            <TrendingDown className="w-12 h-12 text-cost-negative shrink-0" />
          ) : (
            <TrendingUp className="w-12 h-12 text-cost-positive fire-icon shrink-0" />
          )}
        </div>
      </div>

      {/* ============================================================
          2. ESTADO FINANCIERO + 3. ESTADO DE TIEMPO (separados)
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={cn("surface-card p-4 border-l-4", financial.border)}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 inline-flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Estado financiero
          </div>
          <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded font-bold text-sm", financial.bg, financial.color)}>
            <span>{financial.emoji}</span> {financial.label}
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">{financial.description}</p>
        </div>
        <div className={cn("surface-card p-4 border-l-4", execution.border)}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Estado de ejecución
          </div>
          <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded font-bold text-sm", execution.bg, execution.color)}>
            {execution.key === "not_evaluable" && <AlertTriangle className="w-3.5 h-3.5" />}
            {execution.label}
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">{execution.description}</p>
          {execution.key === "not_evaluable" && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-7 text-[11px] gap-1"
              onClick={() => onTabChange("planning")}
            >
              <Calendar className="w-3 h-3" /> Definir fechas del proyecto
              <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================
          4. PROGRESO + presupuesto
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="surface-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1">
            Avance del proyecto
            <span className="text-[9px] normal-case tracking-normal text-primary font-semibold">· auto</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-2xl font-bold font-mono-data fire-text">{project.progress}%</div>
            <Progress value={project.progress} className="h-2 flex-1" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 font-mono-data">
            {doneTasks} de {totalTasks} tareas completadas
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Presupuesto vs gasto</div>
          <div className="flex items-center gap-3 mt-2">
            <div className={cn("text-2xl font-bold font-mono-data", losing && "text-cost-negative")}>{usedPct.toFixed(0)}%</div>
            <Progress value={usedPct} className={cn("h-2 flex-1", losing && "[&>div]:bg-cost-negative")} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 font-mono-data">
            {PEN.format(Number(project.actual_cost))} / {PEN.format(Number(project.budget))}
          </div>
        </div>
      </div>

      {/* ============================================================
          5. CLIENTE (información secundaria)
          ============================================================ */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cliente</div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground truncate">{project.clients?.name || "—"}</span>
              {project.clients?.company && (
                <span className="text-[12px] text-muted-foreground truncate">· {project.clients.company}</span>
              )}
            </div>
          </div>
          {project.quotations && (
            <Link
              to="/cotizaciones"
              className="text-[12px] text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              Origen: <span className="text-primary font-medium">{project.quotations.title}</span>
            </Link>
          )}
        </div>
        {project.description && (
          <p className="text-[12px] text-muted-foreground mt-3 pt-3 border-t border-border">{project.description}</p>
        )}
      </div>

      {/* ============================================================
          ALERTAS ACCIONABLES — cada una con CTA al lugar correcto
          ============================================================ */}
      {losing && (
        <div className="surface-card border border-cost-negative/40 bg-cost-negative/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-negative shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Este proyecto está perdiendo dinero</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Has gastado {PEN.format(Number(project.actual_cost))} contra un presupuesto de {PEN.format(Number(project.budget))}.
              {totalContributions > 0 && ` Más ${PEN.format(totalContributions)} de tu aporte propio.`}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTabChange("costs")}>
            <DollarSign className="w-3.5 h-3.5" /> Ver costos
          </Button>
        </div>
      )}
      {execution.key === "delayed" && (
        <div className="surface-card border border-cost-warning/40 bg-cost-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">
              {overdueTasks > 0 ? `${overdueTasks} tarea(s) vencidas` : "Proyecto fuera de cronograma"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Resuélvelas para evitar mayor impacto en la entrega.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTabChange("planning")}>
            <ListChecks className="w-3.5 h-3.5" /> Ver tareas críticas
          </Button>
        </div>
      )}
      {blockingProject > 0 && (
        <div className="surface-card border border-cost-warning/40 bg-cost-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">
              {blockingProject} tarea(s) están bloqueando el proyecto
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Desbloquéalas para retomar el avance.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTabChange("planning")}>
            <ListChecks className="w-3.5 h-3.5" /> Desbloquear
          </Button>
        </div>
      )}
      {!losing && marginPct >= 30 && totalTasks > 0 && (
        <div className="surface-card border border-cost-positive/40 bg-cost-positive/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-cost-positive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Excelente rentabilidad</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Este proyecto va con margen del {safeMargin.text}. Buen modelo a replicar.
            </p>
          </div>
        </div>
      )}

      {/* Fechas */}
      {(project.start_date || project.end_date) && (
        <div className="surface-card p-4">
          <h3 className="section-header mb-3">Cronograma</h3>
          <div className="flex items-center gap-6 text-[13px] flex-wrap">
            {project.start_date && (
              <div className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Inicio:</span>
                <span className="font-mono-data text-foreground">
                  {new Date(project.start_date).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
            {project.end_date && (
              <div className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Entrega:</span>
                <span className="font-mono-data text-foreground">
                  {new Date(project.end_date).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => onTabChange("planning")} className="surface-card surface-card-hover p-4 text-left group">
          <ListChecks className="w-5 h-5 text-primary fire-icon mb-2" />
          <div className="font-semibold text-sm">Planificar trabajo</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {totalTasks} tareas · {overdueTasks} vencidas
          </div>
          <div className="text-[11px] text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir <ArrowRight className="w-3 h-3" />
          </div>
        </button>
        <button onClick={() => onTabChange("costs")} className="surface-card surface-card-hover p-4 text-left group">
          {losing ? (
            <TrendingDown className="w-5 h-5 text-cost-negative mb-2" />
          ) : (
            <TrendingUp className="w-5 h-5 text-cost-positive mb-2" />
          )}
          <div className="font-semibold text-sm">Ver finanzas</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {safeMargin.isExtreme ? "Revisa qué se disparó" : `Margen ${safeMargin.text} · ${usedPct.toFixed(0)}% del presupuesto usado`}
          </div>
          <div className="text-[11px] text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir <ArrowRight className="w-3 h-3" />
          </div>
        </button>
        <button onClick={() => onTabChange("report")} className="surface-card surface-card-hover p-4 text-left group">
          <CheckCircle2 className="w-5 h-5 text-status-progress mb-2" />
          <div className="font-semibold text-sm">Informe ejecutivo</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            ¿Estoy ganando? ¿Voy atrasado? ¿Qué me bloquea?
          </div>
          <div className="text-[11px] text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir <ArrowRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    </div>
  );
}
