"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Navbar from "../_components/home/Navbar";
import Footer from "../_components/home/Footer";
import Header from "../_components/admin/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "../_components/admin/App-sidebar";
import {
  Home, TrendingUp, BarChart3, ShoppingBag, Package,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  Truck, XCircle, IndianRupee, Star, Sparkles,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Pie, PieChart, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area,
} from "recharts";

interface Order {
  id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
    };
  }[];
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pending",   color: "#f0b429", icon: <Clock className="h-3.5 w-3.5" /> },
  SHIPPED:   { label: "Shipped",   color: "#4f9de8", icon: <Truck className="h-3.5 w-3.5" /> },
  DELIVERED: { label: "Delivered", color: "#4ca626", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CANCELLED: { label: "Cancelled", color: "#e5544e", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const PIE_COLORS = ["#4ca626", "#78d44e", "#2d7a16", "#a3e87a", "#1f5c0e", "#5ba82f"];

// shared glass panel treatment used across every card on the page
const PANEL =
  "rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]";

export default function SellerDashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
    if (isLoaded && isSignedIn && user?.publicMetadata?.role === "admin") fetchDashboardData();
  }, [isLoaded, isSignedIn, user]);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, productsRes, categoriesRes] = await Promise.all([
        fetch("/api/orders?seller=true"),
        fetch("/api/products?all=true"),
        fetch("/api/categories"),
      ]);
      if (ordersRes.ok)     setOrders(await ordersRes.json());
      if (productsRes.ok)   setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── derived stats ──────────────────────────────────────────────────
  const totalRevenue   = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const avgOrderValue  = orders.length ? totalRevenue / orders.length : 0;
  const totalItems     = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Monthly revenue — last 6 months
  const getMonthlySales = () => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[k] = (map[k] || 0) + Number(o.totalAmount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([m, revenue]) => ({
        month: new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        revenue: Math.round(revenue),
      }));
  };

  // Month-over-month revenue change
  const getRevenueChange = () => {
    const monthly = getMonthlySales();
    if (monthly.length < 2) return null;
    const prev = monthly[monthly.length - 2].revenue;
    const curr = monthly[monthly.length - 1].revenue;
    if (!prev) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const getCategoryDistribution = () => {
    const map: Record<string, number> = {};
    orders.forEach(o =>
      o.items.forEach(item => {
        const product  = products.find(p => p.id === item.product.id);
        const category = product ? categories.find(c => c.id === product.categoryId) : null;
        const name     = category?.name ?? "Other";
        map[name] = (map[name] || 0) + item.quantity;
      })
    );
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  };

  const getTopProducts = () => {
    const map: Record<string, { name: string; total: number; units: number }> = {};
    orders.forEach(o =>
      o.items.forEach(item => {
        const id = item.product.id;
        if (!map[id]) map[id] = { name: item.product.name, total: 0, units: 0 };
        map[id].total += item.quantity * item.price;
        map[id].units += item.quantity;
      })
    );
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(p => ({
        name:  p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
        sales: Math.round(p.total),
        units: p.units,
      }));
  };

  const getRecentOrders = () =>
    [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 7);

  const getOrderStatusPieData = () =>
    Object.entries(statusCounts).map(([status, count]) => ({
      name:  STATUS_CONFIG[status]?.label ?? status,
      value: count,
      color: STATUS_CONFIG[status]?.color ?? "#a1a1aa",
    }));

  const chartConfig = {
    revenue: { label: "Revenue (₹)", color: "#4ca626" },
    count:   { label: "Units",       color: "#4ca626" },
    sales:   { label: "Sales (₹)",   color: "#4ca626" },
    units:   { label: "Units Sold",  color: "#4ca626" },
  };

  const revenueChange = getRevenueChange();
  const monthlySales  = getMonthlySales();
  const categoryData  = getCategoryDistribution();
  const topProducts   = getTopProducts();
  const recentOrders  = getRecentOrders();
  const statusPieData = getOrderStatusPieData();

  // ── guards ─────────────────────────────────────────────────────────
  if (!isLoaded || !isSignedIn) return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <div className={`${PANEL} max-w-lg text-center px-10 py-12`}>
          <Sparkles className="h-6 w-6 text-[#4ca626] mx-auto mb-4" />
          <h1 className=" text-2xl text-zinc-100">
            Please sign in with the admin account to access the Seller Dashboard.
          </h1>
        </div>
      </div>
      <Footer />
    </main>
  );

  if (!user?.publicMetadata?.role || user.publicMetadata.role !== "admin") notFound();

  if (loading) return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-[#050505] min-h-screen">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex gap-3 items-center mb-8">
            <Home className="h-6 w-6 text-[#4ca626]" />
            <h1 className=" text-2xl text-zinc-100">Seller Dashboard</h1>
          </div>
          <div className={`${PANEL} h-40 mb-6 animate-pulse`} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`${PANEL} h-28 animate-pulse`} />
            ))}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="w-full bg-[#050505] min-h-screen">
          <Header />

          <div className="container mx-auto px-6 py-8 space-y-8">

            {/* ── Hero: greeting + revenue centerpiece ── */}
            <div className={`${PANEL} relative overflow-hidden p-8 lg:p-10`}>
              {/* ambient glow */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#4ca626]/20 blur-[100px]" />
              <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[#4ca626]/10 blur-[110px]" />

              <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-2">{greeting}</p>
                  <h1 className=" text-4xl lg:text-5xl text-zinc-100 tracking-tight">
                    Welcome back,{" "}
                    <span className="italic text-[#6fd83f] drop-shadow-[0_0_18px_rgba(76,166,38,0.45)]">
                      {user?.firstName}
                    </span>
                  </h1>
                  <p className="text-sm text-zinc-500 mt-3 flex items-center gap-2">
                    <Home className="h-3.5 w-3.5 text-[#4ca626]" />
                    A complete overview of your store performance
                  </p>
                </div>

                <div className="lg:text-right">
                  <div className="flex items-center gap-3 lg:justify-end mb-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total revenue</p>
                    {revenueChange !== null && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          revenueChange >= 0
                            ? "text-[#8be25a] bg-[#4ca626]/15 border border-[#4ca626]/30"
                            : "text-red-400 bg-red-500/10 border border-red-500/30"
                        }`}
                      >
                        {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(revenueChange)}%
                      </span>
                    )}
                  </div>
                  <p className=" text-5xl lg:text-6xl text-zinc-50 tracking-tight">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">All-time earnings across your store</p>
                </div>
              </div>

              {/* sparkline */}
              {monthlySales.length > 1 && (
                <div className="relative h-16 mt-6 -mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlySales} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="heroGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4ca626" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#4ca626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4ca626"
                        strokeWidth={2}
                        fill="url(#heroGlow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Secondary stat strip ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${PANEL} px-6 py-5 flex items-center gap-4`}>
                <div className="p-2.5 rounded-xl bg-[#4ca626]/10 border border-[#4ca626]/20">
                  <ShoppingBag className="h-4.5 w-4.5 text-[#4ca626]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total orders</p>
                  <p className="text-xl font-semibold text-zinc-100">{orders.length.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{statusCounts["PENDING"] ?? 0} pending · {statusCounts["DELIVERED"] ?? 0} delivered</p>
                </div>
              </div>

              <div className={`${PANEL} px-6 py-5 flex items-center gap-4`}>
                <div className="p-2.5 rounded-xl bg-[#4ca626]/10 border border-[#4ca626]/20">
                  <TrendingUp className="h-4.5 w-4.5 text-[#4ca626]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Avg. order value</p>
                  <p className="text-xl font-semibold text-zinc-100">₹{Math.round(avgOrderValue).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Per order average</p>
                </div>
              </div>

              <div className={`${PANEL} px-6 py-5 flex items-center gap-4`}>
                <div className="p-2.5 rounded-xl bg-[#4ca626]/10 border border-[#4ca626]/20">
                  <Package className="h-4.5 w-4.5 text-[#4ca626]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Active products</p>
                  <p className="text-xl font-semibold text-zinc-100">{products.length}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{totalItems} units sold · {categoryData.length} categories</p>
                </div>
              </div>
            </div>

            {/* ── Order status strip ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = statusCounts[key] ?? 0;
                const pct = orders.length ? (count / orders.length) * 100 : 0;
                return (
                  <div key={key} className={`${PANEL} px-5 py-4`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      <p className="text-xs text-zinc-500">{cfg.label}</p>
                      <p className="ml-auto text-lg font-semibold text-zinc-100">{count}</p>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Charts row 1 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Monthly Revenue – takes 2 cols */}
              <div className={`${PANEL} lg:col-span-2 p-6`}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#4ca626]" />
                      Monthly Revenue
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Last 6 months performance</p>
                  </div>
                  {revenueChange !== null && (
                    <p className={`text-sm font-medium ${revenueChange >= 0 ? "text-[#8be25a]" : "text-red-400"}`}>
                      {revenueChange >= 0 ? "↑" : "↓"} {Math.abs(revenueChange)}% vs last month
                    </p>
                  )}
                </div>
                <ChartContainer config={chartConfig} className="h-[220px] w-full mt-3">
                  <LineChart data={monthlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4ca626"
                      strokeWidth={2.5}
                      dot={{ fill: "#4ca626", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              {/* Order status pie */}
              <div className={`${PANEL} p-6`}>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#4ca626]" />
                  Order Status
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 mb-2">Breakdown by fulfillment</p>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [v, n]}
                        contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                        itemStyle={{ color: "#e4e4e7" }}
                        labelStyle={{ color: "#e4e4e7" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-1">
                    {statusPieData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                        <span className="text-zinc-500 truncate">{entry.name}</span>
                        <span className="ml-auto font-medium text-zinc-200">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Charts row 2 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Products */}
              <div className={`${PANEL} p-6`}>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#4ca626]" />
                  Top Selling Products
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">By total revenue generated</p>
                <ChartContainer config={chartConfig} className="h-[220px] w-full mt-3">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#a1a1aa" }} width={80} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v, n) => [
                        n === "sales" ? `₹${Number(v).toLocaleString("en-IN")}` : v, n
                      ]} />}
                    />
                    <Bar dataKey="sales" fill="#4ca626" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Category Distribution */}
              <div className={`${PANEL} p-6`}>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#4ca626]" />
                  Category Distribution
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Units sold per category</p>
                <ChartContainer config={chartConfig} className="h-[220px] w-full mt-3">
                  <BarChart data={categoryData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            {/* ── Recent Orders table ── */}
            <div className={PANEL}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#4ca626]" />
                    Recent Orders
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Latest 7 orders across your store</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-zinc-500 px-6 py-3">Order ID</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-zinc-500 px-4 py-3">Items</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-zinc-500 px-4 py-3">Amount</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-zinc-500 px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium uppercase tracking-wide text-zinc-500 px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "#a1a1aa", icon: null };
                      return (
                        <tr key={order.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                          <td className="px-6 py-3.5 font-mono text-xs text-zinc-500">
                            #{order.orderId ?? order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-zinc-400">
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-xs text-zinc-100">
                            ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                              style={{ color: cfg.color, background: cfg.color + "1a", borderColor: cfg.color + "33" }}
                            >
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-zinc-500">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </td>
                        </tr>
                      );
                    })}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-zinc-500 text-sm">
                          No orders yet. Share your store to start receiving orders.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}