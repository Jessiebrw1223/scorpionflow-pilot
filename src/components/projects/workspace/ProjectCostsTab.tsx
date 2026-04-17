import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface Props {
  project: any;
}

export default function ProjectCostsTab({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState(Number(project.budget));
  const [actualCost, setActualCost] = useState(Number(project.actual_cost));

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("projects")
        .update({ budget, actual_cost: actualCost })
        .eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Datos financieros actualizados");
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });

  const profit = budget - actualCost;
  const margin = budget > 0 ? (profit / budget) * 100 : 0;
  const usedPct = budget > 0 ? Math.min(100, (actualCost / budget) * 100) : 0;
  const losing = profit < 0;

  // Recompute live from project (read-only context)
  const liveProfit = Number(project.budget) - Number(project.actual_cost);
  const liveMargin = Number(project.budget) > 0 ? (liveProfit / Number(project.budget)) * 100 : 0;
  const liveLosing = liveProfit < 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Finanzas del proyecto</h2>
          <p className="text-[12px] text-muted-foreground">
            ¿Estoy ganando o perdiendo en este proyecto?
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setBudget(Number(project.budget)); setActualCost(Number(project.actual_cost)); } }}>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Pencil className="w-3.5 h-3.5" /> Actualizar costos
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar datos financieros</DialogTitle>
              <p className="text-[12px] text-muted-foreground">
                Actualiza lo que cobraste y lo que llevas gastado para ver tu rentabilidad real.
              </p>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Presupuesto (lo que cobré)</Label>
                <Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Costo real (lo que llevo gastado)</Label>
                <Input type="number" min={0} value={actualCost} onChange={(e) => setActualCost(Number(e.target.value))} />
              </div>
              <div className={cn("surface-card p-3", losing ? "border-cost-negative/40 bg-cost-negative/5" : "border-cost-positive/40 bg-cost-positive/5")}>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ganancia estimada</div>
                <div className={cn("text-xl font-bold font-mono-data", losing ? "text-cost-negative" : "text-cost-positive")}>
                  {profit >= 0 ? "+" : ""}{PEN.format(profit)} ({margin.toFixed(1)}%)
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

      {/* Big number */}
      <div className={cn("surface-card p-6 border-l-4", liveLosing ? "border-cost-negative" : "border-cost-positive")}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Ganancia estimada</div>
            <div className={cn("text-4xl font-bold font-mono-data mt-1", liveLosing ? "text-cost-negative" : "text-cost-positive")}>
              {liveProfit >= 0 ? "+" : ""}{PEN.format(liveProfit)}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1">
              Margen: <span className={cn("font-mono-data font-semibold", liveMargin >= 20 ? "text-cost-positive" : liveMargin >= 0 ? "text-cost-warning" : "text-cost-negative")}>
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

      {/* Budget breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="surface-card p-4 border-l-4 border-status-progress">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Presupuesto cobrado</div>
          <div className="text-xl font-bold font-mono-data">{PEN.format(Number(project.budget))}</div>
        </div>
        <div className="surface-card p-4 border-l-4 border-cost-warning">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Gastado</div>
          <div className={cn("text-xl font-bold font-mono-data", liveLosing && "text-cost-negative")}>
            {PEN.format(Number(project.actual_cost))}
          </div>
        </div>
        <div className="surface-card p-4 border-l-4 border-primary">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">% del presupuesto usado</div>
          <div className="text-xl font-bold font-mono-data">{usedPct.toFixed(0)}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="text-muted-foreground">
            Gastado <span className="font-mono-data text-foreground">{PEN.format(Number(project.actual_cost))}</span> de{" "}
            <span className="font-mono-data text-foreground">{PEN.format(Number(project.budget))}</span>
          </span>
          <span className={cn("font-mono-data font-semibold", liveLosing ? "text-cost-negative" : "text-muted-foreground")}>
            {usedPct.toFixed(0)}%
          </span>
        </div>
        <Progress value={usedPct} className={cn("h-3", liveLosing && "[&>div]:bg-cost-negative")} />
      </div>

      {liveLosing && (
        <div className="surface-card border border-cost-negative/40 bg-cost-negative/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cost-negative shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Has gastado más de lo cobrado</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Estás {PEN.format(Math.abs(liveProfit))} por debajo. Ajusta partidas o renegocia el alcance.
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
