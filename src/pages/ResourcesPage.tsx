import { resources, costFormatter } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ResourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Recursos</h1>
        <p className="text-[13px] text-muted-foreground">
          Gestión y asignación de recursos del equipo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((resource) => {
          const initial = resource.name.split(" ").map((n) => n[0]).join("");
          const isOverloaded = resource.utilization > 90;
          return (
            <div
              key={resource.id}
              className={cn("surface-card surface-card-hover p-4", isOverloaded && "scorpion-border-left-alert")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-medium text-primary-foreground">{initial}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-medium text-foreground truncate">{resource.name}</h3>
                  <p className="text-[12px] text-muted-foreground">{resource.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Utilización</span>
                  <span className={cn(
                    "font-mono-data font-medium",
                    isOverloaded ? "text-cost-negative" : resource.utilization > 75 ? "text-cost-warning" : "text-foreground"
                  )}>
                    {resource.utilization}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-sf",
                      isOverloaded ? "bg-cost-negative" : resource.utilization > 75 ? "bg-cost-warning" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border text-[12px]">
                <div>
                  <span className="text-muted-foreground block">Tarifa/hora</span>
                  <span className="font-mono-data font-medium text-foreground">
                    {costFormatter.format(resource.hourlyRate)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Proyectos</span>
                  <span className="font-mono-data font-medium text-foreground">
                    {resource.assignedProjects.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
