// app/_components/custom-order/CustomOrderState.tsx
import Link from "next/link";
import { Link2Off, Clock, CheckCircle2, Ban } from "lucide-react";

const CONTENT = {
  invalid: {
    icon: Link2Off,
    title: "This link isn't valid",
    body: "Double-check the link your seller sent you, or ask them to send a new one.",
  },
  expired: {
    icon: Clock,
    title: "This link has expired",
    body: "Ask your seller for a fresh link to complete your order.",
  },
  completed: {
    icon: CheckCircle2,
    title: "This order has already been placed",
    body: "There's nothing left to do here — check your orders for the details.",
  },
  cancelled: {
    icon: Ban,
    title: "This order was cancelled",
    body: "Your seller cancelled this order link. Reach out to them if this seems wrong.",
  },
} as const;

export default function CustomOrderState({
  variant,
}: {
  variant: keyof typeof CONTENT;
}) {
  const { icon: Icon, title, body } = CONTENT[variant];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 rounded-3xl bg-[#4ca626]/5 blur-3xl" />
        <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Icon className="h-8 w-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-3">{title}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">{body}</p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#4ca626] hover:bg-[#5bbd31] px-8 font-semibold shadow-[0_0_40px_rgba(76,166,38,0.25)] transition-colors"
          >
            Back to VAM Enterprises
          </Link>
        </div>
      </div>
    </main>
  );
}
