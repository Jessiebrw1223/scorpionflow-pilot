import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FolderKanban, Search, Loader2, Receipt, ArrowRight, Calendar, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_META } from "@/lib/business-intelligence";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

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

const STATUS_FILTERS: { key: ProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "on_track", label: "🟢 En tiempo" },
  { key: "at_risk", label: "🟡 En riesgo" },
  { key: "over_budget", label: "🔴 Sobre presupuesto" },
  { key: "completed", label: "✓ Completados" },
];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(id, name, company), quotations(id, title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Project[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.clients?.name || "").toLowerCase().includes(q)
      );
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(() => {
    const onTrack = projects.filter((p) => p.status === "on_track").length;
    const atRisk = projects.filter((p) => p.status === "at_risk").length;
    const overBudget = projects.filter((p) => p.status === "over_budget").length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);
    const totalCost = projects.reduce((s, p) => s + Number(p.actual_cost), 0);
    const profit = totalBudget - totalCost;
    return { onTrack, atRisk, overBudget, totalBudget, totalCost, profit };
  }, [projects]);

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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card p-3 border-l-4 border-cost-positive">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">🟢 En tiempo</div>
          <div className="text-xl font-bold font-mono-data text-cost-positive">{stats.onTrack}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-warning">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">🟡 En riesgo</div>
          <div className="text-xl font-bold font-mono-data text-cost-warning">{stats.atRisk}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-cost-negative">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">🔴 Sobre presupuesto</div>
          <div className="text-xl font-bold font-mono-data text-cost-negative">{stats.overBudget}</div>
        </div>
        <div className="surface-card p-3 border-l-4 border-primary">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ganancia estimada</div>
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
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-3 py-1.5 text-[12px] rounded-md transition-sf font-medium",
                statusFilter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Cargando proyectos…
        </div>
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
        <div className="surface-card p-6 text-center text-muted-foreground text-[13px]">
          Sin resultados con esos filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const meta = PROJECT_STATUS_META[p.status] || PROJECT_STATUS_META.on_track;
            const margin = Number(p.budget) - Number(p.actual_cost);
            const marginPct = Number(p.budget) > 0 ? ((margin / Number(p.budget)) * 100).toFixed(0) : "0";
            const overBudget = Number(p.actual_cost) > Number(p.budget);
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className={cn(
                  "block surface-card surface-card-hover p-4 border-l-4 group cursor-pointer",
                  meta.border
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-sf">{p.name}</h3>
                      <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded", meta.bg, meta.color)}>
                        {meta.label}
                      </span>
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

                <Progress value={p.progress} className="h-2 mb-3" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Avance</div>
                    <div className="font-mono-data font-semibold">{p.progress}%</div>
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
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Ganancia</div>
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
