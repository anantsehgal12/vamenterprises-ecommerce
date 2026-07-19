"use client";
import React, { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../_components/home/Navbar";
import Footer from "../_components/home/Footer";
import {
  Mail, Calendar, LogOut, Settings, Package, MapPin,
  ShoppingBag, ChevronRight, Clock, CheckCircle2, Truck,
  XCircle, Plus, Home as HomeIcon, Briefcase, Star,
} from "lucide-react";

const display = "font-[family-name:var(--font-display)]";
const mono = "font-[family-name:var(--font-mono)]";

interface Order {
  id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    product: { id: string; name: string };
  }[];
}

interface Address {
  id: string;
  label?: string;
  fullName?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pending",   color: "#f0b429", icon: <Clock className="h-3.5 w-3.5" /> },
  SHIPPED:   { label: "Shipped",   color: "#4f9de8", icon: <Truck className="h-3.5 w-3.5" /> },
  DELIVERED: { label: "Delivered", color: "#4ca626", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CANCELLED: { label: "Cancelled", color: "#e5544e", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const PANEL =
  "rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]";

const ADDRESS_ICON: Record<string, React.ReactNode> = {
  home: <HomeIcon className="h-3.5 w-3.5" />,
  work: <Briefcase className="h-3.5 w-3.5" />,
};

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchAccountData();
    if (isLoaded && !isSignedIn) setLoading(false);
  }, [isLoaded, isSignedIn]);

  const fetchAccountData = async () => {
    try {
      const [ordersRes, addressesRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/addresses"),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (addressesRes.ok) setAddresses(await addressesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const handleSignOut = () => signOut(() => router.push("/"));

  // ── guard: signed out ─────────────────────────────────────────────
  if (isLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen bg-[#050505]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh] px-6">
          <div className={`${PANEL} max-w-lg text-center px-10 py-12`}>
            <h1 className={`${display} text-2xl text-zinc-100`}>
              Please sign in to view your account.
            </h1>
            <Link
              href="/auth/sign-in"
              className="inline-flex mt-6 items-center gap-2 rounded-full border border-[#4ca626]/50 bg-[#4ca626]/10 text-[#e8ffe0] hover:bg-[#4ca626]/25 text-sm uppercase tracking-[0.15em] px-6 py-2.5 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // ── loading ────────────────────────────────────────────────────────
  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#050505]">
        <Navbar />
        <div className="container mx-auto px-6 py-10 pb-28 md:pb-10 space-y-6">
          <div className={`${PANEL} h-48 animate-pulse`} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${PANEL} h-64 animate-pulse`} />
            <div className={`${PANEL} h-64 animate-pulse`} />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />

      <div className="container mx-auto px-6 py-10 pb-28 md:pb-10 space-y-8">

        {/* ── Profile hero ── */}
        <div className={`${PANEL} relative overflow-hidden p-8 lg:p-10`}>
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4ca626]/20 blur-[100px]" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-[#4ca626]/30 blur-md" />
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? "Profile photo"}
                  width={88}
                  height={88}
                  className="relative rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className={`${display} relative h-[88px] w-[88px] rounded-full border border-white/10 bg-[#4ca626]/15 text-2xl text-[#9be274] flex items-center justify-center`}>
                  {initials || "?"}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className={`${display} text-3xl text-zinc-100 tracking-tight truncate`}>
                {user?.fullName ?? "Your Account"}
              </h1>
              <div className={`${mono} flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-xs uppercase tracking-[0.12em] text-zinc-500`}>
                {user?.primaryEmailAddress?.emailAddress && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#4ca626]" />
                    {user.primaryEmailAddress.emailAddress}
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#4ca626]" />
                    Member since {memberSince}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => openUserProfile()}
                className="inline-flex items-center gap-2 rounded-full border border-[#4ca626]/50 bg-[#4ca626]/10 text-[#e8ffe0] hover:bg-[#4ca626]/25 text-xs md:text-sm uppercase tracking-[0.15em] px-5 py-2.5 backdrop-blur-md transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Update Account
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 text-zinc-200 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 text-xs md:text-sm uppercase tracking-[0.15em] px-5 py-2.5 backdrop-blur-md transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${PANEL} px-6 py-5 flex items-center gap-4`}>
            <div className="p-2.5 rounded-xl bg-[#4ca626]/10 border border-[#4ca626]/20">
              <ShoppingBag className="h-4.5 w-4.5 text-[#4ca626]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total orders</p>
              <p className="text-xl font-semibold text-zinc-100">{orders.length}</p>
            </div>
          </div>
          <div className={`${PANEL} px-6 py-5 flex items-center gap-4`}>
            <div className="p-2.5 rounded-xl bg-[#4ca626]/10 border border-[#4ca626]/20">
              <MapPin className="h-4.5 w-4.5 text-[#4ca626]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Saved addresses</p>
              <p className="text-xl font-semibold text-zinc-100">{addresses.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Recent orders ── */}
          <div className={PANEL}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h3 className={`${display} text-lg text-zinc-100 flex items-center gap-2`}>
                  <Package className="h-4 w-4 text-[#4ca626]" />
                  Recent Orders
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Your latest purchases</p>
              </div>
              <Link
                href="/my-orders"
                className="text-xs uppercase tracking-[0.12em] text-zinc-400 hover:text-[#9be274] inline-flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="px-3 pb-3 space-y-1">
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "#a1a1aa", icon: null };
                return (
                  <Link
                    key={order.id}
                    href={`/my-orders/${order.id}`}
                    className="flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex-shrink-0">
                      <ShoppingBag className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        #{order.orderId ?? order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-zinc-100">
                        ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium mt-1"
                        style={{ color: cfg.color, background: cfg.color + "1a", borderColor: cfg.color + "33" }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {recentOrders.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-zinc-500">No orders yet.</p>
                  <Link
                    href="/shop"
                    className="inline-flex mt-4 items-center gap-2 rounded-full border border-[#4ca626]/50 bg-[#4ca626]/10 text-[#e8ffe0] hover:bg-[#4ca626]/25 text-xs uppercase tracking-[0.15em] px-5 py-2 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Saved addresses ── */}
          <div className={PANEL}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h3 className={`${display} text-lg text-zinc-100 flex items-center gap-2`}>
                  <MapPin className="h-4 w-4 text-[#4ca626]" />
                  Saved Addresses
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Where we deliver your orders</p>
              </div>
              <Link
                href="/my-addresses"
                className="text-xs uppercase tracking-[0.12em] text-zinc-400 hover:text-[#9be274] inline-flex items-center gap-1 transition-colors"
              >
                Manage
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="px-3 pb-3 space-y-2">
              {addresses.slice(0, 3).map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl px-4 py-3.5 border border-white/5 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[#4ca626]">
                      {ADDRESS_ICON[addr.label?.toLowerCase() ?? ""] ?? <MapPin className="h-3.5 w-3.5" />}
                    </span>
                    <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">
                      {addr.label ?? "Address"}
                    </p>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#4ca626]/15 border border-[#4ca626]/30 text-[#8be25a] text-[10px] px-2 py-0.5">
                        <Star className="h-2.5 w-2.5" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-200">
                    {addr.fullName ? `${addr.fullName}, ` : ""}{addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {addr.city}, {addr.state} {addr.pincode}
                  </p>
                </div>
              ))}

              {addresses.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-zinc-500">No saved addresses yet.</p>
                </div>
              )}

              <Link
                href="/my-addresses"
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3.5 text-xs uppercase tracking-[0.12em] text-zinc-400 hover:text-[#9be274] hover:border-[#4ca626]/40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add New Address
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}