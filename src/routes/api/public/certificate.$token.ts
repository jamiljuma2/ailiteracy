import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/certificate/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!token || token.length < 16) {
          return new Response("Invalid link", { status: 400 });
        }

        const { data: cert } = await supabaseAdmin
          .from("certificates")
          .select("storage_path, token_expires_at, certificate_code")
          .eq("download_token", token)
          .maybeSingle();

        if (!cert || !cert.storage_path) {
          return new Response("Certificate not found", { status: 404 });
        }
        if (cert.token_expires_at && new Date(cert.token_expires_at) < new Date()) {
          return new Response("This download link has expired", { status: 410 });
        }

        const { data: file, error } = await supabaseAdmin.storage
          .from("certificates")
          .download(cert.storage_path);
        if (error || !file) {
          return new Response("Unable to retrieve certificate", { status: 500 });
        }

        const buffer = await file.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="certificate-${cert.certificate_code}.pdf"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
