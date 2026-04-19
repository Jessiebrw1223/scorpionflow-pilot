import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FolderKanban, Search, Receipt, ArrowRight, Calendar, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getExecutionStatus,
  getFinancialHealth,
  getProjectHealth,
  type ProjectHealth,
} from "@/lib/business-intelligence";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useMoney } from "@/lib/format-money";
import { PageLoadingState, PageEmptyState, PageErrorState } from "@/components/state/PageStates";

type ProjectStatus = "on_track" | "at_risk" | "over_budget" | "completed" | "cancelled";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  budget: number;
  actual_cost: number;
  start_date: string | null;
  end_date: string | null;
  client_id: string;
  quotation_id: string | null;
  created_at: string;
  clients?: { id: string; name: string; company: string | null };
  quotations?: { id: string; title: string };
}

const HEALTH_FILTERS: { key: ProjectHealth | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "healthy", label: "🟢 Saludable" },
  { key: "risk", label: "🟡 En riesgo" },
  { key: "over_budget", label: "🔴 Sobrepresupuesto" },
  { key: "critical", label: "⚫ Crítico" },
  { key: "completed", label: "✓ Completados" },
];


export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<ProjectHealth | "all">("all");
  const PEN = useMoney();
  const { settings } = useUserSettings();

  const { data: projects = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(id, name, company), quotations(id, title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
  });

  // Pre-calcular salud para cada proyecto (runtime, no DB)
  const projectsWithHealth = useMemo(() => {
    return projects.map((p) => {
      const execution = getExecutionStatus({
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
        progress: Number(p.progress) || 0,
        inferSchedule: settings.auto_behavior.inferSchedule,
      });
      const financial = getFinancialHealth({
        budget: Number(p.budget),
        actualCost: Number(p.actual_cost),
        targetMargin: settings.target_margin,
      });
      const health = getProjectHealth({ execution, financial });
      return { project: p, execution, financial, health };
    });
  }, [projects, settings.auto_behavior.inferSchedule, settings.target_margin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectsWithHealth.filter(({ project: p, health }) => {
      if (healthFilter !== "all" && health.key !== healthFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.clients?.name || "").toLowerCase().includes(q)
      );
    });
  }, [projectsWithHealth, search, healthFilter]);

  const stats = useMemo(() => {
    const healthy = projectsWithHealth.filter((x) => x.health.key === "healthy").length;
    const risk = projectsWithHealth.filter((x) => x.health.key === "risk").length;
    const overBudget = projectsWithHealth.filter(
      (x) => x.health.key === "over_budget" || x.health.key === "critical"
    ).length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);
    const totalCost = projects.reduce((s, p) => s + Number(p.actual_cost), 0);
    const profit = totalBudget - totalCost;
    return { healthy, risk, overBudget, totalBudget, totalCost, profit };
  }, [projectsWithHealth, projects]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 fire-text">
            <FolderKanban className="w-5 h-5 text-primary fire-icon" />
            Proyectos
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            ¿Cómo va lo que vendí? · {projects.length} proyectos · cada uno es un workspace aislado
          </p>
        </div>
      </div>

      {/* Aviso de flujo */}
      <div className="surface-card p-3 bg-primary/5 border border-primary/20 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted-foreground flex-1">
          Los proyectos se crean automáticamente al ganar una cotización. Tu flujo natural es{" "}
          <span className="text-primary font-medium">Cliente → Cotización → Proyecto</span>.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/cotizaciones"><Receipt className="w-3.5 h-3.5" /> Ir a Cotizaciones</Link>
        </Button>
      </div>

      {/* KPIs reales (basados en salud calculada) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card p-3 border-l-4 border-cost-positive">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">🟢 Saludables</div>
          <div className="text-xl font-bold font-mono-data text-cost-positive">{stats.healthy}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-warning">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">🟡 En riesgo</div>
          <div className="text-xl font-bold font-mono-data text-cost-warning">{stats.risk}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-negative">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">🔴 Sobrepresupuesto</div>
          <div className="text-xl font-bold font-mono-data text-cost-negative">{stats.overBudget}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-primary">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rentabilidad actual</div>
          <div className={cn("text-xl font-bold font-mono-data", stats.profit >= 0 ? "text-cost-positive" : "text-cost-negative")}>
            {PEN.format(stats.profit)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar proyecto, cliente…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg flex-wrap">
          {HEALTH_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setHealthFilter(f.key)}
              className={cn(
                "px-3 py-1.5 text-[12px] rounded-md transition-sf font-medium",
                healthFilter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <PageLoadingState title="Cargando proyectos…" />
      ) : isError ? (
        <PageErrorState error={error} onRetry={() => refetch()} />
      ) : projects.length === 0 ? (
        <div className="surface-card fire-border p-8 text-center space-y-3">
          <FolderKanban className="w-10 h-10 text-primary fire-icon mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Aún no tienes proyectos</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Tu primer proyecto nacerá cuando ganes una cotización. Ve a Cotizaciones, marca una como{" "}
              <span className="text-primary">Ganada</span> y conviértela en proyecto con un clic.
            </p>
          </div>
          <Button asChild className="fire-button">
            <Link to="/cotizaciones"><Receipt className="w-4 h-4" /> Ir a Cotizaciones</Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <PageEmptyState
          icon={<Search className="w-6 h-6 text-muted-foreground" />}
          title="Sin resultados"
          description="Ningún proyecto coincide con esos filtros. Prueba ajustando la búsqueda."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ project: p, health, execution }) => {
            const margin = Number(p.budget) - Number(p.actual_cost);
            const marginPct = Number(p.budget) > 0 ? ((margin / Number(p.budget)) * 100).toFixed(0) : "0";
            const overBudget = Number(p.actual_cost) > Number(p.budget);
            const progressClamped = Math.max(0, Math.min(100, Number(p.progress) || 0));
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className={cn(
                  "block surface-card surface-card-hover p-4 border-l-4 group cursor-pointer",
                  health.border
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-sf">{p.name}</h3>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1",
                          health.bg,
                          health.color
                        )}
                        title={health.description}
                      >
                        {health.emoji} {health.label}
                      </span>
                      {execution.key !== "not_evaluable" && execution.key !== "completed" && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded bg-muted/30 text-muted-foreground inline-flex items-center gap-1"
                          title={execution.description}
                        >
                          📅 {execution.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {p.clients?.name}
                      {p.clients?.company ? ` · ${p.clients.company}` : ""}
                      {p.quotations && (
                        <> · <span className="text-primary inline-flex items-center gap-0.5">
                          <Receipt className="w-3 h-3" /> {p.quotations.title}
                        </span></>
                      )}
                    </div>
                    {p.description && <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-sf shrink-0 mt-1" />
                </div>

                {/* Barra inteligente: color según salud, NO siempre rojo */}
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
                  <div
                    className={cn("h-full rounded-full transition-sf", health.barColor)}
                    style={{ width: `${progressClamped}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Avance</div>
                    <div className="font-mono-data font-semibold">{progressClamped}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Presupuesto</div>
                    <div className="font-mono-data font-semibold">{PEN.format(Number(p.budget))}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Gastado</div>
                    <div className={cn("font-mono-data font-semibold", overBudget && "text-cost-negative")}>
                      {PEN.format(Number(p.actual_cost))}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      {margin >= 0 ? "Rentabilidad" : "Pérdida"}
                    </div>
                    <div className={cn("font-mono-data font-semibold", margin >= 0 ? "text-cost-positive" : "text-cost-negative")}>
                      {margin >= 0 ? "+" : ""}{PEN.format(margin)} ({marginPct}%)
                    </div>
                  </div>
                </div>

                {(p.start_date || p.end_date) && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {p.start_date && <span>Inicio: <span className="font-mono-data">{new Date(p.start_date).toLocaleDateString("es-PE")}</span></span>}
                    {p.end_date && <span>Entrega: <span className="font-mono-data">{new Date(p.end_date).toLocaleDateString("es-PE")}</span></span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
