import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TaskListView } from "@/components/TaskListView";
import { TaskCalendarView } from "@/components/TaskCalendarView";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Calendar } from "lucide-react";

type TaskView = "kanban" | "list" | "calendar";

export default function TasksPage() {
  const [view, setView] = useState<TaskView>("kanban");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Tareas</h1>
          <p className="text-[13px] text-muted-foreground">
            Gestión de tareas del proyecto
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center surface-card p-0.5 gap-0.5">
          {([
            { key: "kanban" as TaskView, icon: LayoutGrid, label: "Tablero" },
            { key: "list" as TaskView, icon: List, label: "Lista" },
            { key: "calendar" as TaskView, icon: Calendar, label: "Calendario" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-sf",
                view === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === "kanban" && <KanbanBoard />}
      {view === "list" && <TaskListView />}
      {view === "calendar" && (
        <div className="surface-card p-12 text-center text-muted-foreground text-[13px]">
          Calendario de tareas — Próximamente
        </div>
      )}
    </div>
  );
}
