"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Navbar from "../_components/home/Navbar";
import Footer from "../_components/home/Footer";
import Header from "../_components/admin/Header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../_components/admin/App-sidebar";
import { Home, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Cell, BarChart, Bar, Pie } from "recharts";

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

export default function SellerDashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    if (isLoaded && isSignedIn && user?.publicMetadata?.role === "admin") {
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, productsRes, categoriesRes] = await Promise.all([
        fetch("/api/orders?seller=true"),
        fetch("/api/products?all=true"),
        fetch("/api/categories")
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const getMonthlySales = () => {
    const monthlyData: { [key: string]: number } = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(order.totalAmount);
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Math.round(revenue)
      }));
  };

  const getCategoryDistribution = () => {
    const categoryCounts: { [key: string]: number } = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.product.id);
        if (product) {
          // Assuming product has a categoryId field, we'll need to map it to category name
          const category = categories.find(c => c.id === product.categoryId);
          const categoryName = category ? category.name : 'Unknown';
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    }));
  };

  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; total: number } } = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.id;
        const productName = item.product.name;
        const total = item.quantity * item.price;

        if (productSales[productId]) {
          productSales[productId].total += total;
        } else {
          productSales[productId] = { name: productName, total };
        }
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        sales: Math.round(item.total)
      }));
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--chart-1)",
    },
    count: {
      label: "Orders",
      color: "var(--chart-2)",
    },
    sales: {
      label: "Sales",
      color: "var(--chart-3)",
    },
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <main>
        <div>
          <Navbar />
        </div>
        <div>
          <h1 className="text-4xl text-center mt-[110px]">
            Please sign in with the admin account to access the Seller
            Dashboard.
          </h1>
        </div>
        <div className="bottom-0 absolute w-full">
          <Footer />
        </div>
      </main>
    );
  }

  const isAdmin = user?.publicMetadata?.role === "admin";
  if (!isAdmin) {
    notFound();
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex gap-5 items-center mb-12">
              <Home/>
              <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            </div>
            <div className="text-center">Loading dashboard data...</div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  const monthlySales = getMonthlySales();
  const categoryData = getCategoryDistribution();
  const topProducts = getTopProducts();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
      <main className="w-full">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex flex-col mb-12 gap-10">
            
            <h1 className="inline-flex items-center gap-4 text-3xl">
              <span className="font-bold">
                {greeting}, 
              </span>
              <span className="italic text-amber-600">
                {user?.firstName} !
              </span>
            </h1>
            <section className="flex gap-5 items-center">
              <Home/>
              <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            </section>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹ {orders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toLocaleString()}.00</div>
                <p className="text-xs text-muted-foreground">
                  All time revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active products
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Sales Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-revenue)" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Wise Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Products Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
