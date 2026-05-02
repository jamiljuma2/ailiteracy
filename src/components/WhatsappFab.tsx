import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

export function WhatsappFab() {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const env = (window as any).__APP_ENV__ || {};
    const num = env.VITE_WHATSAPP_NUMBER || (import.meta.env?.VITE_WHATSAPP_NUMBER as string) || "";
    if (num) setPhone(num);
  }, []);

  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, "");
  const defaultText = "Hello — I have a question about AI For Everyone";
  const href = `https://wa.me/${cleaned}?text=${encodeURIComponent(defaultText)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact on WhatsApp"
      className="fixed bottom-5 right-5 z-60 inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
    >
      <MessageSquare className="h-5 w-5" />
    </a>
  );
}

export default WhatsappFab;
