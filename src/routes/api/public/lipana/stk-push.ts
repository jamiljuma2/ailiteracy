import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Body = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().min(9).max(15),
});

// Normalize Kenyan numbers to +2547XXXXXXXX
function normalizePhone(raw: string): string | null {
  const p = raw.replace(/\s|-/g, "");
  if (/^\+2547\d{8}$/.test(p)) return p;
  if (/^2547\d{8}$/.test(p)) return `+${p}`;
  if (/^07\d{8}$/.test(p)) return `+254${p.slice(1)}`;
  if (/^7\d{8}$/.test(p)) return `+254${p}`;
  return null;
}

const AMOUNT = 3000;

export const Route = createFileRoute("/api/public/lipana/stk-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch (err) {
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }

        const phone = normalizePhone(parsed.phone);
        if (!phone) return Response.json({ error: "Invalid Kenyan phone number" }, { status: 400 });

        const apiKey = process.env.LIPANA_SECRET_KEY;
        if (!apiKey) return Response.json({ error: "Payments not configured" }, { status: 500 });

        // 1. Create enrollment row (pending)
        const { data: enrollment, error: enrollErr } = await supabaseAdmin
          .from("enrollments")
          .insert({
            full_name: parsed.full_name,
            email: parsed.email.toLowerCase(),
            phone,
            amount: AMOUNT,
            payment_status: "pending",
          })
          .select()
          .single();

        if (enrollErr || !enrollment) {
          console.error("enrollment insert failed", enrollErr);
          return Response.json({ error: "Could not create enrollment" }, { status: 500 });
        }

        // 2. Initiate Lipana STK push
        let lipanaJson: any;
        try {
          const res = await fetch("https://api.lipana.dev/v1/transactions/push-stk", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone, amount: AMOUNT }),
          });
          lipanaJson = await res.json();

          if (!res.ok || !lipanaJson?.success) {
            await supabaseAdmin
              .from("enrollments")
              .update({
                payment_status: "failed",
                failure_reason: lipanaJson?.message || `HTTP ${res.status}`,
              })
              .eq("id", enrollment.id);
            return Response.json(
              { error: lipanaJson?.message || "STK push failed" },
              { status: 502 },
            );
          }
        } catch (err: any) {
          console.error("lipana request failed", err);
          await supabaseAdmin
            .from("enrollments")
            .update({ payment_status: "failed", failure_reason: "Network error" })
            .eq("id", enrollment.id);
          return Response.json({ error: "Payment provider unreachable" }, { status: 502 });
        }

        const data = lipanaJson.data ?? {};
        const transactionId: string | undefined = data.transactionId;
        const checkoutRequestID: string | undefined = data.checkoutRequestID;

        // 3. Persist provider IDs
        await supabaseAdmin
          .from("enrollments")
          .update({
            checkout_request_id: checkoutRequestID ?? transactionId ?? null,
            merchant_request_id: transactionId ?? null,
          })
          .eq("id", enrollment.id);

        await supabaseAdmin.from("payments").insert({
          enrollment_id: enrollment.id,
          phone,
          amount: AMOUNT,
          checkout_request_id: checkoutRequestID ?? null,
          merchant_request_id: transactionId ?? null,
          status: "initiated",
        });

        return Response.json({
          enrollmentId: enrollment.id,
          transactionId,
          checkoutRequestID,
          message: data.message ?? "STK push sent. Enter your M-Pesa PIN to complete payment.",
        });
      },
    },
  },
});
