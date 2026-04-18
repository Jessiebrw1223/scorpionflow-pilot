import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Pencil, Loader2, Users, Cpu, Wrench, Sparkles, Target, Clock, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";
import ProjectContributionsSection from "./ProjectContributionsSection";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface Props {
  project: any;
}

interface CostBreakdown {
  personnel: number;
  tech: number;
  operations: number;
}

const STORAGE_KEY = (id: string) => `sf_cost_breakdown_${id}`;

function loadBreakdown(projectId: string, total: number): CostBreakdown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        personnel: Number(parsed.personnel) || 0,
        tech: Number(parsed.tech) || 0,
        operations: Number(parsed.operations) || 0,
      };
    }
  } catch {}
  return {
    personnel: Math.round(total * 0.6),
    tech: Math.round(total * 0.2),
    operations: Math.round(total * 0.2),
  };
}

function saveBreakdown(projectId: string, b: CostBreakdown) {
  try { localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify(b)); } catch {}
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 5) return "ahora mismo";
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

export default function ProjectCostsTab({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(Number(project.budget));
  const [breakdown, setBreakdown] = useState<CostBreakdown>(() =>
    loadBreakdown(project.id, Number(project.actual_cost))
  );
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [, force] = useState(0);

  // Refresca el "hace X seg" cada 5s
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // Tareas reales: para impacto cost + sumatoria de costos por tarea
  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks-cost", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, impact, estimated_cost, actual_cost, node_type")
        .eq("project_id", project.id);
      if (error) throw error;
      return data as any[];
    },
  });

  const totalActual = breakdown.personnel + breakdown.tech + breakdown.operations;

  const update = useMutation({
    mutationFn: async () => {
      saveBreakdown(project.id, breakdown);
      const { error } = await supabase
        .from("projects")
        .update({ budget, actual_cost: totalActual })
        .eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setLastUpdate(Date.now());
      toast.success("Datos financieros actualizados");
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });

  // Live data desde el proyecto en BD
  const liveBreakdown = loadBreakdown(project.id, Number(project.actual_cost));
  const liveTotal = Number(project.actual_cost);
  const liveProfit = Number(project.budget) - liveTotal;
  const liveMargin = Number(project.budget) > 0 ? (liveProfit / Number(project.budget)) * 100 : 0;
  const liveLosing = liveProfit < 0;
  const usedPct = Number(project.budget) > 0 ? Math.min(100, (liveTotal / Number(project.budget)) * 100) : 0;

  // ROI en lenguaje simple: por cada S/1 invertido ganas S/X.XX
  const roiRatio = liveTotal > 0 ? Number(project.budget) / liveTotal : 0;
  const roiText = liveTotal > 0
    ? `Por cada S/ 1 invertido, recibes S/ ${roiRatio.toFixed(2)}`
    : "Aún no hay gastos registrados";

  // Suma de costos por tarea (diferencial)
  const taskEstimated = tasks.reduce((s, t) => s + Number(t.estimated_cost || 0), 0);
  const taskActual = tasks.reduce((s, t) => s + Number(t.actual_cost || 0), 0);
  const topCostTasks = [...tasks]
    .filter((t) => Number(t.actual_cost) > 0 || Number(t.estimated_cost) > 0)
    .sort((a, b) => Number(b.actual_cost || b.estimated_cost) - Number(a.actual_cost || a.estimated_cost))
    .slice(0, 5);

  // Proyección: si todo sigue así, ¿cómo terminamos?
  // Avance del proyecto (auto desde tareas — viene del trigger en BD)
  const progress = Number(project.progress) || 0;
  const projectedTotal = progress > 0 ? (liveTotal / progress) * 100 : liveTotal;
  const projectedProfit = Number(project.budget) - projectedTotal;
  const projectedMargin = Number(project.budget) > 0 ? (projectedProfit / Number(project.budget)) * 100 : 0;
  const projectionTone = projectedProfit < 0 ? "bad" : projectedMargin >= 20 ? "good" : "warn";

  const costImpactTasks = tasks.filter((t) => t.impact === "cost").length;

  // Para preview en dialog
  const previewProfit = budget - totalActual;
  const previewMargin = budget > 0 ? (previewProfit / budget) * 100 : 0;
  const previewLosing = previewProfit < 0;

  const categories = useMemo(() => [
    {
      key: "personnel" as const,
      icon: Users,
      label: "Personal",
      description: "Honorarios, sueldos, freelancers",
      value: liveBreakdown.personnel,
      color: "border-status-progress",
      iconBg: "bg-status-progress/15 text-status-progress",
    },
    {
      key: "tech" as const,
      icon: Cpu,
      label: "Tecnología",
      description: "Software, licencias, hosting",
      value: liveBreakdown.tech,
      color: "border-primary",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      key: "operations" as const,
      icon: Wrench,
      label: "Operativos",
      description: "Logística, viajes, materiales",
      value: liveBreakdown.operations,
      color: "border-cost-warning",
      iconBg: "bg-cost-warning/15 text-cost-warning",
    },
  ], [liveBreakdown]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Finanzas del proyecto</h2>
          <p className="text-[12px] text-muted-foreground inline-flex items-center gap-2">
            <Clock className="w-3 h-3" /> Actualizado {timeAgo(lastUpdate)} · datos sincronizados
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (v) {
            setBudget(Number(project.budget));
            setBreakdown(loadBreakdown(project.id, Number(project.actual_cost)));
          }
        }}>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Pencil className="w-3.5 h-3.5" /> Actualizar costos
          </Button>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Actualizar datos financieros</DialogTitle>
              <p className="text-[12px] text-muted-foreground">
                Indica lo que cobraste y desglosa lo gastado por categoría.
              </p>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Presupuesto (lo que cobré)</Label>
                <CurrencyInput value={budget} onValueChange={setBudget} />
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">Costos por categoría</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] inline-flex items-center gap-1"><Users className="w-3 h-3" /> Personal</Label>
                    <CurrencyInput value={breakdown.personnel} onValueChange={(v) => setBreakdown({ ...breakdown, personnel: v })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] inline-flex items-center gap-1"><Cpu className="w-3 h-3" /> Tecnología</Label>
                    <CurrencyInput value={breakdown.tech} onValueChange={(v) => setBreakdown({ ...breakdown, tech: v })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> Operativos</Label>
                    <CurrencyInput value={breakdown.operations} onValueChange={(v) => setBreakdown({ ...breakdown, operations: v })} />
                  </div>
                </div>
                <div className="text-[12px] text-muted-foreground font-mono-data">
                  Total gastado: <span className="text-foreground font-semibold">{PEN.format(totalActual)}</span>
                </div>
              </div>
              <div className={cn("surface-card p-3", previewLosing ? "border-cost-negative/40 bg-cost-negative/5" : "border-cost-positive/40 bg-cost-positive/5")}>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ganancia real estimada</div>
                <div className={cn("text-xl font-bold font-mono-data", previewLosing ? "text-cost-negative" : "text-cost-positive")}>
                  {previewProfit >= 0 ? "+" : ""}{PEN.format(previewProfit)} ({previewMargin.toFixed(1)}%)
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => update.mutate()} disabled={update.isPending} className="fire-button">
                {update.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* === Big number: GANANCIA REAL === */}
      <div className={cn("surface-card p-6 border-l-4", liveLosing ? "border-cost-negative" : "border-cost-positive")}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ganancia real (hoy)</div>
            <div className={cn("text-4xl font-bold font-mono-data mt-1", liveLosing ? "text-cost-negative" : "text-cost-positive")}>
              {liveProfit >= 0 ? "+" : ""}{PEN.format(liveProfit)}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1">
              Margen real: <span className={cn("font-mono-data font-semibold", liveMargin >= 20 ? "text-cost-positive" : liveMargin >= 0 ? "text-cost-warning" : "text-cost-negative")}>
                {liveMargin.toFixed(1)}%
              </span>
              {" · "}
              {liveLosing ? "Estás perdiendo dinero. Revisa qué ajustar." : liveMargin >= 30 ? "Excelente rentabilidad." : "Margen aceptable, vigila los costos."}
            </div>
          </div>
          {liveLosing ? (
            <TrendingDown className="w-12 h-12 text-cost-negative" />
          ) : (
            <TrendingUp className="w-12 h-12 text-cost-positive fire-icon" />
          )}
        </div>
      </div>

      {/* === Tarjetas simplificadas: ROI + Proyección final === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="surface-card p-4 border-l-4 border-status-progress">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-status-progress" /> Retorno sobre tu inversión
          </div>
          <div className="text-xl font-bold font-mono-data mt-1 text-foreground">{roiText}</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {liveTotal > 0 && roiRatio >= 1.3
              ? "Buena rentabilidad por cada sol invertido."
              : liveTotal > 0 && roiRatio >= 1.0
              ? "Recuperas la inversión, pero el margen es ajustado."
              : liveTotal > 0
              ? "Estás perdiendo dinero por cada sol invertido."
              : "Cuando registres gastos verás tu ROI aquí."}
          </p>
        </div>

        <div className={cn(
          "surface-card p-4 border-l-4",
          projectionTone === "bad" ? "border-cost-negative" : projectionTone === "warn" ? "border-cost-warning" : "border-cost-positive"
        )}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Target className="w-3.5 h-3.5" /> Si todo sigue así, terminarás con:
          </div>
          {progress === 0 ? (
            <div className="text-[13px] text-muted-foreground mt-2">
              Avanza el proyecto para ver la proyección final.
            </div>
          ) : (
            <>
              <div className={cn(
                "text-xl font-bold font-mono-data mt-1",
                projectionTone === "bad" ? "text-cost-negative" : projectionTone === "warn" ? "text-cost-warning" : "text-cost-positive"
              )}>
                {projectedProfit >= 0 ? "+" : ""}{PEN.format(projectedProfit)} ({projectedMargin.toFixed(1)}%)
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Basado en tu avance actual ({progress}%). Costo proyectado: {PEN.format(projectedTotal)}.
              </p>
            </>
          )}
        </div>
      </div>

      {/* === Clasificación de costos === */}
      <div>
        <h3 className="section-header mb-2">Costos por categoría</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {categories.map((c) => {
            const pct = liveTotal > 0 ? (c.value / liveTotal) * 100 : 0;
            const Icon = c.icon;
            return (
              <div key={c.key} className={cn("surface-card p-4 border-l-4", c.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{c.label}</div>
                    <div className="text-[10px] text-muted-foreground">{c.description}</div>
                  </div>
                </div>
                <div className="text-xl font-bold font-mono-data">{PEN.format(c.value)}</div>
                <div className="text-[11px] text-muted-foreground font-mono-data mt-0.5">
                  {pct.toFixed(0)}% del gasto total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === Resumen presupuesto === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="surface-card p-4 border-l-4 border-status-progress">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Presupuesto cobrado</div>
          <div className="text-xl font-bold font-mono-data">{PEN.format(Number(project.budget))}</div>
        </div>
        <div className="surface-card p-4 border-l-4 border-cost-warning">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total gastado</div>
          <div className={cn("text-xl font-bold font-mono-data", liveLosing && "text-cost-negative")}>
            {PEN.format(liveTotal)}
          </div>
        </div>
        <div className="surface-card p-4 border-l-4 border-primary">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">% del presupuesto usado</div>
          <div className="text-xl font-bold font-mono-data">{usedPct.toFixed(0)}%</div>
        </div>
      </div>

      {/* === Progress bar === */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="text-muted-foreground">
            Gastado <span className="font-mono-data text-foreground">{PEN.format(liveTotal)}</span> de{" "}
            <span className="font-mono-data text-foreground">{PEN.format(Number(project.budget))}</span>
          </span>
          <span className={cn("font-mono-data font-semibold", liveLosing ? "text-cost-negative" : "text-muted-foreground")}>
            {usedPct.toFixed(0)}%
          </span>
        </div>
        <Progress value={usedPct} className={cn("h-3", liveLosing && "[&>div]:bg-cost-negative")} />
        {costImpactTasks > 0 && (
          <p className="text-[11px] text-muted-foreground mt-2">
            💰 {costImpactTasks} tarea(s) marcadas con impacto en costo — vigila su ejecución.
          </p>
        )}
      </div>

      {/* === DIFERENCIAL: costos por tarea === */}
      {(taskEstimated > 0 || taskActual > 0) && (
        <div className="surface-card p-4">
          <h3 className="section-header mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Costo por tarea
            <span className="ml-2 text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
              Estimado: {PEN.format(taskEstimated)} · Real: {PEN.format(taskActual)}
            </span>
          </h3>
          {topCostTasks.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              Asigna costos en las tareas (panel lateral) para ver dónde se va el dinero.
            </p>
          ) : (
            <div className="space-y-1.5">
              {topCostTasks.map((t) => {
                const overrun = Number(t.actual_cost) > Number(t.estimated_cost) && Number(t.estimated_cost) > 0;
                return (
                  <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0 text-[12px]">
                    <span className="truncate flex-1">{t.title}</span>
                    <span className="font-mono-data text-muted-foreground">est. {PEN.format(Number(t.estimated_cost) || 0)}</span>
                    <span className={cn("font-mono-data font-semibold", overrun ? "text-cost-negative" : "text-foreground")}>
                      {PEN.format(Number(t.actual_cost) || 0)}
                    </span>
                    {overrun && <AlertTriangle className="w-3 h-3 text-cost-negative shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {liveLosing && (
        <div className="surface-card border border-cost-negative/40 bg-cost-negative/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-negative shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Has gastado más de lo cobrado</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Estás {PEN.format(Math.abs(liveProfit))} por debajo. Revisa qué categoría se disparó y ajusta partidas o renegocia el alcance.
            </p>
          </div>
        </div>
      )}
      {!liveLosing && liveMargin < 15 && Number(project.budget) > 0 && (
        <div className="surface-card border border-cost-warning/40 bg-cost-warning/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Margen por debajo del 15%</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Tu rentabilidad está apretada. Cuida los costos restantes para no entrar en pérdida.
            </p>
          </div>
        </div>
      )}
      {!liveLosing && liveMargin >= 30 && (
        <div className="surface-card border border-cost-positive/40 bg-cost-positive/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-cost-positive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Excelente margen ({liveMargin.toFixed(0)}%)</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Este proyecto está dejando muy buena rentabilidad. Buen modelo a replicar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
