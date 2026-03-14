import { projects, costFormatter } from "@/lib/mock-data";
import { ProjectStatusCard } from "@/components/ProjectStatusCard";

export default function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Proyectos</h1>
        <p className="text-[13px] text-muted-foreground">
          Gestión del ciclo de vida de proyectos
        </p>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectStatusCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
