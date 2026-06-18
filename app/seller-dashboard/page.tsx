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
  Truck, XCircle, IndianRupee, Users, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend
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
  PENDING:   { label: "Pending",   color: "#f59e0b", icon: <Clock className="h-3 w-3" /> },
  SHIPPED:   { label: "Shipped",   color: "#3b82f6", icon: <Truck className="h-3 w-3" /> },
  DELIVERED: { label: "Delivered", color: "#10b981", icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", color: "#ef4444", icon: <XCircle className="h-3 w-3" /> },
};

const PIE_COLORS = ["#4ca626", "#2d7a16", "#78d44e", "#a3e87a", "#1f5c0e", "#8bc34a"];

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
      color: STATUS_CONFIG[status]?.color ?? "#6b7280",
    }));

  const chartConfig = {
    revenue: { label: "Revenue (₹)", color: "var(--chart-1)" },
    count:   { label: "Units",       color: "var(--chart-2)" },
    sales:   { label: "Sales (₹)",   color: "var(--chart-3)" },
    units:   { label: "Units Sold",  color: "var(--chart-4)" },
  };

  const revenueChange = getRevenueChange();
  const monthlySales  = getMonthlySales();
  const categoryData  = getCategoryDistribution();
  const topProducts   = getTopProducts();
  const recentOrders  = getRecentOrders();
  const statusPieData = getOrderStatusPieData();

  // ── guards ─────────────────────────────────────────────────────────
  if (!isLoaded || !isSignedIn) return (
    <main>
      <Navbar />
      <div>
        <h1 className="text-4xl text-center mt-[110px]">
          Please sign in with the admin account to access the Seller Dashboard.
        </h1>
      </div>
      <div className="bottom-0 absolute w-full"><Footer /></div>
    </main>
  );

  if (!user?.publicMetadata?.role || user.publicMetadata.role !== "admin") notFound();

  if (loading) return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex gap-3 items-center mb-8">
            <Home className="h-6 w-6 text-[#4ca626]" />
            <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
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
        <main className="w-full bg-background min-h-screen">
          <Header />

          <div className="container mx-auto px-6 py-6 space-y-8">

            {/* ── Page header ── */}
            <div className="flex flex-col gap-1">
              <p className="text-3xl text-muted-foreground font-medium pb-8 pt-4">
                {greeting}, <span className="text-amber-600 font-semibold italic">{user?.firstName}</span>
              </p>
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-[#4ca626]" />
                <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                A complete overview of your store performance
              </p>
            </div>

            {/* ── KPI cards ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue */}
              <Card className="border-l-4 border-l-[#4ca626]">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#f0fae9] dark:bg-[#1a3a0d]">
                      <IndianRupee className="h-4 w-4 text-[#4ca626]" />
                    </div>
                    {revenueChange !== null && (
                      <Badge
                        variant="secondary"
                        className={`text-xs gap-1 ${revenueChange >= 0 ? "text-[#4ca626] bg-[#f0fae9]" : "text-red-500 bg-red-50"}`}
                      >
                        {revenueChange >= 0
                          ? <ArrowUpRight className="h-3 w-3" />
                          : <ArrowDownRight className="h-3 w-3" />
                        }
                        {Math.abs(revenueChange)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">Total Revenue</p>
                  <p className="text-xl font-bold">₹{totalRevenue.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
                </CardContent>
              </Card>

              {/* Orders */}
              <Card className="border-l-4 border-l-[#2d7a16]">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#edf7e8] dark:bg-[#162e0a]">
                      <ShoppingBag className="h-4 w-4 text-[#2d7a16]" />
                    </div>
                    <Badge variant="secondary" className="text-xs text-[#2d7a16] bg-[#edf7e8]">
                      {statusCounts["PENDING"] ?? 0} pending
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">Total Orders</p>
                  <p className="text-xl font-bold">{orders.length.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statusCounts["DELIVERED"] ?? 0} delivered
                  </p>
                </CardContent>
              </Card>

              {/* Avg order value */}
              <Card className="border-l-4 border-l-[#78d44e]">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#f4fdf0] dark:bg-[#1e3d10]">
                      <TrendingUp className="h-4 w-4 text-[#4ca626]" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">Avg. Order Value</p>
                  <p className="text-xl font-bold">₹{Math.round(avgOrderValue).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-1">Per order average</p>
                </CardContent>
              </Card>

              {/* Products */}
              <Card className="border-l-4 border-l-[#1f5c0e]">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#e8f5e2] dark:bg-[#112808]">
                      <Package className="h-4 w-4 text-[#1f5c0e]" />
                    </div>
                    <Badge variant="secondary" className="text-xs text-[#4ca626] bg-[#f0fae9]">
                      {totalItems} units sold
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">Active Products</p>
                  <p className="text-xl font-bold">{products.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categoryData.length} categories
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── Order status strip ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-card"
                  style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}
                >
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    <p className="text-lg font-bold">{statusCounts[key] ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts row 1 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Monthly Revenue – takes 2 cols */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#4ca626]" />
                        Monthly Revenue
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">Last 6 months performance</CardDescription>
                    </div>
                    {revenueChange !== null && (
                      <p className={`text-sm font-semibold ${revenueChange >= 0 ? "text-[#4ca626]" : "text-red-500"}`}>
                        {revenueChange >= 0 ? "↑" : "↓"} {Math.abs(revenueChange)}% vs last month
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <LineChart data={monthlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
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
                </CardContent>
              </Card>

              {/* Order status pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#4ca626]" />
                    Order Status
                  </CardTitle>
                  <CardDescription className="text-xs">Breakdown by fulfillment</CardDescription>
                </CardHeader>
                <CardContent>
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
                        >
                          {statusPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full mt-1">
                      {statusPieData.map((entry, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                          <span className="text-muted-foreground truncate">{entry.name}</span>
                          <span className="ml-auto font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Charts row 2 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Products */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#4ca626]" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription className="text-xs">By total revenue generated</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="opacity-40" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                      <ChartTooltip
                        content={<ChartTooltipContent formatter={(v, n) => [
                          n === "sales" ? `₹${Number(v).toLocaleString("en-IN")}` : v, n
                        ]} />}
                      />
                      <Bar dataKey="sales" fill="#4ca626" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#4ca626]" />
                    Category Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">Units sold per category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <BarChart data={categoryData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Recent Orders table ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-[#4ca626]" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">Latest 7 orders across your store</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Order ID</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Items</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Amount</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, i) => {
                        const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "#6b7280", icon: null };
                        return (
                          <tr key={order.id} className={`border-b transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                            <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                              #{order.orderId ?? order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs">
                              ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ color: cfg.color, background: cfg.color + "1a" }}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </td>
                          </tr>
                        );
                      })}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                            No orders yet. Share your store to start receiving orders.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}