import {
  DollarSign,
  CheckCircle2,
  Clock,
  Users,
  Activity,
  Zap,
} from "lucide-react";
import { projects, tasks, resources, costFormatter } from "@/lib/mock-data";
import { KpiCard } from "@/components/KpiCard";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";
import { ActivityFeed } from "@/components/ActivityFeed";

export default function Dashboard() {
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const avgUtilization = Math.round(
    resources.reduce((s, r) => s + r.utilization, 0) / resources.length
  );
  const burnRate = projects.reduce((s, p) => s + p.burnRate, 0);
  const budgetVariance = ((totalSpent - totalBudget) / totalBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Centro de Control
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Vista general del portafolio de proyectos
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <Activity className="w-3.5 h-3.5 text-cost-positive" />
          <span className="text-cost-positive font-medium">Sistema Operativo</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Presupuesto Total"
          value={costFormatter.format(totalBudget)}
          subValue={`Gastado: ${costFormatter.format(totalSpent)}`}
          icon={DollarSign}
          trend={budgetVariance}
          trendLabel="variación"
        />
        <KpiCard
          label="Tareas Completadas"
          value={`${completedTasks}/${totalTasks}`}
          subValue={`${inProgressTasks} en proceso`}
          icon={CheckCircle2}
          trend={(completedTasks / totalTasks) * 100}
          trendLabel="progreso"
        />
        <KpiCard
          label="Tasa de Quemado"
          value={`${costFormatter.format(burnRate)}/día`}
          subValue={`${blockedTasks} tareas bloqueadas`}
          icon={Clock}
          trend={blockedTasks > 0 ? -blockedTasks : 0}
          trendLabel="bloqueadas"
        />
        <KpiCard
          label="Utilización Promedio"
          value={`${avgUtilization}%`}
          subValue={`${resources.length} recursos activos`}
          icon={Users}
          trend={avgUtilization > 80 ? avgUtilization - 80 : 0}
          trendLabel="sobre 80%"
        />
      </div>

      {/* Projects + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="section-header">Estado de Proyectos</h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectStatusCard key={project.id} project={project} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="section-header">Actividad Reciente</h2>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
