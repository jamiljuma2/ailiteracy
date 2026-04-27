import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Lipana webhook receiver.
 * Verifies HMAC-SHA256 signature in `X-Lipana-Signature` header against the raw body
 * using LIPANA_WEBHOOK_SECRET, then updates the enrollment + payments rows.
 */
export const Route = createFileRoute("/api/public/lipana-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.LIPANA_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const signature = request.headers.get("x-lipana-signature");
        const rawBody = await request.text();

        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event: string = payload?.event ?? "";
        const data = payload?.data ?? {};
        const checkoutRequestID: string | undefined = data.checkoutRequestID;
        const transactionId: string | undefined = data.transactionId;
        const mpesaReceipt: string | undefined = data.mpesaReceipt ?? data.receipt;

        // Find enrollment by checkout/transaction id
        let enrollmentQuery = supabaseAdmin.from("enrollments").select("*").limit(1);
        if (checkoutRequestID) {
          enrollmentQuery = enrollmentQuery.eq("checkout_request_id", checkoutRequestID);
        } else if (transactionId) {
          enrollmentQuery = enrollmentQuery.eq("merchant_request_id", transactionId);
        } else {
          return new Response("Missing transaction reference", { status: 400 });
        }

        const { data: enrollments } = await enrollmentQuery;
        const enrollment = enrollments?.[0];

        let newStatus: "success" | "failed" | "pending" = "pending";
        if (event === "payment.success") newStatus = "success";
        else if (event === "payment.failed" || event === "payment.cancelled") newStatus = "failed";

        if (enrollment) {
          await supabaseAdmin
            .from("enrollments")
            .update({
              payment_status: newStatus,
              course_access: newStatus === "success",
              mpesa_receipt: mpesaReceipt ?? enrollment.mpesa_receipt,
              failure_reason: newStatus === "failed" ? data.message ?? data.status ?? "Payment failed" : null,
            })
            .eq("id", enrollment.id);
        }

        await supabaseAdmin.from("payments").insert({
          enrollment_id: enrollment?.id ?? null,
          phone: data.phone ?? enrollment?.phone ?? "",
          amount: Number(data.amount ?? enrollment?.amount ?? 0),
          checkout_request_id: checkoutRequestID ?? null,
          merchant_request_id: transactionId ?? null,
          mpesa_receipt: mpesaReceipt ?? null,
          status: newStatus,
          result_desc: data.message ?? event,
          raw_callback: payload,
        });

        return Response.json({ received: true });
      },
    },
  },
});
