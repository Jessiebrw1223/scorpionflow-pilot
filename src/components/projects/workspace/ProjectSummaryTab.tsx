import { Link } from "react-router-dom";
import { Calendar, Receipt, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ListChecks, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_META } from "@/lib/business-intelligence";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface Props {
  project: any;
  tasks: any[];
  onTabChange: (tab: string) => void;
}

export default function ProjectSummaryTab({ project, tasks, onTabChange }: Props) {
  const meta = PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.on_track;
  const profit = Number(project.budget) - Number(project.actual_cost);
  const marginPct = Number(project.budget) > 0 ? (profit / Number(project.budget)) * 100 : 0;
  const usedPct = Number(project.budget) > 0
    ? Math.min(100, (Number(project.actual_cost) / Number(project.budget)) * 100)
    : 0;
  const losing = profit < 0;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const blockingProject = tasks.filter((t) => t.blocks_project).length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date()
  ).length;
  const taskCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Estado del proyecto — banner principal */}
      <div className={cn("surface-card p-5 border-l-4", meta.border)}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded", meta.bg, meta.color)}>
                {meta.label}
              </span>
              {project.quotations && (
                <Link
                  to="/cotizaciones"
                  className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  <Receipt className="w-3 h-3" />
                  Viene de la cotización · {project.quotations.title}
                </Link>
              )}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-3">
              Avance del proyecto
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="text-3xl font-bold font-mono-data fire-text">{project.progress}%</div>
              <Progress value={project.progress} className="h-2 flex-1 max-w-md" />
            </div>
            {project.description && (
              <p className="text-[13px] text-muted-foreground mt-3 max-w-2xl">{project.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ganancia estimada</div>
            <div className={cn("text-2xl font-bold font-mono-data", losing ? "text-cost-negative" : "text-cost-positive")}>
              {profit >= 0 ? "+" : ""}{PEN.format(profit)}
            </div>
            <div className={cn("text-[12px] font-mono-data font-semibold", losing ? "text-cost-negative" : marginPct >= 20 ? "text-cost-positive" : "text-cost-warning")}>
              Margen {marginPct.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* KPIs operativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Presupuesto</div>
          <div className="text-lg font-bold font-mono-data">{PEN.format(Number(project.budget))}</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Gastado</div>
          <div className={cn("text-lg font-bold font-mono-data", losing && "text-cost-negative")}>
            {PEN.format(Number(project.actual_cost))}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono-data mt-0.5">{usedPct.toFixed(0)}% usado</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tareas</div>
          <div className="text-lg font-bold font-mono-data">{doneTasks} / {totalTasks}</div>
          <div className="text-[10px] text-muted-foreground font-mono-data mt-0.5">{taskCompletion}% completadas</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Bloqueos</div>
          <div className={cn("text-lg font-bold font-mono-data", (blockedTasks > 0 || blockingProject > 0) && "text-cost-warning")}>
            {blockedTasks + blockingProject}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono-data mt-0.5">
            {blockingProject > 0 ? `${blockingProject} retrasan entrega` : "Sin bloqueos críticos"}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {losing && (
        <div className="surface-card border border-cost-negative/40 bg-cost-negative/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-negative shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Este proyecto está perdiendo dinero</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Has gastado {PEN.format(Number(project.actual_cost))} contra un presupuesto de {PEN.format(Number(project.budget))}.
              Revisa la pestaña Costos para ver dónde ajustar.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTabChange("costs")}>Ver costos</Button>
        </div>
      )}
      {blockingProject > 0 && (
        <div className="surface-card border border-cost-warning/40 bg-cost-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">
              {blockingProject} tarea(s) están retrasando el proyecto
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Resuélvelas para evitar mayor impacto en la entrega.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTabChange("tasks")}>
            <ListChecks className="w-3.5 h-3.5" /> Ver tareas
          </Button>
        </div>
      )}
      {!losing && marginPct >= 30 && totalTasks > 0 && (
        <div className="surface-card border border-cost-positive/40 bg-cost-positive/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-cost-positive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Excelente rentabilidad</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Este proyecto va con margen del {marginPct.toFixed(0)}%. Buen modelo a replicar.
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
        <button onClick={() => onTabChange("tasks")} className="surface-card surface-card-hover p-4 text-left group">
          <ListChecks className="w-5 h-5 text-primary fire-icon mb-2" />
          <div className="font-semibold text-sm">Gestionar tareas</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            {totalTasks} tareas · {overdueTasks} vencidas
          </div>
          <div className="text-[11px] text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir <ArrowRight className="w-3 h-3" />
          </div>
        </button>
        <button onClick={() => onTabChange("costs")} className="surface-card surface-card-hover p-4 text-left group">
          {profit >= 0 ? (
            <TrendingUp className="w-5 h-5 text-cost-positive mb-2" />
          ) : (
            <TrendingDown className="w-5 h-5 text-cost-negative mb-2" />
          )}
          <div className="font-semibold text-sm">Ver finanzas</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Margen {marginPct.toFixed(0)}% · {usedPct.toFixed(0)}% del presupuesto usado
          </div>
          <div className="text-[11px] text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir <ArrowRight className="w-3 h-3" />
          </div>
        </button>
        <button onClick={() => onTabChange("report")} className="surface-card surface-card-hover p-4 text-left group">
          <CheckCircle2 className="w-5 h-5 text-status-progress mb-2" />
          <div className="font-semibold text-sm">Informe ejecutivo</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Estado, progreso, presupuesto y entregables
          </div>
          <div className="text-[11px] text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Abrir <ArrowRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    </div>
  );
}
