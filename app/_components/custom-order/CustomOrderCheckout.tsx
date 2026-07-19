// app/_components/custom-order/CustomOrderCheckout.tsx
//
// Adjust the PaymentMethodSelector import path below to wherever
// PaymentMethodSelector.tsx actually lives in your project.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { CheckCircle2, MapPin, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/app/_components/home/PaymentMethodSelector";

type PaymentMethod = "Razorpay" | "COD";

interface CustomOrderItem {
  productId: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

interface CustomOrderData {
  id: string;
  token: string;
  title: string;
  description: string | null;
  items: CustomOrderItem[];
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  expiresAt: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CustomOrderCheckout({
  order,
  token,
}: {
  order: CustomOrderData;
  token: string;
}) {
  const { user } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Razorpay");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user]);

  const subtotal = Number(order.subtotalAmount);
  const discount = Number(order.discountAmount);
  const total = Number(order.totalAmount);
  const advanceAmount = paymentMethod === "COD" ? Number((total * 0.5).toFixed(2)) : total;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      toast.error("Please fill in your delivery details", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    setSubmitting(true);
    try {
      const claimRes = await fetch(`/api/custom-orders/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          paymentMethod,
        }),
      });

      const claimData = await claimRes.json();
      if (!claimRes.ok) throw new Error(claimData.error || "Couldn't place your order");

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Couldn't load the payment gateway. Please try again.");

      const rzp = new window.Razorpay({
        key: claimData.razorpayKeyId,
        amount: Math.round(claimData.amountDue * 100),
        currency: "INR",
        name: "VAM Enterprises",
        description: order.title,
        order_id: claimData.razorpayOrderId,
        prefill: { name: fullName, email, contact: phone },
        theme: { color: "#4ca626" },
        handler: async (response: any) => {
          const verifyRes = await fetch(`/api/custom-orders/${token}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: claimData.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setSuccess({ orderNumber: verifyData.orderNumber });
          } else {
            toast.error(verifyData.error || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      rzp.open();
    } catch (error: any) {
      toast.error(error.message, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 rounded-3xl bg-[#4ca626]/10 blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 sm:p-10 text-center">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#4ca626]/20 border border-[#4ca626]/30 flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-[#7ddc56]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif mb-2">Order confirmed</h1>
            <p className="text-sm text-zinc-400 mb-1 break-words">Order #{success.orderNumber}</p>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 break-words">
              We'll send updates to {email || "your email"}. Thank you for shopping with VAM Enterprises.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="h-12 w-full rounded-xl bg-[#4ca626] hover:bg-[#5bbd31] font-semibold shadow-[0_0_40px_rgba(76,166,38,0.25)]"
            >
              Continue
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-28 lg:pb-16">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#4ca626]/30 bg-[#4ca626]/10 px-4 py-1.5 text-xs text-[#7ddc56]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            Curated just for you
          </span>
          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight font-serif break-words">
            {order.title}
          </h1>
          {order.description && (
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-400 leading-relaxed break-words">
              {order.description}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 sm:gap-8"
      >

        <div className="space-y-8 order-2 xl:order-1">
          {/* Delivery details */}
          <Card className="border-zinc-800 bg-gradient-to-b from-[#0b0d18] to-black rounded-3xl p-4 sm:p-6 lg:p-7 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
            <div className="mb-6 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-lime-500 shrink-0" />
              <div>
                <h2 className="font-mono text-lg sm:text-xl font-semibold text-white">Delivery Details</h2>
                <p className="text-xs text-zinc-500 mt-1">Where should we send your order?</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <Label className="mb-2 block text-zinc-300">Full Name *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  placeholder="Priya Sharma"
                  required
                />
              </div>
              <div>
                <Label className="mb-2 block text-zinc-300">Contact Number *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-zinc-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  placeholder="priya@email.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-zinc-300">Address Line 1 *</Label>
                <Input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  placeholder="Flat / House no., Street"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-zinc-300">Address Line 2</Label>
                <Input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  placeholder="Landmark, area (optional)"
                />
              </div>
              <div>
                <Label className="mb-2 block text-zinc-300">City *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  required
                />
              </div>
              <div>
                <Label className="mb-2 block text-zinc-300">State *</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  required
                />
              </div>
              <div>
                <Label className="mb-2 block text-zinc-300">Pincode *</Label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                  required
                />
              </div>
              <div>
                <Label className="mb-2 block text-zinc-300">Country</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-12 rounded-xl bg-black/30 border-zinc-800"
                />
              </div>
            </div>
          </Card>

          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          <Button
            type="submit"
            disabled={submitting}
            className="hidden xl:flex w-full h-14 rounded-2xl bg-[#4ca626] hover:bg-[#5bbd31] text-white font-semibold text-sm sm:text-base shadow-[0_0_40px_rgba(76,166,38,0.35)] disabled:opacity-50 px-4 text-center"
          >
            {submitting ? "Processing..." : `Confirm & Pay ₹${advanceAmount.toLocaleString("en-IN")}`}
          </Button>
        </div>

        {/* Order summary */}
        <div className="order-1 xl:order-2 space-y-6 xl:sticky xl:top-10 h-fit">
          <Card className="border-zinc-800 bg-gradient-to-b from-[#0b0d18] to-black rounded-3xl p-4 sm:p-6 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
            <h3 className="font-mono text-lg sm:text-xl font-semibold text-white mb-6">Your Order</h3>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-sm gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-white break-words">{item.name}</p>
                    <p className="text-zinc-500">
                      {item.quantity} x ₹{item.price.toLocaleString("en-IN")}
                    </p>
                    {item.variant && <p className="text-xs text-zinc-500 break-words">Variant: {item.variant}</p>}
                  </div>
                  <span className="font-medium text-white whitespace-nowrap shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-[#7ddc56]">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between items-center text-lg font-bold text-[#7ddc56]">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              {paymentMethod === "COD" && (
                <p className="text-xs text-zinc-500 pt-1">
                  Pay ₹{advanceAmount.toLocaleString("en-IN")} now, ₹
                  {(total - advanceAmount).toLocaleString("en-IN")} on delivery.
                </p>
              )}
            </div>
          </Card>
        </div>
      </form>

      {/* Sticky mobile submit bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 xl:hidden border-t border-white/10 bg-black/70 backdrop-blur-xl p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-2xl bg-[#4ca626] hover:bg-[#5bbd31] text-white font-semibold text-sm sm:text-base shadow-[0_0_40px_rgba(76,166,38,0.35)] disabled:opacity-50 px-4 text-center"
        >
          {submitting ? "Processing..." : `Confirm & Pay ₹${advanceAmount.toLocaleString("en-IN")}`}
        </Button>
      </div>
    </main>
  );
}