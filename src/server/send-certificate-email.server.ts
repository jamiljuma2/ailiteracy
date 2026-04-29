// Sends certificate email via Resend with the PDF as an attachment.
interface SendArgs {
  recipientEmail: string;
  recipientName: string;
  courseTitle: string;
  certificateCode: string;
  pdfBytes: Uint8Array;
}

export async function sendCertificateEmail({
  recipientEmail,
  recipientName,
  courseTitle,
  certificateCode,
  pdfBytes,
}: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  // Convert Uint8Array to base64
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < pdfBytes.length; i += chunkSize) {
    binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);

  const subject = `Your certificate for ${courseTitle}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#fff;padding:24px;color:#111;">
      <div style="max-width:560px;margin:0 auto;">
        <h1 style="font-size:22px;margin:0 0 16px;">Congratulations, ${escapeHtml(recipientName)}! 🎉</h1>
        <p style="font-size:15px;line-height:1.6;color:#333;">
          You've successfully completed <strong>${escapeHtml(courseTitle)}</strong>.
          Your certificate of completion is attached to this email as a PDF.
        </p>
        <p style="font-size:14px;color:#555;margin-top:16px;">
          Certificate ID: <strong style="font-family:monospace;">${escapeHtml(certificateCode)}</strong>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#999;">AI Skills Africa — keep building, keep learning.</p>
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
        attachments: [
          {
            filename: `certificate-${certificateCode}.pdf`,
            content: base64,
          },
        ],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${JSON.stringify(json)}` };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Network error" };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
