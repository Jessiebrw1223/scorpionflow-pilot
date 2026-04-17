import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List as ListIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TASK_IMPACT_META, TASK_STATUS_META } from "@/lib/business-intelligence";
import ProjectTasksTab from "./ProjectTasksTab";
import TaskDetailPanel from "./TaskDetailPanel";

interface Props {
  projectId: string;
}

type Mode = "list" | "kanban" | "calendar";

const MODE_META: Record<Mode, { label: string; helper: string; icon: typeof ListIcon }> = {
  list: { label: "Lista", helper: "Backlog completo en tabla", icon: ListIcon },
  kanban: { label: "Tablero", helper: "Flujo visual por estado", icon: LayoutGrid },
  calendar: { label: "Calendario", helper: "Tareas distribuidas por fecha", icon: CalendarIcon },
};

export default function ProjectPlanningTab({ projectId }: Props) {
  const [mode, setMode] = useState<Mode>("kanban");
  const current = MODE_META[mode];

  return (
    <div className="space-y-4">
      {/* Selector de vista — destacado con highlight naranja */}
      <div className="surface-card p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <current.icon className="w-4 h-4 text-primary fire-icon" />
            Planificación · {current.label}
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {current.helper} — la misma data, vista a tu manera.
          </p>
        </div>
        <div className="flex items-center bg-secondary/60 border border-border rounded-md p-1 gap-0.5">
          {(Object.keys(MODE_META) as Mode[]).map((key) => {
            const Icon = MODE_META[key].icon;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-sf",
                  mode === key
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {MODE_META[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "calendar" ? (
        <PlanningCalendar projectId={projectId} />
      ) : (
        <ProjectTasksTab key={mode} projectId={projectId} defaultView={mode === "list" ? "list" : "kanban"} />
      )}
    </div>
  );
}

function PlanningCalendar({ projectId }: { projectId: string }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["project-tasks-calendar", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, impact, due_date, blocks_project")
        .eq("project_id", projectId)
        .not("due_date", "is", null);
      if (error) throw error;
      return data as any[];
    },
  });

  const monthLabel = cursor.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const firstDayWeek = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7; // Lunes=0

  const tasksByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const d = new Date(t.due_date);
      if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
        const key = String(d.getDate());
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks, cursor]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" /> Cargando calendario…
      </div>
    );
  }

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="surface-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="surface-card p-1.5 hover:bg-muted/40 transition-sf">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="text-[12px] font-medium px-3 py-1.5 surface-card hover:bg-muted/40 transition-sf">
            Hoy
          </button>
          <button onClick={goNext} className="surface-card p-1.5 hover:bg-muted/40 transition-sf">
            <ChevronRight className="w-4 h-4" />
          </button>
          <h3 className="text-base font-semibold capitalize ml-2">{monthLabel}</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {tasks.length} tarea(s) con fecha · click en una tarea para ver detalles
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">
        {weekDays.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[90px]" />;
          }
          const dayTasks = tasksByDay[String(day)] || [];
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <div
              key={day}
              className={cn(
                "surface-card p-1.5 min-h-[90px] flex flex-col gap-1",
                isToday && "border-primary bg-primary/5"
              )}
            >
              <div className={cn(
                "text-[11px] font-mono-data font-semibold",
                isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {day}
              </div>
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((t) => {
                  const im = TASK_IMPACT_META[t.impact || "delivery"];
                  const st = TASK_STATUS_META[t.status];
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1",
                        im.bg,
                        im.color,
                        t.blocks_project && "ring-1 ring-cost-warning"
                      )}
                      title={`${t.title} — ${st.label}`}
                    >
                      {t.blocks_project && <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
                      <span className="truncate">{t.title}</span>
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground font-mono-data">
                    +{dayTasks.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground pt-2 border-t border-border">
        <span className="font-medium">Color = impacto:</span>
        {Object.entries(TASK_IMPACT_META).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded", v.bg)} />
            <span>{v.emoji} {v.short}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 ml-auto">
          <AlertTriangle className="w-3 h-3 text-cost-warning" /> Bloquea entrega
        </span>
      </div>
    </div>
  );
}
