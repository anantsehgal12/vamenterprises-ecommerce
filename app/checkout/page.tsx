"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navbar from "@/app/_components/home/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Info, Edit, Tag, Copy, Check } from "lucide-react";
import BottomNav from "../_components/home/BottomNav";
import { PaymentMethodSelector } from "../_components/home/PaymentMethodSelector";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartItem {
  id: string;
  quantity: number;
  price?: number | null; 
  couponCode?: string | null; 
  product: {
    id: string;
    name: string;
    price: string;
    taxRate: string;
    category: { name: string };
    images: { id: string; url: string; altText: string }[];
  };
  variant?: string;
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface AddressFormData {
  name: string;
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
  isDefault: boolean;
}

interface CustomerDetails {
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
}

interface Address {
  id: string;
  name: string;
  fullName: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
  isDefault: boolean;
}

interface FeesSettings {
  standardDeliveryFee: number;
  freeDeliveryThreshold: number;
  freeDeliveryCoupon: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

function AvailableCoupons({
  coupons,
  loading,
  appliedCode,
  onSelect,
}: {
  coupons: Coupon[];
  loading: boolean;
  appliedCode?: string;
  onSelect: (code: string) => void;
}) {
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "FREE_SHIPPING") return "Free Delivery";
    if (coupon.discountType === "PERCENT") return `${coupon.value}% OFF`;
    return `₹${coupon.value} OFF`;
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-40 flex-shrink-0 animate-pulse rounded-xl bg-zinc-800/60"
          />
        ))}
      </div>
    );
  }

  if (coupons.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-white text-sm font-medium flex items-center gap-1.5">
        <Tag className="h-4 w-4 text-[#4ca626]" />
        Available Coupons
      </Label>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {coupons.map((coupon) => {
          const isApplied = appliedCode === coupon.code;
          return (
            <button
              key={coupon.id}
              type="button"
              onClick={() => onSelect(coupon.code)}
              disabled={isApplied}
              className={`flex-shrink-0 w-44 text-left rounded-xl border p-3 transition-colors ${
                isApplied
                  ? "border-[#4ca626] bg-[#4ca626]/10 cursor-default"
                  : "border-dashed border-[#4ca626]/40 bg-black/40 hover:border-[#4ca626] hover:bg-[#4ca626]/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-[#9be274] truncate">
                  {coupon.code}
                </span>
                {isApplied ? (
                  <Check className="h-4 w-4 text-[#9be274] flex-shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {formatDiscount(coupon)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    fullName: "",
    contactNo: "+91",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    email: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    fullName: "",
    contactNo: "+91",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    email: "",
    isDefault: false,
  });
  const [isTaxInfoOpen, setIsTaxInfoOpen] = useState(false);
  const [feesSettings, setFeesSettings] = useState<FeesSettings>({
    standardDeliveryFee: 0,
    freeDeliveryThreshold: 0,
    freeDeliveryCoupon: false,
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"Razorpay" | "COD">("Razorpay");
  
  // Track if coupon was auto-applied from item data to disable additional options
  const [isAutoApplied, setIsAutoApplied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isLoaded && !user) {
        router.push("/sign-in");
        return;
      }

      if (user) {
        await fetchCartAndAutoApply(); // Updated to handle auto-apply routing logic seamlessly
        await fetchFeesSettings();
        await fetchSavedAddresses();
        await fetchAvailableCoupons();
        setLoading(false);
      }
    };

    loadData();
  }, [user, isLoaded, router]);

  // Fetches the cart and evaluates line items for pre-applied coupon parameters
  const fetchCartAndAutoApply = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);

        // Check if any line-item brought an active coupon key across from the product page
        const embeddedCouponItem = cartData.items?.find((item: CartItem) => item.couponCode);
        if (embeddedCouponItem?.couponCode) {
          const code = embeddedCouponItem.couponCode;
          setCouponCode(code);
          
          // Silently trigger verification route to assign proper global object to state context
          const checkResponse = await fetch(`/api/coupons/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          
          if (checkResponse.ok) {
            const verifiedCoupon = await checkResponse.json();
            setAppliedCoupon(verifiedCoupon);
            setIsAutoApplied(true);
            toast.success(`Coupon "${code}" auto-applied from your cart!`, { id: "auto-coupon-toast" });
          }
        }
      }
    } catch (error) {
      console.error("Error running cart auto-apply sequence:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchFeesSettings = async () => {
    try {
      const response = await fetch("/api/settings/fees");
      if (response.ok) {
        const feesData = await response.json();
        const newFeesSettings = {
          standardDeliveryFee: parseFloat(feesData.standardDeliveryFee) || 50,
          freeDeliveryThreshold: parseFloat(feesData.freeDeliveryThreshold) || 500,
          freeDeliveryCoupon: feesData.freeDeliveryCoupon || false,
        };
        setFeesSettings(newFeesSettings);
      } else {
        setFeesSettings({
          standardDeliveryFee: 50,
          freeDeliveryThreshold: 500,
          freeDeliveryCoupon: false,
        });
      }
    } catch (error) {
      console.error("Error fetching fees settings:", error);
      setFeesSettings({
        standardDeliveryFee: 50,
        freeDeliveryThreshold: 500,
        freeDeliveryCoupon: false,
      });
    }
  };

  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await fetch("/api/coupons?active=true");
      if (response.ok) {
        const data = await response.json();
        const list: Coupon[] = Array.isArray(data) ? data : data.coupons || [];

        const now = new Date();
        const validCoupons = list.filter((coupon) => {
          if (!coupon.isActive) return false;
          if (coupon.expiryDate && new Date(coupon.expiryDate) < now) return false;
          if (
            coupon.usageLimit &&
            coupon.usageLimit > 0 &&
            coupon.usedCount >= coupon.usageLimit
          ) {
            return false;
          }
          return true;
        });

        setAvailableCoupons(validCoupons);
      } else {
        setAvailableCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching available coupons:", error);
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchSavedAddresses = async (newAddressId?: string, addedFormData?: AddressFormData) => {
    try {
      const response = await fetch("/api/addresses");
      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);
        
        let addressToSelect = null;
        if (newAddressId) {
          addressToSelect = addresses.find((addr: Address) => addr.id === newAddressId);
        } else if (addedFormData) {
          addressToSelect = addresses.find((addr: Address) => addr.name === addedFormData.name && addr.address === addedFormData.address);
        }
        
        if (!addressToSelect && !selectedAddressId) {
          addressToSelect = addresses.find((addr: Address) => addr.isDefault);
        }

        if (addressToSelect) {
          setSelectedAddressId(addressToSelect.id);
          setCustomerDetails({
            fullName: addressToSelect.fullName || (addressToSelect as any).name || "",
            contactNo: addressToSelect.contactNo || (addressToSelect as any).phone || "",
            address: addressToSelect.address,
            city: addressToSelect.city,
            state: addressToSelect.state || (addressToSelect as any).State || (addressToSelect as any).region || "",
            pincode: addressToSelect.pincode || (addressToSelect as any).postalCode || "",
            country: addressToSelect.country,
            email: addressToSelect.email,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Safe helper extraction tool to parse original un-discounted base price out of items
  const getStandardProductBasePrice = (item: CartItem): number => {
    return parseFloat(item.product.price.replace(/[^\d.]/g, ""));
  };

  // Subtotal uses standard product values to avoid computing discounts on top of discounts
  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      return total + getStandardProductBasePrice(item) * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const basePrice = getStandardProductBasePrice(item);
      const taxRate = parseFloat(item.product.taxRate) || 0;
      return total + (basePrice * item.quantity * taxRate) / 100;
    }, 0);
  };

  const calculateDeliveryFee = () => {
    if (appliedCoupon?.discountType === "FREE_SHIPPING") {
      return 0;
    }
    const subtotal = calculateSubtotal();
    if (
      feesSettings.freeDeliveryThreshold > 0 &&
      subtotal >= feesSettings.freeDeliveryThreshold
    ) {
      return 0;
    }
    return feesSettings.standardDeliveryFee;
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "FREE_SHIPPING") return 0;

    const taxableAmount = calculateSubtotal() + calculateTax();
    if (appliedCoupon.discountType === "PERCENT") {
      return (taxableAmount * appliedCoupon.value) / 100;
    } else {
      return Math.min(appliedCoupon.value, taxableAmount);
    }
  };

  const calculateTotal = () => {
    return Math.round(
      calculateSubtotal() +
        calculateTax() +
        calculateDeliveryFee() -
        calculateDiscount()
    );
  };

  const applyCoupon = async (codeOverride?: string) => {
    const codeToApply = (codeOverride ?? couponCode).trim();

    if (!codeToApply) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply }),
      });

      if (response.ok) {
        const coupon = await response.json();
        setAppliedCoupon(coupon);
        setCouponCode(coupon.code || codeToApply);
        setCouponError("");
        setIsAutoApplied(false); // Explicit manual override
        toast.success("Coupon applied successfully!", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Invalid coupon code", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
      setAppliedCoupon(null);
    }
  };

  const handleSelectAvailableCoupon = (code: string) => {
    setCouponCode(code);
    applyCoupon(code);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    setIsAutoApplied(false);
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id);
    setCustomerDetails({
      fullName: address.fullName,
      contactNo: address.contactNo,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      email: address.email,
    });
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setFormData({
      name: "",
      fullName: "",
      contactNo: "+91",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      email: "",
      isDefault: false,
    });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAddressId
        ? `/api/addresses/${editingAddressId}`
        : "/api/addresses";
      const method = editingAddressId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        await fetchSavedAddresses(data?.id || data?.address?.id || editingAddressId, formData);
        setIsAddDialogOpen(false);
        resetAddressForm();
        toast.success(editingAddressId ? "Address updated successfully" : "Address added successfully", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${editingAddressId ? "update" : "save"} address`, {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(`Failed to ${editingAddressId ? "update" : "save"} address`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    }
  };

  const handleNewPincodeChange = async (pincode: string) => {
    setFormData((prev) => ({ ...prev, pincode }));

    if (pincode.length === 6) {
      try {
        const response = await fetch(`/api/pincode?pincode=${pincode}`);
        const json = await response.json();

        let fetchedCity = "";
        let fetchedState = "";

        if (json?.data) {
          fetchedCity = json.data.district_name || json.data.District || json.data.city;
          fetchedState = json.data.state_name || json.data.State || json.data.state;
        } else if (Array.isArray(json)) {
          if (json[0]?.PostOffice?.[0]) {
            fetchedCity = json[0].PostOffice[0].District;
            fetchedState = json[0].PostOffice[0].State;
          } else if (json[0]?.district_name || json[0]?.state_name) {
            fetchedCity = json[0].district_name || json[0].District || json[0].city;
            fetchedState = json[0].state_name || json[0].State || json[0].state;
          }
        }

        if (fetchedCity || fetchedState) {
          setFormData((prev) => ({
            ...prev,
            ...(fetchedCity && { city: fetchedCity }),
            ...(fetchedState && { state: fetchedState }),
          }));
        }
      } catch (error) {
        console.error("Error fetching pincode data:", error);
      }
    }
  };

  const handleEditClick = (e: React.MouseEvent, address: Address) => {
    e.stopPropagation();
    setEditingAddressId(address.id);
    setFormData({
      name: address.name,
      fullName: address.fullName,
      contactNo: address.contactNo,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      email: address.email,
      isDefault: address.isDefault,
    });
    setIsAddDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!cart?.items || cart.items.length === 0) {
      toast.error("Your cart is empty", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    const requiredFields = [
      "fullName",
      "contactNo",
      "address",
      "city",
      "state",
      "pincode",
      "country",
      "email",
    ];
    const missingFields = requiredFields.filter(
      (field) => !customerDetails[field as keyof CustomerDetails]?.trim()
    );

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const totalAmount = calculateTotal();
      const amountToPay = paymentMethod === "COD" ? totalAmount / 2 : totalAmount;

      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountToPay,
          currency: "INR",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment order");
      }

      const { orderId, amount, currency } = await response.json();

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "VAM Enterprises",
        description: "Purchase from Vam Enterprises",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const orderResponse = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                totalAmount: calculateTotal(),
                amountPaid: amountToPay,
                paymentMethod: paymentMethod,
                customerDetails,
                appliedCoupon: appliedCoupon
                  ? {
                      id: appliedCoupon.id,
                      code: appliedCoupon.code,
                      discountType: appliedCoupon.discountType,
                      value: appliedCoupon.value,
                    }
                  : null,
              }),
            });

            if (orderResponse.ok) {
              const orderData = await orderResponse.json();
              setCart(null);
              toast.success("Payment successful! Order created.", {
                style: { borderRadius: "10px", background: "#333", color: "#fff" },
              });
              router.push(`/order-complete/${orderData.id}`);
            } else {
              throw new Error("Failed to create order");
            }
          } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Payment successful but failed to create order. Please contact support.", {
              style: { borderRadius: "10px", background: "#333", color: "#fff" },
            });
          }
        },
        prefill: {
          name: user?.firstName + " " + user?.lastName,
          email: user?.primaryEmailAddress?.emailAddress,
          contact: customerDetails.contactNo,
        },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getItemImage = (item: CartItem) => {
    if (item.product.images?.[0]) {
      return item.product.images[0].url;
    }
    return null;
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />
            <p className="text-lg text-zinc-400">Loading Checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />
        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <div className="py-6 md:py-8 relative z-10">
        <div className="container mx-auto px-4 max-w-8xl">
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 ml-0 md:ml-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Checkout
          </motion.h1>

          {!cart?.items || cart.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-zinc-300 text-base md:text-lg mb-4">Your cart is empty</div>
              <Button
                onClick={() => router.push("/cart")}
                className="rounded-3xl p-6 md:p-8 text-sm md:text-md bg-[#4ca626] text-white hover:bg-[#5cbf32]"
              >
                Go to Cart
              </Button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Left side - Form */}
              <div className="lg:col-span-2">
                <form
                  id="customerForm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePayment();
                  }}
                >
                  {/* Saved Addresses Section */}
                  <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] mb-6 backdrop-blur-xl rounded-2xl sm:rounded-[2rem]">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-6">
                      <CardTitle className="text-white text-xl md:text-2xl font-bold">
                        Select Delivery Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-6 space-y-4">
                      {savedAddresses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id}
                              onClick={() => handleAddressSelect(address)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                selectedAddressId === address.id
                                  ? "border-[#4ca626] bg-[#4ca626]/10"
                                  : "border-white/10 bg-zinc-900/50 hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <h4 className="text-white font-medium">
                                      {address.name}
                                    </h4>
                                    {address.isDefault && (
                                      <span className="ml-2 px-2 py-1 bg-[#4ca626]/20 text-[#9be274] border border-[#4ca626]/30 text-xs rounded-full">
                                        Default
                                      </span>
                                    )}
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => handleEditClick(e, address)}
                                      className="ml-auto text-zinc-400 hover:text-white p-1 h-8 w-8"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="text-zinc-400 text-sm space-y-1">
                                    <div>
                                      <strong>{address.fullName}</strong>
                                    </div>
                                    <div>{address.address}</div>
                                    <div>
                                      {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                                    </div>
                                    <div>{address.contactNo}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-zinc-400 mb-4">No address found</p>
                          <Button
                            type="button"
                            onClick={() => setIsAddDialogOpen(true)}
                            className="rounded-3xl bg-[#4ca626] text-white hover:bg-[#5cbf32]"
                          >
                            Add Your First Address
                          </Button>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(true)}
                          className="border-white/10 text-white hover:bg-zinc-800"
                        >
                          + Add New Address
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => router.push("/my-addresses")}
                          className="text-[#4ca626] hover:text-[#5cbf32]"
                        >
                          <Link href="/my-addresses">Manage Addresses</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] backdrop-blur-xl rounded-2xl sm:rounded-[2rem]">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-6">
                      <CardTitle className="text-white text-xl md:text-2xl font-bold">
                        {savedAddresses.length > 0 ? "Delivery Details" : "Customer Details"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-6 space-y-4 md:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-white text-sm font-medium">Full Name *</Label>
                          <Input id="fullName" type="text" value={customerDetails.fullName} readOnly className="bg-black/50 border-white/10 text-white" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactNo" className="text-white text-sm font-medium">Contact No. *</Label>
                          <Input id="contactNo" type="tel" value={customerDetails.contactNo} readOnly className="bg-black/50 border-white/10 text-white" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white text-sm font-medium">Email *</Label>
                        <Input id="email" type="email" value={customerDetails.email} readOnly className="bg-black/50 border-white/10 text-white" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-white text-sm font-medium">Address *</Label>
                        <Input id="address" type="text" value={customerDetails.address} readOnly className="bg-black/50 border-white/10 text-white" required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-white text-sm font-medium">City *</Label>
                          <Input id="city" type="text" value={customerDetails.city} readOnly className="bg-black/50 border-white/10 text-white" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-white text-sm font-medium">State *</Label>
                          <Input id="state" type="text" value={customerDetails.state} readOnly className="bg-black/50 border-white/10 text-white" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode" className="text-white text-sm font-medium">Pincode *</Label>
                          <Input id="pincode" type="text" value={customerDetails.pincode} readOnly className="bg-black/50 border-white/10 text-white" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-white text-sm font-medium">Country *</Label>
                          <Input id="country" type="text" value={customerDetails.country} readOnly className="bg-black/50 border-white/10 text-white" required />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>

              {/* Right side - Summary */}
              <div className="lg:col-span-1 space-y-10">
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
                <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] backdrop-blur-xl rounded-2xl sm:rounded-[2rem] sticky top-24">
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-6">
                    <CardTitle className="text-xl text-white pb-0">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 space-y-3 sm:space-y-4 overflow-visible">
                    
                    {/* Hide click list if a cart item auto-applied a single-use coupon */}
                    {!isAutoApplied && (
                      <AvailableCoupons
                        coupons={availableCoupons}
                        loading={loadingCoupons}
                        appliedCode={appliedCoupon?.code}
                        onSelect={handleSelectAvailableCoupon}
                      />
                    )}

                    {/* Coupon Input Area */}
                    <div className="space-y-2">
                      <Label htmlFor="coupon" className="text-white text-sm font-medium">Have a coupon?</Label>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Input
                          id="coupon"
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="bg-black/50 border-white/10 text-white flex-1"
                          disabled={!!appliedCoupon}
                        />
                        {!appliedCoupon ? (
                          <Button onClick={() => applyCoupon()} variant="outline" className="border-white/10 text-white w-full sm:w-auto">
                            Apply
                          </Button>
                        ) : (
                          <Button onClick={removeCoupon} variant="outline" className="border-red-500/50 text-red-400 w-full sm:w-auto">
                            Remove
                          </Button>
                        )}
                      </div>
                      {couponError && <div className="text-red-400 text-sm">{couponError}</div>}
                      {appliedCoupon && (
                        <div className="text-[#9be274] text-xs font-semibold">
                          {isAutoApplied ? `✓ Coupon "${appliedCoupon.code}" auto-applied from your item configuration.` : `✓ Coupon "${appliedCoupon.code}" globally running.`}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-white text-sm md:text-base">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-white text-sm md:text-base">
                      <div className="flex items-center space-x-2">
                        <span>Tax:</span>
                        <div className="relative">
                          <Collapsible open={isTaxInfoOpen} onOpenChange={setIsTaxInfoOpen}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-1 h-auto">
                                <Info className="h-4 w-4 text-zinc-400 hover:text-white" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="absolute bottom-full left-0 mb-2 w-80 bg-zinc-900 border border-white/10 rounded-xl p-4 z-10 shadow-2xl backdrop-blur-xl">
                              <div className="space-y-2 text-sm">
                                <div className="font-medium text-white">Tax Breakdown:</div>
                                {cart?.items.map((item) => {
                                  const unitBasePrice = getStandardProductBasePrice(item);
                                  const taxRate = parseFloat(item.product.taxRate) || 0;
                                  const itemTaxTotal = (unitBasePrice * item.quantity * taxRate) / 100;
                                  return (
                                    <div key={item.id} className="flex justify-between text-zinc-400">
                                      <span className="truncate max-w-[70%]">
                                        {item.product.name} ({taxRate}%):
                                      </span>
                                      <span>₹{itemTaxTotal.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-medium text-white">
                                  <span>Total Tax:</span>
                                  <span>₹{calculateTax().toFixed(2)}</span>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                      <span>₹{calculateTax().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-white text-sm md:text-base">
                      <span>Delivery Fee:</span>
                      <span>₹{calculateDeliveryFee()}</span>
                    </div>
                    {appliedCoupon && appliedCoupon.discountType !== "FREE_SHIPPING" && (
                      <div className="flex justify-between text-[#9be274] text-sm md:text-base">
                        <span>Discount ({appliedCoupon.code}):</span>
                        <span>-₹{calculateDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base md:text-lg font-bold text-white border-t border-white/10 pt-4 mt-2">
                      <span>Total Amount:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    {paymentMethod === "COD" && (
                      <div className="flex justify-between text-base md:text-lg font-bold text-[#9be274]">
                        <span>Advance to Pay (50%):</span>
                        <span>₹{(calculateTotal() / 2).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-zinc-800 h-10 sm:h-12 rounded-xl text-sm sm:text-base"
                        onClick={() => router.push("/cart")}
                      >
                        Back to Cart
                      </Button>
                      <Button
                        type="submit"
                        form="customerForm"
                        className="w-full rounded-xl p-4 text-sm md:text-base cursor-pointer h-10 sm:h-12 bg-[#4ca626] text-white hover:bg-[#5cbf32]"
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? "Processing..." : paymentMethod === "COD" ? `Pay Advance ₹${(calculateTotal() / 2).toFixed(2)}` : "Pay Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetAddressForm();
      }}>
        <DialogContent className="bg-zinc-900 text-white max-w-2xl border-white/10 overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>{editingAddressId ? "Edit Address" : "Add New Address"}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="dialogName">Address Name *</Label><Input id="dialogName" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Home, Office" className="bg-black/50 border-white/10 text-white" required /></div>
              <div><Label htmlFor="dialogFullName">Full Name *</Label><Input id="dialogFullName" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Contact No. *</Label><Input value={formData.contactNo} onChange={e => setFormData(p => ({ ...p, contactNo: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
              <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
            </div>
            <div><Label>Address Line *</Label><Input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><Label>Pincode *</Label><Input value={formData.pincode} onChange={e => handleNewPincodeChange(e.target.value)} className="bg-black/50 border-white/10 text-white" required /></div>
              <div><Label>City *</Label><Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
              <div><Label>State *</Label><Input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
              <div><Label>Country *</Label><Input value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))} className="bg-black/50 border-white/10 text-white" required /></div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <input type="checkbox" id="dialogIsDefault" checked={formData.isDefault} onChange={e => setFormData(p => ({ ...p, isDefault: e.target.checked }))} className="rounded bg-black/50 text-[#4ca626]" />
              <Label htmlFor="dialogIsDefault">Set as default address</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-white/10 text-white">Cancel</Button>
              <Button type="submit" className="bg-[#4ca626] text-white">Save Address</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}