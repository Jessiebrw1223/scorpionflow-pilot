import { projects, tasks, resources, personnelResources, costFormatter } from "@/lib/mock-data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const solFormatter = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 });

const tasksByStatus = {
  done: tasks.filter(t => t.status === "done").length,
  in_progress: tasks.filter(t => t.status === "in_progress").length,
  in_review: tasks.filter(t => t.status === "in_review").length,
  todo: tasks.filter(t => t.status === "todo").length,
  blocked: tasks.filter(t => t.status === "blocked").length,
};
const totalTasks = tasks.length;

const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
const totalEstimated = tasks.reduce((s, t) => s + t.estimatedCost, 0);
const totalActual = tasks.reduce((s, t) => s + t.actualCost, 0);

const pieData = [
  { name: "Finalizadas", value: tasksByStatus.done, color: "hsl(142 71% 45%)" },
  { name: "En Proceso", value: tasksByStatus.in_progress, color: "hsl(210 70% 55%)" },
  { name: "En Revisión", value: tasksByStatus.in_review, color: "hsl(38 92% 55%)" },
  { name: "Pendientes", value: tasksByStatus.todo, color: "hsl(0 0% 45%)" },
  { name: "Bloqueadas", value: tasksByStatus.blocked, color: "hsl(0 80% 55%)" },
];

const budgetChart = projects.map(p => ({ name: p.code, budget: p.budget, spent: p.spent }));
const budgetConfig = { budget: { label: "Presupuesto", color: "hsl(210 70% 55%)" }, spent: { label: "Gastado", color: "hsl(15 90% 55%)" } };
const pieConfig = { value: { label: "Tareas" } };

const laborCost = personnelResources.reduce((s, r) => s + r.salary, 0);

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Informes</h1>
        <p className="text-[13px] text-muted-foreground">Reportes estratégicos y análisis de rendimiento del portafolio</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tareas Totales", value: totalTasks.toString() },
          { label: "Completadas", value: `${tasksByStatus.done} (${Math.round(tasksByStatus.done / totalTasks * 100)}%)` },
          { label: "Presupuesto Total", value: solFormatter.format(totalBudget) },
          { label: "Variación Costo", value: solFormatter.format(totalActual - totalEstimated), alert: totalActual > totalEstimated },
        ].map(k => (
          <div key={k.label} className="surface-card p-4">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium block mb-1">{k.label}</span>
            <span className={`text-lg font-semibold font-mono-data ${(k as any).alert ? "text-[hsl(var(--cost-negative))]" : "text-foreground"}`}>{k.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Task Distribution with pie */}
        <div className="surface-card p-4">
          <h3 className="section-header mb-4">Distribución de Tareas</h3>
          <div className="flex gap-4 items-center">
            <ChartContainer config={pieConfig} className="h-[180px] w-[180px] shrink-0">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} strokeWidth={2} stroke="hsl(0 0% 10%)">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="space-y-2 flex-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-[12px] text-foreground flex-1">{d.name}</span>
                  <span className="font-mono-data text-[12px] text-muted-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="surface-card p-4">
          <h3 className="section-header mb-4">Utilización de Recursos</h3>
          <div className="space-y-2.5">
            {resources.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-medium text-primary-foreground">{r.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <span className="text-[12px] text-foreground w-28 truncate">{r.name}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.utilization > 90 ? "bg-[hsl(var(--cost-negative))]" : r.utilization > 75 ? "bg-[hsl(var(--cost-warning))]" : "bg-primary"}`} style={{ width: `${r.utilization}%` }} />
                </div>
                <span className="font-mono-data text-[11px] text-muted-foreground w-10 text-right">{r.utilization}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget by project chart */}
        <div className="surface-card p-4 lg:col-span-2">
          <h3 className="section-header mb-3">Presupuesto vs Gasto por Proyecto</h3>
          <ChartContainer config={budgetConfig} className="h-[220px] w-full">
            <BarChart data={budgetChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="budget" fill="hsl(210 70% 55%)" radius={[4, 4, 0, 0]} barSize={24} name="Presupuesto" />
              <Bar dataKey="spent" fill="hsl(15 90% 55%)" radius={[4, 4, 0, 0]} barSize={24} name="Gastado" />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Financial summary */}
        <div className="surface-card p-4">
          <h3 className="section-header mb-3">Resumen Financiero</h3>
          <div className="space-y-2">
            {[
              { label: "Presupuesto Total", value: solFormatter.format(totalBudget) },
              { label: "Gasto Acumulado", value: solFormatter.format(totalSpent) },
              { label: "Costo Laboral Mensual", value: solFormatter.format(laborCost) },
              { label: "Costo Estimado Tareas", value: solFormatter.format(totalEstimated) },
              { label: "Costo Real Tareas", value: solFormatter.format(totalActual) },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-[12px] text-muted-foreground">{r.label}</span>
                <span className="font-mono-data text-[12px] text-foreground font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance by project */}
        <div className="surface-card p-4">
          <h3 className="section-header mb-3">Rendimiento por Proyecto</h3>
          <div className="space-y-3">
            {projects.map(p => {
              const pct = Math.round((p.spent / p.budget) * 100);
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="font-mono-data text-muted-foreground">{pct}% consumido</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-sf ${pct > 100 ? "bg-[hsl(var(--cost-negative))]" : pct > 80 ? "bg-[hsl(var(--cost-warning))]" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progreso: {p.progress}%</span>
                    <span>{solFormatter.format(p.spent)} / {solFormatter.format(p.budget)}</span>
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
