import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Users, Cpu, Cog, Trash2, Pencil, AlertTriangle,
  TrendingUp, Sparkles, Loader2, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

type Kind = "human" | "tech" | "asset";
type Unit = "hour" | "month" | "use" | "fixed";

interface ProjectResource {
  id: string;
  project_id: string;
  owner_id: string;
  kind: Kind;
  name: string;
  role_or_type: string | null;
  unit: Unit;
  unit_cost: number;
  quantity: number;
  total_cost: number;
  status: string;
  notes: string | null;
}

interface Props {
  project: any;
}

const KIND_META: Record<Kind, { label: string; icon: typeof Users; color: string; bg: string; placeholderName: string; placeholderRole: string }> = {
  human: { label: "Personal", icon: Users, color: "text-primary", bg: "bg-primary/15", placeholderName: "Ana García", placeholderRole: "Diseñadora UX" },
  tech: { label: "Tecnología", icon: Cpu, color: "text-status-progress", bg: "bg-status-progress/15", placeholderName: "Figma Pro", placeholderRole: "Software / SaaS" },
  asset: { label: "Activo", icon: Cog, color: "text-cost-warning", bg: "bg-cost-warning/15", placeholderName: "Laptop MacBook Pro", placeholderRole: "Equipo" },
};

const UNIT_META: Record<Unit, { label: string; suffix: string }> = {
  hour: { label: "Por hora", suffix: "h" },
  month: { label: "Por mes", suffix: "mes" },
  use: { label: "Por uso", suffix: "uso" },
  fixed: { label: "Costo fijo", suffix: "" },
};

