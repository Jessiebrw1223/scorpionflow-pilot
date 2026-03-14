import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  FolderKanban,
  DollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Tareas", icon: ListChecks, path: "/tasks" },
  { label: "Recursos", icon: Users, path: "/resources" },
  { label: "Proyectos", icon: FolderKanban, path: "/projects" },
  { label: "Costos", icon: DollarSign, path: "/costs" },
  { label: "Informes", icon: BarChart3, path: "/reports" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar flex flex-col z-50 transition-sf border-r border-sidebar-border",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg scorpion-gradient flex items-center justify-center shrink-0 shadow-lg">
          <Flame className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sidebar-foreground font-bold text-sm tracking-wide truncate">
              ScorpionFlow
            </span>
            <span className="text-[10px] text-sidebar-muted tracking-widest uppercase">
              Project Control
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-sf group relative",
                isActive
                  ? "bg-sidebar-accent text-primary font-medium"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
              )}
              <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-sf",
            location.pathname === "/settings"
              ? "bg-sidebar-accent text-primary"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Configuración</span>}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-sf w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Contraer</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
