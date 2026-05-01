import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in | AI Skills Africa" },
      {
        name: "description",
        content: "Sign in to access your AI Skills Africa account, enrollments, and certificates.",
      },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const route = async (session: { user: { id: string } } | null) => {
      if (!session) return;
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      navigate({ to: role ? "/admin" : "/dashboard" });
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      route(session);
    });
    supabase.auth.getSession().then(({ data }) => route(data.session));
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    // onAuthStateChange will handle the redirect (admin vs learner)
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 p-6 rounded-xl border border-border/60 bg-card"
      >
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-foreground hover:underline">
            Create one
          </Link>
        </p>
        <p className="text-xs text-muted-foreground text-center">
          <Link to="/" className="hover:text-foreground">
            ← Back to site
          </Link>
        </p>
      </form>
    </div>
  );
}
