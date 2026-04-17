import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutGrid,
  List as ListIcon,
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  GitBranch,
  Sparkles,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PLANNING_MODE_META, getNodeTypesForMode, NODE_TYPE_META } from "@/lib/business-intelligence";
import ProjectTasksTab from "./ProjectTasksTab";
import PlanningHierarchyView from "./PlanningHierarchyView";
import PlanningTimelineView from "./PlanningTimelineView";
import QuickCreateNodeDialog from "./QuickCreateNodeDialog";

interface Props {
  projectId: string;
  planningMode: "agile" | "traditional";
}

type Mode = "list" | "kanban" | "calendar";

const MODE_META: Record<Mode, { label: string; helper: string; icon: typeof ListIcon }> = {
  list: { label: "Backlog", helper: "Estructura jerárquica del proyecto", icon: ListIcon },
  kanban: { label: "Tablero", helper: "Flujo visual por estado", icon: LayoutGrid },
  calendar: { label: "Cronograma", helper: "Actividades distribuidas en el tiempo", icon: CalendarIcon },
};

const VIEW_STORAGE_KEY = "scorpion.planning.lastView";

export default function ProjectPlanningTab({ projectId, planningMode }: Props) {
  const qc = useQueryClient();

  // Recordar última vista usada (preferencia del usuario)
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "list";
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return (saved === "list" || saved === "kanban" || saved === "calendar") ? saved : "list";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    }
  }, [mode]);

  // Diálogo de creación
  const [createOpen, setCreateOpen] = useState(false);
  const [createParent, setCreateParent] = useState<string | null>(null);
  const [createType, setCreateType] = useState<string>("epic");

  const openCreate = (parentId: string | null, nodeType: string) => {
    setCreateParent(parentId);
    setCreateType(nodeType);
    setCreateOpen(true);
  };

  // Cambiar modo de planificación (Ágil ↔ Tradicional)
  const switchMode = useMutation({
    mutationFn: async (newMode: "agile" | "traditional") => {
      const { error } = await supabase
        .from("projects")
        .update({ planning_mode: newMode as any })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: (_d, newMode) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success(`Modo cambiado a ${PLANNING_MODE_META[newMode].label}`, {
        description: "La data se conserva — solo cambia la visualización.",
      });
    },
    onError: (e: Error) => toast.error("No se pudo cambiar el modo", { description: e.message }),
  });

  const current = MODE_META[mode];
  const modeMeta = PLANNING_MODE_META[planningMode];
  const rootType = getNodeTypesForMode(planningMode)[0];

  return (
    <div className="space-y-3">
      {/* Header del centro operativo */}
      <div className="surface-card p-3 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <current.icon className="w-4 h-4 text-primary fire-icon" />
              Planificación · {current.label}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {current.helper} — toda la ejecución del proyecto en un solo lugar.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Ágil / Tradicional */}
            <div className="flex items-center bg-secondary/60 border border-border rounded-md p-1 gap-0.5" title="Modelo de organización del proyecto">
              {(["agile", "traditional"] as const).map((m) => {
                const meta = PLANNING_MODE_META[m];
                const active = planningMode === m;
                const Icon = m === "agile" ? Sparkles : Building2;
                return (
                  <button
                    key={m}
                    onClick={() => !active && switchMode.mutate(m)}
                    disabled={switchMode.isPending}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-sf",
                      active
                        ? "bg-card border border-border text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={meta.description}
                  >
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Selector de vista */}
            <div className="flex items-center bg-secondary/60 border border-border rounded-md p-1 gap-0.5">
              {(Object.keys(MODE_META) as Mode[]).map((key) => {
                const Icon = MODE_META[key].icon;
                const active = mode === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-sf",
                      active
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {MODE_META[key].label}
                  </button>
                );
              })}
            </div>

            {/* Crear elemento raíz */}
            <Button
              onClick={() => openCreate(null, rootType)}
              size="sm"
              className="fire-button"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva {NODE_TYPE_META[rootType].label}
            </Button>
          </div>
        </div>

        {/* Indicador del modelo activo */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border pt-2">
          <GitBranch className="w-3 h-3" />
          <span>Modelo:</span>
          <span className={cn("font-semibold", modeMeta.color)}>{modeMeta.emoji} {modeMeta.label}</span>
          <span>·</span>
          <span className="font-mono-data">{modeMeta.description}</span>
        </div>
      </div>

      {/* Vista activa */}
      {mode === "list" && (
        <PlanningHierarchyView projectId={projectId} mode={planningMode} onCreate={openCreate} />
      )}
      {mode === "kanban" && (
        <ProjectTasksTab key="kanban" projectId={projectId} defaultView="kanban" />
      )}
      {mode === "calendar" && (
        <PlanningTimelineView projectId={projectId} />
      )}

      <QuickCreateNodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        parentId={createParent}
        nodeType={createType}
      />
    </div>
  );
}
