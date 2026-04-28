import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMeetEmail } from "@/server/send-meet-email.server";

export const Route = createFileRoute("/api/admin/resend-meet-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) return new Response("Unauthorized", { status: 401 });

        // Verify the requester is a logged-in user
        const userClient = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } },
        );
        const { data: userData, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        // Verify the user has the 'admin' role
        const { data: roleRow } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) return new Response("Forbidden", { status: 403 });

        let body: any;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
        const enrollmentId: string | undefined = body?.enrollmentId;
        if (!enrollmentId) return Response.json({ error: "enrollmentId required" }, { status: 400 });

        const { data: enrollment, error: eErr } = await supabaseAdmin
          .from("enrollments")
          .select("id, full_name, email, payment_status")
          .eq("id", enrollmentId)
          .maybeSingle();
        if (eErr || !enrollment) return Response.json({ error: "Enrollment not found" }, { status: 404 });

        const result = await sendMeetEmail({
          enrollmentId: enrollment.id,
          recipientEmail: enrollment.email,
          recipientName: enrollment.full_name,
          triggerSource: "admin_resend",
          triggeredBy: userId,
        });

        if (!result.ok) return Response.json({ error: result.error }, { status: 502 });
        return Response.json({ ok: true });
      },
    },
  },
});
