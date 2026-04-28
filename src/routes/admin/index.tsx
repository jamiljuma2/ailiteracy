import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2, XCircle, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  payment_status: string;
  mpesa_receipt: string | null;
  created_at: string;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [resending, setResending] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      const { data: role } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!role) { setAuthorized(false); setLoading(false); return; }
      setAuthorized(true);
      const { data } = await supabase
        .from("enrollments")
        .select("id, full_name, email, phone, amount, payment_status, mpesa_receipt, created_at")
        .order("created_at", { ascending: false });
      setEnrollments((data as Enrollment[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const resend = async (id: string) => {
    setResending(id);
    setToast(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/resend-meet-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ enrollmentId: id }),
    });
    const json = await res.json().catch(() => ({}));
    setResending(null);
    setToast({ id, ok: res.ok, msg: res.ok ? "Email sent" : (json.error || "Failed to send") });
    setTimeout(() => setToast(null), 4000);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground mt-2">Your account doesn't have admin access.</p>
          <Button onClick={signOut} variant="outline" className="mt-4">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Enrollments</h1>
            <p className="text-sm text-muted-foreground">{enrollments.length} total</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> Sign out</Button>
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-t border-border/40">
                  <td className="px-4 py-3">{e.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      e.payment_status === "success" ? "bg-success/15 text-success" :
                      e.payment_status === "failed" ? "bg-destructive/15 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{e.payment_status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{e.mpesa_receipt || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {toast?.id === e.id && (
                        <span className={`text-xs flex items-center gap-1 ${toast.ok ? "text-success" : "text-destructive"}`}>
                          {toast.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {toast.msg}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resending === e.id || e.payment_status !== "success"}
                        onClick={() => resend(e.id)}
                        title={e.payment_status !== "success" ? "Only available for paid enrollments" : "Resend Google Meet email"}
                      >
                        {resending === e.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <><Mail className="h-3 w-3 mr-1" /> Resend</>}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No enrollments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
