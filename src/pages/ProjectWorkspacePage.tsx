import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderKanban, LayoutDashboard, ListChecks, DollarSign, FileBarChart2, Receipt, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_META } from "@/lib/business-intelligence";
import ProjectSummaryTab from "@/components/projects/workspace/ProjectSummaryTab";
import ProjectTasksTab from "@/components/projects/workspace/ProjectTasksTab";
import ProjectCostsTab from "@/components/projects/workspace/ProjectCostsTab";
import ProjectReportTab from "@/components/projects/workspace/ProjectReportTab";
import ResourcesSummary from "@/components/resources/ResourcesSummary";

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("summary");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(id, name, company), quotations(id, title)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks-summary", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, status, due_date, blocks_project")
        .eq("project_id", id!);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" /> Abriendo workspace del proyecto…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="surface-card p-8 text-center space-y-3">
        <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="font-semibold">Proyecto no encontrado</p>
        <Button asChild variant="outline"><Link to="/projects"><ArrowLeft className="w-4 h-4" /> Volver a proyectos</Link></Button>
      </div>
    );
  }

  const meta = PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.on_track;

  return (
    <div className="space-y-4">
      {/* Header del workspace */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/projects")}
          className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-sf"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Todos los proyectos
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FolderKanban className="w-5 h-5 text-primary fire-icon shrink-0" />
              <h1 className="text-xl font-bold fire-text truncate">{project.name}</h1>
              <span className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded", meta.bg, meta.color)}>
                {meta.label}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 ml-7">
              Cliente: <span className="text-foreground font-medium">{project.clients?.name || "—"}</span>
              {project.clients?.company && <> · {project.clients.company}</>}
              {project.quotations && (
                <>
                  {" · "}
                  <Link to="/cotizaciones" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Receipt className="w-3 h-3" /> Origen: {project.quotations.title}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Workspace tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-secondary border border-border w-full justify-start overflow-x-auto">
          <TabsTrigger value="summary" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <LayoutDashboard className="w-3.5 h-3.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <ListChecks className="w-3.5 h-3.5" /> Tareas
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <Users className="w-3.5 h-3.5" /> Recursos
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <DollarSign className="w-3.5 h-3.5" /> Costos
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <FileBarChart2 className="w-3.5 h-3.5" /> Informe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <ProjectSummaryTab project={project} tasks={tasks} onTabChange={setTab} />
        </TabsContent>
        <TabsContent value="tasks">
          <ProjectTasksTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="resources">
          <div className="space-y-3">
            <div className="surface-card p-3 bg-muted/20 border border-border">
              <p className="text-[12px] text-muted-foreground">
                Vista general de equipo, tecnología y maquinaria. Los recursos se asignan a tareas dentro del proyecto.
              </p>
            </div>
            <ResourcesSummary />
          </div>
        </TabsContent>
        <TabsContent value="costs">
          <ProjectCostsTab project={project} />
        </TabsContent>
        <TabsContent value="report">
          <ProjectReportTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
