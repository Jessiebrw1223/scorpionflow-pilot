import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Flame,
  ArrowRight,
  Eye,
  AlertTriangle,
  TrendingDown,
  Activity,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Target,
  LineChart,
  Sparkles,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type Billing = "monthly" | "annual";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    emotional: "Empieza a organizar tu trabajo",
    features: ["Hasta 5 clientes", "Hasta 3 proyectos", "Tareas básicas", "Vista simple"],
    cta: "Empezar gratis",
    highlight: false,
    accent: "muted" as const,
  },
  {
    id: "starter",
    name: "Starter",
    monthly: 35,
    emotional: "Trabaja sin límites",
    features: ["Clientes ilimitados", "Más proyectos", "Planificación completa", "Calendario"],
    cta: "Actualizar a Starter",
    highlight: false,
    accent: "blue" as const,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 90,
    emotional: "Aquí es donde dejas de adivinar.",
    features: [
      "Todo lo anterior",
      "💰 Ver si ganas o pierdes dinero",
      "Margen real",
      "ROI claro",
      "Costos por tarea",
      "Alertas inteligentes",
      "Recursos con impacto",
    ],
    cta: "Actualizar a Pro",
    highlight: true,
    accent: "fire" as const,
  },
  {
    id: "business",
    name: "Business",
    monthly: 200,
    emotional: "Decisiones estratégicas",
    features: ["Todo Pro", "Proyección financiera", "Control multi-proyecto", "Reportes ejecutivos"],
    cta: "Hablar con ventas",
    highlight: false,
    accent: "muted" as const,
  },
];

const COMPARE_ROWS: Array<{
  label: string;
  values: [string | boolean, string | boolean, string | boolean, string | boolean];
}> = [
  { label: "Clientes", values: ["limitado", true, true, true] },
  { label: "Proyectos", values: ["limitado", true, true, true] },
  { label: "Ver si ganas dinero", values: [false, false, true, true] },
  { label: "Margen real", values: [false, false, true, true] },
  { label: "ROI claro", values: [false, false, true, true] },
  { label: "Alertas inteligentes", values: [false, false, true, true] },
  { label: "Gestión de recursos", values: [false, false, true, true] },
];

/**
 * Landing pública de ScorpionFlow.
 * Copy persuasivo orientado a "ver la verdad" del negocio.
 * Si el usuario ya está autenticado, lo enviamos al dashboard.
 */
