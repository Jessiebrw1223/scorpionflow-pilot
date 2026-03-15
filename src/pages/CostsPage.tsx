import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projects, tasks, resources, personnelResources, techResources, machineryResources, costFormatter } from "@/lib/mock-data";
import { BarChart3, TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Area, Legend } from "recharts";

/* ── helpers ─────────────────────────────────────────────── */
const solFormatter = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
const fmt = (v: number) => solFormatter.format(v);

const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
const totalEstimated = tasks.reduce((s, t) => s + t.estimatedCost, 0);
const totalActual = tasks.reduce((s, t) => s + t.actualCost, 0);

/* simulated period data */
const periodData = [
  { period: "Ene", cost: 18500, cumulative: 18500, income: 35000 },
  { period: "Feb", cost: 32400, cumulative: 50900, income: 30000 },
  { period: "Mar", cost: 28700, cumulative: 79600, income: 42000 },
  { period: "Abr", cost: 22100, cumulative: 101700, income: 25000 },
  { period: "May", cost: 35200, cumulative: 136900, income: 38000 },
  { period: "Jun", cost: 19800, cumulative: 156700, income: 20000 },
];

/* Earned value data */
const evData = [
  { month: "Ene", PV: 25000, EV: 22000, AC: 18500 },
  { month: "Feb", PV: 55000, EV: 48000, AC: 50900 },
  { month: "Mar", PV: 90000, EV: 78000, AC: 79600 },
  { month: "Abr", PV: 130000, EV: 112000, AC: 101700 },
  { month: "May", PV: 175000, EV: 155000, AC: 136900 },
  { month: "Jun", PV: 220000, EV: 198000, AC: 156700 },
];
const latestEV = evData[evData.length - 1];
const CPI = latestEV.EV / latestEV.AC;
const SPI = latestEV.EV / latestEV.PV;

/* Cash flow */
const cashFlowData = periodData.map((p, i) => {
  const flow = p.income - p.cost;
  const prevBalance = i > 0 ? periodData.slice(0, i).reduce((s, x) => s + x.income - x.cost, 0) : 0;
  return { ...p, expenses: p.cost, flow, balance: prevBalance + flow };
});

/* Cost per resource */
const resourceCosts = [
  ...personnelResources.map(r => ({
    name: `${r.firstName} ${r.lastName}`, type: "Personal", unitCost: r.salary,
    hoursUsed: Math.round(160 * r.utilization / 100), total: Math.round(r.salary * r.utilization / 100),
  })),
  ...techResources.filter(t => t.status === "active").map(t => ({
    name: t.name, type: "Tecnológico", unitCost: Math.round(Math.random() * 500 + 200),
    hoursUsed: Math.round(720 * t.utilization / 100), total: Math.round((Math.random() * 500 + 200) * t.utilization / 100 * 3),
  })),
  ...machineryResources.filter(m => m.operationalStatus === "active").map(m => ({
    name: m.name, type: "Maquinaria", unitCost: Math.round(Math.random() * 2000 + 1000),
    hoursUsed: Math.round(720 * m.utilization / 100), total: Math.round((Math.random() * 2000 + 1000) * m.utilization / 100 * 2),
  })),
];

/* Overrun data */
const overrunData = projects.map(p => {
  const diff = p.spent - p.budget;
  const pct = Math.round(((p.spent - p.budget) / p.budget) * 100);
  return { ...p, diff, pct, isOver: diff > 0 };
});

/* ── chart configs ─────────────────────────────────────────── */
const costChartConfig = { cost: { label: "Costo por Período", color: "hsl(210 70% 55%)" }, cumulative: { label: "Costo Acumulado", color: "hsl(15 90% 55%)" } };
const evChartConfig = { PV: { label: "Valor Planificado (PV)", color: "hsl(210 70% 55%)" }, EV: { label: "Valor Ganado (EV)", color: "hsl(142 71% 45%)" }, AC: { label: "Costo Real (AC)", color: "hsl(0 80% 55%)" } };
const cashChartConfig = { income: { label: "Ingresos", color: "hsl(142 71% 45%)" }, expenses: { label: "Gastos", color: "hsl(0 80% 55%)" }, balance: { label: "Saldo", color: "hsl(15 90% 55%)" } };

