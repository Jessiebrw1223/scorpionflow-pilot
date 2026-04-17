import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { ListChecks, Plus, Loader2, AlertTriangle, User, Calendar, LayoutGrid, List as ListIcon, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_META, TASK_STATUS_META, TASK_IMPACT_META } from "@/lib/business-intelligence";
import TaskDetailPanel from "./TaskDetailPanel";

type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked";
type TaskPriority = "low" | "medium" | "high" | "critical";
type TaskImpact = "time" | "cost" | "delivery";

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  impact: TaskImpact;
  assignee_name: string | null;
  due_date: string | null;
  blocks_project: boolean;
  blocked_since: string | null;
  position: number;
  created_at: string;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "Por hacer", color: "bg-status-todo" },
  { status: "in_progress", label: "En progreso", color: "bg-status-progress" },
  { status: "in_review", label: "En revisión", color: "bg-status-review" },
  { status: "done", label: "Completada", color: "bg-status-done" },
  { status: "blocked", label: "Bloqueada", color: "bg-status-blocked" },
];

const schema = z.object({
  title: z.string().trim().min(2, "Mínimo 2 caracteres").max(160),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["time", "cost", "delivery"]),
  assignee_name: z.string().max(80).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  blocks_project: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  impact: "delivery",
  assignee_name: "",
  due_date: "",
  blocks_project: false,
};

interface Props {
  projectId: string;
  defaultView?: "kanban" | "list";
}

