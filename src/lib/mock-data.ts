export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeAvatar: string;
  estimatedCost: number;
  actualCost: number;
  estimatedHours: number;
  loggedHours: number;
  dueDate: string;
  projectId: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  code: string;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
  tasksTotal: number;
  tasksCompleted: number;
  burnRate: number;
  status: "on_track" | "at_risk" | "over_budget";
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  avatar: string;
  utilization: number;
  hourlyRate: number;
  assignedProjects: string[];
}

const avatarInitials = (name: string) => name.split(" ").map(n => n[0]).join("");

export const projects: Project[] = [
  {
    id: "proj-001",
    name: "Project Alpha",
    code: "ALPHA",
    budget: 150000,
    spent: 98500,
    progress: 62,
    startDate: "2026-01-15",
    endDate: "2026-06-30",
    tasksTotal: 48,
    tasksCompleted: 30,
    burnRate: 1240,
    status: "at_risk",
  },
  {
    id: "proj-002",
    name: "Project Beta",
    code: "BETA",
    budget: 85000,
    spent: 42000,
    progress: 45,
    startDate: "2026-02-01",
    endDate: "2026-08-15",
    tasksTotal: 32,
    tasksCompleted: 14,
    burnRate: 680,
    status: "on_track",
  },
  {
    id: "proj-003",
    name: "Project Gamma",
    code: "GAMMA",
    budget: 200000,
    spent: 215000,
    progress: 78,
    startDate: "2025-10-01",
    endDate: "2026-04-30",
    tasksTotal: 64,
    tasksCompleted: 50,
    burnRate: 2100,
    status: "over_budget",
  },
];

export const resources: Resource[] = [
  { id: "res-001", name: "Ana García", role: "Senior Developer", avatar: "", utilization: 92, hourlyRate: 85, assignedProjects: ["proj-001", "proj-003"] },
  { id: "res-002", name: "Carlos López", role: "Backend Developer", avatar: "", utilization: 78, hourlyRate: 75, assignedProjects: ["proj-001"] },
  { id: "res-003", name: "María Torres", role: "UX Designer", avatar: "", utilization: 65, hourlyRate: 70, assignedProjects: ["proj-002"] },
  { id: "res-004", name: "Luis Ramírez", role: "Project Manager", avatar: "", utilization: 88, hourlyRate: 95, assignedProjects: ["proj-001", "proj-002", "proj-003"] },
  { id: "res-005", name: "Elena Martín", role: "QA Engineer", avatar: "", utilization: 45, hourlyRate: 65, assignedProjects: ["proj-002"] },
  { id: "res-006", name: "Diego Fernández", role: "DevOps Engineer", avatar: "", utilization: 95, hourlyRate: 90, assignedProjects: ["proj-001", "proj-003"] },
];

export const tasks: Task[] = [
  { id: "ALPHA-001", title: "Setup CI/CD Pipeline", description: "Configure automated build and deploy", status: "done", priority: "high", assignee: "Diego Fernández", assigneeAvatar: "", estimatedCost: 2400, actualCost: 2800, estimatedHours: 32, loggedHours: 35, dueDate: "2026-02-15", projectId: "proj-001", tags: ["devops", "infrastructure"] },
  { id: "ALPHA-002", title: "Design Database Schema", description: "Create ERD and implement migrations", status: "done", priority: "high", assignee: "Carlos López", assigneeAvatar: "", estimatedCost: 1800, actualCost: 1600, estimatedHours: 24, loggedHours: 21, dueDate: "2026-02-20", projectId: "proj-001", tags: ["backend", "database"] },
  { id: "ALPHA-003", title: "Implement Auth Module", description: "JWT-based authentication with role management", status: "in_progress", priority: "critical", assignee: "Ana García", assigneeAvatar: "", estimatedCost: 3200, actualCost: 3800, estimatedHours: 40, loggedHours: 44, dueDate: "2026-03-10", projectId: "proj-001", tags: ["backend", "security"] },
  { id: "ALPHA-004", title: "Dashboard UI Components", description: "Build reusable chart and card components", status: "in_progress", priority: "medium", assignee: "Ana García", assigneeAvatar: "", estimatedCost: 2100, actualCost: 1200, estimatedHours: 28, loggedHours: 16, dueDate: "2026-03-20", projectId: "proj-001", tags: ["frontend", "ui"] },
  { id: "ALPHA-005", title: "API Rate Limiting", description: "Implement rate limiting middleware", status: "todo", priority: "medium", assignee: "Carlos López", assigneeAvatar: "", estimatedCost: 900, actualCost: 0, estimatedHours: 12, loggedHours: 0, dueDate: "2026-03-25", projectId: "proj-001", tags: ["backend", "security"] },
  { id: "ALPHA-006", title: "User Notifications System", description: "Real-time notification service", status: "todo", priority: "low", assignee: "Carlos López", assigneeAvatar: "", estimatedCost: 1500, actualCost: 0, estimatedHours: 20, loggedHours: 0, dueDate: "2026-04-05", projectId: "proj-001", tags: ["backend", "feature"] },
  { id: "ALPHA-007", title: "Performance Load Testing", description: "Load test all critical endpoints", status: "blocked", priority: "high", assignee: "Elena Martín", assigneeAvatar: "", estimatedCost: 1200, actualCost: 0, estimatedHours: 16, loggedHours: 0, dueDate: "2026-04-10", projectId: "proj-001", tags: ["qa", "testing"] },
  { id: "ALPHA-008", title: "Resource Allocation View", description: "Drag-and-drop resource assignment interface", status: "in_review", priority: "high", assignee: "Ana García", assigneeAvatar: "", estimatedCost: 2800, actualCost: 2600, estimatedHours: 36, loggedHours: 33, dueDate: "2026-03-15", projectId: "proj-001", tags: ["frontend", "feature"] },
  { id: "BETA-001", title: "Wireframe Prototyping", description: "Create interactive wireframes for client review", status: "done", priority: "high", assignee: "María Torres", assigneeAvatar: "", estimatedCost: 1400, actualCost: 1400, estimatedHours: 20, loggedHours: 20, dueDate: "2026-02-28", projectId: "proj-002", tags: ["design", "ux"] },
  { id: "BETA-002", title: "Component Library Setup", description: "Initialize shared component library", status: "in_progress", priority: "medium", assignee: "María Torres", assigneeAvatar: "", estimatedCost: 1050, actualCost: 700, estimatedHours: 15, loggedHours: 10, dueDate: "2026-03-15", projectId: "proj-002", tags: ["design", "frontend"] },
  { id: "GAMMA-001", title: "Data Migration Script", description: "Migrate legacy data to new schema", status: "in_review", priority: "critical", assignee: "Diego Fernández", assigneeAvatar: "", estimatedCost: 4500, actualCost: 5200, estimatedHours: 50, loggedHours: 58, dueDate: "2026-03-01", projectId: "proj-003", tags: ["backend", "migration"] },
  { id: "GAMMA-002", title: "Report Generation Engine", description: "Automated PDF/Excel report builder", status: "in_progress", priority: "high", assignee: "Ana García", assigneeAvatar: "", estimatedCost: 3600, actualCost: 2800, estimatedHours: 40, loggedHours: 32, dueDate: "2026-03-20", projectId: "proj-003", tags: ["backend", "reporting"] },
];

export const costFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const costFormatterDetailed = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export const statusLabels: Record<TaskStatus, string> = {
  todo: "Pendiente",
  in_progress: "En Proceso",
  in_review: "En Revisión",
  done: "Finalizada",
  blocked: "Bloqueada",
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};
