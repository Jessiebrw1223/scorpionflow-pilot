import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import {
  FolderKanban,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  ArrowRight,
  ExternalLink,
  Calendar,
  Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  currency: string;
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

const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  client_id: z.string().uuid("Selecciona un cliente"),
  status: z.enum(["on_track", "at_risk", "over_budget", "completed", "cancelled"]),
  progress: z.number().min(0).max(100),
  budget: z.number().min(0),
  actual_cost: z.number().min(0),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  name: "",
  description: "",
  client_id: "",
  status: "on_track",
  progress: 0,
  budget: 0,
  actual_cost: 0,
  start_date: "",
  end_date: "",
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

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

  const { data: clientsList = [] } = useQuery({
    queryKey: ["clients-min-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company")
        .order("name");
      if (error) throw error;
      return data;
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

  // KPIs
  const stats = useMemo(() => {
    const onTrack = projects.filter((p) => p.status === "on_track").length;
    const atRisk = projects.filter((p) => p.status === "at_risk").length;
    const overBudget = projects.filter((p) => p.status === "over_budget").length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);
    const totalCost = projects.reduce((s, p) => s + Number(p.actual_cost), 0);
    const profit = totalBudget - totalCost;
    return { onTrack, atRisk, overBudget, totalBudget, totalCost, profit };
  }, [projects]);

  const upsert = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const payload = {
        owner_id: userData.user.id,
        name: values.name,
        description: values.description || null,
        client_id: values.client_id,
        status: values.status,
        progress: values.progress,
        budget: values.budget,
        actual_cost: values.actual_cost,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
      };

      if (editing) {
        const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects-dash"] });
      toast.success(editing ? "Proyecto actualizado" : "Proyecto creado");
      setOpenForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects-dash"] });
      toast.success("Proyecto eliminado");
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      client_id: p.client_id,
      status: p.status,
      progress: p.progress,
      budget: Number(p.budget),
      actual_cost: Number(p.actual_cost),
      start_date: p.start_date || "",
      end_date: p.end_date || "",
    });
    setOpenForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      progress: Number(form.progress),
      budget: Number(form.budget),
      actual_cost: Number(form.actual_cost),
    });
    if (!parsed.success) {
      const fld = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fld).map(([k, v]) => [k, v?.[0]])) as any);
      return;
    }
    setErrors({});
    upsert.mutate(parsed.data);
  };

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
            ¿Cómo va lo que vendí? · {projects.length} proyectos activos
          </p>
        </div>

        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="fire-button font-semibold" disabled={clientsList.length === 0}>
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="fire-text">
                {editing ? "Editar proyecto" : "Nuevo proyecto"}
              </DialogTitle>
              <p className="text-[12px] text-muted-foreground mt-1">
                Define qué estás ejecutando, para quién y cuánto te debería dejar.
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Nombre del proyecto *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Implementación CRM Hotel Sol"
                  />
                  {errors.name && <p className="text-[12px] text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Cliente *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.company ? ` · ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && <p className="text-[12px] text-destructive">{errors.client_id}</p>}
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Alcance del proyecto"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v: ProjectStatus) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_track">🟢 En tiempo</SelectItem>
                      <SelectItem value="at_risk">🟡 En riesgo</SelectItem>
                      <SelectItem value="over_budget">🔴 Sobre presupuesto</SelectItem>
                      <SelectItem value="completed">✓ Completado</SelectItem>
                      <SelectItem value="cancelled">⊘ Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Progreso (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Presupuesto (lo que cobré)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Costo real (lo que llevo gastado)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.actual_cost}
                    onChange={(e) => setForm({ ...form, actual_cost: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Entrega</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={upsert.isPending} className="fire-button">
                  {upsert.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Guardar cambios" : "Crear proyecto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
          <div className={cn(
            "text-xl font-bold font-mono-data",
            stats.profit >= 0 ? "text-cost-positive" : "text-cost-negative"
          )}>
            {PEN.format(stats.profit)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyecto, cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-3 py-1.5 text-[12px] rounded-md transition-sf font-medium",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
              Tu flujo natural: <span className="text-primary">Cliente → Cotización → Proyecto</span>.
              Convierte una cotización ganada para crear tu primer proyecto.
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
            const marginPct = Number(p.budget) > 0
              ? ((margin / Number(p.budget)) * 100).toFixed(0)
              : "0";
            const overBudget = Number(p.actual_cost) > Number(p.budget);
            return (
              <div key={p.id} className={cn("surface-card surface-card-hover p-4 border-l-4", meta.border)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded",
                        meta.bg, meta.color
                      )}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {p.clients?.name}
                      {p.clients?.company ? ` · ${p.clients.company}` : ""}
                      {p.quotations && (
                        <> · <Link to="/cotizaciones" className="text-primary hover:underline inline-flex items-center gap-0.5">
                          <Receipt className="w-3 h-3" /> {p.quotations.title}
                        </Link></>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="h-8 w-8">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(p)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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
                    <div className={cn(
                      "font-mono-data font-semibold",
                      margin >= 0 ? "text-cost-positive" : "text-cost-negative"
                    )}>
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
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará "{deleting?.name}" y todas sus tareas asociadas. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