export default function LandingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center fire-glow">
              <Flame className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">
              Scorpion<span className="text-primary">Flow</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-muted-foreground">
            <a href="#dolor" className="hover:text-foreground transition-colors">Problema</a>
            <a href="#solucion" className="hover:text-foreground transition-colors">Solución</a>
            <a href="#diferencia" className="hover:text-foreground transition-colors">Diferencia</a>
            <a href="#precios" className="hover:text-foreground transition-colors">Precios</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm" className="text-[13px]">Ingresar</Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm" className="fire-button text-[13px] font-semibold">
                Empezar gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        {/* Glow background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-5 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/40 text-[11px] uppercase tracking-widest text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            Control real de proyectos y dinero
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
            ¿Tu proyecto genera dinero
            <span className="block text-primary">…o solo trabajo?</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Gestionas tareas todos los días. Pero, ¿realmente sabes cómo va tu negocio?
          </p>

          <p className="mt-5 text-sm md:text-base text-foreground/80 italic max-w-xl mx-auto">
            "Lo peligroso no es perder… es no saberlo."
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/register">
              <Button size="lg" className="fire-button h-12 px-7 font-semibold text-sm gap-2">
                <Flame className="w-4 h-4" />
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#demo">
              <Button size="lg" variant="outline" className="h-12 px-7 text-sm gap-2 border-border hover:border-primary/50">
                <Eye className="w-4 h-4" />
                Ver un proyecto real
              </Button>
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Sin tarjeta de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Empiezas en minutos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Sin compromisos</span>
          </div>
        </div>
      </section>

      {/* DOLOR */}
      <section id="dolor" className="border-t border-border/60 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">Diagnóstico</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              No estás desorganizado.
              <span className="block text-muted-foreground">Estás a ciegas.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: TrendingDown, title: "Tu proyecto avanza…", body: "pero tus números no están claros." },
              { icon: AlertTriangle, title: "Decides por intuición…", body: "no por datos reales." },
              { icon: Activity, title: "Trabajas mucho…", body: "pero no sabes si vale la pena." },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={i} className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTADO + DEMO */}
      <section id="demo" className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">El cambio</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              En minutos, entiendes lo que antes ignorabas.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Así se ve un problema… cuando por fin es visible.
            </p>
            <div className="mt-6">
              <Link to="/auth/register">
                <Button size="lg" className="fire-button h-12 px-6 font-semibold text-sm gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Ver cómo se pierde dinero en un proyecto real
                </Button>
              </Link>
            </div>
          </div>

          {/* Mock card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl rounded-3xl" />
            <div className="relative rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Proyecto</p>
                  <p className="font-semibold">Hotel Costa Sur — Renovación</p>
                </div>
                <span className="px-2 py-1 rounded-md bg-destructive/15 text-destructive text-[11px] font-semibold border border-destructive/30">
                  Perdiendo dinero
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Presupuesto</p>
                  <p className="font-mono-data font-semibold mt-1">S/ 48,000</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Gastado</p>
                  <p className="font-mono-data font-semibold mt-1 text-cost-warning">S/ 51,200</p>
                </div>
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-destructive">Ganancia</p>
                  <p className="font-mono-data font-semibold mt-1 text-destructive">−S/ 3,200</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span>Costos superaron el 100% del presupuesto.</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-cost-warning shrink-0" />
                  <span>El margen cayó del 22% al −6%.</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-status-blocked shrink-0" />
                  <span>2 tareas críticas bloquean la entrega.</span>
                </div>
              </div>

              <p className="mt-5 text-[12px] text-muted-foreground italic border-t border-border pt-3">
                "Los números no opinan. Te muestran la realidad."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section id="solucion" className="border-t border-border/60 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">La solución</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Un proyecto sin números…
              <span className="block text-primary">es solo una suposición.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Target, title: "Todo en un solo lugar", body: "Clientes, cotizaciones, proyectos y dinero — sin pestañas." },
              { icon: LineChart, title: "Sin hojas externas", body: "Tus costos y márgenes se calculan solos, en tiempo real." },
              { icon: ShieldCheck, title: "Sin suposiciones", body: "Cada estado del proyecto está respaldado por datos reales." },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIACIÓN */}
      <section id="diferencia" className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">La diferencia</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              No necesitas más orden.
              <span className="block text-primary">Necesitas claridad.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Otras herramientas</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-muted-foreground" /> Organizan tareas</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-muted-foreground" /> Estructuran procesos</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-muted-foreground" /> Ordenan información</li>
              </ul>
            </div>
            <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-accent/5 p-6 fire-glow">
              <p className="text-[11px] uppercase tracking-widest text-primary mb-3 font-semibold">ScorpionFlow</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Revela lo que no estás viendo</li>
                <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" /> Alerta antes de que sea tarde</li>
                <li className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Decide con datos, no intuición</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ANTES vs DESPUÉS */}
      <section className="border-t border-border/60 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Cuando ves los números,
              <span className="block text-primary">cambias la forma de trabajar.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-[11px] uppercase tracking-widest text-destructive mb-4 font-semibold">Antes</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> Trabajas sin certeza</li>
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> Ajustas sobre la marcha</li>
                <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> Reaccionas tarde</li>
              </ul>
            </div>
            <div className="rounded-xl border border-cost-positive/40 bg-cost-positive/5 p-6">
              <p className="text-[11px] uppercase tracking-widest text-cost-positive mb-4 font-semibold">Después</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cost-positive mt-0.5 shrink-0" /> Ves lo que importa</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cost-positive mt-0.5 shrink-0" /> Corriges a tiempo</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-cost-positive mt-0.5 shrink-0" /> Decides con seguridad</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">Precios</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Empiezas gratis.
              <span className="block text-muted-foreground">Pagas cuando realmente lo necesitas.</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground italic">
              "Hay cosas que solo puedes ver… cuando decides mirar en serio."
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "S/ 0",
                tag: "Para empezar",
                features: ["Hasta 3 proyectos", "Tareas y clientes", "Vista básica de costos"],
                cta: "Empezar gratis",
                highlight: false,
              },
              {
                name: "Pro",
                price: "S/ 49",
                tag: "Más elegido",
                features: ["Proyectos ilimitados", "Control de margen y ganancia", "Alertas inteligentes", "Reportes ejecutivos"],
                cta: "Probar Pro",
                highlight: true,
              },
              {
                name: "Business",
                price: "S/ 129",
                tag: "Para decidir",
                features: ["Todo lo de Pro", "Multi-usuario", "Roles y permisos", "Soporte prioritario"],
                cta: "Hablar con ventas",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-gradient-to-br from-primary/10 to-accent/5 fire-glow"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-bold">
                    {plan.tag}
                  </span>
                )}
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth/register" className="mt-6">
                  <Button
                    className={`w-full ${plan.highlight ? "fire-button font-semibold" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section className="border-t border-border/60 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-3xl mx-auto px-5 py-24 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            No necesitas más herramientas.
            <span className="block text-primary">Necesitas ver la verdad.</span>
          </h2>
          <p className="mt-6 text-muted-foreground">
            Empieza gratis. Trabaja sin límites. Controla tu negocio cuando estés listo.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/register">
              <Button size="lg" className="fire-button h-12 px-8 font-semibold gap-2">
                <Flame className="w-4 h-4" />
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span>© {new Date().getFullYear()} ScorpionFlow — Control real de proyectos.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/auth/login" className="hover:text-foreground transition-colors">Ingresar</Link>
            <Link to="/auth/register" className="hover:text-foreground transition-colors">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
