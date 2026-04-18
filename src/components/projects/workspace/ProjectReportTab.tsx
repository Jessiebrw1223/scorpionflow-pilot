import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Receipt, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_META, TASK_PRIORITY_META, TASK_IMPACT_META } from "@/lib/business-intelligence";
import { useMoney } from "@/lib/format-money";

interface Props {
  project: any;
}

export default function ProjectReportTab({ project }: Props) {
  const PEN = useMoney();
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

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const blockingTasks = tasks.filter((t: any) => t.blocks_project);
  const overdueTasks = tasks.filter(
    (t: any) => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date()
  );
  const blockedTasks = tasks.filter((t: any) => t.status === "blocked");
  const criticalImpactCost = tasks.filter((t: any) => t.impact === "cost" && t.status !== "done");

  // Determinar respuestas a las 3 preguntas estratégicas
  const earningStatus = profit < 0
    ? { tone: "bad" as const, icon: TrendingDown, title: "Estás perdiendo dinero", detail: `Tienes ${PEN.format(Math.abs(profit))} de pérdida. Margen ${margin.toFixed(1)}%.` }
    : margin >= 30
    ? { tone: "good" as const, icon: TrendingUp, title: "Vas ganando bien", detail: `Ganancia de ${PEN.format(profit)} (margen ${margin.toFixed(1)}%).` }
    : { tone: "warn" as const, icon: TrendingUp, title: "Margen ajustado", detail: `Ganas ${PEN.format(profit)} (margen ${margin.toFixed(1)}%). Vigila los costos.` };

  const scheduleStatus = overdueTasks.length === 0 && blockingTasks.length === 0
    ? { tone: "good" as const, icon: CheckCircle2, title: "Vas en tiempo", detail: "Sin tareas vencidas ni que retrasen la entrega." }
    : blockingTasks.length > 0
    ? { tone: "bad" as const, icon: AlertTriangle, title: "Hay retrasos críticos", detail: `${blockingTasks.length} tarea(s) están retrasando la entrega del proyecto.` }
    : { tone: "warn" as const, icon: Clock, title: "Hay tareas vencidas", detail: `${overdueTasks.length} tarea(s) ya pasaron su fecha límite.` };

  const blockersStatus = blockedTasks.length === 0 && blockingTasks.length === 0
    ? { tone: "good" as const, icon: CheckCircle2, title: "Sin bloqueos", detail: "Nada está deteniendo el avance." }
    : { tone: "bad" as const, icon: AlertTriangle, title: `${blockedTasks.length + blockingTasks.length} bloqueo(s)`, detail: `${blockedTasks.length} bloqueada(s) · ${blockingTasks.length} retrasan entrega.` };

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
        <h2 className="text-base font-semibold">Informe ejecutivo</h2>
        <p className="text-[12px] text-muted-foreground">
          Las 3 respuestas que necesitas para tomar decisiones — solo de este proyecto.
        </p>
      </div>

      {/* Header card con cliente + estado */}
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
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Avance</div>
            <div className="text-2xl font-bold font-mono-data fire-text">{project.progress}%</div>
            <div className="text-[11px] text-muted-foreground font-mono-data">{doneTasks}/{totalTasks} tareas</div>
          </div>
        </div>
      </div>

      {/* === LAS 3 PREGUNTAS DE DECISIÓN === */}
      <div className="space-y-3">
        <DecisionCard
          question="¿Estoy ganando o perdiendo?"
          status={earningStatus}
        />
        <DecisionCard
          question="¿Voy en tiempo o atrasado?"
          status={scheduleStatus}
        />
        <DecisionCard
          question="¿Qué está bloqueando el avance?"
          status={blockersStatus}
        />
      </div>

      {/* === Detalle financiero === */}
      <div className="surface-card p-4">
        <h3 className="section-header mb-3">Detalle financiero</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Presupuesto" value={PEN.format(Number(project.budget))} />
          <Metric label="Gastado" value={PEN.format(Number(project.actual_cost))} tone={profit < 0 ? "bad" : undefined} />
          <Metric label="Ganancia" value={PEN.format(profit)} tone={profit < 0 ? "bad" : margin >= 20 ? "good" : "warn"} />
          <Metric label="Margen" value={`${margin.toFixed(1)}%`} tone={margin >= 20 ? "good" : margin >= 0 ? "warn" : "bad"} />
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-foreground">Uso del presupuesto</span>
            <span className={cn("font-mono-data font-semibold", profit < 0 && "text-cost-negative")}>
              {usedPct.toFixed(0)}%
            </span>
          </div>
          <Progress value={usedPct} className={cn("h-2", profit < 0 && "[&>div]:bg-cost-negative")} />
        </div>
      </div>

      {/* Tareas críticas o que retrasan la entrega */}
      {(blockingTasks.length > 0 || overdueTasks.length > 0 || criticalImpactCost.length > 0) && (
        <div className="surface-card p-4">
          <h3 className="section-header mb-3">Tareas que requieren atención</h3>
          <div className="space-y-2">
            {[...new Map([...blockingTasks, ...overdueTasks, ...criticalImpactCost].map((t) => [t.id, t])).values()]
              .slice(0, 10)
              .map((t: any) => {
                const pr = TASK_PRIORITY_META[t.priority];
                const im = TASK_IMPACT_META[t.impact || "delivery"];
                const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "done";
                return (
                  <div key={t.id} className="flex items-center gap-2 text-[12px] py-1.5 border-b border-border last:border-0">
                    <span className={cn("text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded", pr.bg, pr.color)}>
                      {pr.emoji} {pr.label}
                    </span>
                    <span className={cn("text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded", im.bg, im.color)}>
                      {im.emoji} {im.short}
                    </span>
                    <span className="flex-1 truncate">{t.title}</span>
                    {t.blocks_project && (
                      <span className="text-[10px] text-cost-warning font-semibold">⚠ Bloquea</span>
                    )}
                    {overdue && (
                      <span className="text-[10px] text-destructive font-semibold">Vencida</span>
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

function DecisionCard({
  question,
  status,
}: {
  question: string;
  status: { tone: "good" | "warn" | "bad"; icon: React.ElementType; title: string; detail: string };
}) {
  const Icon = status.icon;
  const toneBorder = status.tone === "good" ? "border-cost-positive" : status.tone === "warn" ? "border-cost-warning" : "border-cost-negative";
  const toneBg = status.tone === "good" ? "bg-cost-positive/5" : status.tone === "warn" ? "bg-cost-warning/5" : "bg-cost-negative/5";
  const toneText = status.tone === "good" ? "text-cost-positive" : status.tone === "warn" ? "text-cost-warning" : "text-cost-negative";

  return (
    <div className={cn("surface-card border-l-4 p-4 flex items-start gap-3", toneBorder, toneBg)}>
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", toneText, "bg-card")}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{question}</div>
        <div className={cn("font-semibold text-sm mt-0.5", toneText)}>{status.title}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{status.detail}</div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const toneClass = tone === "good" ? "text-cost-positive" : tone === "warn" ? "text-cost-warning" : tone === "bad" ? "text-cost-negative" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-bold font-mono-data", toneClass)}>{value}</div>
    </div>
  );
}
