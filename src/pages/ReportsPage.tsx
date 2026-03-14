import { projects, tasks, resources, costFormatter } from "@/lib/mock-data";

export default function ReportsPage() {
  const tasksByStatus = {
    done: tasks.filter((t) => t.status === "done").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    in_review: tasks.filter((t) => t.status === "in_review").length,
    todo: tasks.filter((t) => t.status === "todo").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  const totalTasks = tasks.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Informes</h1>
        <p className="text-[13px] text-muted-foreground">
          Reportes y análisis del portafolio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Task Distribution */}
        <div className="surface-card p-4">
          <h3 className="section-header mb-4">Distribución de Tareas</h3>
          <div className="space-y-2.5">
            {([
              { label: "Finalizadas", count: tasksByStatus.done, color: "bg-status-done" },
              { label: "En Proceso", count: tasksByStatus.in_progress, color: "bg-status-progress" },
              { label: "En Revisión", count: tasksByStatus.in_review, color: "bg-status-review" },
              { label: "Pendientes", count: tasksByStatus.todo, color: "bg-status-todo" },
              { label: "Bloqueadas", count: tasksByStatus.blocked, color: "bg-status-blocked" },
            ]).map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                <span className="text-[13px] text-foreground w-24">{label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${(count / totalTasks) * 100}%` }}
                  />
                </div>
                <span className="font-mono-data text-[12px] text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="surface-card p-4">
          <h3 className="section-header mb-4">Utilización de Recursos</h3>
          <div className="space-y-2.5">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-medium text-primary-foreground">
                    {r.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <span className="text-[13px] text-foreground w-32 truncate">{r.name}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.utilization > 90 ? 'bg-cost-negative' : r.utilization > 75 ? 'bg-cost-warning' : 'bg-primary'}`}
                    style={{ width: `${r.utilization}%` }}
                  />
                </div>
                <span className="font-mono-data text-[12px] text-muted-foreground w-10 text-right">
                  {r.utilization}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Summary */}
        <div className="surface-card p-4 lg:col-span-2">
          <h3 className="section-header mb-4">Resumen de Presupuesto por Proyecto</h3>
          <div className="space-y-3">
            {projects.map((p) => {
              const pct = Math.round((p.spent / p.budget) * 100);
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="font-mono-data text-muted-foreground">
                      {costFormatter.format(p.spent)} / {costFormatter.format(p.budget)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-sf ${pct > 100 ? 'bg-cost-negative' : pct > 80 ? 'bg-cost-warning' : 'bg-primary'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