/* ── Indicator card ─────────────────────────────────────────── */
function Indicator({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className="surface-card p-4">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium block mb-1">{label}</span>
      <span className={`text-lg font-semibold font-mono-data ${alert ? "text-[hsl(var(--cost-negative))]" : "text-foreground"}`}>{value}</span>
      {sub && <span className="block text-[11px] text-muted-foreground mt-0.5">{sub}</span>}
    </div>
  );
}

export default function CostsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Costos</h1>
        <p className="text-[13px] text-muted-foreground">Control financiero y análisis de valor ganado del portafolio</p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="summary" className="text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Resumen</TabsTrigger>
          <TabsTrigger value="cashflow" className="text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Flujo de Caja</TabsTrigger>
          <TabsTrigger value="earned" className="text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Valor Ganado</TabsTrigger>
          <TabsTrigger value="resources" className="text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Users className="w-3.5 h-3.5 mr-1.5" />Por Recursos</TabsTrigger>
          <TabsTrigger value="overrun" className="text-[12px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><AlertTriangle className="w-3.5 h-3.5 mr-1.5" />Sobrecostos</TabsTrigger>
        </TabsList>

        {/* ═══ RESUMEN ═══ */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Indicator label="Costo Real" value={fmt(totalActual)} />
            <Indicator label="Costo de Línea Base" value={fmt(totalEstimated)} />
            <Indicator label="Costo Restante" value={fmt(Math.max(totalEstimated - totalActual, 0))} />
            <Indicator label="Variación de Costo" value={fmt(totalActual - totalEstimated)} alert={totalActual > totalEstimated} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 surface-card p-4">
              <h3 className="section-header mb-3">Costo por Período vs Acumulado</h3>
              <ChartContainer config={costChartConfig} className="h-[260px] w-full">
                <ComposedChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                  <XAxis dataKey="period" tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cost" fill="hsl(210 70% 55%)" radius={[4, 4, 0, 0]} barSize={28} name="Costo por Período" />
                  <Line dataKey="cumulative" stroke="hsl(15 90% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(15 90% 55%)" }} name="Costo Acumulado" />
                </ComposedChart>
              </ChartContainer>
            </div>
            <div className="surface-card p-4">
              <h3 className="section-header mb-3">Análisis</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                El gráfico muestra el <span className="text-foreground font-medium">costo acumulado</span> del proyecto (línea naranja) y el <span className="text-foreground font-medium">costo por período</span> (barras azules).
              </p>
              <p className="text-[12px] text-muted-foreground leading-relaxed mt-2">
                Para analizar los costos en diferentes períodos, puede modificar los campos de visualización del informe.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Promedio mensual</span><span className="font-mono-data text-foreground">{fmt(totalActual / 6)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Máx. mensual</span><span className="font-mono-data text-foreground">{fmt(35200)}</span></div>
                <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Mín. mensual</span><span className="font-mono-data text-foreground">{fmt(18500)}</span></div>
              </div>
            </div>
          </div>

          {/* EVM table */}
          <div className="surface-card overflow-hidden">
            <h3 className="section-header px-4 pt-3 mb-2">Costos del Proyecto (Valor Ganado)</h3>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {["Nombre", "Costo Restante", "Costo Real", "Costo", "CRTR (AC)", "CPTR (EV)", "CPTP (PV)"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => {
                  const remaining = Math.max(t.estimatedCost - t.actualCost, 0);
                  const pv = t.estimatedCost;
                  const ev = t.status === "done" ? t.estimatedCost : Math.round(t.estimatedCost * (t.loggedHours / t.estimatedHours) * 0.9);
                  return (
                    <tr key={t.id} className="border-b border-border hover:bg-muted/50 transition-sf">
                      <td className="px-4 py-2.5"><span className="font-mono-data text-[11px] text-muted-foreground mr-2">{t.id}</span><span className="font-medium">{t.title}</span></td>
                      <td className="px-4 py-2.5 font-mono-data">{fmt(remaining)}</td>
                      <td className="px-4 py-2.5 font-mono-data">{fmt(t.actualCost)}</td>
                      <td className="px-4 py-2.5 font-mono-data">{fmt(t.estimatedCost)}</td>
                      <td className="px-4 py-2.5 font-mono-data">{fmt(t.actualCost)}</td>
                      <td className="px-4 py-2.5 font-mono-data">{fmt(ev)}</td>
                      <td className="px-4 py-2.5 font-mono-data">{fmt(pv)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ═══ FLUJO DE CAJA ═══ */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Indicator label="Ingresos Totales" value={fmt(cashFlowData.reduce((s, c) => s + c.income, 0))} />
            <Indicator label="Gastos Totales" value={fmt(cashFlowData.reduce((s, c) => s + c.expenses, 0))} />
            <Indicator label="Flujo Neto" value={fmt(cashFlowData.reduce((s, c) => s + c.flow, 0))} />
            <Indicator label="Saldo Final" value={fmt(cashFlowData[cashFlowData.length - 1].balance)} />
          </div>
          <div className="surface-card p-4">
            <h3 className="section-header mb-3">Ingresos vs Egresos</h3>
            <ChartContainer config={cashChartConfig} className="h-[280px] w-full">
              <ComposedChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                <XAxis dataKey="period" tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} barSize={20} name="Ingresos" />
                <Bar dataKey="expenses" fill="hsl(0 80% 55%)" radius={[4, 4, 0, 0]} barSize={20} name="Gastos" />
                <Line dataKey="balance" stroke="hsl(15 90% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(15 90% 55%)" }} name="Saldo Acumulado" />
              </ComposedChart>
            </ChartContainer>
          </div>
          <div className="surface-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {["Período", "Ingresos", "Gastos", "Flujo Neto", "Saldo Acumulado"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right first:text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashFlowData.map(c => (
                  <tr key={c.period} className="border-b border-border hover:bg-muted/50 transition-sf">
                    <td className="px-4 py-2.5 font-medium">{c.period} 2026</td>
                    <td className="px-4 py-2.5 text-right font-mono-data text-[hsl(var(--cost-positive))]">{fmt(c.income)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-data text-[hsl(var(--cost-negative))]">{fmt(c.expenses)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono-data font-medium ${c.flow < 0 ? "text-[hsl(var(--cost-negative))]" : ""}`}>{fmt(c.flow)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-data font-medium">{fmt(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ═══ VALOR GANADO ═══ */}
        <TabsContent value="earned" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Indicator label="Valor Planificado (PV)" value={fmt(latestEV.PV)} />
            <Indicator label="Valor Ganado (EV)" value={fmt(latestEV.EV)} />
            <Indicator label="Costo Real (AC)" value={fmt(latestEV.AC)} />
            <Indicator label="CPI / SPI" value={`${CPI.toFixed(2)} / ${SPI.toFixed(2)}`} sub={CPI >= 1 ? "Dentro de presupuesto" : "Sobre presupuesto"} alert={CPI < 1} />
          </div>
          <div className="surface-card p-4">
            <h3 className="section-header mb-3">Diagrama de Valor Ganado</h3>
            <ChartContainer config={evChartConfig} className="h-[300px] w-full">
              <LineChart data={evData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0 0% 50%)", fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="PV" stroke="hsl(210 70% 55%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} name="PV" />
                <Line dataKey="EV" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} name="EV" />
                <Line dataKey="AC" stroke="hsl(0 80% 55%)" strokeWidth={2} dot={{ r: 3 }} name="AC" />
              </LineChart>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="surface-card p-4">
              <h3 className="section-header mb-3">Índices de Desempeño</h3>
              <div className="space-y-3">
                {[
                  { label: "CPI (Índice de Desempeño del Costo)", value: CPI, desc: CPI >= 1 ? "El proyecto gasta menos de lo planificado" : "El proyecto gasta más de lo planificado" },
                  { label: "SPI (Índice de Desempeño del Cronograma)", value: SPI, desc: SPI >= 1 ? "El proyecto avanza según lo planificado" : "El proyecto está retrasado respecto al plan" },
                ].map(idx => (
                  <div key={idx.label} className="p-3 bg-secondary rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] text-foreground font-medium">{idx.label}</span>
                      <span className={`font-mono-data text-sm font-semibold ${idx.value >= 1 ? "text-[hsl(var(--cost-positive))]" : "text-[hsl(var(--cost-negative))]"}`}>{idx.value.toFixed(3)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{idx.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="surface-card p-4">
              <h3 className="section-header mb-3">Variaciones</h3>
              <div className="space-y-3">
                {[
                  { label: "Variación del Costo (CV)", value: latestEV.EV - latestEV.AC, desc: "EV - AC" },
                  { label: "Variación del Cronograma (SV)", value: latestEV.EV - latestEV.PV, desc: "EV - PV" },
                  { label: "Estimación a la Conclusión (EAC)", value: totalBudget / CPI, desc: "BAC / CPI" },
                ].map(v => (
                  <div key={v.label} className="p-3 bg-secondary rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] text-foreground font-medium">{v.label}</span>
                      <span className={`font-mono-data text-sm font-semibold ${v.value >= 0 ? "text-[hsl(var(--cost-positive))]" : "text-[hsl(var(--cost-negative))]"}`}>{fmt(v.value)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ COSTOS POR RECURSOS ═══ */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Indicator label="Costo Personal" value={fmt(resourceCosts.filter(r => r.type === "Personal").reduce((s, r) => s + r.total, 0))} />
            <Indicator label="Costo Tecnológico" value={fmt(resourceCosts.filter(r => r.type === "Tecnológico").reduce((s, r) => s + r.total, 0))} />
            <Indicator label="Costo Maquinaria" value={fmt(resourceCosts.filter(r => r.type === "Maquinaria").reduce((s, r) => s + r.total, 0))} />
          </div>
          <div className="surface-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {["Recurso", "Tipo", "Costo Unitario", "Horas Utilizadas", "Costo Total"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resourceCosts.map((r, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/50 transition-sf">
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        r.type === "Personal" ? "bg-[hsl(210_70%_55%/0.15)] text-[hsl(210,70%,65%)]"
                        : r.type === "Tecnológico" ? "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142,71%,55%)]"
                        : "bg-[hsl(38_92%_55%/0.15)] text-[hsl(38,92%,65%)]"
                      }`}>{r.type}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono-data">{fmt(r.unitCost)}</td>
                    <td className="px-4 py-2.5 font-mono-data">{r.hoursUsed}h</td>
                    <td className="px-4 py-2.5 text-right font-mono-data font-medium">{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ═══ SOBRECOSTOS ═══ */}
        <TabsContent value="overrun" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Indicator label="Presupuesto Total" value={fmt(totalBudget)} />
            <Indicator label="Costo Real Acumulado" value={fmt(totalSpent)} />
            <Indicator label="Diferencia" value={fmt(totalSpent - totalBudget)} alert={totalSpent > totalBudget} />
            <Indicator label="Desviación %" value={`${Math.round(((totalSpent - totalBudget) / totalBudget) * 100)}%`} alert={totalSpent > totalBudget} />
          </div>

          {/* Alerts */}
          {overrunData.filter(o => o.isOver).length > 0 && (
            <div className="space-y-2">
              {overrunData.filter(o => o.isOver).map(o => (
                <div key={o.id} className="surface-card p-3 scorpion-border-left-alert flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--cost-negative))] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{o.name} — Sobrecosto detectado</p>
                    <p className="text-[11px] text-muted-foreground">Excede el presupuesto en {fmt(o.diff)} ({o.pct}% de desviación). Se recomienda acción correctiva inmediata.</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="surface-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  {["Proyecto", "Presupuesto", "Costo Real", "Diferencia", "Desviación", "Estado"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overrunData.map(o => (
                  <tr key={o.id} className="border-b border-border hover:bg-muted/50 transition-sf">
                    <td className="px-4 py-2.5"><span className="font-mono-data text-[11px] text-muted-foreground mr-2">{o.code}</span><span className="font-medium">{o.name}</span></td>
                    <td className="px-4 py-2.5 font-mono-data">{fmt(o.budget)}</td>
                    <td className="px-4 py-2.5 font-mono-data">{fmt(o.spent)}</td>
                    <td className={`px-4 py-2.5 font-mono-data font-medium ${o.isOver ? "text-[hsl(var(--cost-negative))]" : "text-[hsl(var(--cost-positive))]"}`}>{fmt(o.diff)}</td>
                    <td className={`px-4 py-2.5 font-mono-data font-medium ${o.isOver ? "text-[hsl(var(--cost-negative))]" : ""}`}>{o.pct}%</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        o.isOver ? "bg-[hsl(0_80%_55%/0.15)] text-[hsl(0,80%,65%)]"
                        : Math.abs(o.pct) < 10 ? "bg-[hsl(38_92%_55%/0.15)] text-[hsl(38,92%,65%)]"
                        : "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142,71%,55%)]"
                      }`}>{o.isOver ? "Sobre presupuesto" : Math.abs(o.pct) < 10 ? "En riesgo" : "En control"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