export default function ProjectTasksTab({ projectId, defaultView = "kanban" }: Props) {
  const qc = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">(defaultView);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [panelTask, setPanelTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");
      const payload = {
        owner_id: userData.user.id,
        project_id: projectId,
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        impact: values.impact,
        assignee_name: values.assignee_name || null,
        due_date: values.due_date || null,
        blocks_project: values.blocks_project,
      };
      if (editing) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      qc.invalidateQueries({ queryKey: ["project-tasks-summary", projectId] });
      qc.invalidateQueries({ queryKey: ["project-tasks-report", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks-dash"] });
      toast.success(editing ? "Tarea actualizada" : "Tarea creada");
      setOpenForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-tasks", projectId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast.success("Tarea eliminada");
    },
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpenForm(true); };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      impact: t.impact || "delivery",
      assignee_name: t.assignee_name || "",
      due_date: t.due_date || "",
      blocks_project: t.blocks_project,
    });
    setOpenForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fld = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fld).map(([k, v]) => [k, v?.[0]])) as any);
      return;
    }
    setErrors({});
    upsert.mutate(parsed.data);
  };

  const grouped = useMemo(() => {
    const m: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], in_review: [], done: [], blocked: [] };
    tasks.forEach((t) => m[t.status].push(t));
    return m;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">Tareas del proyecto</h2>
          <p className="text-[12px] text-muted-foreground">
            {tasks.length} tareas · {tasks.filter(t => t.blocks_project).length} bloqueando entrega
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center surface-card p-0.5 gap-0.5">
            {[
              { key: "kanban" as const, icon: LayoutGrid, label: "Tablero" },
              { key: "list" as const, icon: ListIcon, label: "Lista" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-sf",
                  view === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <Dialog open={openForm} onOpenChange={setOpenForm}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="fire-button font-semibold">
                <Plus className="w-4 h-4" /> Nueva tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="fire-text">{editing ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Título *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Configurar pasarela de pago" />
                    {errors.title && <p className="text-[12px] text-destructive">{errors.title}</p>}
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Descripción</Label>
                    <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estado</Label>
                    <Select value={form.status} onValueChange={(v: TaskStatus) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_COLUMNS.map((s) => (<SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prioridad</Label>
                    <Select value={form.priority} onValueChange={(v: TaskPriority) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">⚪ Baja</SelectItem>
                        <SelectItem value="medium">🔵 Media</SelectItem>
                        <SelectItem value="high">🟠 Alta</SelectItem>
                        <SelectItem value="critical">🔴 Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Impacto en el negocio *</Label>
                    <Select value={form.impact} onValueChange={(v: TaskImpact) => setForm({ ...form, impact: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_IMPACT_META).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {TASK_IMPACT_META[form.impact]?.description}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Responsable</Label>
                    <Input value={form.assignee_name} onChange={(e) => setForm({ ...form, assignee_name: e.target.value })} placeholder="Nombre o equipo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha límite</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2 surface-card p-3 bg-cost-warning/5 border-cost-warning/30">
                    <Checkbox id="blocks" checked={form.blocks_project} onCheckedChange={(v) => setForm({ ...form, blocks_project: !!v })} />
                    <Label htmlFor="blocks" className="cursor-pointer flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-cost-warning" />
                      Esta tarea impacta en el retraso del proyecto
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
                  <Button type="submit" disabled={upsert.isPending} className="fire-button">
                    {upsert.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editing ? "Guardar" : "Crear tarea"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" /> Cargando tareas…
        </div>
      ) : tasks.length === 0 ? (
        <div className="surface-card fire-border p-8 text-center space-y-3">
          <ListChecks className="w-10 h-10 text-primary fire-icon mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Aún no hay tareas en este proyecto</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Empieza desglosando lo que vendiste en pequeños bloques de trabajo.
            </p>
          </div>
          <Button onClick={openCreate} className="fire-button">
            <Plus className="w-4 h-4" /> Crear primera tarea
          </Button>
        </div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {STATUS_COLUMNS.map(({ status, label, color }) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 px-1 py-2">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-[13px] font-medium text-foreground">{label}</span>
                <span className="text-[12px] font-mono-data text-muted-foreground ml-auto">{grouped[status].length}</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {grouped[status].length === 0 ? (
                  <div className="surface-card p-3 text-center text-[11px] text-muted-foreground border border-dashed">
                    Sin tareas
                  </div>
                ) : (
                  grouped[status].map((t) => (
                    <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={remove.mutate} onMove={(s) => move.mutate({ id: t.id, status: s })} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (<TaskRow key={t.id} task={t} onEdit={openEdit} onDelete={remove.mutate} />))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onMove }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void; onMove: (s: TaskStatus) => void; }) {
  const pr = TASK_PRIORITY_META[task.priority];
  const im = TASK_IMPACT_META[task.impact || "delivery"];
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
  return (
    <div
      className={cn(
        "surface-card surface-card-hover p-2.5 space-y-2 cursor-pointer",
        task.blocks_project && "border-l-2 border-cost-warning",
        task.status === "blocked" && "border-l-2 border-destructive"
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-1.5 flex-wrap">
        <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0", pr.bg, pr.color)}>
          {pr.emoji} {pr.label}
        </span>
        <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0", im.bg, im.color)} title={im.description}>
          {im.emoji} {im.short}
        </span>
        {task.blocks_project && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-cost-warning/10 text-cost-warning shrink-0 inline-flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Bloquea
          </span>
        )}
      </div>
      <div className="font-medium text-[13px] text-foreground line-clamp-2">{task.title}</div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        {task.assignee_name && (
          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {task.assignee_name}</span>
        )}
        {task.due_date && (
          <span className={cn("inline-flex items-center gap-1 font-mono-data", overdue && "text-destructive font-semibold")}>
            <Calendar className="w-3 h-3" /> {new Date(task.due_date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
        <Select value={task.status} onValueChange={(v: TaskStatus) => onMove(v)}>
          <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TASK_STATUS_META).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" onClick={() => onDelete(task.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function TaskRow({ task, onEdit, onDelete }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void; }) {
  const pr = TASK_PRIORITY_META[task.priority];
  const st = TASK_STATUS_META[task.status];
  const im = TASK_IMPACT_META[task.impact || "delivery"];
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
  return (
    <div className="surface-card surface-card-hover p-3 flex items-center gap-3 cursor-pointer" onClick={() => onEdit(task)}>
      <div className={cn("w-2 h-2 rounded-full shrink-0", st.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[13px] text-foreground">{task.title}</span>
          <span className={cn("text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded", pr.bg, pr.color)}>{pr.emoji} {pr.label}</span>
          <span className={cn("text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded", im.bg, im.color)} title={im.description}>{im.emoji} {im.short}</span>
          {task.blocks_project && (
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cost-warning/10 text-cost-warning inline-flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Bloquea proyecto
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {task.assignee_name && <>👤 {task.assignee_name}</>}
          {task.due_date && (
            <> · <span className={cn("font-mono-data", overdue && "text-destructive")}>📅 {new Date(task.due_date).toLocaleDateString("es-PE")}</span></>
          )}
        </div>
      </div>
      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="h-8 w-8 text-muted-foreground hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
