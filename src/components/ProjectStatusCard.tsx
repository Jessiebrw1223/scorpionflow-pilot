import { Project, costFormatter } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProjectStatusCardProps {
  project: Project;
}

const statusConfig = {
  on_track: { label: "En Tiempo", className: "bg-status-done/10 text-status-done" },
  at_risk: { label: "En Riesgo", className: "bg-status-review/10 text-status-review" },
  over_budget: { label: "Sobre Presupuesto", className: "bg-status-blocked/10 text-status-blocked" },
};

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const status = statusConfig[project.status];
  const budgetPercent = Math.round((project.spent / project.budget) * 100);
  const isOverBudget = project.status === "over_budget";

  return (
    <div className={cn("surface-card surface-card-hover p-4", isOverBudget && "scorpion-border-left-alert")}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-data text-[12px] text-muted-foreground">{project.code}</span>
            <h3 className="text-[13px] font-medium text-foreground">{project.name}</h3>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {project.startDate} → {project.endDate}
          </p>
        </div>
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded", status.className)}>
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-[12px]">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-mono-data font-medium text-foreground">{project.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-sf"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 text-[12px]">
        <div>
          <span className="text-muted-foreground block">Presupuesto</span>
          <span className="font-mono-data font-medium text-foreground">
            {costFormatter.format(project.budget)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Gastado</span>
          <span className={cn("font-mono-data font-medium", isOverBudget ? "text-cost-negative" : "text-foreground")}>
            {costFormatter.format(project.spent)} ({budgetPercent}%)
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Tasa Quemado</span>
          <span className="font-mono-data font-medium text-foreground">
            {costFormatter.format(project.burnRate)}/día
          </span>
        </div>
      </div>
    </div>
  );
}
