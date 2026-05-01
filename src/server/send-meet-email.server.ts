// Server-only helper: sends the Google Meet enrollment email via Resend
// and logs the attempt to enrollment_emails.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface SendArgs {
  enrollmentId: string;
  recipientEmail: string;
  recipientName: string;
  triggerSource: "webhook" | "admin_resend";
  triggeredBy?: string | null;
}

export async function sendMeetEmail({
  enrollmentId,
  recipientEmail,
  recipientName,
  triggerSource,
  triggeredBy = null,
}: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const meetLink = process.env.MEET_LINK;

  if (!apiKey) return logAndReturn("RESEND_API_KEY not configured");
  if (!meetLink) return logAndReturn("MEET_LINK not configured");

  const subject = "You're enrolled — your Google Meet link inside";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#ffffff;padding:24px;color:#111;">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:22px;margin:0 0 16px;">Welcome, ${escapeHtml(recipientName)} 🎉</h1>
        <p style="font-size:15px;line-height:1.6;color:#333;">
          Your enrollment in the <strong>AI for Beginners</strong> cohort is confirmed.
          We're excited to have you.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#333;margin-top:16px;">
          Join the live sessions on Google Meet:
        </p>
        <p style="margin:24px 0;">
          <a href="${meetLink}" style="background:#6366f1;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
            Join Google Meet
          </a>
        </p>
        <p style="font-size:13px;color:#666;word-break:break-all;">
          Or copy this link: <a href="${meetLink}" style="color:#6366f1;">${meetLink}</a>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#999;">
          You received this email because you enrolled at AI Skills Africa.
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AI Skills Africa <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return logAndReturn(`Resend ${res.status}: ${JSON.stringify(json)}`);
    }

    await supabaseAdmin.from("enrollment_emails").insert({
      enrollment_id: enrollmentId,
      recipient_email: recipientEmail,
      status: "sent",
      trigger_source: triggerSource,
      triggered_by: triggeredBy,
    });
    return { ok: true };
  } catch (err: any) {
    return logAndReturn(err?.message || "Network error");
  }

  async function logAndReturn(error: string) {
    await supabaseAdmin.from("enrollment_emails").insert({
      enrollment_id: enrollmentId,
      recipient_email: recipientEmail,
      status: "failed",
      trigger_source: triggerSource,
      triggered_by: triggeredBy,
      error,
    });
    return { ok: false, error };
  }
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
