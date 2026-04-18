import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Palette, CreditCard, User, Bell, Check, Sparkles, Star, Rocket, TrendingUp, Zap,
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
          <div className="space-y-4">
            <div className="surface-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Plan Activo</h3>
              <p className="text-[12px] text-muted-foreground mb-4">Gestiona tu suscripción y funcionalidades</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin Plan */}
                <div className={cn(
                  "surface-card p-5 rounded-lg border-2 transition-sf",
                  activePlan === "admin" ? "border-primary" : "border-transparent hover:border-border"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <h4 className="text-[14px] font-semibold text-foreground">Plan Administrador</h4>
                  </div>
                  <div className="mb-4">
                    <span className="font-mono-data text-2xl font-bold text-foreground">S/ 79</span>
                    <span className="text-[12px] text-muted-foreground"> / mes</span>
                  </div>
                  <ul className="space-y-2 text-[12px] text-foreground/80 mb-4">
                    {["Gestión de usuarios", "Gestión de recursos", "Informes avanzados", "Planificación de proyectos", "Visualización de redes de cronograma", "Análisis de utilización"].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cost-positive" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="surface-card p-2 bg-secondary/30 rounded text-[11px] text-muted-foreground mb-3">
                    <strong className="text-cost-warning">Limitación:</strong> No puede modificar actividades críticas ni fechas estratégicas del cronograma.
                  </div>
                  {activePlan === "admin" ? (
                    <Badge className="w-full justify-center py-1.5">Plan Actual</Badge>
                  ) : (
                    <Button variant="outline" className="w-full h-9 text-[12px]" onClick={() => setActivePlan("admin")}>
                      Cambiar a este plan
                    </Button>
                  )}
                </div>

                {/* Manager Plan */}
                <div className={cn(
                  "surface-card p-5 rounded-lg border-2 transition-sf relative overflow-hidden",
                  activePlan === "manager" ? "border-primary" : "border-transparent hover:border-border"
                )}>
                  <div className="absolute top-0 right-0 scorpion-gradient text-[10px] text-white font-bold px-3 py-1 rounded-bl-lg">
                    PRO
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-cost-warning" />
                    <h4 className="text-[14px] font-semibold text-foreground">Plan Gerente de Proyectos</h4>
                  </div>
                  <div className="mb-4">
                    <span className="font-mono-data text-2xl font-bold text-foreground">S/ 250</span>
                    <span className="text-[12px] text-muted-foreground"> / mes</span>
                  </div>
                  <ul className="space-y-2 text-[12px] text-foreground/80 mb-4">
                    {[
                      "Todo del plan Administrador",
                      "Toma de decisiones bajo incertidumbre",
                      "Simulación de escenarios",
                      "Optimización de cronogramas",
                      "Análisis de retrasos",
                      "Gestión avanzada de costos",
                      "Redes de planificación CPM/PERT",
                      "Aceleración de proyectos",
                      "Análisis de ruta crítica",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cost-positive" /> {f}
                      </li>
                    ))}
                  </ul>
                  {activePlan === "manager" ? (
                    <Badge className="w-full justify-center py-1.5">Plan Actual</Badge>
                  ) : (
                    <Button className="w-full h-9 text-[12px]" onClick={() => setActivePlan("manager")}>
                      Actualizar a Gerente
                    </Button>
                  )}
                </div>
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
