import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

interface ProjectFinancial {
  id: string;
  name: string;
  budget: number;
  actual_cost: number;
  status: string;
  progress: number;
  clients?: { name: string };
}

export default function CostsPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, budget, actual_cost, status, progress, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProjectFinancial[];
    },
  });

  const totals = useMemo(() => {
    const income = projects.reduce((s, p) => s + Number(p.budget), 0);
    const cost = projects.reduce((s, p) => s + Number(p.actual_cost), 0);
    const profit = income - cost;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    const losing = projects.filter((p) => Number(p.actual_cost) > Number(p.budget));
    const winning = projects.filter(
      (p) => Number(p.budget) > 0 && Number(p.actual_cost) <= Number(p.budget)
    );
    return { income, cost, profit, margin, losing, winning };
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2 fire-text">
          <DollarSign className="w-5 h-5 text-primary fire-icon" />
          Costos
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          ¿Estoy ganando o perdiendo? · Análisis por proyecto en tiempo real
        </p>
      </div>

      {/* Big number: ganancia estimada */}
      <div className={cn(
        "surface-card p-6 border-l-4",
        totals.profit >= 0 ? "border-cost-positive" : "border-cost-negative"
      )}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Ganancia estimada total
            </div>
            <div className={cn(
              "text-4xl font-bold font-mono-data mt-1",
              totals.profit >= 0 ? "text-cost-positive" : "text-cost-negative"
            )}>
              {totals.profit >= 0 ? "+" : ""}{PEN.format(totals.profit)}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1">
              Margen: <span className={cn(
                "font-mono-data font-semibold",
                totals.margin >= 20 ? "text-cost-positive" :
                totals.margin >= 0 ? "text-cost-warning" : "text-cost-negative"
              )}>{totals.margin.toFixed(1)}%</span>
              {" · "}
              {totals.profit >= 0
                ? "Tu negocio es rentable. Sigue así."
                : "Estás perdiendo dinero. Revisa proyectos en sobrecosto."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totals.profit >= 0 ? (
              <TrendingUp className="w-12 h-12 text-cost-positive fire-icon" />
            ) : (
              <TrendingDown className="w-12 h-12 text-cost-negative" />
            )}
          </div>
        </div>
      </div>

      {/* Income / Cost / Winning / Losing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card p-3 border-l-4 border-status-progress">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ingresos cotizados</div>
          <div className="text-xl font-bold font-mono-data text-foreground">{PEN.format(totals.income)}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-warning">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Costos reales</div>
          <div className="text-xl font-bold font-mono-data text-foreground">{PEN.format(totals.cost)}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-positive">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">✅ Rentables</div>
          <div className="text-xl font-bold font-mono-data text-cost-positive">{totals.winning.length}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-negative">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">⚠️ En pérdida</div>
          <div className="text-xl font-bold font-mono-data text-cost-negative">{totals.losing.length}</div>
        </div>
      </div>

      {/* Alerta de proyectos en pérdida */}
      {totals.losing.length > 0 && (
        <div className="surface-card border border-cost-negative/40 bg-cost-negative/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cost-negative shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">
                ⚠️ {totals.losing.length} proyecto(s) están perdiendo dinero
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Has gastado más de lo que cobraste. Revisa qué está pasando para no afectar tu margen total.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/projects">Revisar proyectos</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Tabla por proyecto */}
      <div>
        <h2 className="section-header mb-3">Ganancia por proyecto</h2>
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Cargando datos financieros…
          </div>
        ) : projects.length === 0 ? (
          <div className="surface-card p-8 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-primary fire-icon mx-auto" />
            <p className="text-[13px] text-muted-foreground">
              Aún no tienes proyectos para analizar. Convierte tus cotizaciones ganadas en proyectos para ver tu rentabilidad real.
            </p>
            <Button asChild className="fire-button">
              <Link to="/cotizaciones">Ir a Cotizaciones</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => {
              const profit = Number(p.budget) - Number(p.actual_cost);
              const marginPct = Number(p.budget) > 0 ? (profit / Number(p.budget)) * 100 : 0;
              const losing = profit < 0;
              const usedPct = Number(p.budget) > 0
                ? Math.min(100, (Number(p.actual_cost) / Number(p.budget)) * 100)
                : 0;
              return (
                <div key={p.id} className={cn(
                  "surface-card p-4 border-l-4",
                  losing ? "border-cost-negative" : marginPct >= 20 ? "border-cost-positive" : "border-cost-warning"
                )}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-[12px] text-muted-foreground">{p.clients?.name || "Sin cliente"}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-lg font-bold font-mono-data",
                        losing ? "text-cost-negative" : "text-cost-positive"
                      )}>
                        {profit >= 0 ? "+" : ""}{PEN.format(profit)}
                      </div>
                      <div className={cn(
                        "text-[11px] font-mono-data font-semibold",
                        losing ? "text-cost-negative" : marginPct >= 20 ? "text-cost-positive" : "text-cost-warning"
                      )}>
                        Margen {marginPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Visualización: presupuesto vs gastado */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Gastado: <span className="font-mono-data text-foreground">{PEN.format(Number(p.actual_cost))}</span> de{" "}
                        <span className="font-mono-data text-foreground">{PEN.format(Number(p.budget))}</span>
                      </span>
                      <span className={cn(
                        "font-mono-data",
                        losing ? "text-cost-negative font-semibold" : "text-muted-foreground"
                      )}>
                        {usedPct.toFixed(0)}% usado
                      </span>
                    </div>
                    <Progress
                      value={usedPct}
                      className={cn("h-2", losing && "[&>div]:bg-cost-negative")}
                    />
                  </div>

                  {losing && (
                    <div className="mt-3 text-[12px] text-cost-negative inline-flex items-center gap-1.5 bg-cost-negative/10 px-2 py-1 rounded">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Has gastado más de lo cobrado. Revisa este proyecto.
                    </div>
                  )}
                  {!losing && marginPct >= 30 && (
                    <div className="mt-3 text-[12px] text-cost-positive inline-flex items-center gap-1.5 bg-cost-positive/10 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Excelente margen. Este es un buen modelo a replicar.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
