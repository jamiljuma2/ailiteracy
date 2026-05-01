import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — AI Skills Africa" },
      {
        name: "description",
        content: "View your enrollments, payment status, and join active Google Meet sessions.",
      },
    ],
  }),
  component: Dashboard,
});

type Enrollment = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  payment_status: string;
  course_access: boolean;
  course_completed: boolean;
  mpesa_receipt: string | null;
  failure_reason: string | null;
  created_at: string;
};

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "success" || s === "completed") {
    return (
      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Paid
      </Badge>
    );
  }
  if (s === "failed" || s === "cancelled") {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      if (cancelled) return;
      setEmail(session.user.email ?? "");

      const { data, error: enrollErr } = await supabase
        .from("enrollments")
        .select(
          "id, full_name, email, phone, amount, payment_status, course_access, course_completed, mpesa_receipt, failure_reason, created_at",
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (enrollErr) {
        setError(enrollErr.message);
      } else {
        setEnrollments((data ?? []) as Enrollment[]);
      }

      try {
        // Get the session to extract the JWT token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token");

        const response = await fetch("/api/public/get-meet-link", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (!cancelled) setMeetLink(result.meetLink);
      } catch {
        // user has no active enrollment — leave null
      }

      if (!cancelled) setLoading(false);
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const activeEnrollments = enrollments.filter((e) => e.course_access && !e.course_completed);
  const hasActive = activeEnrollments.length > 0;

  return (
    <AppSidebar variant="user" onSignOut={handleSignOut}>
      <main className="min-h-screen bg-background text-foreground px-6 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">My Dashboard</h1>
            <p className="mt-3 text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>

          {/* Active session card */}
          <section className="mb-10">
            <div className="rounded-2xl bg-gradient-card border border-primary/30 p-6 md:p-8 shadow-elegant">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Live session</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActive && meetLink
                        ? "Your Google Meet link for the active cohort."
                        : hasActive
                          ? "Your link will appear here once your cohort starts."
                          : "Enroll and complete payment to unlock your Google Meet link."}
                    </p>
                  </div>
                </div>
                {hasActive && meetLink ? (
                  <a href={meetLink} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-glow">
                      Join Meet <ExternalLink className="ml-1 h-4 w-4" />
                    </Button>
                  </a>
                ) : !hasActive ? (
                  <Link to="/">
                    <Button variant="outline">
                      Enroll now <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          {/* Enrollments */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">My enrollments</h2>

            {loading ? (
              <div className="rounded-2xl border border-border/60 p-10 text-center text-muted-foreground">
                Loading…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
                {error}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-gradient-card p-10 text-center">
                <p className="text-muted-foreground">You haven't enrolled in any cohort yet.</p>
                <Link to="/" className="inline-block mt-4">
                  <Button className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                    Browse the course <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-2xl bg-gradient-card border border-border/60 p-6 shadow-card"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">AI for Beginners</h3>
                          {statusBadge(e.payment_status)}
                          {e.course_access && (
                            <Badge variant="outline" className="border-primary/40 text-primary">
                              Access granted
                            </Badge>
                          )}
                          {e.course_completed && (
                            <Badge variant="outline" className="border-success/40 text-success">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div className="flex justify-between sm:block">
                            <dt className="text-muted-foreground">Amount</dt>
                            <dd className="font-medium">KES {e.amount.toLocaleString()}</dd>
                          </div>
                          <div className="flex justify-between sm:block">
                            <dt className="text-muted-foreground">Phone</dt>
                            <dd className="font-medium">{e.phone}</dd>
                          </div>
                          {e.mpesa_receipt && (
                            <div className="flex justify-between sm:block">
                              <dt className="text-muted-foreground">M-Pesa receipt</dt>
                              <dd className="font-mono text-xs">{e.mpesa_receipt}</dd>
                            </div>
                          )}
                          <div className="flex justify-between sm:block">
                            <dt className="text-muted-foreground">Enrolled</dt>
                            <dd className="font-medium">
                              {new Date(e.created_at).toLocaleDateString()}
                            </dd>
                          </div>
                        </dl>
                        {e.failure_reason && (
                          <p className="mt-3 text-xs text-destructive">{e.failure_reason}</p>
                        )}
                      </div>
                      {e.course_access && !e.course_completed && meetLink && (
                        <a
                          href={meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <Button size="sm" variant="outline">
                            <Video className="h-4 w-4" /> Join Meet
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AppSidebar>
  );
}