export default function ProjectResourcesTab({ project }: Props) {
  const qc = useQueryClient();
  const [dialogKind, setDialogKind] = useState<Kind | null>(null);
  const [editing, setEditing] = useState<ProjectResource | null>(null);
  const [form, setForm] = useState({ name: "", role_or_type: "", unit: "fixed" as Unit, unit_cost: 0, quantity: 1, notes: "" });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["project-resources", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_resources" as any)
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProjectResource[];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks-for-resources", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, status, assignee_name, node_type")
        .eq("project_id", project.id);
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<ProjectResource> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      if (payload.id) {
        const { error } = await supabase.from("project_resources" as any).update({
          name: payload.name,
          role_or_type: payload.role_or_type,
          unit: payload.unit,
          unit_cost: payload.unit_cost,
          quantity: payload.quantity,
          notes: payload.notes,
        } as any).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_resources" as any).insert({
          project_id: project.id,
          owner_id: user.id,
          kind: payload.kind,
          name: payload.name,
          role_or_type: payload.role_or_type,
          unit: payload.unit,
          unit_cost: payload.unit_cost,
          quantity: payload.quantity,
          notes: payload.notes,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-resources", project.id] });
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["project-financials", project.id] });
      toast.success(editing ? "Recurso actualizado" : "Recurso asignado");
      closeDialog();
    },
    onError: (e: any) => toast.error("Error", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_resources" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-resources", project.id] });
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["project-financials", project.id] });
      toast.success("Recurso eliminado");
    },
  });

  function openCreate(kind: Kind) {
    setEditing(null);
    setForm({ name: "", role_or_type: "", unit: kind === "human" ? "hour" : "fixed", unit_cost: 0, quantity: 1, notes: "" });
    setDialogKind(kind);
  }

  function openEdit(r: ProjectResource) {
    setEditing(r);
    setForm({
      name: r.name,
      role_or_type: r.role_or_type || "",
      unit: r.unit,
      unit_cost: Number(r.unit_cost),
      quantity: Number(r.quantity),
      notes: r.notes || "",
    });
    setDialogKind(r.kind);
  }

  function closeDialog() {
    setDialogKind(null);
    setEditing(null);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nombre requerido");
      return;
    }
    if (form.unit_cost < 0 || form.quantity <= 0) {
      toast.error("Cantidad y costo deben ser válidos");
      return;
    }
    upsertMutation.mutate({
      id: editing?.id,
      kind: dialogKind!,
      name: form.name.trim(),
      role_or_type: form.role_or_type.trim() || null,
      unit: form.unit,
      unit_cost: form.unit_cost,
      quantity: form.quantity,
      notes: form.notes.trim() || null,
    });
  }

  // Métricas globales
  const totals = useMemo(() => {
    const sum = (k: Kind) => resources.filter(r => r.kind === k).reduce((s, r) => s + Number(r.total_cost), 0);
    const human = sum("human");
    const tech = sum("tech");
    const asset = sum("asset");
    const total = human + tech + asset;
    return { human, tech, asset, total };
  }, [resources]);

  // Carga real por persona
  const personLoad = useMemo(() => {
    const counts: Record<string, { active: number; total: number }> = {};
    tasks.forEach((t: any) => {
      const name = (t.assignee_name || "").trim();
      if (!name) return;
      if (!counts[name]) counts[name] = { active: 0, total: 0 };
      counts[name].total += 1;
      if (t.status !== "done") counts[name].active += 1;
    });
    return counts;
  }, [tasks]);

  // Insights automáticos
  const insights = useMemo(() => {
    const out: { type: "warn" | "info" | "good"; text: string }[] = [];
    const budget = Number(project.budget) || 0;
    if (budget > 0 && totals.total > budget) {
      out.push({ type: "warn", text: `Costos asignados (${PEN.format(totals.total)}) superan el presupuesto (${PEN.format(budget)}).` });
    } else if (budget > 0 && totals.total > budget * 0.85) {
      out.push({ type: "warn", text: `Costos asignados consumen ${Math.round((totals.total / budget) * 100)}% del presupuesto.` });
    }
    Object.entries(personLoad).forEach(([name, c]) => {
      const util = Math.min(120, Math.round((c.active / 4) * 100));
      if (util > 100) out.push({ type: "warn", text: `${name} está sobrecargado (${util}%). Redistribuye tareas.` });
      else if (util > 80) out.push({ type: "info", text: `${name} cerca del límite (${util}%).` });
    });
    if (resources.length === 0) {
      out.push({ type: "info", text: "Aún no hay recursos asignados. Empieza por agregar al equipo." });
    } else if (out.length === 0) {
      out.push({ type: "good", text: "Distribución saludable. Costos y carga bajo control." });
    }
    return out;
  }, [totals, project.budget, personLoad, resources.length]);

  return (
    <div className="space-y-4">
      {/* RESUMEN ARRIBA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["human", "tech", "asset"] as Kind[]).map((k) => {
          const meta = KIND_META[k];
          const Icon = meta.icon;
          const cost = totals[k];
          const count = resources.filter(r => r.kind === k).length;
          return (
            <button
              key={k}
              onClick={() => openCreate(k)}
              className="surface-card surface-card-hover p-4 text-left transition-sf hover:border-primary/40"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", meta.bg)}>
                  <Icon className={cn("w-4 h-4", meta.color)} />
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="text-[12px] font-medium text-muted-foreground">{meta.label}</h3>
              <div className="font-mono-data text-lg font-semibold text-foreground mt-0.5">{PEN.format(cost)}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{count} {count === 1 ? "asignado" : "asignados"}</p>
            </button>
          );
        })}
        <div className="surface-card p-4 bg-primary/5 border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
          <h3 className="text-[12px] font-medium text-muted-foreground">Costo total recursos</h3>
          <div className="font-mono-data text-lg font-bold text-primary mt-0.5">{PEN.format(totals.total)}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Suma automática al proyecto</p>
        </div>
      </div>

      {/* MEDIO: listas por categoría */}
      {isLoading ? (
        <div className="surface-card p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {(["human", "tech", "asset"] as Kind[]).map((k) => {
            const meta = KIND_META[k];
            const Icon = meta.icon;
            const items = resources.filter(r => r.kind === k);
            return (
              <div key={k} className="surface-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", meta.color)} />
                    <h3 className="text-[14px] font-semibold text-foreground">{meta.label}</h3>
                    <span className="text-[11px] text-muted-foreground">({items.length})</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openCreate(k)} className="gap-1.5 text-[12px] h-7">
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-4">
                    Sin {meta.label.toLowerCase()} asignados.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {items.map((r) => {
                      const load = k === "human" ? personLoad[r.name] : null;
                      const util = load ? Math.min(120, Math.round((load.active / 4) * 100)) : 0;
                      const isOverloaded = util > 100;
                      const isWarn = util > 80 && util <= 100;
                      return (
                        <div key={r.id} className="py-2.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-medium text-foreground truncate">{r.name}</span>
                              {r.role_or_type && (
                                <span className="text-[11px] text-muted-foreground">· {r.role_or_type}</span>
                              )}
                              {load && (
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                  <ListChecks className="w-3 h-3" /> {load.total} {load.total === 1 ? "tarea" : "tareas"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span className="font-mono-data">
                                {PEN.format(Number(r.unit_cost))}{UNIT_META[r.unit].suffix && `/${UNIT_META[r.unit].suffix}`} × {Number(r.quantity)}
                              </span>
                              {load && (
                                <span className={cn(
                                  "font-mono-data font-medium",
                                  isOverloaded ? "text-cost-negative" : isWarn ? "text-cost-warning" : "text-cost-positive"
                                )}>
                                  {util}% carga
                                  {isOverloaded && " · Crítico"}
                                  {isWarn && " · Alerta"}
                                </span>
                              )}
                            </div>
                            {load && (
                              <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-sf",
                                    isOverloaded ? "bg-cost-negative" : isWarn ? "bg-cost-warning" : "bg-primary"
                                  )}
                                  style={{ width: `${Math.min(util, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono-data text-[13px] font-semibold text-foreground">
                              {PEN.format(Number(r.total_cost))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{UNIT_META[r.unit].label}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-cost-negative hover:text-cost-negative" onClick={() => {
                              if (confirm(`¿Eliminar "${r.name}"?`)) deleteMutation.mutate(r.id);
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* INSIGHTS ABAJO */}
      <div className="surface-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">Insights automáticos</h3>
        </div>
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const Icon = ins.type === "warn" ? AlertTriangle : ins.type === "good" ? TrendingUp : Sparkles;
            const color = ins.type === "warn" ? "text-cost-negative" : ins.type === "good" ? "text-cost-positive" : "text-muted-foreground";
            return (
              <div key={i} className="flex items-start gap-2 text-[12px]">
                <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", color)} />
                <span className="text-foreground">{ins.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={!!dialogKind} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar" : "Agregar"} {dialogKind && KIND_META[dialogKind].label.toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          {dialogKind && (
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={KIND_META[dialogKind].placeholderName}
                  className="h-9 text-[13px]"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">{dialogKind === "human" ? "Rol" : "Tipo"}</Label>
                <Input
                  value={form.role_or_type}
                  onChange={(e) => setForm(f => ({ ...f, role_or_type: e.target.value }))}
                  placeholder={KIND_META[dialogKind].placeholderRole}
                  className="h-9 text-[13px]"
                  maxLength={80}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Unidad</Label>
                  <Select value={form.unit} onValueChange={(v: Unit) => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(UNIT_META) as Unit[]).map(u => (
                        <SelectItem key={u} value={u}>{UNIT_META[u].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">
                    {form.unit === "hour" ? "Horas" : form.unit === "month" ? "Meses" : form.unit === "use" ? "Usos" : "Cantidad"}
                  </Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.5}
                    value={form.quantity}
                    onChange={(e) => setForm(f => ({ ...f, quantity: Number(e.target.value) || 0 }))}
                    className="h-9 text-[13px] font-mono-data"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">
                  Costo {form.unit === "fixed" ? "fijo" : `por ${UNIT_META[form.unit].suffix || "unidad"}`}
                </Label>
                <CurrencyInput
                  value={form.unit_cost}
                  onValueChange={(v) => setForm(f => ({ ...f, unit_cost: v }))}
                  className="h-9"
                />
              </div>
              <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">Costo total</span>
                  <span className="font-mono-data text-[15px] font-bold text-primary">
                    {PEN.format(form.unit_cost * form.quantity)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Se sumará automáticamente al costo del proyecto.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={upsertMutation.isPending}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {editing ? "Guardar" : "Asignar recurso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
