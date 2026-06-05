"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navbar from "@/app/_components/Navbar";
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
import { Info, ChevronDown, Edit } from "lucide-react";
import Image from "next/image";
import BottomNav from "../_components/BottomNav";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartItem {
  id: string;
  quantity: number;
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

  useEffect(() => {
    const loadData = async () => {
      if (isLoaded && !user) {
        router.push("/sign-in");
        return;
      }

      if (user) {
        await fetchCart();
        await fetchFeesSettings();
        await fetchSavedAddresses();
        setLoading(false);
      }
    };

    loadData();
  }, [user, isLoaded, router]);

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
        console.log("Fetched fees data:", feesData); // Debug log
        const newFeesSettings = {
          standardDeliveryFee: parseFloat(feesData.standardDeliveryFee) || 50,
          freeDeliveryThreshold:
            parseFloat(feesData.freeDeliveryThreshold) || 500,
          freeDeliveryCoupon: feesData.freeDeliveryCoupon || false,
        };
        console.log("Setting fees settings:", newFeesSettings); // Debug log
        setFeesSettings(newFeesSettings);
      } else {
        console.error(
          "Failed to fetch fees settings, status:",
          response.status,
        );
        // Set default values if API fails
        setFeesSettings({
          standardDeliveryFee: 50,
          freeDeliveryThreshold: 500,
          freeDeliveryCoupon: false,
        });
      }
    } catch (error) {
      console.error("Error fetching fees settings:", error);
      // Set default values on error
      setFeesSettings({
        standardDeliveryFee: 50,
        freeDeliveryThreshold: 500,
        freeDeliveryCoupon: false,
      });
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
          // Fallback if ID is not returned by API directly
          addressToSelect = addresses.find((addr: Address) => addr.name === addedFormData.name && addr.address === addedFormData.address);
        }
        
        if (!addressToSelect && !selectedAddressId) {
          // Auto-select default address if available and no address is currently selected
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

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.product.price.replace(/[^\d.]/g, ""));
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.product.price.replace(/[^\d.]/g, ""));
      const taxRate = parseFloat(item.product.taxRate) || 0;
      const tax = (price * item.quantity * taxRate) / 100;
      return total + tax;
    }, 0);
  };

  const calculateDeliveryFee = () => {
    if (appliedCoupon?.discountType === "FREE_SHIPPING") {
      return 0; // Free delivery coupon applied
    }

    const subtotal = calculateSubtotal();
    console.log(
      "Subtotal:",
      subtotal,
      "Threshold:",
      feesSettings.freeDeliveryThreshold,
    ); // Debug log
    if (
      feesSettings.freeDeliveryThreshold > 0 &&
      subtotal >= feesSettings.freeDeliveryThreshold
    ) {
      console.log("Free delivery applied"); // Debug log
      return 0; // Free delivery
    }
    console.log(
      "Standard delivery fee applied:",
      feesSettings.standardDeliveryFee,
    ); // Debug log
    return feesSettings.standardDeliveryFee;
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === "FREE_SHIPPING") return 0;

    const subtotal = calculateSubtotal();
    if (appliedCoupon.discountType === "PERCENT") {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return Math.min(appliedCoupon.value, subtotal);
    }
  };

  const calculateTotal = () => {
    return Math.round(
      calculateSubtotal() +
        calculateTax() +
        calculateDeliveryFee() -
        calculateDiscount(),
    );
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const response = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      if (response.ok) {
        const coupon = await response.json();
        setAppliedCoupon(coupon);
        setCouponError("");
        toast.success("Coupon applied successfully!", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      } else {
        const error = await response.json();
        toast.error(error.error || "Invalid coupon code", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
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
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${editingAddressId ? "update" : "save"} address`, {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(`Failed to ${editingAddressId ? "update" : "save"} address`, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleNewPincodeChange = async (pincode: string) => {
    setFormData((prev) => ({ ...prev, pincode }));

    if (pincode.length === 6) {
      try {
        const response = await fetch(
          `/api/pincode?pincode=${pincode}`
        );
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
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    // Validate customer details
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
      (field) => !customerDetails[field as keyof CustomerDetails]?.trim(),
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
        {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }
      );
      return;
    }

    setIsProcessingPayment(true);

    try {
      const totalAmount = calculateTotal();

      // Create Razorpay order
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment order");
      }

      const { orderId, amount, currency } = await response.json();

      // Load Razorpay script if not already loaded
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
        name: "Vam Enterprises",
        description: "Purchase from Vam Enteprises",
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Create order after successful payment
            const orderResponse = await fetch("/api/orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                totalAmount: calculateTotal(),
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
              // Clear local cart state immediately
              setCart(null);
              toast.success("Payment successful! Order created.", {
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                },
              });
              router.push(`/order-complete/${orderData.id}`);
            } else {
              throw new Error("Failed to create order");
            }
          } catch (error) {
            console.error("Error creating order:", error);
            toast.error(
              "Payment successful but failed to create order. Please contact support.",
              {
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                },
              }
            );
          }
        },
        prefill: {
          name: user?.firstName + " " + user?.lastName,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
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
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Background Glow */}
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
              <div className="text-zinc-300 text-base md:text-lg mb-4">
                Your cart is empty
              </div>
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
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) {
                    resetAddressForm();
                  }
                }}>
                  <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl lg:max-w-3xl xl:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl">
                        {editingAddressId ? "Edit Address" : "Add New Address"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white text-sm font-medium">Address Name *</Label>
                          <Input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            placeholder="e.g., Home, Office, Work"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newFullName" className="text-white text-sm font-medium">Full Name *</Label>
                          <Input
                            id="newFullName"
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newContactNo" className="text-white text-sm font-medium">Contact No. *</Label>
                          <Input
                            id="newContactNo"
                            type="tel"
                            value={formData.contactNo}
                            onChange={(e) => setFormData((prev) => ({ ...prev, contactNo: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newEmail" className="text-white text-sm font-medium">Email *</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newAddress" className="text-white text-sm font-medium">Address *</Label>
                        <Input
                          id="newAddress"
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPincode" className="text-white text-sm font-medium">Pincode *</Label>
                          <Input
                            id="newPincode"
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => handleNewPincodeChange(e.target.value)}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCity" className="text-white text-sm font-medium">City *</Label>
                          <Input
                            id="newCity"
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newState" className="text-white text-sm font-medium">State *</Label>
                          <Input
                            id="newState"
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newCountry" className="text-white text-sm font-medium">Country *</Label>
                          <Input
                            id="newCountry"
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                          className="rounded border-white/10 bg-black/50 text-[#4ca626] focus:ring-[#4ca626]"
                        />
                        <Label htmlFor="isDefault" className="text-white text-sm">Set as default address</Label>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false);
                            resetAddressForm();
                          }}
                          className="border-white/10 text-white hover:bg-zinc-800"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="rounded-xl bg-[#4ca626] text-white hover:bg-[#5cbf32]">
                          {editingAddressId ? "Update Address" : "Add Address"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

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
                                      className="ml-auto text-zinc-400 hover:text-white hover:bg-zinc-800 p-1 h-8 w-8"
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
                                      {[address.city, address.state || (address as any).State || (address as any).region, address.pincode || (address as any).postalCode].filter(Boolean).join(', ')}
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
                        {savedAddresses.length > 0
                          ? "Delivery Details"
                          : "Customer Details"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-6 space-y-4 md:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="fullName"
                            className="text-white text-sm font-medium"
                          >
                            Full Name *
                          </Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={customerDetails.fullName}
                            onChange={(e) =>
                              setCustomerDetails((prev) => ({
                                ...prev,
                                fullName: e.target.value,
                              }))
                            }
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                            readOnly
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="contactNo"
                            className="text-white text-sm font-medium"
                          >
                            Contact No. *
                          </Label>
                          <Input
                            id="contactNo"
                            type="tel"
                            value={customerDetails.contactNo}
                            onChange={(e) =>
                              setCustomerDetails((prev) => ({
                                ...prev,
                                contactNo: e.target.value,
                              }))
                            }
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-white text-sm font-medium"
                        >
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerDetails.email}
                          onChange={(e) =>
                            setCustomerDetails((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="address"
                          className="text-white text-sm font-medium"
                        >
                          Address *
                        </Label>
                        <Input
                          id="address"
                          type="text"
                          value={customerDetails.address}
                          onChange={(e) =>
                            setCustomerDetails((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
                          readOnly
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="city"
                            className="text-white text-sm font-medium"
                          >
                            City *
                          </Label>
                          <Input
                            id="city"
                            type="text"
                            value={customerDetails.city}
                            onChange={(e) =>
                              setCustomerDetails((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                            readOnly
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="state"
                            className="text-white text-sm font-medium"
                          >
                            State *
                          </Label>
                          <Input
                            id="state"
                            type="text"
                            value={customerDetails.state}
                            onChange={(e) =>
                              setCustomerDetails((prev) => ({
                                ...prev,
                                state: e.target.value,
                              }))
                            }
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                            readOnly
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="pincode"
                            className="text-white text-sm font-medium"
                          >
                            Pincode *
                          </Label>
                          <Input
                            id="pincode"
                            type="text"
                            value={customerDetails.pincode}
                            onChange={async (e) => {
                            const pincode = e.target.value;
                            setCustomerDetails(prev => ({ ...prev, pincode }));

                            if (pincode.length === 6) {
                              try {
                                const response = await fetch(
                                  `/api/pincode?pincode=${pincode}`
                                );
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
                                  setCustomerDetails((prev) => ({
                                    ...prev,
                                    ...(fetchedCity && { city: fetchedCity }),
                                    ...(fetchedState && { state: fetchedState }),
                                  }));
                                }
                              } catch (error) {
                                console.error('Error fetching pincode data:', error);
                              }
                            }
                          }}
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                            readOnly
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="country"
                            className="text-white text-sm font-medium"
                          >
                            Country *
                          </Label>
                          <Input
                            id="country"
                            type="text"
                            value={customerDetails.country}
                            onChange={(e) =>
                              setCustomerDetails((prev) => ({
                                ...prev,
                                country: e.target.value,
                              }))
                            }
                            className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                            required
                            readOnly
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </form>
              </div>

              {/* Right side - Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] backdrop-blur-xl rounded-2xl sm:rounded-[2rem] sticky top-24">
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-6">
                    <CardTitle className="text-lg sm:text-xl text-white">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-6 space-y-3 sm:space-y-4 overflow-visible">
                    {/* Coupon Section */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="coupon"
                        className="text-white text-sm font-medium"
                      >
                        Have a coupon?
                      </Label>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Input
                          id="coupon"
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20 flex-1"
                          disabled={!!appliedCoupon}
                        />
                        {!appliedCoupon ? (
                          <Button
                            onClick={applyCoupon}
                            variant="outline"
                            className="border-white/10 text-white hover:bg-zinc-800 w-full sm:w-auto"
                          >
                            Apply
                          </Button>
                        ) : (
                          <Button
                            onClick={removeCoupon}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-900/30 hover:border-red-500/80 w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      {couponError && (
                        <div className="text-red-400 text-sm">
                          {couponError}
                        </div>
                      )}
                      {appliedCoupon && (
                        <div className="text-[#9be274] text-sm">
                          Coupon "{appliedCoupon.code}" applied!{" "}
                          {appliedCoupon.discountType === "FREE_SHIPPING"
                            ? "Free Delivery"
                            : appliedCoupon.discountType === "PERCENT" ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
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
                          <Collapsible
                            open={isTaxInfoOpen}
                            onOpenChange={setIsTaxInfoOpen}
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto"
                              >
                                <Info className="h-4 w-4 text-zinc-400 hover:text-white" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="absolute bottom-full left-0 mb-2 w-80 bg-zinc-900 border border-white/10 rounded-xl p-4 z-10 shadow-2xl backdrop-blur-xl">
                              <div className="space-y-2 text-sm">
                                <div className="font-medium text-white">
                                  Tax Breakdown:
                                </div>
                                {cart?.items.map((item) => {
                                  const price = parseFloat(
                                    item.product.price.replace(/[^\d.]/g, ""),
                                  );
                                  const taxRate = parseFloat(item.product.taxRate) || 0;
                                  const tax =
                                    (price * item.quantity * taxRate) / 100;
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex justify-between text-zinc-400"
                                    >
                                      <span>
                                        {item.product.name} ({taxRate}%):
                                      </span>
                                      <span>₹{tax.toFixed(2)}</span>
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
                        {isProcessingPayment ? "Processing..." : "Pay Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <BottomNav  />
    </div>
  );
}
