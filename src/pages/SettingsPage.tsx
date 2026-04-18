import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Palette, CreditCard, User, Bell, Check, Sparkles, Star, Rocket, TrendingUp,
  Briefcase, AlertTriangle, Zap, DollarSign, Target, Wand2,
} from "lucide-react";

type PlanId = "free" | "starter" | "pro" | "business";
type Billing = "monthly" | "annual";
type Currency = "PEN" | "USD";
type CostModel = "hourly" | "monthly" | "fixed" | "mixed";
type Channel = "system" | "email";

const PLANS: Array<{
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPEN: number;
  monthlyUSD: number;
  annualPEN: number;
  annualUSD: number;
  icon: typeof Sparkles;
  accent: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}> = [
  {
    id: "free",
    name: "Free",
    tagline: "Empieza a organizar tu trabajo",
    monthlyPEN: 0, monthlyUSD: 0, annualPEN: 0, annualUSD: 0,
    icon: Sparkles,
    accent: "text-muted-foreground",
    features: [
      "Hasta 5 clientes",
      "Hasta 3 proyectos",
      "Planificación básica",
      "Tareas y tablero simple",
      "Dashboard básico",
    ],
    cta: "Empezar gratis",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Trabaja sin límites",
    monthlyPEN: 35, monthlyUSD: 12, annualPEN: 28, annualUSD: 9,
    icon: Rocket,
    accent: "text-blue-400",
    features: [
      "Clientes ilimitados",
      "Proyectos ilimitados",
      "Planificación completa",
      "Calendario y vistas avanzadas",
      "Cotizaciones ilimitadas",
    ],
    cta: "Actualizar a Starter",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Controla tu negocio y evita pérdidas",
    monthlyPEN: 90, monthlyUSD: 27, annualPEN: 70, annualUSD: 21,
    icon: Star,
    accent: "text-primary",
    highlight: true,
    features: [
      "Todo lo de Starter",
      "💰 Ganancia real y margen",
      "ROI por proyecto",
      "Costos por tarea y recursos",
      "Alertas inteligentes de riesgo",
      "Gestión avanzada de recursos",
    ],
    cta: "Actualizar a Pro",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Decisiones estratégicas y control total",
    monthlyPEN: 200, monthlyUSD: 60, annualPEN: 160, annualUSD: 48,
    icon: TrendingUp,
    accent: "text-cost-warning",
    features: [
      "Todo lo de Pro",
      "Dashboard ejecutivo",
      "Proyección financiera",
      "Informes avanzados",
      "Control multi-proyecto",
      "Soporte prioritario",
    ],
    cta: "Actualizar a Business",
  },
];

