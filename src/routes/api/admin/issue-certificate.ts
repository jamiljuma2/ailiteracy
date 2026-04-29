import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  generateCertificatePdf,
  generateCertificateCode,
} from "@/server/generate-certificate.server";
import { sendCertificateEmail } from "@/server/send-certificate-email.server";

export const Route = createFileRoute("/api/admin/issue-certificate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) return new Response("Unauthorized", { status: 401 });

        const userClient = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } },
        );
        const { data: userData, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const { data: roleRow } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) return new Response("Forbidden", { status: 403 });

        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const enrollmentId: string | undefined = body?.enrollmentId;
        if (!enrollmentId) return Response.json({ error: "enrollmentId required" }, { status: 400 });

        const { data: enrollment, error: eErr } = await supabaseAdmin
          .from("enrollments")
          .select("id, full_name, email, payment_status")
          .eq("id", enrollmentId)
          .maybeSingle();
        if (eErr || !enrollment) {
          return Response.json({ error: "Enrollment not found" }, { status: 404 });
        }
        if (enrollment.payment_status !== "success") {
          return Response.json(
            { error: "Enrollment is not paid" },
            { status: 400 },
          );
        }

        const courseTitle = "AI for Beginners";
        const certificateCode = generateCertificateCode();
        const issuedAt = new Date();

        const pdfBytes = await generateCertificatePdf({
          recipientName: enrollment.full_name,
          courseTitle,
          certificateCode,
          issuedAt,
        });

        const sendResult = await sendCertificateEmail({
          recipientEmail: enrollment.email,
          recipientName: enrollment.full_name,
          courseTitle,
          certificateCode,
          pdfBytes,
        });

        // Record certificate
        await supabaseAdmin.from("certificates").insert({
          enrollment_id: enrollment.id,
          certificate_code: certificateCode,
          recipient_name: enrollment.full_name,
          recipient_email: enrollment.email,
          course_title: courseTitle,
          issued_at: issuedAt.toISOString(),
          issued_by: userId,
          email_status: sendResult.ok ? "sent" : "failed",
          email_error: sendResult.ok ? null : sendResult.error,
        });

        // Mark enrollment completed on first successful issuance
        if (sendResult.ok) {
          await supabaseAdmin
            .from("enrollments")
            .update({ course_completed: true, completed_at: issuedAt.toISOString() })
            .eq("id", enrollment.id);
        }

        if (!sendResult.ok) {
          return Response.json({ error: sendResult.error }, { status: 502 });
        }
        return Response.json({ ok: true, certificateCode });
      },
    },
  },
});
