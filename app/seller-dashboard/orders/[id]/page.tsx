"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { isAdmin } from "@/app/extras/isAdmis";

import {
  Upload,
  FileText,
  Eye,
  ArrowLeft,
  ShoppingBag,
  Download,
} from "lucide-react";

import { toast } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { addresses } from "@/src/db/schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: string;
    category: {
      name: string;
    };
    images: {
      id: string;
      url: string;
      altText: string;
    }[];
  };
  variant?: string;
}

interface Order {
  id: string;
  orderId: string;
  userId: string;
  totalAmount: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;

  invoiceUrl?: string;

  items: OrderItem[];

  createdAt: string;
}

const sanitizeOrder = (data: any): Order => {
  const extractString = (val: any): string => {
    if (val === null || val === undefined) return "";

    if (typeof val === "object") {
      return (
        val.fullName ||
        val.name ||
        val.email ||
        val.id ||
        ""
      );
    }

    return String(val);
  };

 let addr: any = {};

const rawAddress =
  data.shippingAddress || data.address || {};

if (
  typeof rawAddress === "object" &&
  rawAddress !== null
) {
  addr = rawAddress;
} else if (
  typeof rawAddress === "string"
) {
  try {
    addr = JSON.parse(rawAddress);

    if (typeof addr === "string") {
      addr = JSON.parse(addr);
    }

    if (
      typeof addr !== "object" ||
      addr === null
    ) {
      addr = {};
    }
  } catch (e) {
    addr = {};
  }
}

  return {
    id: extractString(data.id),

    orderId: extractString(data.orderId),

    userId: extractString(data.userId),

    totalAmount:
      Number(data.totalAmount) || 0,

    status: extractString(
      data.status || "PENDING",
    ),

    razorpayOrderId: extractString(
      data.razorpayOrderId,
    ),

    razorpayPaymentId: extractString(
      data.razorpayPaymentId,
    ),

    fullName: extractString(
      data.fullName ||
        addr.fullName,
    ),

    contactNo: extractString(
      data.contactNo ||
        data.phone ||
        addr.phone ||
        addr.contactNo,
    ),

    address: extractString(
      data.addressLine1 ||
        addr.addressLine1 ||
        addr.address ||
        (typeof data.address === "string" && (!addr || Object.keys(addr).length === 0)
          ? data.address
          : ""),
    ),

    city: extractString(
      data.city || addr.city,
    ),

    state: extractString(
      data.state || addr.state || addr.region || addr.province || addr.State,
    ),

    pincode: extractString(
      data.pincode ||
        data.postalCode ||
        addr.pincode ||
        addr.postalCode,
    ),

    country: extractString(
      data.country ||
        addr.country,
    ),

    email: extractString(
      data.email ||
        addr.email,
    ),

    invoiceUrl: data.invoiceUrl
      ? extractString(
          data.invoiceUrl,
        )
      : undefined,

    createdAt: extractString(
      data.createdAt,
    ),

    items: Array.isArray(data.items)
      ? data.items.map(
          (item: any) => ({
            id: extractString(
              item.id,
            ),

            quantity:
              Number(
                item.quantity,
              ) || 0,

            price:
              Number(item.price) ||
              0,

            variant:
              extractString(
                item.variant,
              ),

            product: {
              id: extractString(
                item.product?.id,
              ),

              name: extractString(
                item.product?.name,
              ),

              price: extractString(
                item.product?.price,
              ),

              category: {
                name: extractString(
                  item.product
                    ?.category
                    ?.name,
                ),
              },

              images: Array.isArray(
                item.product?.images,
              )
                ? item.product.images.map(
                    (img: any) => ({
                      id: extractString(
                        img.id,
                      ),

                      url: extractString(
                        img.url,
                      ),

                      altText:
                        extractString(
                          img.altText,
                        ),
                    }),
                  )
                : [],
            },
          }),
        )
      : [],
  };
};