export default function SettingsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activePlan, setActivePlan] = useState<PlanId>("free");
  const [billing, setBilling] = useState<Billing>("monthly");

  // Configuración de Trabajo (impacta cálculos)
  const [currency, setCurrency] = useState<Currency>("PEN");
  const [costModel, setCostModel] = useState<CostModel>("mixed");
  const [targetMargin, setTargetMargin] = useState<number>(20);
  const [autoAlerts, setAutoAlerts] = useState({
    budgetOver80: true,
    marginBelow15: true,
    projectInLoss: true,
  });
  const [autoBehavior, setAutoBehavior] = useState({
    autoCostFromResources: true,
    autoProgressFromTasks: true,
    inferSchedule: false,
  });

  // Alertas inteligentes
  const [alerts, setAlerts] = useState({
    losingMoney: true,
    criticalDelays: true,
    budgetExceeded: true,
    blockingTask: true,
  });
  const [channel, setChannel] = useState<Channel>("system");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Configuración</h1>
        <p className="text-[13px] text-muted-foreground">Define cómo funciona tu negocio en ScorpionFlow</p>
      </div>

      <Tabs defaultValue="work" className="space-y-4">
        <TabsList className="bg-secondary border border-border h-9">
          <TabsTrigger value="work" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <Briefcase className="w-3.5 h-3.5" /> Trabajo
          </TabsTrigger>
          <TabsTrigger value="interface" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <Palette className="w-3.5 h-3.5" /> Interfaz
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <AlertTriangle className="w-3.5 h-3.5" /> Alertas inteligentes
          </TabsTrigger>
          <TabsTrigger value="account" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <User className="w-3.5 h-3.5" /> Cuenta
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <CreditCard className="w-3.5 h-3.5" /> Suscripciones
          </TabsTrigger>
        </TabsList>

        {/* === TAB: CONFIGURACIÓN DE TRABAJO === */}
        <TabsContent value="work">
          <div className="space-y-4 max-w-3xl">
            {/* Intro */}
            <div className="surface-card p-4 rounded-lg flex items-center gap-3 bg-primary/5 border-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="text-[12px] text-muted-foreground">
                <span className="text-foreground font-medium">Cada opción aquí cambia cómo se calculan tus costos, márgenes y alertas.</span>{" "}
                No es decorativo: impacta directamente en tu negocio.
              </div>
            </div>

            {/* Moneda */}
            <SectionCard
              icon={DollarSign}
              title="Moneda principal"
              hint="Afecta cotizaciones, costos y reportes"
            >
              <div className="grid grid-cols-2 gap-3">
                <RadioOption
                  active={currency === "PEN"}
                  onClick={() => setCurrency("PEN")}
                  label="S/ Soles peruanos"
                  desc="Mostrar todos los montos en PEN"
                />
                <RadioOption
                  active={currency === "USD"}
                  onClick={() => setCurrency("USD")}
                  label="$ Dólares"
                  desc="Mostrar todos los montos en USD"
                />
              </div>
            </SectionCard>

            {/* Modelo de costos */}
            <SectionCard
              icon={Briefcase}
              title="Modelo de costos"
              hint="Define cómo calcula el sistema tus recursos y proyectos"
            >
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "hourly", label: "Por horas", desc: "Tarifa por hora trabajada" },
                  { id: "monthly", label: "Por meses", desc: "Pago mensual fijo" },
                  { id: "fixed", label: "Costos fijos", desc: "Monto único por entregable" },
                  { id: "mixed", label: "Mixto", desc: "Combina horas, meses y fijos" },
                ] as const).map((opt) => (
                  <RadioOption
                    key={opt.id}
                    active={costModel === opt.id}
                    onClick={() => setCostModel(opt.id)}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Margen objetivo */}
            <SectionCard
              icon={Target}
              title="Margen objetivo mínimo"
              hint="Si tus proyectos bajan de este margen, el sistema te alerta"
            >
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value) || 0)}
                  className="h-9 text-[13px] bg-secondary border-border font-mono-data"
                />
                <span className="text-[13px] font-semibold text-foreground">%</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[11px]",
                    targetMargin >= 30 ? "text-cost-positive" : targetMargin >= 15 ? "text-cost-warning" : "text-destructive"
                  )}
                >
                  {targetMargin >= 30 ? "Saludable" : targetMargin >= 15 ? "Aceptable" : "Riesgoso"}
                </Badge>
              </div>
            </SectionCard>

            {/* Alertas automáticas */}
            <SectionCard
              icon={AlertTriangle}
              title="Alertas automáticas"
              hint="El sistema te avisa cuando algo pone en riesgo tu rentabilidad"
            >
              <div className="space-y-3">
                <ToggleRow
                  label="Costos superan el 80% del presupuesto"
                  desc="Aviso temprano antes de excederte"
                  checked={autoAlerts.budgetOver80}
                  onChange={(v) => setAutoAlerts({ ...autoAlerts, budgetOver80: v })}
                />
                <ToggleRow
                  label={`Margen baja del ${Math.min(15, targetMargin)}%`}
                  desc="Detecta proyectos poco rentables"
                  checked={autoAlerts.marginBelow15}
                  onChange={(v) => setAutoAlerts({ ...autoAlerts, marginBelow15: v })}
                />
                <ToggleRow
                  label="Proyecto entra en pérdida"
                  desc="Notifica cuando el costo supera el ingreso"
                  checked={autoAlerts.projectInLoss}
                  onChange={(v) => setAutoAlerts({ ...autoAlerts, projectInLoss: v })}
                />
              </div>
            </SectionCard>

            {/* Comportamiento automático */}
            <SectionCard
              icon={Wand2}
              title="Automatización"
              hint="Reduce el trabajo manual: deja que el sistema calcule por ti"
            >
              <div className="space-y-3">
                <ToggleRow
                  label="Calcular costos desde los recursos"
                  desc="El costo del proyecto se actualiza automáticamente"
                  checked={autoBehavior.autoCostFromResources}
                  onChange={(v) => setAutoBehavior({ ...autoBehavior, autoCostFromResources: v })}
                />
                <ToggleRow
                  label="Actualizar progreso por tareas completadas"
                  desc="El % de avance se calcula solo"
                  checked={autoBehavior.autoProgressFromTasks}
                  onChange={(v) => setAutoBehavior({ ...autoBehavior, autoProgressFromTasks: v })}
                />
                <ToggleRow
                  label="Inferir cronograma si no existe"
                  desc="Usa las fechas de tus tareas para estimar inicio y fin"
                  checked={autoBehavior.inferSchedule}
                  onChange={(v) => setAutoBehavior({ ...autoBehavior, inferSchedule: v })}
                />
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <Button className="h-9 text-[13px]">Guardar configuración</Button>
            </div>
          </div>
        </TabsContent>

        {/* === TAB: INTERFAZ === */}
        <TabsContent value="interface">
          <div className="surface-card p-5 space-y-5 max-w-2xl">
            <h3 className="text-sm font-semibold text-foreground">Apariencia</h3>
            <div>
              <Label className="text-[12px] text-muted-foreground mb-3 block">Tema del sistema</Label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "surface-card p-4 rounded-lg text-center transition-sf border-2",
                    theme === "dark" ? "border-primary" : "border-transparent hover:border-border"
                  )}
                >
                  <div className="w-full h-16 rounded-md bg-[#121212] border border-[#2a2a2a] mb-2 flex items-center justify-center">
                    <div className="w-8 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-[12px] font-medium text-foreground">Oscuro</span>
                  <p className="text-[10px] text-muted-foreground">Tema oficial ScorpionFlow</p>
                  {theme === "dark" && <Badge className="mt-1.5 text-[10px]">Activo</Badge>}
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "surface-card p-4 rounded-lg text-center transition-sf border-2",
                    theme === "light" ? "border-primary" : "border-transparent hover:border-border"
                  )}
                >
                  <div className="w-full h-16 rounded-md bg-white border border-gray-200 mb-2 flex items-center justify-center">
                    <div className="w-8 h-1.5 rounded-full bg-orange-500" />
                  </div>
                  <span className="text-[12px] font-medium text-foreground">Claro</span>
                  <p className="text-[10px] text-muted-foreground">Fondo blanco</p>
                  {theme === "light" && <Badge className="mt-1.5 text-[10px]">Activo</Badge>}
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* === TAB: ALERTAS INTELIGENTES === */}
        <TabsContent value="alerts">
          <div className="space-y-4 max-w-2xl">
            <div className="surface-card p-4 rounded-lg flex items-center gap-3 bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-primary" />
              </div>
              <div className="text-[12px] text-muted-foreground">
                <span className="text-foreground font-medium">Solo alertas que importan.</span>{" "}
                Te avisamos cuando hay algo que decidir, no por cada acción.
              </div>
            </div>

            <SectionCard
              icon={Bell}
              title="Recibir alertas cuando…"
              hint="Cada alerta requiere una decisión tuya"
            >
              <div className="space-y-3">
                <ToggleRow
                  label="El proyecto está perdiendo dinero"
                  desc="Costos > ingresos esperados"
                  checked={alerts.losingMoney}
                  onChange={(v) => setAlerts({ ...alerts, losingMoney: v })}
                />
                <ToggleRow
                  label="Hay retrasos críticos"
                  desc="Tareas vencidas o atraso > 15% del cronograma"
                  checked={alerts.criticalDelays}
                  onChange={(v) => setAlerts({ ...alerts, criticalDelays: v })}
                />
                <ToggleRow
                  label="Se supera el presupuesto"
                  desc="Total gastado mayor al presupuesto del proyecto"
                  checked={alerts.budgetExceeded}
                  onChange={(v) => setAlerts({ ...alerts, budgetExceeded: v })}
                />
                <ToggleRow
                  label="Una tarea bloquea el avance"
                  desc="Tarea bloqueada por más de 24 horas"
                  checked={alerts.blockingTask}
                  onChange={(v) => setAlerts({ ...alerts, blockingTask: v })}
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={Zap}
              title="Canal de alertas"
              hint="Dónde quieres recibirlas"
            >
              <div className="grid grid-cols-2 gap-3">
                <RadioOption
                  active={channel === "system"}
                  onClick={() => setChannel("system")}
                  label="Sistema"
                  desc="Campana de notificaciones en la app"
                />
                <RadioOption
                  active={channel === "email"}
                  onClick={() => setChannel("email")}
                  label="Correo electrónico"
                  desc="Recibe un email por cada alerta crítica"
                />
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <Button className="h-9 text-[13px]">Guardar alertas</Button>
            </div>
          </div>
        </TabsContent>

        {/* === TAB: CUENTA (SIMPLIFICADO) === */}
        <TabsContent value="account">
          <div className="surface-card p-5 space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-foreground">Tu cuenta</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Nombre</Label>
                <Input defaultValue="admin_scorpion" className="h-9 text-[13px] bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Email</Label>
                <Input defaultValue="admin@scorpionflow.com" className="h-9 text-[13px] bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Contraseña actual</Label>
                <Input type="password" placeholder="••••••••" className="h-9 text-[13px] bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Nueva contraseña</Label>
                <Input type="password" placeholder="••••••••" className="h-9 text-[13px] bg-secondary border-border" />
              </div>

              <Button className="h-9 text-[13px] w-full sm:w-auto">Guardar cambios</Button>
            </div>
          </div>
        </TabsContent>

        {/* === TAB: SUSCRIPCIONES (sin cambios) === */}
        <TabsContent value="subscriptions">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Elige el plan que se adapta a tu negocio</h3>
                <p className="text-[13px] text-muted-foreground">
                  Empieza gratis. Trabaja sin límites. Controla tu negocio cuando estés listo.
                </p>
              </div>

              <div className="inline-flex items-center gap-1 bg-secondary border border-border rounded-lg p-1 self-start sm:self-auto">
                <button
                  onClick={() => setBilling("monthly")}
                  className={cn(
                    "px-3 h-7 rounded-md text-[12px] font-medium transition-sf",
                    billing === "monthly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={cn(
                    "px-3 h-7 rounded-md text-[12px] font-medium transition-sf flex items-center gap-1.5",
                    billing === "annual"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Anual
                  <span className="text-[10px] font-semibold text-cost-positive bg-cost-positive/10 px-1.5 py-0.5 rounded">
                    -20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = activePlan === plan.id;
                const pricePEN = billing === "monthly" ? plan.monthlyPEN : plan.annualPEN;
                const priceUSD = billing === "monthly" ? plan.monthlyUSD : plan.annualUSD;
                const isFree = plan.id === "free";

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "surface-card p-5 rounded-xl border-2 transition-sf relative flex flex-col",
                      plan.highlight
                        ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_8px_30px_-8px_hsl(var(--primary)/0.4)] md:scale-[1.02]"
                        : isCurrent
                        ? "border-primary/60"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 scorpion-gradient text-[10px] font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-current" />
                        Más popular
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn("w-4 h-4", plan.accent)} />
                      <h4 className="text-[14px] font-semibold text-foreground">{plan.name}</h4>
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-4 min-h-[32px]">
                      {plan.tagline}
                    </p>

                    <div className="mb-4 pb-4 border-b border-border">
                      {isFree ? (
                        <div>
                          <span className="font-mono-data text-3xl font-bold text-foreground">Gratis</span>
                          <p className="text-[11px] text-muted-foreground mt-1">Para siempre</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-mono-data text-3xl font-bold text-foreground">
                              S/ {pricePEN}
                            </span>
                            <span className="text-[12px] text-muted-foreground">/ mes</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            ≈ ${priceUSD} USD {billing === "annual" && "· facturado anual"}
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 text-[12px] text-foreground/85 mb-5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", plan.highlight ? "text-primary" : "text-cost-positive")} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Badge variant="secondary" className="w-full justify-center py-2 text-[12px]">
                        Plan actual
                      </Badge>
                    ) : (
                      <Button
                        variant={plan.highlight ? "default" : "outline"}
                        className={cn(
                          "w-full h-9 text-[12px]",
                          plan.highlight && "scorpion-gradient text-white border-0 hover:opacity-90"
                        )}
                        onClick={() => setActivePlan(plan.id)}
                      >
                        {plan.cta}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="surface-card p-4 rounded-lg flex items-center gap-3 bg-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="text-[12px] text-muted-foreground">
                <span className="text-foreground font-medium">Cancela cuando quieras.</span>{" "}
                Puedes cambiar o cancelar tu plan en cualquier momento. Sin permanencia ni costos ocultos.
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Helpers locales ---------- */

function SectionCard({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5 rounded-lg space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function RadioOption({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg border-2 transition-sf bg-secondary/40",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={cn(
            "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
            active ? "border-primary" : "border-muted-foreground"
          )}
        >
          {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </div>
        <span className="text-[12px] font-medium text-foreground">{label}</span>
      </div>
      <p className="text-[11px] text-muted-foreground pl-5">{desc}</p>
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <span className="text-[12.5px] font-medium text-foreground block">{label}</span>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
