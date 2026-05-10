import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoUrl from "@/assets/scorpionflow-logo.jpg";
import {
  LayoutDashboard, FolderKanban, ChevronLeft, ChevronRight, Settings,
  LogOut, Receipt, Contact2, Users, FileBarChart2, Building2,
  ShieldAlert, Lock, HelpCircle, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePremiumGate, type PremiumFeature } from "@/hooks/usePremiumGate";
import { UpsellDialog } from "@/components/billing/UpsellDialog";
import { useWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { usePlan } from "@/hooks/usePlan";
import { useIsSuperadmin } from "@/hooks/useIsSuperadmin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface NavItem {
  labelKey: string;
  icon: React.ElementType;
  path: string;
  groupKey?: string;
  feature?: PremiumFeature;
  visibleFor?: WorkspaceRole[];
  businessOnly?: boolean;
}

const ADMIN_ONLY: WorkspaceRole[] = ["owner", "admin"];

const navItems: NavItem[] = [
  { labelKey: "sidebar.items.dashboard", icon: LayoutDashboard, path: "/", groupKey: "sidebar.groups.vision" },
  { labelKey: "sidebar.items.clients", icon: Contact2, path: "/clientes", groupKey: "sidebar.groups.commercial", visibleFor: ADMIN_ONLY },
  { labelKey: "sidebar.items.quotations", icon: Receipt, path: "/cotizaciones", groupKey: "sidebar.groups.commercial", visibleFor: ADMIN_ONLY },
  { labelKey: "sidebar.items.projects", icon: FolderKanban, path: "/projects", groupKey: "sidebar.groups.execution" },
  { labelKey: "sidebar.items.team", icon: Users, path: "/team", groupKey: "sidebar.groups.execution" },
  { labelKey: "sidebar.items.executiveOverview", icon: Building2, path: "/finanzas", groupKey: "sidebar.groups.businessFinance", feature: "executive_dashboard", visibleFor: ADMIN_ONLY, businessOnly: true },
  { labelKey: "sidebar.items.resources", icon: Users, path: "/resources", groupKey: "sidebar.groups.businessFinance", feature: "resources_management", visibleFor: ADMIN_ONLY, businessOnly: true },
  { labelKey: "sidebar.items.reports", icon: FileBarChart2, path: "/reports", groupKey: "sidebar.groups.businessFinance", feature: "advanced_reports", visibleFor: ADMIN_ONLY, businessOnly: true },
  { labelKey: "sidebar.items.risks", icon: ShieldAlert, path: "/riesgos", groupKey: "sidebar.groups.businessFinance", feature: "executive_dashboard", visibleFor: ADMIN_ONLY, businessOnly: true },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const gate = usePremiumGate();
  const { role } = useWorkspace();
  const { isBusiness } = usePlan();
  const { isSuperadmin } = useIsSuperadmin();

  const handleLogout = async () => {
    await signOut();
    toast.success(t("sidebar.logoutSuccess"));
    navigate("/", { replace: true });
  };

  const visibleNavItems = navItems.filter((it) => {
    if (it.visibleFor && (!role || !it.visibleFor.includes(role))) return false;
    if (it.businessOnly && !isBusiness) return false;
    return true;
  });

  const groups = visibleNavItems.reduce<Record<string, NavItem[]>>((acc, it) => {
    const g = it.groupKey || "sidebar.groups.general";
    (acc[g] = acc[g] || []).push(it);
    return acc;
  }, {});

  const userInitial = (user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  return (
    <>
      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar flex flex-col z-50 transition-sf border-r border-sidebar-border",
        collapsed ? "w-16" : "w-60"
      )}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-lg fire-glow relative z-10 bg-gradient-to-br from-primary/20 to-accent/20">
            <img src={logoUrl} alt="ScorpionFlow" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col relative z-10">
              <span className="font-bold text-sm tracking-wide truncate fire-text">ScorpionFlow</span>
              <span className="text-[10px] text-sidebar-muted tracking-widest uppercase">{t("auth.layout.tagline")}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-3 overflow-y-auto">
          {Object.entries(groups).map(([groupKey, items]) => (
            <div key={groupKey} className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 pb-1 text-[9px] uppercase tracking-[0.2em] text-sidebar-muted/60 font-semibold">
                  {t(groupKey)}
                </div>
              )}
              {items.map((item) => {
                const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
                const isLocked = item.feature ? gate.locked(item.feature) : false;
                const label = t(item.labelKey);
                const baseClasses = cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-sf group relative overflow-hidden w-full",
                  isActive && !isLocked
                    ? "bg-sidebar-accent text-primary font-medium fire-glow"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                );
                const inner = (
                  <>
                    {isActive && !isLocked && (
                      <>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary shadow-[0_0_8px_hsl(15_90%_55%)]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                      </>
                    )}
                    <item.icon className={cn("w-4 h-4 shrink-0 transition-all",
                      isActive && !isLocked ? "text-primary fire-icon"
                        : "group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(15_90%_55%)]")} />
                    {!collapsed && <span className="truncate relative z-10 flex-1 text-left">{label}</span>}
                    {isLocked && !collapsed && <Lock className="w-3 h-3 shrink-0 text-primary/70" aria-label="Premium" />}
                    {isLocked && collapsed && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-primary/80" aria-label="Premium" />}
                  </>
                );
                if (isLocked && item.feature) {
                  return (
                    <button key={item.path} type="button" onClick={() => gate.requestAccess(item.feature!)}
                      className={baseClasses} title={`${label} · ${t("sidebar.premiumLocked")}`}>
                      {inner}
                    </button>
                  );
                }
                return (
                  <NavLink key={item.path} to={item.path} className={baseClasses}>
                    {inner}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {!collapsed && user && (
          <div className="px-2 pb-2">
            <div className="px-3 py-2 rounded-lg bg-sidebar-accent/40 flex items-center gap-2.5 border border-sidebar-border">
              <div className="w-8 h-8 rounded-full scorpion-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 fire-glow">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-sidebar-foreground truncate">{displayName}</div>
                <div className="text-[10px] text-sidebar-muted truncate">{user.email}</div>
              </div>
            </div>
          </div>
        )}

        <div className="px-2 py-2 border-t border-sidebar-border space-y-0.5">
          {!collapsed && (
            <div className="px-2 pb-1">
              <LanguageSwitcher variant="pill" className="w-full justify-center" />
            </div>
          )}
          {isSuperadmin && (
            <NavLink to="/admin" className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-sf",
              location.pathname.startsWith("/admin")
                ? "bg-orange-950/40 text-orange-300 border border-orange-900/40"
                : "text-orange-400/80 hover:text-orange-300 hover:bg-orange-950/30"
            )}>
              <Shield className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{t("sidebar.footer.admin")}</span>}
            </NavLink>
          )}
          <NavLink to="/settings" className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-sf",
            location.pathname === "/settings" ? "bg-sidebar-accent text-primary"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}>
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t("sidebar.footer.settings")}</span>}
          </NavLink>
          <NavLink to="/learn" className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-sf",
            location.pathname.startsWith("/learn") ? "bg-sidebar-accent text-primary"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}>
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t("sidebar.footer.help")}</span>}
          </NavLink>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sidebar-muted hover:text-destructive hover:bg-destructive/10 transition-sf w-full">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t("sidebar.footer.logout")}</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-sf w-full">
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : (
              <><ChevronLeft className="w-4 h-4 shrink-0" /><span>{t("sidebar.footer.collapse")}</span></>
            )}
          </button>
        </div>
      </aside>

      <UpsellDialog open={gate.dialog.open} onOpenChange={gate.close} feature={gate.dialog.feature} />
    </>
  );
}
