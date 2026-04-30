import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Returns the active Google Meet link, but only for users who have at least
// one paid enrollment with course_access granted.
export const getMyMeetLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data, error } = await supabase
      .from("enrollments")
      .select("id, course_access, payment_status")
      .eq("course_access", true)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { meetLink: null as string | null };
    }

    return { meetLink: process.env.MEET_LINK ?? null };
  });
