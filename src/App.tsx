import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectWorkspacePage from "./pages/ProjectWorkspacePage";
import SettingsPage from "./pages/SettingsPage";
import ClientesPage from "./pages/ClientesPage";
import CotizacionesPage from "./pages/CotizacionesPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppShell() {
  return (
    <Routes>
      <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/auth/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <>
              <AppSidebar />
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/cotizaciones" element={<CotizacionesPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectWorkspacePage />} />
                  {/* Rutas legacy redirigidas al nuevo flujo por proyecto */}
                  <Route path="/tasks" element={<Navigate to="/projects" replace />} />
                  <Route path="/costs" element={<Navigate to="/projects" replace />} />
                  <Route path="/reports" element={<Navigate to="/projects" replace />} />
                  <Route path="/resources" element={<Navigate to="/projects" replace />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
