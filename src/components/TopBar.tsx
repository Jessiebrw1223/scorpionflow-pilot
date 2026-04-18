import { useLocation } from "react-router-dom";
import { NotificationsBell } from "@/components/NotificationsBell";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Centro de Control",
  "/clientes": "Clientes",
  "/cotizaciones": "Cotizaciones",
  "/projects": "Proyectos",
  "/team": "Equipo",
  "/tasks": "Tareas",
  "/resources": "Recursos",
  "/costs": "Costos",
  "/reports": "Informes",
  "/settings": "Configuración",
};

export function TopBar() {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] || "ScorpionFlow";

  return (
    <div className="flex items-center justify-between mb-4 sticky top-0 z-30 -mx-6 px-6 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationsBell />
      </div>
    </div>
  );
}
