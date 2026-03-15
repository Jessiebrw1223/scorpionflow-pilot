import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Cpu, Cog, LayoutDashboard } from "lucide-react";
import ResourcesSummary from "@/components/resources/ResourcesSummary";
import PersonnelTab from "@/components/resources/PersonnelTab";
import TechResourcesTab from "@/components/resources/TechResourcesTab";
import MachineryTab from "@/components/resources/MachineryTab";

export default function ResourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-foreground">Recursos</h1>
        <p className="text-[13px] text-muted-foreground">
          Gestión integral de recursos humanos, tecnológicos e industriales
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="summary" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <LayoutDashboard className="w-3.5 h-3.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <Users className="w-3.5 h-3.5" /> Personal
          </TabsTrigger>
          <TabsTrigger value="tech" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <Cpu className="w-3.5 h-3.5" /> Tecnológicos
          </TabsTrigger>
          <TabsTrigger value="machinery" className="gap-1.5 text-[12px] data-[state=active]:bg-card">
            <Cog className="w-3.5 h-3.5" /> Maquinaria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary"><ResourcesSummary /></TabsContent>
        <TabsContent value="personnel"><PersonnelTab /></TabsContent>
        <TabsContent value="tech"><TechResourcesTab /></TabsContent>
        <TabsContent value="machinery"><MachineryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
