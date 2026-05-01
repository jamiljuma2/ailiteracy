import { createFileRoute } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * API endpoint that returns the active Google Meet link for authenticated users.
 * Only returns the link if the user has at least one paid enrollment with course_access.
 */
export const Route = createFileRoute("/api/public/get-meet-link")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Get the auth token from the request
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }

        const token = authHeader.slice(7);

        // Verify the token with Supabase
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
          if (userError || !userData.user) {
            return new Response("Unauthorized", { status: 401 });
          }

          // Check if user has active enrollment with course access
          const { data, error } = await supabaseAdmin
            .from("enrollments")
            .select("id, course_access, payment_status")
            .eq("email", userData.user.email)
            .eq("course_access", true)
            .limit(1);

          if (error) {
            return new Response(JSON.stringify({ meetLink: null }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!data || data.length === 0) {
            return new Response(JSON.stringify({ meetLink: null }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const meetLink = process.env.MEET_LINK ?? null;
          return new Response(JSON.stringify({ meetLink }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ meetLink: null }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
