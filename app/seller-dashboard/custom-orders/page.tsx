// app/seller-dashboard/custom-orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  MessageCircle,
} from "lucide-react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/admin/App-sidebar";
import Header from "@/app/_components/admin/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useIsAdmin } from "@/app/extras/useIsAdmin";

type CustomOrderStatus = "pending" | "claimed" | "completed" | "cancelled" | "expired";

interface CustomOrderRow {
  id: string;
  token: string;
  title: string;
  totalAmount: string;
  status: CustomOrderStatus;
  customerId: string | null;
  createdAt: string;
  expiresAt: string | null;
}

const STATUS_STYLES: Record<CustomOrderStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Awaiting customer",
    className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    icon: <Hourglass className="h-3.5 w-3.5" />,
  },
  claimed: {
    label: "Order placed",
    className: "border-[#4ca626]/30 bg-[#4ca626]/10 text-[#7ddc56]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Paid",
    className: "border-[#4ca626]/30 bg-[#4ca626]/10 text-[#7ddc56]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-500/20 bg-red-500/10 text-red-400",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Expired",
    className: "border-zinc-700 bg-zinc-800/50 text-zinc-400",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

export default function CustomOrdersListPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = useIsAdmin();

  useEffect(() => {
    fetch("/api/seller/custom-orders")
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Couldn't load custom orders"))
      .finally(() => setLoading(false));
  }, []);

  if (!isLoaded || !isSignedIn) return null;
  if (!isAdmin) notFound();

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/custom-order/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard", {
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
    });
  };

  const shareOnWhatsApp = (token: string, title: string) => {
    const link = `${window.location.origin}/custom-order/${token}`;
    const text = encodeURIComponent(
      `Hi! Here's your custom order for "${title}" from VAM Enterprises. Complete it here: ${link}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Cancel this custom order link? The customer won't be able to use it anymore.")) return;
    const res = await fetch(`/api/seller/custom-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
      toast.success("Order link cancelled");
    } else {
      toast.error("Couldn't cancel this order");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this custom order link permanently?")) return;
    const res = await fetch(`/api/seller/custom-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Deleted");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Couldn't delete this order");
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <main className="min-h-screen bg-[#0a0a0a] text-white">
          <Header />

          <div className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
            <div className="mx-6 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#4ca626]/20 border border-[#4ca626]/30 flex items-center justify-center">
                  <Link2 className="text-[#7ddc56]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight ">Custom Orders</h1>
                  <p className="text-sm text-zinc-400 mt-1">
                    Build a curated order and send the link — the customer just signs in and checks out
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/seller-dashboard/custom-orders/new")}
                className="h-12 px-7 rounded-xl bg-[#4ca626] hover:bg-[#5bbd31] text-white font-semibold shadow-[0_0_40px_rgba(76,166,38,0.35)]"
              >
                <Plus className="h-4 w-4 mr-2" /> Create Custom Order
              </Button>
            </div>
          </div>

          <div className="mx-4 sm:mx-8 px-2 sm:px-6 py-8 pb-28 lg:pb-8">
            {loading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-3xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card className="bg-[#111111] border border-white/10 rounded-3xl p-12 text-center">
                <Link2 className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No custom orders yet</h3>
                <p className="text-sm text-zinc-400 mt-2">
                  Create one to send a ready-made order link to a customer.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => {
                  const s = STATUS_STYLES[order.status];
                  return (
                    <Card
                      key={order.id}
                      className="bg-[#111111] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg truncate">{order.title}</h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${s.className}`}
                          >
                            {s.icon}
                            {s.label}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">
                          Created {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {order.expiresAt && (
                            <> · Expires {new Date(order.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
                          )}
                        </p>
                      </div>

                      <div className="text-lg font-bold text-[#7ddc56] md:w-32">
                        ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === "pending" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyLink(order.token)}
                              className="rounded-xl border border-white/10 hover:bg-white/5"
                              title="Copy link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => shareOnWhatsApp(order.token, order.title)}
                              className="rounded-xl border border-white/10 hover:bg-white/5"
                              title="Share on WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => cancelOrder(order.id)}
                              className="rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400"
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteOrder(order.id)}
                              className="rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {order.status !== "pending" && (
                          <Link
                            href={`/seller-dashboard/orders`}
                            className="text-sm text-[#7ddc56] hover:underline whitespace-nowrap"
                          >
                            View order →
                          </Link>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
