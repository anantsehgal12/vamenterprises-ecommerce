// app/seller-dashboard/custom-orders/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/admin/App-sidebar";
import Header from "@/app/_components/admin/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronsUpDown, Check } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/app/extras/useIsAdmin";

interface ItemRow {
  productId: string;
  variant: string;
  quantity: string;
  price: string;
}

export default function NewCustomOrderPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const isAdmin = useIsAdmin();

  const [products, setProducts] = useState<any[]>([]);
  const [openProduct, setOpenProduct] = useState<number | null>(null);
  const [openVariant, setOpenVariant] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<{
    token: string;
    title: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [customerEmail, setCustomerEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<ItemRow[]>([
    { productId: "", variant: "", quantity: "1", price: "0" },
  ]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  if (!isLoaded || !isSignedIn) return null;
  if (!isAdmin) notFound();

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: "", variant: "", quantity: "1", price: "0" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "productId") {
      const selectedProduct = products.find((p) => p.id === value);
      if (selectedProduct) {
        newItems[index].price = String(selectedProduct.price).replace(
          /[^\d.]/g,
          "",
        );
      }
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + price * quantity;
  }, 0);
  const total = Math.max(subtotal - (parseFloat(discountAmount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Give this custom order a title", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && parseInt(item.quantity) > 0,
    );
    if (validItems.length === 0) {
      toast.error("Add at least one product", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/seller/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          discountAmount: parseFloat(discountAmount) || 0,
          customerEmail: customerEmail || undefined,
          expiresAt: expiresAt || undefined,
          notes,
          items: validItems.map((item) => ({
            productId: item.productId,
            variant: item.variant || undefined,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price) || 0,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create custom order");
      }

      const data = await res.json();
      setCreatedLink({ token: data.token, title });
      toast.success("Custom order link created!", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } catch (error: any) {
      toast.error(error.message, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  };

  if (createdLink) {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/custom-order/${createdLink.token}`;
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
            <Card className="max-w-lg w-full bg-[#111111] border border-white/10 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(76,166,38,0.08)]">
              <div className="h-16 w-16 rounded-2xl bg-[#4ca626]/20 border border-[#4ca626]/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-[#7ddc56]" />
              </div>
              <h2 className="text-2xl font-bold font-serif mb-2">
                Link ready to send
              </h2>
              <p className="text-sm text-zinc-400 mb-6">
                Share this with your customer — they'll sign in and check out in
                one step.
              </p>
              <div className="rounded-2xl bg-[#181818] border border-white/10 p-4 text-sm text-zinc-300 break-all mb-6">
                {link}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    toast.success("Copied!");
                  }}
                  className="flex-1 h-12 rounded-xl bg-[#4ca626] hover:bg-[#5bbd31]"
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy Link
                </Button>
                <Button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Hi! Here's your custom order for "${createdLink.title}" from VAM Enterprises. Complete it here: ${link}`,
                    );
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-white/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Share on WhatsApp
                </Button>
              </div>
              <button
                onClick={() => router.push("/seller-dashboard/custom-orders")}
                className="text-sm text-zinc-500 hover:text-zinc-300 mt-6"
              >
                Back to all custom orders
              </button>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <main className="min-h-screen bg-[#0a0a0a] text-white">
          <Header />

          <div className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
            <div className="mx-6 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#4ca626]/20 border border-[#4ca626]/30 flex items-center justify-center">
                  <Link2 className="text-[#7ddc56]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight font-serif">
                    Create Custom Order
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">
                    Pick products, set a price, get a shareable link
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="h-12 px-7 rounded-xl bg-[#4ca626] hover:bg-[#5bbd31] text-white font-semibold shadow-[0_0_40px_rgba(76,166,38,0.35)] disabled:opacity-50"
              >
                {loading ? "Creating..." : "Generate Order Link"}
              </Button>
            </div>
          </div>

          <div className="mx-4 sm:mx-8 px-2 sm:px-6 py-8 pb-28 lg:pb-8">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8"
            >
              <div className="space-y-8">
                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Order Details</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      What the customer will see
                    </p>
                  </div>
                  <div className="grid gap-6">
                    <div>
                      <Label className="mb-3 block text-zinc-300">
                        Title *
                      </Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-14 rounded-2xl bg-[#181818] border-white/10"
                        placeholder="e.g. Your Custom Gifting Order"
                        required
                      />
                    </div>
                    <div>
                      <Label className="mb-3 block text-zinc-300">
                        Description (optional)
                      </Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-24 rounded-2xl bg-[#181818] border-white/10"
                        placeholder="A short note the customer sees above the order summary"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Restrict to email (optional)
                        </Label>
                        <Input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="h-14 rounded-2xl bg-[#181818] border-white/10"
                          placeholder="customer@email.com"
                        />
                      </div>
                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Link expires (optional)
                        </Label>
                        <Input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="h-14 rounded-2xl bg-[#181818] border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Items</h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        Choose from your existing products
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {items.map((item, index) => {
                      const selectedProduct = products.find(
                        (p) => p.id === item.productId,
                      );
                      return (
                        <div
                          key={index}
                          className="p-5 border border-white/10 rounded-2xl bg-[#181818] relative"
                        >
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="absolute top-4 right-4 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="grid md:grid-cols-2 gap-5 mt-2">
                            {selectedProduct?.images?.[0] && (
                              <div className="md:col-span-2 flex items-center gap-4 mb-2 p-3 bg-black/20 rounded-xl border border-white/5">
                                <img
                                  src={selectedProduct.images[0].url}
                                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  alt=""
                                />
                                <span className="font-semibold text-lg">
                                  {selectedProduct.name}
                                </span>
                              </div>
                            )}
                            <div className="md:col-span-2">
                              <Label className="mb-2 block text-zinc-300">
                                Product *
                              </Label>
                              <Popover
                                open={openProduct === index}
                                onOpenChange={(open) =>
                                  setOpenProduct(open ? index : null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="h-12 w-full justify-between rounded-xl bg-[#111111] border-white/10 hover:bg-[#181818]"
                                  >
                                    {item.productId
                                      ? products.find(
                                          (p) => p.id === item.productId,
                                        )?.name
                                      : "Select Product"}

                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                  className="w-[var(--radix-popover-trigger-width)] p-0 border-white/10 bg-[#111111]"
                                  align="start"
                                >
                                  <Command className="bg-[#111111]">
                                    <CommandInput
                                      placeholder="Search products..."
                                      className="h-10"
                                    />

                                    <CommandList>
                                      <CommandEmpty>
                                        No products found.
                                      </CommandEmpty>

                                      <CommandGroup>
                                        {products.map((product) => (
                                          <CommandItem
                                            key={product.id}
                                            value={`${product.name} ${product.price}`}
                                            onSelect={() => {
                                              updateItem(
                                                index,
                                                "productId",
                                                product.id,
                                              );
                                              setOpenProduct(null);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                item.productId === product.id
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />

                                            <div className="flex items-center gap-3 w-full">
                                              {product.images?.[0] && (
                                                <img
                                                  src={product.images[0].url}
                                                  alt=""
                                                  className="h-8 w-8 rounded object-cover"
                                                />
                                              )}

                                              <div className="flex flex-col">
                                                <span>{product.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                  ₹
                                                  {String(
                                                    product.price,
                                                  ).replace(/[^\d.]/g, "")}
                                                </span>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>

                            {selectedProduct?.variants &&
                            selectedProduct.variants.some(
                              (v: any) => v.name,
                            ) ? (
                              <div>
                                <Label className="mb-2 block text-zinc-300">
                                  Variant
                                </Label>
                                <Popover
                                  open={openVariant === index}
                                  onOpenChange={(open) =>
                                    setOpenVariant(open ? index : null)
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      disabled={!selectedProduct}
                                      className="h-12 w-full justify-between rounded-xl bg-[#111111] border-white/10 hover:bg-[#181818]"
                                    >
                                      {item.variant || "Select Variant"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>

                                  <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#111111] border-white/10"
                                    align="start"
                                  >
                                    <Command className="bg-[#111111]">
                                      <CommandInput placeholder="Search variants..." />

                                      <CommandList>
                                        <CommandEmpty>
                                          No variants found.
                                        </CommandEmpty>

                                        <CommandGroup>
                                          {selectedProduct?.variants
                                            ?.filter((v: any) => v.name)
                                            .map((variant: any) => (
                                              <CommandItem
                                                key={variant.name}
                                                value={variant.name}
                                                onSelect={() => {
                                                  updateItem(
                                                    index,
                                                    "variant",
                                                    variant.name,
                                                  );
                                                  setOpenVariant(null);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    "mr-2 h-4 w-4",
                                                    item.variant ===
                                                      variant.name
                                                      ? "opacity-100"
                                                      : "opacity-0",
                                                  )}
                                                />
                                                {variant.name}
                                              </CommandItem>
                                            ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ) : (
                              <div>
                                <Label className="mb-2 block text-zinc-300">
                                  Variant (Optional)
                                </Label>
                                <Input
                                  value={item.variant}
                                  onChange={(e) =>
                                    updateItem(index, "variant", e.target.value)
                                  }
                                  className="h-12 rounded-xl bg-[#111111] border-white/10"
                                  placeholder="e.g. Red, Large"
                                  disabled={!selectedProduct}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="mb-2 block text-zinc-300">
                                  Quantity
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  className="h-12 rounded-xl bg-[#111111] border-white/10"
                                />
                              </div>
                              <div>
                                <Label className="mb-2 block text-zinc-300">
                                  Price (₹)
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) =>
                                    updateItem(index, "price", e.target.value)
                                  }
                                  className="h-12 rounded-xl bg-[#111111] border-white/10"
                                />
                                <p className="text-[11px] text-zinc-500 mt-1">
                                  Auto-filled from catalog — override to give a
                                  custom price for this link.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Internal Notes</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      Only visible to your team, never shown to the customer
                    </p>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-24 rounded-2xl bg-[#181818] border-white/10"
                    placeholder="e.g. Requested via Instagram DM, wants gift wrapping"
                  />
                </Card>
              </div>

              <div className="space-y-6 xl:sticky xl:top-28 h-fit">
                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-6">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const product = products.find(
                        (p) => p.id === item.productId,
                      );
                      if (!product) return null;
                      const price = parseFloat(item.price) || 0;
                      const quantity = parseInt(item.quantity) || 0;
                      return (
                        <div
                          key={index}
                          className="flex justify-between items-start text-sm"
                        >
                          <div className="flex-1 pr-4 flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0].url}
                                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                alt=""
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-zinc-500">
                                {quantity} x ₹{price.toFixed(2)}
                              </p>
                              {item.variant && (
                                <p className="text-xs text-zinc-500">
                                  Variant: {item.variant}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-medium whitespace-nowrap">
                            ₹{(price * quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-center text-sm text-zinc-400">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm text-zinc-400 shrink-0">
                        Discount (₹)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        className="h-10 w-28 rounded-xl bg-[#181818] border-white/10 text-right"
                      />
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between items-center text-lg font-bold text-[#7ddc56]">
                      <span>Total Amount</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </form>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
