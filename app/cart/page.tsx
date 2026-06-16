"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@clerk/nextjs";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { motion } from "framer-motion";

import Navbar from "@/app/_components/home/Navbar";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import BottomNav from "../_components/home/BottomNav";
import OptionalCart from "@/app/_components/home/OptCart";
import YouMayAlsoLike from "../_components/home/YouMayAlsoLike";
import items from "razorpay/dist/types/items";

interface ImageType {
  id: string;
  url: string;
  altText: string;
}

interface CartItem {
  id: string;

  quantity: number;

  product: {
    id: string;

    name: string;

    price: string;

    mrp?: string;

    taxRate: number;

    isOptional?: "Yes" | "No";

    category: {
      name: string;
    };
    images: ImageType[];
  };

  variant?: string;
}

interface Cart {
  id: string;

  items: CartItem[];
}

export default function CartPage() {
  const { user, isLoaded } = useUser();

  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);

  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");

      return;
    }

    if (user) {
      fetchCart();
      fetchProducts();
    }
  }, [user, isLoaded, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);

        newSet.delete(itemId);

        return newSet;
      });
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);

        newSet.delete(itemId);

        return newSet;
      });
    }
  };

  const calculateItemTotal = (item: CartItem): number => {
    const price = parseFloat(item.product.price.replace(/[^\d.]/g, ""));

    const taxAmount = price * (item.product.taxRate / 100);

    const finalPrice = price + taxAmount;

    return Math.round(finalPrice * item.quantity);
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total: number, item: CartItem) => {
      return total + calculateItemTotal(item);
    }, 0);
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total: number, item: CartItem) => {
      const price = parseFloat(item.product.price.replace(/[^\d.]/g, ""));

      return total + price * item.quantity;
    }, 0);
  };

  const calculateTaxTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((total: number, item: CartItem) => {
      const price = parseFloat(item.product.price.replace(/[^\d.]/g, ""));

      const taxAmount = price * (item.product.taxRate / 100);

      return total + taxAmount * item.quantity;
    }, 0);
  };

  const getItemImage = (item: CartItem) => {
    if (item.product.images?.[0]) {
      return item.product.images[0].url;
    }

    return null;
  };

  const hasOptionalProduct =
    cart?.items.some((item) => item.product.isOptional === "Yes") || false;

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />

            <p className="text-zinc-400">Loading Cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 sm:pb-0">
      <Navbar />

      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />

        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-2 md:mb-10 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center rounded-full border border-[#4ca626]/20 bg-[#4ca626]/10 px-4 py-1 text-sm font-medium text-[#9be274]">
            Your Shopping Cart
          </div>

          <section className="p-1">
            <h1 className="text-lg md:text-4xl font-black tracking-tight">
              Cart Summary
            </h1>

            <p className="text-zinc-400 text-xs">
              Review your selected products before checkout.
            </p>
          </section>
        </div>

        {!cart?.items || cart.items.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#4ca626]/10">
              <ShoppingBag className="h-10 w-10 text-[#8ef065]" />
            </div>

            <h2 className="mb-3 text-3xl font-bold">Your cart is empty</h2>

            <p className="mb-8 max-w-md text-zinc-400">
              Looks like you haven't added anything yet.
            </p>

            <Button
              onClick={() => router.push("/shop")}
              className="rounded-2xl bg-[#4ca626] px-8 py-6 text-base font-semibold text-white hover:bg-[#5cbf32]"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2">
              <motion.div
                className="space-y-5"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {
                    opacity: 0,
                  },

                  visible: {
                    opacity: 1,

                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
              >
                {cart.items.map((item: CartItem) => {
                  const image = getItemImage(item);

                  const isUpdating = updatingItems.has(item.id);

                  const itemTotal = calculateItemTotal(item);

                  const finalPrice = Math.round(
                    parseFloat(item.product.price.replace(/[^\d.]/g, "")) *
                      (1 + item.product.taxRate / 100),
                  );

                  return (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: {
                          opacity: 0,
                          y: 20,
                        },

                        visible: {
                          opacity: 1,
                          y: 0,
                        },
                      }}
                    >
                      <Card className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_20px_60px_-20px_rgba(76,166,38,0.2)]">
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex gap-3 sm:flex-1 sm:items-center">
                              {/* Image */}
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:h-28 sm:w-28">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={item.product.name}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                                    No Image
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex flex-1 flex-col justify-center">
                                <h3 className="text-sm font-bold text-white sm:text-xl line-clamp-2 sm:line-clamp-none">
                                  {item.product.name}
                                </h3>
                                <p className="mt-0.5 text-[11px] text-zinc-400 sm:mt-1 sm:text-sm">
                                  {item.product.category.name}
                                </p>
                                {item.variant && (
                                  <div className="mt-1.5 inline-flex w-fit rounded-full border border-[#4ca626]/20 bg-[#4ca626]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9be274] sm:mt-3 sm:px-3 sm:py-1 sm:text-xs">
                                    Variant: {item.variant}
                                  </div>
                                )}

                                <div className="mt-1.5 flex items-center gap-2 sm:mt-4 sm:gap-3">
                                  <span className="text-base font-black text-white sm:text-2xl">
                                    ₹{finalPrice}
                                  </span>
                                  {item.product.mrp && (
                                    <span className="text-xs text-zinc-500 line-through sm:text-sm">
                                      ₹
                                      {Math.round(parseFloat(item.product.mrp))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0">
                              {/* Quantity */}
                              <div className="flex items-center gap-2 xl:px-6 lg:px-6">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1)
                                  }
                                  disabled={isUpdating || item.quantity <= 1}
                                  className="h-8 w-8 border-white/10 bg-zinc-900 text-white hover:bg-zinc-800 sm:h-10 sm:w-10"
                                >
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={String(item.quantity)}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value);
                                    if (qty >= 1) {
                                      updateQuantity(item.id, qty);
                                    }
                                  }}
                                  className="h-8 w-12  border-white/10 bg-zinc-900 text-center text-sm text-white sm:h-10 sm:w-16 sm:text-base"
                                  disabled={isUpdating}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                  disabled={isUpdating}
                                  className="h-8 w-8 border-white/10 bg-zinc-900 text-white hover:bg-zinc-800 sm:h-10 sm:w-10"
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>

                              {/* Total & Delete */}
                              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                                <div className="text-right">
                                  <p className="hidden text-sm text-zinc-400 sm:block">
                                    Total
                                  </p>
                                  <h3 className="text-lg font-black text-white sm:text-2xl">
                                    ₹{itemTotal}
                                  </h3>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  disabled={isUpdating}
                                  className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300 sm:h-10 sm:w-10"
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                {hasOptionalProduct && (
                  <section className="py-8 border-white/10 pt-10 text-center">
                    <h1>
                      Want to shop more. Click{" "}
                      <Link href="/shop" className="underline">
                        Here
                      </Link>
                    </h1>
                  </section>
                )}
              </motion.div>

          {!hasOptionalProduct && (
            <Card className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_20px_60px_-20px_rgba(76,166,38,0.2)]">
              <CardContent className="p-4 sm:p-6">
                <OptionalCart onItemAdded={() => window.location.reload()} />
              </CardContent>
            </Card>
          )}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <Card className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_20px_60px_-20px_rgba(76,166,38,0.2)]">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl font-black text-white">
                    Order Summary
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-6">
                  <div className="space-y-3 sm:space-y-5 text-sm sm:text-base">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Total Items</span>

                      <span className="font-semibold text-white">
                        {cart.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Subtotal</span>

                      <span className="font-semibold text-white">
                        ₹{calculateSubtotal().toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Tax</span>

                      <span className="font-semibold text-white">
                        ₹{calculateTaxTotal().toFixed(2)}
                      </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-base sm:text-lg font-bold text-white">
                        Total
                      </span>

                      <span className="text-2xl sm:text-3xl font-black text-white">
                        ₹{Math.round(calculateTotal())}
                      </span>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-[#4ca626]/20 bg-[#4ca626]/10 p-3 sm:p-4 text-xs sm:text-sm text-[#b7f19e]">
                      Shipping and additional charges will be calculated at
                      checkout.
                    </div>

                    <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-4">
                      <Button
                        variant="outline"
                        className="h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
                        asChild
                      >
                        <Link href="/shop">Continue Shopping</Link>
                      </Button>

                      <Button
                        className="h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl bg-[#4ca626] text-sm sm:text-base font-bold text-white hover:bg-[#5cbf32]"
                        asChild
                      >
                        <Link href="/checkout">Proceed to Checkout</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <div className="h-1 w-full bg-gradient-to-r from-[#4ca626] via-[#7ae14d] to-transparent" />
              </Card>
            </div>
          </div>
        )}

        
      </div>
      <BottomNav />
    </div>
  );
}
