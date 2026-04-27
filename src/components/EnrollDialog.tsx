import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Smartphone, ShieldCheck } from "lucide-react";

type Status = "idle" | "sending" | "pending" | "success" | "failed";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnrollDialog({ open, onOpenChange }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

  const validatePhone = (p: string) => /^(?:\+?254|0)?7\d{8}$/.test(p.replace(/\s/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.name.length < 2) return setError("Please enter your full name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return setError("Please enter a valid email");
    if (!validatePhone(form.phone)) return setError("Enter a valid Safaricom number (e.g. 0712 345 678)");

    setStatus("sending");
    try {
      const res = await fetch("/api/lipana/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("idle");
        return setError(json?.error || "Could not initiate payment. Please try again.");
      }
      setTxRef(json.transactionId || json.checkoutRequestID || null);
      setStatus("pending");
    } catch (err) {
      setStatus("idle");
      setError("Network error. Please check your connection and retry.");
    }
  };

  const reset = () => {
    setStatus("idle");
    setForm({ name: "", email: "", phone: "" });
    setError(null);
    setTxRef(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 300); }}>
      <DialogContent className="sm:max-w-md glass border-border/60">
        {status === "success" ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-2xl">You're enrolled! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Confirmation sent to <span className="text-foreground font-medium">{form.email}</span>.
              Check your inbox for the Google Meet link and schedule.
            </DialogDescription>
            <Button onClick={() => onOpenChange(false)} className="w-full mt-4" size="lg">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Enroll in the cohort</DialogTitle>
              <DialogDescription>
                Pay <span className="text-primary font-semibold">KES 2,500</span> via M-Pesa STK Push. Takes 30 seconds.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Wanjiku" disabled={status !== "idle"} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com" disabled={status !== "idle"} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0712 345 678" className="pl-9" disabled={status !== "idle"} maxLength={15} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {status === "pending" && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Check your phone</p>
                      <p className="text-muted-foreground mt-1">We've sent an M-Pesa prompt. Enter your PIN to complete payment.</p>
                      {txRef && (
                        <p className="text-xs text-muted-foreground/70 mt-2 font-mono">Ref: {txRef}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-glow"
                disabled={status !== "idle"}>
                {status === "sending" && <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Initiating...</>}
                {status === "pending" && <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Awaiting M-Pesa...</>}
                {status === "idle" && <>Pay KES 2,500 with M-Pesa</>}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Secure payment via Safaricom Daraja API
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
