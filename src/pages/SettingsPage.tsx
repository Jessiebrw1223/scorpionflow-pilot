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
} from "lucide-react";

type PlanId = "free" | "starter" | "pro" | "business";
type Billing = "monthly" | "annual";

const PLANS: Array<{
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPEN: number;
  monthlyUSD: number;
  annualPEN: number; // precio mensual al pagar anual
  annualUSD: number;
  icon: typeof Sparkles;
  accent: string; // tailwind classes
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
  const [notifications, setNotifications] = useState({
    tasks: true,
    delays: true,
    budget: false,
    comments: true,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Configuración</h1>
        <p className="text-[13px] text-muted-foreground">Personaliza tu experiencia en ScorpionFlow</p>
      </div>

      <Tabs defaultValue="interface" className="space-y-4">
        <TabsList className="bg-secondary border border-border h-9">
          <TabsTrigger value="interface" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <Palette className="w-3.5 h-3.5" /> Interfaz
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <CreditCard className="w-3.5 h-3.5" /> Suscripciones
          </TabsTrigger>
          <TabsTrigger value="account" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <User className="w-3.5 h-3.5" /> Cuenta
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <Bell className="w-3.5 h-3.5" /> Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Interface Preferences */}
        <TabsContent value="interface">
          <div className="surface-card p-5 space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Preferencias de Interfaz</h3>
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

        {/* Subscriptions */}
        <TabsContent value="subscriptions">
          <div className="space-y-5">
            {/* Header + Billing toggle */}
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

            {/* Plans grid */}
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

        {/* Account */}
        <TabsContent value="account">
          <div className="surface-card p-5 space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-foreground">Gestión de Cuenta</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Nombre de usuario</Label>
                <Input defaultValue="admin_scorpion" className="h-9 text-[13px] bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-muted-foreground">Correo electrónico</Label>
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

              <div className="surface-card p-3 bg-secondary/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-muted-foreground">Rol</span>
                    <p className="font-semibold text-foreground">Administrador</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proyectos asignados</span>
                    <p className="font-semibold text-foreground">3 proyectos</p>
                  </div>
                </div>
              </div>

              <Button className="h-9 text-[13px]">Guardar Cambios</Button>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="surface-card p-5 space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-foreground">Preferencias de Notificaciones</h3>
            <div className="space-y-4">
              {[
                { key: "tasks" as const, label: "Tareas asignadas", desc: "Recibir notificación cuando se te asigne una tarea" },
                { key: "delays" as const, label: "Alertas de retrasos", desc: "Avisos cuando el proyecto tenga retrasos" },
                { key: "budget" as const, label: "Alertas de presupuesto", desc: "Alertas cuando se supere el presupuesto" },
                { key: "comments" as const, label: "Comentarios y colaboraciones", desc: "Notificaciones de comentarios en tareas" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-border">
                <Label className="text-[12px] text-muted-foreground mb-2 block">Canal de notificaciones</Label>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[11px]">Sistema</Badge>
                  <Badge variant="outline" className="text-[11px]">Correo electrónico</Badge>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
