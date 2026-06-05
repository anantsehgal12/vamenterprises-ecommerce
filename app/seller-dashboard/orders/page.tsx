"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart } from "lucide-react";
import { isAdmin } from "@/app/extras/isAdmis";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/Navbar";
import RefreshButton from "@/app/_components/RefreshApis";

interface OrderItem {
  id: string;
  quantity: number;
  price: string; // API sends price as a string
  product: {
    id: string;
    name: string;
    price: string;
    category: { name: string };
    images: { id: string; url: string; altText: string }[];
  };
  variant?: string | { name: string }; // Variant can be a string or an object
}

interface Order {
  id: string;
  orderId: string;
  userId: string;
  totalAmount: string; // API sends totalAmount as a string
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  items: OrderItem[];
  createdAt: string;
}

// Helper to safely get the variant name, whether it's a string or an object
const getVariantName = (variant: unknown): string => {
  if (!variant) {
    return "";
  }
  if (typeof variant === 'string') {
    return variant;
  }
  if (typeof variant === 'object' && variant !== null && 'name' in variant) {
    return String((variant as { name: unknown }).name);
  }
  return JSON.stringify(variant); // Fallback to prevent crashing and aid debugging
};

export default function SellerOrdersPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isLoaded, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders?seller=true");
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "shipped":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "delivered":
        return "bg-[#4ca626]/10 text-[#7ddc56] border border-[#4ca626]/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const filteredOrders = orders
    .filter(
      (order) =>
        filterStatus === "all" ||
        order.status.toLowerCase() === filterStatus.toLowerCase(),
    )
    .filter((order) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.items.some((item) =>
          item.product.name.toLowerCase().includes(query),
        )
      );
    });

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="w-full">
        <Navbar />
        <div className="p-6 mt-30">
          <div className="text-center">
            Please sign in with the admin account to access the Seller
            Dashboard.
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin(user)) {
    notFound();
  }

  if (loading && isAdmin(user)) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
          <Header />
          <div className="p-6 text-center text-zinc-400">
            <div className="text-center">Loading orders...</div>
          </div>
        </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (isLoaded && isAdmin(user)){    console.log(orders);
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
            <Header />
            <div className="container mx-auto p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <section className="inline-flex items-center gap-4 justify-between w-full">
                <div className="flex gap-5 items-center">
                  <ShoppingCart className="text-[#7ddc56]"/>
                  <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
                </div>
                <RefreshButton />
                </section>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                  <Select value={filterStatus} onValueChange={setFilterStatus} >
                    <SelectTrigger className="w-40 bg-[#181818] border-white/10 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search orders by order ID or product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-[#181818] border-white/10 focus-visible:ring-[#4ca626]"
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <Card className="shadow-lg bg-[#111111] border-white/10 rounded-3xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">
                        {filterStatus === "all"
                          ? "No orders found."
                          : `No ${filterStatus} orders found.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="hidden md:block space-y-6">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} className="shadow-lg bg-[#111111] border-white/10 rounded-3xl">
                        <CardHeader className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center space-x-4">
                                <span>Order #{order.orderId}</span>
                                <Badge
                                  className={getStatusBadgeClass(order.status)}
                                >
                                  {order.status}
                                </Badge>
                              </CardTitle>
                              <p className="text-zinc-400 text-sm mt-2">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                              <p className="text-zinc-400 text-sm">
                            User ID: {order.userId || "Walk-in/Guest"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-zinc-400 text-sm">
                                Total Amount
                              </p>
                              <p className="text-xl font-bold text-[#7ddc56]">
                                ₹{Math.round(parseFloat(order.totalAmount))}
                              </p>
                              <div className="mt-2 space-y-2">
                                <Select
                                  value={order.status}
                                  onValueChange={(value) =>
                                    updateOrderStatus(order.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-32 bg-[#181818] border-white/10 rounded-xl">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PENDING">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="CONFIRMED">
                                      Confirmed
                                    </SelectItem>
                                    <SelectItem value="SHIPPED">
                                      Shipped
                                    </SelectItem>
                                    <SelectItem value="DELIVERED">
                                      Delivered
                                    </SelectItem>
                                    <SelectItem value="CANCELLED">
                                      Cancelled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-4 p-4 bg-[#181818] rounded-xl border border-white/5"
                              >
                                <div className="flex-shrink-0">
                                  {item.product.images?.[0] ? (
                                    <img
                                      src={item.product.images[0].url}
                                      alt={item.product.images[0].altText || item.product.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-zinc-800 rounded flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">
                                        No Image
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <h3 className="font-medium">
                                    {item.product.name}
                                  </h3>
                                  {getVariantName(item.variant) && (
                                    <p className="text-zinc-400 text-sm">
                                  Variant: {getVariantName(item.variant)}
                                    </p>
                                  )}
                                  <p className="text-zinc-400 text-sm">
                                    Category: {item.product.category.name}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p>Qty: {item.quantity}</p>
                                  <p className="font-medium">
                                    ₹{Math.round(parseFloat(item.price) * item.quantity)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                            <div className="text-sm text-zinc-400">
                          <p>Razorpay Order ID: {order.razorpayOrderId || "N/A"}</p>
                          <p>Payment ID: {order.razorpayPaymentId || "N/A"}</p>
                            </div>
                            <Button
                              onClick={() =>
                                router.push(
                                  `/seller-dashboard/orders/${order.id}`,
                                )
                              }
                              variant="outline"
                              size="sm" className="bg-[#4ca626] hover:bg-[#5bbd31] text-white border-none"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} className="shadow-lg bg-[#111111] border-white/10 rounded-3xl">
                        <CardHeader className="p-4 pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2 mb-1">
                                <span>Order #{order.orderId}</span>
                                <Badge
                                  className={`${getStatusBadgeClass(order.status)} text-xs`}
                                >
                                  {order.status}
                                </Badge>
                              </CardTitle>
                              <p className="text-xs text-zinc-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-zinc-400">
                            User ID: {order.userId ? `${order.userId.slice(0, 12)}...` : "Walk-in/Guest"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[#7ddc56]">
                                ₹{Math.round(parseFloat(order.totalAmount))}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-3 mb-4">
                            {order.items.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-3 p-3 bg-[#181818] rounded-lg border border-white/5"
                              >
                                <div className="flex-shrink-0">
                                  {item.product.images?.[0] ? (
                                    <img
                                      src={item.product.images[0].url}
                                      alt={item.product.images[0].altText || item.product.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">
                                        No Image
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {item.product.name}
                                  </h4>
                                  {getVariantName(item.variant) && (
                                    <p className="text-xs text-zinc-500 truncate">
                                  Variant: {getVariantName(item.variant)}
                                    </p>
                                  )}
                                  <p className="text-xs text-zinc-400">
                                    Qty: {item.quantity} • ₹
                                    {(parseFloat(item.price) * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-xs text-zinc-500 text-center">
                                +{order.items.length - 2} more items
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                updateOrderStatus(order.id, value)
                              }
                            >
                              <SelectTrigger className="flex-1 bg-[#181818] border-white/10 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CONFIRMED">
                                  Confirmed
                                </SelectItem>
                                <SelectItem value="SHIPPED">Shipped</SelectItem>
                                <SelectItem value="DELIVERED">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="CANCELLED">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() =>
                                router.push(
                                  `/seller-dashboard/orders/${order.id}`,
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="px-3 bg-[#4ca626] hover:bg-[#5bbd31] text-white border-none"
                            >
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
}
}