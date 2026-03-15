import { projects, costFormatter } from "@/lib/mock-data";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectReportTab } from "@/components/projects/ProjectReportTab";
import { WBSTab } from "@/components/projects/WBSTab";
import { TimeChangeTab } from "@/components/projects/TimeChangeTab";
import { ScheduleNetworkTab } from "@/components/projects/ScheduleNetworkTab";
import { FolderKanban, FileText, Network, Clock, GitBranch } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Proyectos</h1>
        <p className="text-[13px] text-muted-foreground">
          Gestión del ciclo de vida de proyectos
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary border border-border h-9">
          <TabsTrigger value="overview" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <FolderKanban className="w-3.5 h-3.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <FileText className="w-3.5 h-3.5" /> Informes
          </TabsTrigger>
          <TabsTrigger value="wbs" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <GitBranch className="w-3.5 h-3.5" /> EDT
          </TabsTrigger>
          <TabsTrigger value="time" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <Clock className="w-3.5 h-3.5" /> Cambio de Tiempo
          </TabsTrigger>
          <TabsTrigger value="network" className="text-[12px] gap-1.5 data-[state=active]:bg-card">
            <Network className="w-3.5 h-3.5" /> Gráfica de Cronogramas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectStatusCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <ProjectReportTab />
        </TabsContent>

        <TabsContent value="wbs">
          <WBSTab />
        </TabsContent>

        <TabsContent value="time">
          <TimeChangeTab />
        </TabsContent>

        <TabsContent value="network">
          <ScheduleNetworkTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
