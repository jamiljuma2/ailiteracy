import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import AdminSessionDashboard from "../../components/AdminSessionDashboard";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessionsPage,
});

function AdminSessionsPage() {
  return (
    <AppSidebar variant="admin">
      <main className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Admin: Manage Sessions</h1>
          <AdminSessionDashboard />
        </div>
      </main>
    </AppSidebar>
  );
}
