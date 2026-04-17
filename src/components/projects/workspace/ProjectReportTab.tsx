import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Receipt, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_META, TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/business-intelligence";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface Props {
  project: any;
}

export default function ProjectReportTab({ project }: Props) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["project-tasks-report", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", project.id);
      if (error) throw error;
      return data as any[];
    },
  });

  const meta = PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.on_track;
  const profit = Number(project.budget) - Number(project.actual_cost);
  const margin = Number(project.budget) > 0 ? (profit / Number(project.budget)) * 100 : 0;
  const usedPct = Number(project.budget) > 0 ? Math.min(100, (Number(project.actual_cost) / Number(project.budget)) * 100) : 0;

  const byStatus = tasks.reduce((acc: any, t: any) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const totalTasks = tasks.length;
  const doneTasks = byStatus.done || 0;
  const completion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const criticalTasks = tasks.filter((t: any) => t.priority === "critical" && t.status !== "done");
  const blockingTasks = tasks.filter((t: any) => t.blocks_project);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" /> Generando informe…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Informe ejecutivo del proyecto</h2>
        <p className="text-[12px] text-muted-foreground">
          Estado general, presupuesto, avance y entregables — solo de este proyecto.
        </p>
      </div>

      {/* Header card */}
      <div className={cn("surface-card p-5 border-l-4", meta.border)}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded", meta.bg, meta.color)}>
                {meta.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Cliente: <span className="text-foreground font-medium">{project.clients?.name || "—"}</span>
                {project.clients?.company && <> · {project.clients.company}</>}
              </span>
            </div>
            <h3 className="text-xl font-bold mt-2">{project.name}</h3>
            {project.quotations && (
              <Link to="/cotizaciones" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1 mt-1">
                <Receipt className="w-3 h-3" /> Origen: {project.quotations.title}
              </Link>
            )}
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ganancia</div>
            <div className={cn("text-2xl font-bold font-mono-data", profit < 0 ? "text-cost-negative" : "text-cost-positive")}>
              {profit >= 0 ? "+" : ""}{PEN.format(profit)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Avance" value={`${project.progress}%`} />
        <Metric label="Tareas completadas" value={`${doneTasks} / ${totalTasks}`} sub={`${completion}%`} />
        <Metric label="Presupuesto usado" value={`${usedPct.toFixed(0)}%`} sub={PEN.format(Number(project.actual_cost))} />
        <Metric label="Margen" value={`${margin.toFixed(1)}%`} tone={margin >= 20 ? "good" : margin >= 0 ? "warn" : "bad"} />
      </div>

      {/* Cronograma */}
      {(project.start_date || project.end_date) && (
        <div className="surface-card p-4">
          <h3 className="section-header mb-3">Cronograma</h3>
          <div className="flex items-center gap-6 text-[13px] flex-wrap">
            {project.start_date && (
              <div className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Inicio:</span>
                <span className="font-mono-data text-foreground">{new Date(project.start_date).toLocaleDateString("es-PE")}</span>
              </div>
            )}
            {project.end_date && (
              <div className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Entrega:</span>
                <span className="font-mono-data text-foreground">{new Date(project.end_date).toLocaleDateString("es-PE")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Presupuesto vs gasto */}
      <div className="surface-card p-4">
        <h3 className="section-header mb-3">Presupuesto vs gasto</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-foreground">Presupuesto</span>
            <span className="font-mono-data font-semibold">{PEN.format(Number(project.budget))}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-foreground">Gastado</span>
            <span className={cn("font-mono-data font-semibold", profit < 0 && "text-cost-negative")}>
              {PEN.format(Number(project.actual_cost))}
            </span>
          </div>
          <Progress value={usedPct} className={cn("h-2 mt-2", profit < 0 && "[&>div]:bg-cost-negative")} />
        </div>
      </div>

      {/* Distribución de tareas */}
      <div className="surface-card p-4">
        <h3 className="section-header mb-3">Distribución de tareas</h3>
        {totalTasks === 0 ? (
          <p className="text-[13px] text-muted-foreground">Aún no hay tareas registradas.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(TASK_STATUS_META).map(([k, v]) => {
              const count = byStatus[k] || 0;
              const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", v.color)} />
                      {v.label}
                    </span>
                    <span className="font-mono-data text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", v.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tareas críticas */}
      {(criticalTasks.length > 0 || blockingTasks.length > 0) && (
        <div className="surface-card p-4">
          <h3 className="section-header mb-3">Tareas críticas o que retrasan la entrega</h3>
          <div className="space-y-2">
            {[...new Map([...criticalTasks, ...blockingTasks].map((t) => [t.id, t])).values()]
              .slice(0, 8)
              .map((t: any) => {
                const pr = TASK_PRIORITY_META[t.priority];
                return (
                  <div key={t.id} className="flex items-center gap-2 text-[12px] py-1.5 border-b border-border last:border-0">
                    <span className={cn("text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded", pr.bg, pr.color)}>
                      {pr.emoji} {pr.label}
                    </span>
                    <span className="flex-1 truncate">{t.title}</span>
                    {t.blocks_project && (
                      <span className="text-[10px] text-cost-warning font-semibold">⚠ Bloquea</span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" | "bad" }) {
  const toneClass = tone === "good" ? "text-cost-positive" : tone === "warn" ? "text-cost-warning" : tone === "bad" ? "text-cost-negative" : "text-foreground";
  return (
    <div className="surface-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-bold font-mono-data", toneClass)}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground font-mono-data mt-0.5">{sub}</div>}
    </div>
  );
}
