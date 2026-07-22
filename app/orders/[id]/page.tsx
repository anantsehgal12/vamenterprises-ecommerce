"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Share2,
  ExternalLink,
  FileText,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

interface ProductImage {
  url: string;
}

interface Product {
  name: string;
  images?: ProductImage[];
  category?: { name: string };
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: Product;
}

interface OrderData {
  id: string;
  orderId?: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  awb?: string;
  totalAmount?: number;
  createdAt?: string;
  invoiceUrl?: string;
  paymentMethod?: string;
  cancelReason?: string;
  items: OrderItem[];
}

interface TrackingActivity {
  date: string;
  status: string;
  location: string;
  activity: string;
}

interface TrackingData {
  tracking_data?: {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: Array<{
      current_status?: string;
      origin?: string;
      destination?: string;
      etd?: string;
    }>;
    shipment_track_activities?: TrackingActivity[];
  };
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link shortener / sharing state
  const [shortUrl, setShortUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // 1. Fetch Order Data
  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoadingOrder(true);
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load order");
        }
        const data: OrderData = await res.json();
        setOrder(data);

        // Set initial share URL
        if (typeof window !== "undefined") {
          setShortUrl(`${window.location.origin}/orders/${data.id}`);
        }

        // 2. Fetch Tracking Data if AWB exists
        if (data.awb) {
          fetchTracking(data.awb);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoadingOrder(false);
      }
    }

    fetchOrder();
  }, [id]);

  const fetchTracking = async (awbNumber: string) => {
    try {
      setLoadingTracking(true);
      const res = await fetch(
        `/api/shiprocket-tracking?awb=${encodeURIComponent(awbNumber)}`
      );
      if (res.ok) {
        const trackData = await res.json();
        setTracking(trackData);
      }
    } catch (err) {
      console.error("Failed to load tracking data:", err);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Inbuilt Shortener & Copy Handler
  const handleCopyLink = async () => {
    try {
      // Inbuilt shortener transform: Uses clean order reference hash
      const baseUrl = window.location.origin;
      const displayUrl = `${baseUrl}/o/${order?.orderId || id}`;
      
      await navigator.clipboard.writeText(displayUrl);
      setShortUrl(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order #${order?.orderId || id}`,
          text: `Track my order status`,
          url: shortUrl || window.location.href,
        });
      } catch (err) {
        console.error("Share cancelled/failed", err);
      }
    } else {
      handleCopyLink();
    }
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 animate-pulse">
          <Package className="w-6 h-6 animate-spin" />
          <span className="font-medium text-lg">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg border border-gray-100 dark:border-gray-700">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Order
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const trackDetails = tracking?.tracking_data?.shipment_track?.[0];
  const trackActivities =
    tracking?.tracking_data?.shipment_track_activities || [];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Orders
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Order #{order.orderId || order.id.slice(0, 8)}
          </span>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                Order Status
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Inbuilt Link Shortener & Share Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all"
                title="Copy shortened tracking link"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Short Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="pt-6">
            <OrderStatusTimeline currentStatus={order.status} />
          </div>
        </div>

        {/* Live Shipment Tracking Section */}
        {order.awb && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Shipment Tracking
                </h3>
              </div>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300">
                AWB: {order.awb}
              </span>
            </div>

            {loadingTracking ? (
              <div className="py-8 text-center text-gray-400 animate-pulse text-sm">
                Fetching latest shipment events...
              </div>
            ) : trackActivities.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-6">
                {trackActivities.map((act, idx) => (
                  <div key={idx} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-gray-800" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {act.activity}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {act.location} &bull; {act.date}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                {trackDetails?.current_status
                  ? `Current Status: ${trackDetails.current_status}`
                  : "Tracking details will update once scanned by the courier."}
              </p>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Items Ordered
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {order.items?.map((item) => {
              const imgUrl = item.product?.images?.[0]?.url || "/placeholder.png";
              return (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center gap-4"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                    <Image
                      src={imgUrl}
                      alt={item.product?.name || "Product image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {item.product?.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invoice & Total Summary */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              {order.invoiceUrl && (
                <a
                  href={order.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <FileText className="w-4 h-4" /> Download Official Invoice{" "}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                Total Paid ({order.paymentMethod || "Online"})
              </span>
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                ₹{order.totalAmount?.toLocaleString("en-IN") || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800",
    DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || styles.PENDING
      }`}
    >
      {status === "DELIVERED" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status === "CANCELLED" && <XCircle className="w-3.5 h-3.5" />}
      {["PENDING", "CONFIRMED", "SHIPPED"].includes(status) && (
        <Clock className="w-3.5 h-3.5" />
      )}
      {status}
    </span>
  );
}

// Progress Bar Visualizer
function OrderStatusTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
  const isCancelled = currentStatus === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>This order was cancelled and cannot be tracked further.</span>
      </div>
    );
  }

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="relative">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`absolute top-4 right-1/2 left-[-50%] h-0.5 -z-0 transition-colors ${
                    idx <= currentIndex
                      ? "bg-blue-600 dark:bg-blue-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}

              {/* Status Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                  isCompleted
                    ? "bg-blue-600 text-white ring-4 ring-blue-50 dark:ring-blue-950"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>

              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}