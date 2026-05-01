import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Mail, CheckCircle2, XCircle, LogOut, Eye, Award } from "lucide-react";

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
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  status: string;
  amount: number;
  phone: string;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  mpesa_receipt: string | null;
  result_code: number | null;
  result_desc: string | null;
  created_at: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    success: "bg-success/15 text-success",
    failed: "bg-destructive/15 text-destructive",
    pending: "bg-muted text-muted-foreground",
    initiated: "bg-primary/15 text-primary",
  };
  return `text-xs px-2 py-1 rounded-full ${map[status] ?? "bg-muted text-muted-foreground"}`;
}

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [resending, setResending] = useState<string | null>(null);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [detailsFor, setDetailsFor] = useState<Enrollment | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      const { data } = await supabase
        .from("enrollments")
        .select(
          "id, full_name, email, phone, amount, payment_status, mpesa_receipt, checkout_request_id, merchant_request_id, failure_reason, created_at, updated_at",
        )
        .order("created_at", { ascending: false });
      setEnrollments((data as Enrollment[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const openDetails = async (enrollment: Enrollment) => {
    setDetailsFor(enrollment);
    setPayments(null);
    setLoadingPayments(true);
    const { data } = await supabase
      .from("payments")
      .select(
        "id, status, amount, phone, checkout_request_id, merchant_request_id, mpesa_receipt, result_code, result_desc, created_at",
      )
      .eq("enrollment_id", enrollment.id)
      .order("created_at", { ascending: false });
    setPayments((data as Payment[]) ?? []);
    setLoadingPayments(false);
  };

  const resend = async (id: string) => {
    setResending(id);
    setToast(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
    setToast({ id, ok: res.ok, msg: res.ok ? "Email sent" : json.error || "Failed to send" });
    setTimeout(() => setToast(null), 4000);
  };

  const issueCert = async (id: string) => {
    setIssuing(id);
    setToast(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/issue-certificate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ enrollmentId: id }),
    });
    const json = await res.json().catch(() => ({}));
    setIssuing(null);
    setToast({
      id,
      ok: res.ok,
      msg: res.ok ? `Certificate sent (${json.certificateCode})` : json.error || "Failed to issue",
    });
    setTimeout(() => setToast(null), 5000);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account doesn't have admin access.
          </p>
          <Button onClick={signOut} variant="outline" className="mt-4">
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppSidebar variant="admin" onSignOut={signOut}>
      <main className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Enrollments</h1>
              <p className="text-sm text-muted-foreground">{enrollments.length} total</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-t border-border/40">
                    <td className="px-4 py-3">{e.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.phone}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(e.payment_status)}>{e.payment_status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.mpesa_receipt || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {toast?.id === e.id && (
                          <span
                            className={`text-xs flex items-center gap-1 ${toast.ok ? "text-success" : "text-destructive"}`}
                          >
                            {toast.ok ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {toast.msg}
                          </span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openDetails(e)} className="shrink-0">
                          <Eye className="h-3 w-3 mr-1" /> Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={resending === e.id || e.payment_status !== "success"}
                          onClick={() => resend(e.id)}
                          title={
                            e.payment_status !== "success"
                              ? "Only available for paid enrollments"
                              : "Resend Google Meet email"
                          }
                        >
                          {resending === e.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Mail className="h-3 w-3 mr-1" /> Resend
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="shrink-0"
                          disabled={issuing === e.id || e.payment_status !== "success"}
                          onClick={() => issueCert(e.id)}
                          title={
                            e.payment_status !== "success"
                              ? "Only available for paid enrollments"
                              : "Issue certificate of completion"
                          }
                        >
                          {issuing === e.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Award className="h-3 w-3 mr-1" /> Issue cert
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog
          open={!!detailsFor}
          onOpenChange={(o) => {
            if (!o) {
              setDetailsFor(null);
              setPayments(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            {detailsFor && (
              <>
                <DialogHeader>
                  <DialogTitle>Payment details</DialogTitle>
                  <DialogDescription>
                    {detailsFor.full_name} · {detailsFor.email}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  <section className="rounded-lg border border-border/60 p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-foreground mb-2">Enrollment</h3>
                    <Row label="Status">
                      <span className={statusBadge(detailsFor.payment_status)}>
                        {detailsFor.payment_status}
                      </span>
                    </Row>
                    <Row label="Phone">
                      <span className="font-mono">{detailsFor.phone}</span>
                    </Row>
                    <Row label="Amount">KES {detailsFor.amount.toLocaleString()}</Row>
                    <Row label="M-Pesa receipt">
                      <span className="font-mono">{detailsFor.mpesa_receipt || "—"}</span>
                    </Row>
                    <Row label="Checkout request ID">
                      <span className="font-mono text-xs break-all">
                        {detailsFor.checkout_request_id || "—"}
                      </span>
                    </Row>
                    <Row label="Merchant request ID">
                      <span className="font-mono text-xs break-all">
                        {detailsFor.merchant_request_id || "—"}
                      </span>
                    </Row>
                    {detailsFor.failure_reason && (
                      <Row label="Failure reason">
                        <span className="text-destructive">{detailsFor.failure_reason}</span>
                      </Row>
                    )}
                    <Row label="Created">{fmt(detailsFor.created_at)}</Row>
                    <Row label="Updated">{fmt(detailsFor.updated_at)}</Row>
                  </section>

                  <section className="rounded-lg border border-border/60 p-4">
                    <h3 className="font-semibold text-foreground mb-3 text-sm">
                      Transactions ({payments?.length ?? 0})
                    </h3>
                    {loadingPayments ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : payments && payments.length > 0 ? (
                      <div className="space-y-3">
                        {payments.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-md border border-border/40 p-3 text-sm space-y-1.5"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={statusBadge(p.status)}>{p.status}</span>
                              <span className="text-xs text-muted-foreground">
                                {fmt(p.created_at)}
                              </span>
                            </div>
                            <Row label="Transaction ID">
                              <span className="font-mono text-xs break-all">
                                {p.merchant_request_id || p.checkout_request_id || "—"}
                              </span>
                            </Row>
                            <Row label="Phone">
                              <span className="font-mono text-xs">{p.phone}</span>
                            </Row>
                            <Row label="Amount">KES {p.amount.toLocaleString()}</Row>
                            {p.mpesa_receipt && (
                              <Row label="Receipt">
                                <span className="font-mono text-xs">{p.mpesa_receipt}</span>
                              </Row>
                            )}
                            {p.result_desc && <Row label="Result">{p.result_desc}</Row>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No transactions recorded.
                      </p>
                    )}
                  </section>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </AppSidebar>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-muted-foreground text-xs uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className="text-left sm:text-right">{children}</span>
    </div>
  );
}
