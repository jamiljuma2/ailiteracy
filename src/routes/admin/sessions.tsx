import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import AdminSessionDashboard from "../../components/AdminSessionDashboard";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessionsPage,
});

function AdminSessionsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.assign("/admin/login");
        return;
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!role) {
        window.location.assign("/");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (!authorized) {
    return null;
  }

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