export default function SellerOrderDetailsPage() {
  const {
    isLoaded,
    isSignedIn,
    user,
  } = useUser();

  const router = useRouter();

  const params = useParams();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    if (
      isLoaded &&
      !isSignedIn
    ) {
      router.push("/sign-in");
      return;
    }

    if (user && params.id) {
      fetchOrder();
    }
  }, [
    user,
    isLoaded,
    params.id,
    router,
  ]);
  

  const fetchOrder = async () => {
    try {
      const response = await fetch(
        `/api/orders/${params.id}`,
      );
      

      if (response.ok) {
        const orderData =
          await response.json();
                console.log("ORDER DATA", orderData);
console.log("ADDRESS", orderData.address);
console.log("SHIPPING ADDRESS", orderData.shippingAddress);

        setOrder(
          sanitizeOrder(orderData),
        );
      } else {
        router.push(
          "/seller-dashboard/orders",
        );
      }
    } catch (error) {
      console.error(
        "Error fetching order:",
        error,
      );


      router.push(
        "/seller-dashboard/orders",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus =
    async (newStatus: string) => {
      if (!order) return;

      try {
        const response = await fetch(
          `/api/orders/${order.id}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          },
        );

        if (response.ok) {
          setOrder({
            ...order,
            status: newStatus,
          });

          toast.success(
            "Order status updated", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
          },}
          );
        }
      } catch (error) {
        console.error(
          "Error updating order status:", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        }},
          error,
        );

        toast.error(
          "Failed to update order status", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        }},
        );
      }
    };

  const handleInvoiceUpload =
    async (
      event: React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!order) return;

      const formData =
        new FormData(
          event.currentTarget,
        );

      const file =
        formData.get(
          "invoice",
        ) as File;

      if (!file) return;

      setUploading(true);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `invoice-${order.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(fileName, file, {
            contentType: file.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("invoices")
          .getPublicUrl(fileName);

        const response = await fetch(`/api/orders/${order.id}/invoice`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoiceUrl: publicUrlData.publicUrl }),
        });

        if (response.ok) {
          setOrder({
            ...order,
            invoiceUrl: publicUrlData.publicUrl,
          });

          toast.success(
            "Invoice uploaded successfully!", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        }},
          );
        } else {
          toast.error(
            "Failed to save invoice URL to order", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        }},
          );
        }
      } catch (error) {
        console.error(
          "Error uploading invoice:",
          error,
        );

        toast.error(
          "Error uploading invoice", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        }},
        );
      } finally {
        setUploading(false);
      }
    };

  const getStatusBadgeClass = (
    status: string,
  ) => {
    switch (
      status.toLowerCase()
    ) {
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

  if (
    !isLoaded ||
    !isSignedIn
  ) {
    return (
      <main className="w-full">
        <div className="p-6 mt-30">
          <div className="text-center">
            Please sign in with the
            admin account to access
            the Seller Dashboard.
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin(user)) {
    return null;
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
            <Header />

            <div className="p-6 text-center text-zinc-400">
              Loading order
              details...
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!order) {
    return (
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
            <Header />

            <div className="p-6 text-center text-zinc-400">
              Order not found.
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />

      <SidebarInset>
        <main className="w-full min-h-screen bg-[#0a0a0a] text-white">
          <Header />

          <div className="container mx-10 p-6">
            {/* HERO */}

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] p-8 mb-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4ca62620,transparent_35%)]" />

              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4ca626]/10 blur-3xl rounded-full" />

              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4ca626]/10 border border-[#4ca626]/20 text-[#7ddc56] text-sm font-medium mb-5">
                    <ShoppingBag className="w-4 h-4" />
                    Order Management
                  </div>

                  <h1 className="text-5xl font-black tracking-tight leading-none">
                    Order #
                    <span className="text-[#7ddc56]">
                      {order.orderId}
                    </span>
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 mt-5">
                    <Badge
                      className={`${getStatusBadgeClass(order.status)} px-4 py-1.5 rounded-full text-sm`}
                    >
                      {order.status}
                    </Badge>

                    <p className="text-zinc-400 text-sm">
                      {new Date(
                        order.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end">
                  <p className="text-zinc-500 text-sm mb-1">
                    Total Revenue
                  </p>

                  <h2 className="text-5xl font-black text-[#7ddc56] tracking-tight">
                    ₹
                    {Number(
                      order.totalAmount,
                    ).toFixed(2)}
                  </h2>

                  <div className="mt-5 flex gap-3">
                    <Select
                      value={
                        order.status
                      }
                      onValueChange={
                        updateOrderStatus
                      }
                    >
                      <SelectTrigger className="w-44 h-12 rounded-2xl bg-[#181818] border-white/10">
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

                    <Button
                      onClick={() =>
                        router.push(
                          "/seller-dashboard/orders",
                        )
                      }
                      variant="outline"
                      className=" rounded-2xl bg-[#181818] border-white/10"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOMER */}

            <Card className="mb-6 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20">
              <CardHeader className="border-b border-white/5 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 mb-2">
                      Customer
                    </p>

                    <CardTitle className="text-3xl font-black tracking-tight">
                      Customer Details
                    </CardTitle>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-[#4ca626]/10 border border-[#4ca626]/20 flex items-center justify-center">
                    <span className="text-[#7ddc56] text-2xl">
                      👤
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[
                    {
                      label:
                        "Full Name",
                      value:
                        order.fullName,
                    },
                    {
                      label:
                        "Contact",
                      value:
                        order.contactNo,
                    },
                    {
                      label:
                        "Email",
                      value:
                        order.email,
                    },
                    {
                      label:
                        "Address",
                      value:
                        order.address,
                    },
                    {
                      label:
                        "City",
                      value:
                        order.city,
                    },
                    {
                      label:
                        "State",
                      value:
                        order.state,
                    },
                    {
                      label:
                        "Pincode",
                      value:
                        order.pincode,
                    },
                    {
                      label:
                        "Country",
                      value:
                        order.country,
                    },
                  ].map(
                    (
                      field,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="rounded-2xl border border-white/5 bg-[#181818] p-5 hover:border-[#4ca626]/30 transition-all"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">
                          {
                            field.label
                          }
                        </p>

                        <p className="text-lg font-semibold break-words">
                          {field.value ||
                            "N/A"}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ORDER DETAILS */}

            <Card className="mb-6 bg-[#111111] border border-white/10 rounded-[2rem] overflow-hidden">
              <CardHeader className="border-b border-white/5 p-8">
                <CardTitle className="text-3xl font-black tracking-tight">
                  Payment &
                  Order Details
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-white/5 bg-[#181818] p-5">
                    <Label className="text-zinc-500">
                      Razorpay Order
                      ID
                    </Label>

                    <p className="mt-3 font-mono text-sm break-all">
                      {
                        order.razorpayOrderId
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-[#181818] p-5">
                    <Label className="text-zinc-500">
                      Payment ID
                    </Label>

                    <p className="mt-3 font-mono text-sm break-all">
                      {
                        order.razorpayPaymentId
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRODUCTS */}

            <Card className="mb-6 bg-[#111111] border border-white/10 rounded-[2rem] overflow-hidden">
              <CardHeader className="border-b border-white/5 p-8">
                <CardTitle className="text-3xl font-black tracking-tight">
                  Products
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                <div className="space-y-5">
                  {order.items.map(
                    (item) => (
                      <div
                        key={
                          item.id
                        }
                        className="group relative overflow-hidden rounded-[1.7rem] border border-white/5 bg-[#181818] p-5 transition-all duration-300 hover:border-[#4ca626]/20 hover:bg-[#1d1d1d]"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4ca62610,transparent_40%)] opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0">
                            {item
                              .product
                              .images?.[0] ? (
                              <img
                                src={
                                  item
                                    .product
                                    .images[0]
                                    .url
                                }
                                alt={
                                  item
                                    .product
                                    .images[0]
                                    .altText ||
                                  item
                                    .product
                                    .name
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                                No
                                Image
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-2xl font-bold tracking-tight">
                              {
                                item
                                  .product
                                  .name
                              }
                            </h3>

                            <div className="flex flex-wrap gap-3 mt-3">
                              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-sm text-zinc-300">
                                {
                                  item
                                    .product
                                    .category
                                    .name
                                }
                              </div>

                              {item.variant && (
                                <div className="px-3 py-1 rounded-full bg-[#4ca626]/10 border border-[#4ca626]/20 text-sm text-[#7ddc56]">
                                  {
                                    item.variant
                                  }
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="md:text-right">
                            <p className="text-zinc-500 text-sm">
                              Quantity
                            </p>

                            <p className="text-2xl font-bold">
                              {
                                item.quantity
                              }
                            </p>

                            <div className="mt-3">
                              <p className="text-zinc-500 text-sm">
                                Total
                              </p>

                              <p className="text-2xl font-black text-[#7ddc56]">
                                ₹
                                {(
                                  Number(
                                    item.price,
                                  ) *
                                  item.quantity
                                ).toFixed(
                                  2,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* INVOICE */}

            <Card className="bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20">
              <CardHeader className="border-b border-white/5 px-8 py-6">
                <CardTitle className="flex items-center gap-3 text-3xl font-black tracking-tight">
                  <div className="w-14 h-14 rounded-2xl bg-[#4ca626]/10 border border-[#4ca626]/20 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-[#7ddc56]" />
                  </div>

                  Invoice
                  Management
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                {order.invoiceUrl ? (
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 rounded-2xl border border-[#4ca626]/20 bg-[#4ca626]/5 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#4ca626]/10 flex items-center justify-center">
                          <FileText className="w-7 h-7 text-[#7ddc56]" />
                        </div>

                        <div>
                          <h3 className="text-xl font-bold">
                            Invoice
                            Uploaded
                          </h3>

                          <p className="text-zinc-400 text-sm mt-1">
                            Customer
                            invoice
                            attached
                            successfully.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() =>
                            window.open(
                              order.invoiceUrl,
                              "_blank",
                            )
                          }
                          className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-2xl h-12 px-6"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          onClick={() =>
                            window.open(`${order.invoiceUrl}?download=`, "_blank")
                          }
                          variant="outline"
                          className="border-[#4ca626]/20 text-[#7ddc56] hover:bg-[#4ca626]/10 rounded-2xl h-12 px-6 bg-transparent"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-[#181818] p-6">
                      <h4 className="text-lg font-bold mb-5">
                        Replace
                        Invoice
                      </h4>

                      <form
                        onSubmit={
                          handleInvoiceUpload
                        }
                        className="space-y-5"
                      >
                        <div>
                          <Label
                            htmlFor="invoice"
                            className="text-zinc-400"
                          >
                            Upload
                            New
                            Invoice
                          </Label>

                          <Input
                            id="invoice"
                            name="invoice"
                            type="file"
                            accept=".pdf,image/*"
                            required
                            className="mt-3 h-12 bg-[#101010] border-white/10 rounded-xl"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={
                            uploading
                          }
                          className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-2xl h-12 px-8"
                        >
                          {uploading
                            ? "Uploading..."
                            : "Update Invoice"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#181818] p-8">
                    <form
                      onSubmit={
                        handleInvoiceUpload
                      }
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-3xl bg-[#4ca626]/10 border border-[#4ca626]/20 flex items-center justify-center mx-auto mb-5">
                          <Upload className="w-10 h-10 text-[#7ddc56]" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2">
                          Upload
                          Invoice
                        </h3>

                        <p className="text-zinc-400">
                          Upload PDF
                          or image
                          invoice
                          for this
                          order.
                        </p>
                      </div>

                      <div>
                        <Label
                          htmlFor="invoice"
                          className="text-zinc-400"
                        >
                          Invoice
                          File
                        </Label>

                        <Input
                          id="invoice"
                          name="invoice"
                          type="file"
                          accept=".pdf,image/*"
                          required
                          className="mt-3 h-12 bg-[#101010] border-white/10 rounded-xl"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          uploading
                        }
                        className="w-full bg-[#4ca626] hover:bg-[#5bbd31] rounded-2xl h-12 text-base font-semibold"
                      >
                        {uploading
                          ? "Uploading..."
                          : "Upload Invoice"}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}