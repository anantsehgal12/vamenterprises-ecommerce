"use client";

import { useState, useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/admin/App-sidebar";
import Header from "@/app/_components/admin/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, ExternalLink, Search } from "lucide-react";
import { isAdmin } from "@/app/extras/isAdmis";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/home/Navbar";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  category: { id: string; name: string };
  variants: { name?: string }[];
  images: { id: string; url: string; altText: string }[];
}

interface Category {
  id: string;
  name: string;
}

interface Order {
  id: string;
  orderId: string;
  fullName?: string;
  email?: string;
  status: string;
  totalAmount: number;
}

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  value: number;
  isActive: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  isPinned: boolean;
}

interface SearchResult {
  type: "product" | "category" | "order" | "coupon" | "notification";
  item: Product | Category | Order | Coupon | Notification;
  matchedFields: string[];
}

export default function SearchPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      // Fetch products, categories, orders, coupons, and notifications
      const [
        productsRes,
        categoriesRes,
        ordersRes,
        couponsRes,
        notificationsRes,
      ] = await Promise.all([
        fetch("/api/products?all=true"),
        fetch("/api/categories"),
        fetch("/api/orders"),
        fetch("/api/coupons"),
        fetch("/api/notifications"),
      ]);

      if (
        !productsRes.ok ||
        !categoriesRes.ok ||
        !ordersRes.ok ||
        !couponsRes.ok ||
        !notificationsRes.ok
      ) {
        throw new Error("Failed to fetch data");
      }

      const products: Product[] = await productsRes.json();
      const categories: Category[] = await categoriesRes.json();
      const orders: Order[] = await ordersRes.json();
      const coupons: Coupon[] = await couponsRes.json();
      const notifications: Notification[] = await notificationsRes.json();

      const searchResults: SearchResult[] = [];

      // Search in products
      products.forEach((product) => {
        const matchedFields: string[] = [];

        if (product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchedFields.push("Name");
        }
        if (
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Description");
        }
        if (
          product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Category");
        }
        product.variants.forEach((variant, index) => {
          if (
            variant.name &&
            variant.name.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            matchedFields.push(`Variant ${index + 1} Name`);
          }
        });
        product.images?.forEach((image, imgIndex) => {
          if (image.altText?.toLowerCase().includes(searchTerm.toLowerCase())) {
            matchedFields.push(`Image ${imgIndex + 1} AltText`);
          }
        });

        if (matchedFields.length > 0) {
          searchResults.push({
            type: "product",
            item: product,
            matchedFields,
          });
        }
      });

      // Search in categories
      categories.forEach((category) => {
        if (category.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchResults.push({
            type: "category",
            item: category,
            matchedFields: ["Name"],
          });
        }
      });

      // Search in orders
      orders.forEach((order) => {
        const matchedFields: string[] = [];

        if (order.orderId.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchedFields.push("Order ID");
        }
        if (
          order.fullName &&
          order.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Full Name");
        }
        if (
          order.email &&
          order.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Email");
        }
        if (order.status.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchedFields.push("Status");
        }

        if (matchedFields.length > 0) {
          searchResults.push({
            type: "order",
            item: order,
            matchedFields,
          });
        }
      });

      // Search in coupons
      coupons.forEach((coupon) => {
        const matchedFields: string[] = [];

        if (coupon.code.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchedFields.push("Code");
        }
        if (
          coupon.discountType.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Discount Type");
        }

        if (matchedFields.length > 0) {
          searchResults.push({
            type: "coupon",
            item: coupon,
            matchedFields,
          });
        }
      });

      // Search in notifications
      notifications.forEach((notification) => {
        const matchedFields: string[] = [];

        if (
          notification.message.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Message");
        }
        if (
          notification.type.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          matchedFields.push("Type");
        }

        if (matchedFields.length > 0) {
          searchResults.push({
            type: "notification",
            item: notification,
            matchedFields,
          });
        }
      });

      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="w-full">
          <Header />
          <div className="container mx-auto p-6">
            <div className="flex gap-5 items-center mb-12">
              <Search />
              <h1 className="text-3xl font-bold">Search</h1>
            </div>

            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle>
                  Search Products, Categories, Orders, Coupons, and
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">
                      Search term
                    </Label>
                    <Input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter search term..."
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchTerm.trim()}
                    className="bg-[#4ca626]/10 hover:bg-[#4ca626]/20 text-[#4ca626] border-[#4ca626]/20"
                  >
                    <SearchIcon className="h-4 w-4 mr-2" />
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {hasSearched && !loading && (
              <div className="mb-6">
                <p className="text-gray-600">
                  Found {results.length} result{results.length !== 1 ? "s" : ""}{" "}
                  for "{searchTerm}"
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="text-gray-500">Searching...</div>
              </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">
                      No results found for "{searchTerm}"
                    </p>
                    <p className="text-sm text-gray-400">
                      Try searching for product names, descriptions, categories,
                      order IDs, coupon codes, notification messages, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-6">
                {/* Products Results */}
                {results.filter((r) => r.type === "product").length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Products</h2>
                    <div className="grid gap-4">
                      {results
                        .filter((r) => r.type === "product")
                        .map((result) => {
                          const product = result.item as Product;
                          return (
                            <Card key={product.id} className="shadow-lg">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-semibold">
                                      {product.name}
                                    </h3>
                                    <p className="text-green-600 font-bold">
                                      ₹{product.price}
                                    </p>
                                    <p className="text-gray-600 mt-2">
                                      {product.description}
                                    </p>
                                  </div>
                                  <Link
                                    href={`/seller-dashboard/edit-product/${product.id}`}
                                  >
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                  </Link>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {result.matchedFields.map((field, index) => (
                                    <Badge key={index} variant="secondary">
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Category: {product.category.name}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Categories Results */}
                {results.filter((r) => r.type === "category").length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Categories</h2>
                    <div className="grid gap-4">
                      {results
                        .filter((r) => r.type === "category")
                        .map((result) => {
                          const category = result.item as Category;
                          return (
                            <Card key={category.id} className="shadow-lg">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="text-xl font-semibold">
                                      {category.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {result.matchedFields.map(
                                        (field, index) => (
                                          <Badge
                                            key={index}
                                            variant="secondary"
                                          >
                                            {field}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                  <Link href="/seller-dashboard/categories">
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Categories
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Orders Results */}
                {results.filter((r) => r.type === "order").length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Orders</h2>
                    <div className="grid gap-4">
                      {results
                        .filter((r) => r.type === "order")
                        .map((result) => {
                          const order = result.item as Order;
                          return (
                            <Card key={order.id} className="shadow-lg">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-semibold">
                                      Order {order.orderId}
                                    </h3>
                                    <p className="text-green-600 font-bold">
                                      ₹{order.totalAmount}
                                    </p>
                                    <p className="text-gray-600 mt-2">
                                      Status: {order.status}
                                    </p>
                                    {order.fullName && (
                                      <p className="text-gray-600">
                                        Name: {order.fullName}
                                      </p>
                                    )}
                                    {order.email && (
                                      <p className="text-gray-600">
                                        Email: {order.email}
                                      </p>
                                    )}
                                  </div>
                                  <Link
                                    href={`/seller-dashboard/orders/${order.id}`}
                                  >
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Order
                                    </Button>
                                  </Link>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {result.matchedFields.map((field, index) => (
                                    <Badge key={index} variant="secondary">
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Coupons Results */}
                {results.filter((r) => r.type === "coupon").length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Coupons</h2>
                    <div className="grid gap-4">
                      {results
                        .filter((r) => r.type === "coupon")
                        .map((result) => {
                          const coupon = result.item as Coupon;
                          return (
                            <Card key={coupon.id} className="shadow-lg">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="text-xl font-semibold">
                                      {coupon.code}
                                    </h3>
                                    <p className="text-gray-600 mt-2">
                                      {coupon.discountType === "PERCENT"
                                        ? `${coupon.value}% off`
                                        : `₹${coupon.value} off`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Active: {coupon.isActive ? "Yes" : "No"}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {result.matchedFields.map(
                                        (field, index) => (
                                          <Badge
                                            key={index}
                                            variant="secondary"
                                          >
                                            {field}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                  <Link href="/seller-dashboard/coupons">
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Coupons
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Notifications Results */}
                {results.filter((r) => r.type === "notification").length >
                  0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Notifications
                    </h2>
                    <div className="grid gap-4">
                      {results
                        .filter((r) => r.type === "notification")
                        .map((result) => {
                          const notification = result.item as Notification;
                          return (
                            <Card key={notification.id} className="shadow-lg">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-semibold">
                                      {notification.type}
                                    </h3>
                                    <p className="text-gray-600 mt-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Read: {notification.isRead ? "Yes" : "No"}{" "}
                                      | Pinned:{" "}
                                      {notification.isPinned ? "Yes" : "No"}
                                    </p>
                                  </div>
                                  <Link href="/seller-dashboard/notifications">
                                    <Button variant="outline" size="sm">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View Notifications
                                    </Button>
                                  </Link>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {result.matchedFields.map((field, index) => (
                                    <Badge key={index} variant="secondary">
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
