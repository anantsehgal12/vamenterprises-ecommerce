"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Minus, Search, Loader2, Package } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/Navbar";
import { isAdmin } from "@/app/extras/isAdmis";
import RefreshButton from "@/app/_components/RefreshApis";

interface Product {
  id: string;
  name: string;
  price: string;
  taxRate: string;
  description: string;
  stock: number;
  category: { id: string; name: string };
  variants: { name?: string }[];
  images: { id: string; url: string; altText: string }[];
}

export default function InventoryPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState("");
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?all=true");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, stock: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock }),
      });
      if (!response.ok) {
        throw new Error("Failed to update stock");
      }
      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, stock } : product,
        ),
      );
      setEditingProduct(null);
      setNewStock("");
      setStockInOpen(false);
      setStockOutOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openStockInDialog = (product: Product) => {
    setEditingProduct(product);
    setNewStock("");
    setStockInOpen(true);
  };

  const openStockOutDialog = (product: Product) => {
    setEditingProduct(product);
    setNewStock("");
    setStockOutOpen(true);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4ca626]" />
              <p className="mt-2">Loading inventory...</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (isLoaded && isAdmin(user))
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
            <Header />
            <div className="container mx-auto p-6">
              <section className="inline-flex justify-between items-center w-full">
                <div className="flex gap-5 items-center mb-8">
                  <Package className="text-[#7ddc56]" />
                  <h1 className="text-3xl font-bold tracking-tight">
                    Inventory Management
                  </h1>
                </div>
                <RefreshButton />
              </section>

              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search inventory by name, description, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-[#181818] border-white/10 focus-visible:ring-[#4ca626]"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                  {error}
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <Card className="shadow-lg bg-[#111111] border-white/10 rounded-3xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-zinc-500 mb-4">No products found.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => {
                          const price = parseFloat(product.price);
                          const isOutOfStock = product.stock === 0;
                          const isLowStock =
                            product.stock > 0 && product.stock < 10;
                          const productImage = product.images?.[0];

                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center">
                                  {productImage ? (
                                    <img
                                      src={productImage.url}
                                      alt={productImage.altText || product.name}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <Package className="h-6 w-6 text-zinc-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-green-600 font-bold">
                                ₹{Math.round(price)}
                              </TableCell>
                              <TableCell className="text-sm text-zinc-400">
                                {product.category.name}
                              </TableCell>
                              <TableCell
                                className={`font-bold ${isOutOfStock ? "text-red-400" : isLowStock ? "text-yellow-400" : "text-[#7ddc56]"}`}
                              >
                                {product.stock}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    isOutOfStock
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : isLowStock
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                        : "bg-[#4ca626]/10 text-[#7ddc56] border-[#4ca626]/20"
                                  }`}
                                >
                                  {isOutOfStock
                                    ? "Out of Stock"
                                    : isLowStock
                                      ? "Low Stock"
                                      : "In Stock"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Dialog
                                    open={stockInOpen}
                                    onOpenChange={setStockInOpen}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]"
                                        size="sm"
                                        onClick={() =>
                                          openStockInDialog(product)
                                        }
                                      >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Stock In
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#111111] border-white/10 text-white">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Stock In for {editingProduct?.name}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label
                                            htmlFor="stock"
                                            className="text-right"
                                          >
                                            Add Stock
                                          </Label>
                                          <Input
                                            id="stock"
                                            type="number"
                                            value={newStock}
                                            onChange={(e) =>
                                              setNewStock(e.target.value)
                                            }
                                            className="col-span-3 bg-[#181818] border-white/10"
                                            min="0"
                                            placeholder="Enter quantity to add"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]"
                                          onClick={() => {
                                            setEditingProduct(null);
                                            setStockInOpen(false);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() =>
                                            handleUpdateStock(
                                              editingProduct!.id,
                                              editingProduct!.stock +
                                                (parseInt(newStock) || 0),
                                            )
                                          }
                                          className="bg-[#4ca626] hover:bg-[#5bbd31]"
                                        >
                                          Add Stock
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Dialog
                                    open={stockOutOpen}
                                    onOpenChange={setStockOutOpen}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]"
                                        size="sm"
                                        onClick={() =>
                                          openStockOutDialog(product)
                                        }
                                      >
                                        <Minus className="h-4 w-4 mr-1" />
                                        Stock Out
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#111111] border-white/10 text-white">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Stock Out for {editingProduct?.name}
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label
                                            htmlFor="stock"
                                            className="text-right"
                                          >
                                            Remove Stock
                                          </Label>
                                          <Input
                                            id="stock"
                                            type="number"
                                            value={newStock}
                                            onChange={(e) =>
                                              setNewStock(e.target.value)
                                            }
                                            className="col-span-3 bg-[#181818] border-white/10"
                                            min="0"
                                            max={editingProduct?.stock || 0}
                                            placeholder="Enter quantity to remove"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]"
                                          onClick={() => {
                                            setEditingProduct(null);
                                            setStockOutOpen(false);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() =>
                                            handleUpdateStock(
                                              editingProduct!.id,
                                              editingProduct!.stock -
                                                (parseInt(newStock) || 0),
                                            )
                                          }
                                        >
                                          className="bg-red-600
                                          hover:bg-red-700" Remove Stock
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {filteredProducts.map((product) => {
                      const price = parseFloat(product.price);
                      const isOutOfStock = product.stock === 0;
                      const isLowStock =
                        product.stock > 0 && product.stock < 10;

                      // Get the first image from product images
                      const productImage = product.images?.[0];

                      return (
                        <Card
                          key={product.id}
                          className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-[#111111] border-white/10 rounded-3xl"
                        >
                          <CardHeader className="p-0">
                            {productImage && (
                              <div className="w-full aspect-square overflow-hidden rounded-t-lg p-4">
                                <img
                                  src={productImage.url}
                                  alt={productImage.altText || product.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 rounded-md"
                                />
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="p-4 text-white">
                            <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
                              {product.name}
                            </CardTitle>
                            <p className="text-sm text-zinc-400 mb-3 line-clamp-3">
                              {product.description}
                            </p>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">
                                  Price:
                                </span>
                                <span className="text-[#7ddc56] font-bold">
                                  ₹{price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">
                                  Stock:
                                </span>
                                <span
                                  className={`font-bold ${isOutOfStock ? "text-red-400" : isLowStock ? "text-yellow-400" : "text-[#7ddc56]"}`}
                                >
                                  {product.stock}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-500">
                                  Status:
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                    isOutOfStock
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : isLowStock
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                        : "bg-[#4ca626]/10 text-[#7ddc56] border-[#4ca626]/20"
                                  }`}
                                >
                                  {isOutOfStock
                                    ? "Out of Stock"
                                    : isLowStock
                                      ? "Low Stock"
                                      : "In Stock"}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                                {product.category.name}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Dialog
                                open={stockInOpen}
                                onOpenChange={setStockInOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f] flex-1"
                                    size="sm"
                                    onClick={() => openStockInDialog(product)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Stock In
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#111111] border-white/10 text-white">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Stock In for {editingProduct?.name}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label
                                        htmlFor="stock"
                                        className="text-right"
                                      >
                                        Add Stock
                                      </Label>
                                      <Input
                                        id="stock"
                                        type="number"
                                        value={newStock}
                                        onChange={(e) =>
                                          setNewStock(e.target.value)
                                        }
                                        className="col-span-3 bg-[#181818] border-white/10"
                                        min="0"
                                        placeholder="Enter quantity to add"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]"
                                      onClick={() => {
                                        setEditingProduct(null);
                                        setStockInOpen(false);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleUpdateStock(
                                          editingProduct!.id,
                                          editingProduct!.stock +
                                            (parseInt(newStock) || 0),
                                        )
                                      }
                                      className="bg-[#4ca626] hover:bg-[#5bbd31]"
                                    >
                                      Add Stock
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog
                                open={stockOutOpen}
                                onOpenChange={setStockOutOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f] flex-1"
                                    size="sm"
                                    onClick={() => openStockOutDialog(product)}
                                  >
                                    <Minus className="h-4 w-4 mr-1" />
                                    Stock Out
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#111111] border-white/10 text-white">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Stock Out for {editingProduct?.name}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label
                                        htmlFor="stock"
                                        className="text-right"
                                      >
                                        Remove Stock
                                      </Label>
                                      <Input
                                        id="stock"
                                        type="number"
                                        value={newStock}
                                        onChange={(e) =>
                                          setNewStock(e.target.value)
                                        }
                                        className="col-span-3 bg-[#181818] border-white/10"
                                        min="0"
                                        max={editingProduct?.stock || 0}
                                        placeholder="Enter quantity to remove"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]"
                                      onClick={() => {
                                        setEditingProduct(null);
                                        setStockOutOpen(false);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleUpdateStock(
                                          editingProduct!.id,
                                          editingProduct!.stock -
                                            (parseInt(newStock) || 0),
                                        )
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove Stock
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
}
