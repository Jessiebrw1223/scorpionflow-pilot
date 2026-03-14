import { projects, tasks, resources, costFormatter } from "@/lib/mock-data";

export default function CostsPage() {
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const totalEstimated = tasks.reduce((s, t) => s + t.estimatedCost, 0);
  const totalActual = tasks.reduce((s, t) => s + t.actualCost, 0);
  const laborCost = resources.reduce((s, r) => s + r.hourlyRate * 160 * (r.utilization / 100), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Costos</h1>
        <p className="text-[13px] text-muted-foreground">
          Control financiero del portafolio de proyectos
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Presupuesto Total", value: costFormatter.format(totalBudget) },
          { label: "Gasto Acumulado", value: costFormatter.format(totalSpent) },
          { label: "Costo Laboral Mensual", value: costFormatter.format(Math.round(laborCost)) },
          { label: "Variación", value: costFormatter.format(totalSpent - totalBudget), isNeg: totalSpent > totalBudget },
        ].map((item) => (
          <div key={item.label} className="surface-card p-4">
            <span className="text-[12px] text-muted-foreground uppercase tracking-wide font-medium block mb-1">
              {item.label}
            </span>
            <span className={`text-lg font-semibold font-mono-data ${item.isNeg ? 'text-cost-negative' : 'text-foreground'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Cost per project */}
      <div>
        <h2 className="section-header mb-3">Desglose por Proyecto</h2>
        <div className="surface-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Proyecto</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Presupuesto</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Gastado</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Disponible</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Quemado/día</th>
                <th className="px-4 py-2.5 text-right text-[12px] font-medium text-muted-foreground uppercase tracking-wide">% Consumido</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const remaining = p.budget - p.spent;
                const percent = Math.round((p.spent / p.budget) * 100);
                const isOver = remaining < 0;
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/50 transition-sf">
                    <td className="px-4 py-2.5">
                      <span className="font-mono-data text-[11px] text-muted-foreground mr-2">{p.code}</span>
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-data">{costFormatter.format(p.budget)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-data">{costFormatter.format(p.spent)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono-data font-medium ${isOver ? 'text-cost-negative' : ''}`}>
                      {costFormatter.format(remaining)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-data">{costFormatter.format(p.burnRate)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-mono-data font-medium ${percent > 100 ? 'text-cost-negative' : percent > 80 ? 'text-cost-warning' : ''}`}>
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
