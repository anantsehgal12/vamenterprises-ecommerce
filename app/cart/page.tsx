'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';

import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { motion } from 'framer-motion';

import Navbar from '@/app/_components/Navbar';

import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';

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
  const { user, isLoaded } =
    useUser();

  const router = useRouter();

  const [cart, setCart] =
    useState<Cart | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    updatingItems,
    setUpdatingItems,
  ] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (
      isLoaded &&
      !user
    ) {
      router.push('/sign-in');

      return;
    }

    if (user) {
      fetchCart();
    }
  }, [
    user,
    isLoaded,
    router,
  ]);

  const fetchCart =
    async () => {
      try {
        const response =
          await fetch(
            '/api/cart'
          );

        if (
          response.ok
        ) {
          const cartData =
            await response.json();

          setCart(
            cartData
          );
        }
      } catch (error) {
        console.error(
          'Error fetching cart:',
          error
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  const updateQuantity =
    async (
      itemId: string,
      newQuantity: number
    ) => {
      if (
        newQuantity < 1
      )
        return;

      setUpdatingItems(
        (prev) =>
          new Set(prev).add(
            itemId
          )
      );

      try {
        const response =
          await fetch(
            `/api/cart/${itemId}`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify(
                {
                  quantity:
                    newQuantity,
                }
              ),
            }
          );

        if (
          response.ok
        ) {
          await fetchCart();
        }
      } catch (error) {
        console.error(
          'Error updating quantity:',
          error
        );
      } finally {
        setUpdatingItems(
          (prev) => {
            const newSet =
              new Set(
                prev
              );

            newSet.delete(
              itemId
            );

            return newSet;
          }
        );
      }
    };

  const removeItem =
    async (
      itemId: string
    ) => {
      setUpdatingItems(
        (prev) =>
          new Set(prev).add(
            itemId
          )
      );

      try {
        const response =
          await fetch(
            `/api/cart/${itemId}`,
            {
              method:
                'DELETE',
            }
          );

        if (
          response.ok
        ) {
          await fetchCart();
        }
      } catch (error) {
        console.error(
          'Error removing item:',
          error
        );
      } finally {
        setUpdatingItems(
          (prev) => {
            const newSet =
              new Set(
                prev
              );

            newSet.delete(
              itemId
            );

            return newSet;
          }
        );
      }
    };

  const calculateItemTotal =
    (
      item: CartItem
    ): number => {
      const price =
        parseFloat(
          item.product.price.replace(
            /[^\d.]/g,
            ''
          )
        );

      const taxAmount =
        price *
        (item.product
          .taxRate /
          100);

      const finalPrice =
        price +
        taxAmount;

      return Math.round(
        finalPrice *
          item.quantity
      );
    };

  const calculateTotal =
    () => {
      if (
        !cart?.items
      )
        return 0;

      return cart.items.reduce(
        (
          total: number,
          item: CartItem
        ) => {
          return (
            total +
            calculateItemTotal(
              item
            )
          );
        },
        0
      );
    };

  const calculateSubtotal =
    () => {
      if (
        !cart?.items
      )
        return 0;

      return cart.items.reduce(
        (
          total: number,
          item: CartItem
        ) => {
          const price =
            parseFloat(
              item.product.price.replace(
                /[^\d.]/g,
                ''
              )
            );

          return (
            total +
            price *
              item.quantity
          );
        },
        0
      );
    };

  const calculateTaxTotal =
    () => {
      if (
        !cart?.items
      )
        return 0;

      return cart.items.reduce(
        (
          total: number,
          item: CartItem
        ) => {
          const price =
            parseFloat(
              item.product.price.replace(
                /[^\d.]/g,
                ''
              )
            );

          const taxAmount =
            price *
            (item.product
              .taxRate /
              100);

          return (
            total +
            taxAmount *
              item.quantity
          );
        },
        0
      );
    };

  const getItemImage =
    (
      item: CartItem
    ) => {
      if (item.product.images?.[0]) {
        return item.product.images[0].url;
      }

      return null;
    };

  if (
    !isLoaded ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />

            <p className="text-zinc-400">
              Loading Cart...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />

        <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center rounded-full border border-[#4ca626]/20 bg-[#4ca626]/10 px-4 py-1 text-sm font-medium text-[#9be274]">
            Your Shopping Cart
          </div>

          <h1 className="text-4xl font-black tracking-tight">
            Cart Summary
          </h1>

          <p className="text-zinc-400">
            Review your
            selected products
            before checkout.
          </p>
        </div>

        {!cart?.items ||
        cart.items.length ===
          0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#4ca626]/10">
              <ShoppingBag className="h-10 w-10 text-[#8ef065]" />
            </div>

            <h2 className="mb-3 text-3xl font-bold">
              Your cart is
              empty
            </h2>

            <p className="mb-8 max-w-md text-zinc-400">
              Looks like you
              haven't added
              anything yet.
            </p>

            <Button
              onClick={() =>
                router.push(
                  '/shop'
                )
              }
              className="rounded-2xl bg-[#4ca626] px-8 py-6 text-base font-semibold text-white hover:bg-[#5cbf32]"
            >
              Continue
              Shopping
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
                      staggerChildren:
                        0.08,
                    },
                  },
                }}
              >
                {cart.items.map(
                  (
                    item: CartItem
                  ) => {
                    const image =
                      getItemImage(
                        item
                      );

                    const isUpdating =
                      updatingItems.has(
                        item.id
                      );

                    const itemTotal =
                      calculateItemTotal(
                        item
                      );

                    const finalPrice =
                      Math.round(
                        parseFloat(
                          item.product.price.replace(
                            /[^\d.]/g,
                            ''
                          )
                        ) *
                          (1 +
                            item
                              .product
                              .taxRate /
                              100)
                      );

                    return (
                      <motion.div
                        key={
                          item.id
                        }
                        variants={{
                          hidden:
                            {
                              opacity: 0,
                              y: 20,
                            },

                          visible:
                            {
                              opacity: 1,
                              y: 0,
                            },
                        }}
                      >
                        <Card className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_20px_60px_-20px_rgba(76,166,38,0.2)]">
                          <CardContent className="p-5">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center">
                              {/* Image */}
                              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-zinc-900 md:h-28 md:w-28">
                                {image ? (
                                  <img
                                    src={
                                      image
                                    }
                                    alt={
                                      item
                                        .product
                                        .name
                                    }
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                    No
                                    Image
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-white">
                                  {
                                    item
                                      .product
                                      .name
                                  }
                                </h3>

                                <p className="mt-1 text-sm text-zinc-400">
                                  {
                                    item
                                      .product
                                      .category
                                      .name
                                  }
                                </p>

                                {item.variant && (
                                  <div className="mt-3 inline-flex rounded-full border border-[#4ca626]/20 bg-[#4ca626]/10 px-3 py-1 text-xs font-semibold text-[#9be274]">
                                    Variant:{' '}
                                    {
                                      item
                                        .variant
                                    }
                                  </div>
                                )}

                                <div className="mt-4 flex items-center gap-3">
                                  <span className="text-2xl font-black text-white">
                                    ₹
                                    {
                                      finalPrice
                                    }
                                  </span>

                                  {item
                                    .product
                                    .mrp && (
                                    <span className="text-sm text-zinc-500 line-through">
                                      ₹
                                      {Math.round(
                                        parseFloat(
                                          item
                                            .product
                                            .mrp
                                        )
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quantity */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity -
                                        1
                                    )
                                  }
                                  disabled={
                                    isUpdating ||
                                    item.quantity <=
                                      1
                                  }
                                  className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>

                                <Input
                                  type="number"
                                  min="1"
                                  value={String(
                                    item.quantity
                                  )}
                                  onChange={(
                                    e
                                  ) => {
                                    const qty =
                                      parseInt(
                                        e
                                          .target
                                          .value
                                      );

                                    if (
                                      qty >=
                                      1
                                    ) {
                                      updateQuantity(
                                        item.id,
                                        qty
                                      );
                                    }
                                  }}
                                  className="w-16 border-white/10 bg-zinc-900 text-center text-white"
                                  disabled={
                                    isUpdating
                                  }
                                />

                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity +
                                        1
                                    )
                                  }
                                  disabled={
                                    isUpdating
                                  }
                                  className="border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Total */}
                              <div className="flex flex-row items-center justify-between gap-5 md:flex-col md:items-end">
                                <div className="text-right">
                                  <p className="text-sm text-zinc-400">
                                    Total
                                  </p>

                                  <h3 className="text-2xl font-black text-white">
                                    ₹
                                    {
                                      itemTotal
                                    }
                                  </h3>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItem(
                                      item.id
                                    )
                                  }
                                  disabled={
                                    isUpdating
                                  }
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }
                )}
              </motion.div>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <Card className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black shadow-[0_20px_60px_-20px_rgba(76,166,38,0.2)]">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white">
                    Order Summary
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>
                        Total Items
                      </span>

                      <span className="font-semibold text-white">
                        {cart.items.reduce(
                          (
                            sum,
                            item
                          ) =>
                            sum +
                            item.quantity,
                          0
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-300">
                      <span>
                        Subtotal
                      </span>

                      <span className="font-semibold text-white">
                        ₹
                        {calculateSubtotal().toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Tax</span>

                      <span className="font-semibold text-white">
                        ₹
                        {calculateTaxTotal().toFixed(
                          2
                        )}
                      </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">
                        Total
                      </span>

                      <span className="text-3xl font-black text-white">
                        ₹
                        {Math.round(
                          calculateTotal()
                        )}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-[#4ca626]/20 bg-[#4ca626]/10 p-4 text-sm text-[#b7f19e]">
                      Shipping and
                      additional
                      charges will
                      be calculated
                      at checkout.
                    </div>

                    <div className="space-y-3 pt-4">
                      <Button
                        variant="outline"
                        className="h-12 w-full rounded-2xl border-white/10 bg-zinc-900 text-white hover:bg-zinc-800"
                        asChild
                      >
                        <Link href="/shop">
                          Continue
                          Shopping
                        </Link>
                      </Button>

                      <Button
                        className="h-12 w-full rounded-2xl bg-[#4ca626] text-base font-bold text-white hover:bg-[#5cbf32]"
                        asChild
                      >
                        <Link href="/checkout">
                          Proceed to
                          Checkout
                        </Link>
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
    </div>
  );
}