import { personnelResources, techResources, machineryResources } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Users, Cpu, Cog, AlertTriangle } from "lucide-react";

function SummaryCard({ icon: Icon, title, count, subtitle, accent }: {
  icon: React.ElementType;
  title: string;
  count: number;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <div className="surface-card surface-card-hover p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          accent ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="font-mono-data text-2xl font-semibold text-foreground">{count}</div>
    </div>
  );
}

function PersonnelPreview() {
  const sorted = [...personnelResources].sort((a, b) => b.utilization - a.utilization);
  return (
    <div className="surface-card p-4">
      <h3 className="section-header mb-3">Resumen de Personal</h3>
      <div className="space-y-2.5">
        {sorted.map((p) => {
          const isOverloaded = p.utilization > 90;
          return (
            <div key={p.id} className={cn("flex items-center gap-3", isOverloaded && "scorpion-border-left-alert pl-2")}>
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-primary">
                  {p.firstName[0]}{p.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-foreground truncate">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className={cn(
                    "font-mono-data text-[12px] font-medium ml-2",
                    isOverloaded ? "text-cost-negative" : p.utilization > 75 ? "text-cost-warning" : "text-foreground"
                  )}>
                    {p.utilization}%
                  </span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-sf",
                      isOverloaded ? "bg-cost-negative" : p.utilization > 75 ? "bg-cost-warning" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(p.utilization, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TechPreview() {
  const active = techResources.filter(t => t.status === "active");
  return (
    <div className="surface-card p-4">
      <h3 className="section-header mb-3">Recursos Tecnológicos</h3>
      <div className="space-y-2">
        {active.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[12px] text-foreground truncate">{t.name}</span>
            </div>
            <span className="font-mono-data text-[11px] text-muted-foreground ml-2">{t.utilization}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MachineryPreview() {
  return (
    <div className="surface-card p-4">
      <h3 className="section-header mb-3">Maquinaria Industrial</h3>
      <div className="space-y-2">
        {machineryResources.slice(0, 5).map((m) => {
          const statusColor = m.operationalStatus === "active" ? "text-cost-positive"
            : m.operationalStatus === "maintenance" ? "text-cost-warning"
            : m.operationalStatus === "available" ? "text-status-progress"
            : "text-muted-foreground";
          const statusLabel = m.operationalStatus === "active" ? "Activo"
            : m.operationalStatus === "maintenance" ? "Mantenimiento"
            : m.operationalStatus === "available" ? "Disponible"
            : "Inactivo";
          return (
            <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Cog className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[12px] text-foreground truncate">{m.name}</span>
              </div>
              <span className={cn("text-[11px] font-medium", statusColor)}>{statusLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResourcesSummary() {
  const overloaded = personnelResources.filter(p => p.utilization > 90).length;
  const activeTech = techResources.filter(t => t.status === "active").length;
  const activeMachinery = machineryResources.filter(m => m.operationalStatus === "active").length;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={Users} title="Personal" count={personnelResources.length} subtitle="Miembros del equipo" />
        <SummaryCard icon={Cpu} title="Tecnológicos" count={activeTech} subtitle="Recursos activos" />
        <SummaryCard icon={Cog} title="Maquinaria" count={activeMachinery} subtitle="Equipos activos" />
        <SummaryCard icon={AlertTriangle} title="Sobrecarga" count={overloaded} subtitle="Personal >90%" accent />
      </div>

      {/* Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <PersonnelPreview />
        <TechPreview />
        <MachineryPreview />
      </div>
    </div>
  );
}
