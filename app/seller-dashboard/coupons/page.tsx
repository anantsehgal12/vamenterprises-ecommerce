"use client";

import { useState, useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Percent } from "lucide-react";
import { isAdmin } from "@/app/extras/isAdmis";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/Navbar";

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

export default function CouponsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FIXED" | "FREE_SHIPPING",
    value: "",
    expiryDate: "",
    usageLimit: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/coupons");
      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCoupon
        ? `/api/coupons/${editingCoupon.id}`
        : "/api/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: formData.discountType === "FREE_SHIPPING" ? 0 : parseFloat(formData.value),
          usageLimit: formData.usageLimit
            ? parseInt(formData.usageLimit)
            : null,
          isActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save coupon");
      }

      fetchCoupons();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value.toString(),
      expiryDate: new Date(coupon.expiryDate).toISOString().split("T")[0],
      usageLimit: coupon.usageLimit?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete coupon");
      }
      fetchCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "PERCENT",
      value: "",
      expiryDate: "",
      usageLimit: "",
    });
    setEditingCoupon(null);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "FREE_SHIPPING") return "Free Delivery";
    
    return coupon.discountType === "PERCENT"
      ? `${coupon.value}%`
      : `₹  ${coupon.value}`;
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

  if (loading && isAdmin(user)) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="p-6">
            <div className="text-center">Loading coupons...</div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  if (isLoaded && isAdmin(user))
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="w-full">
            <Header />
            <div className="container mx-auto p-6">
              <div className="flex justify-between items-center mb-12">
                <div className="flex gap-5 items-center">
                  <Percent />
                  <h1 className="text-3xl font-bold">Coupons</h1>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} className="bg-[#4ca626] hover:bg-[#5bbd31]">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="p-6">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleSubmit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) =>
                            setFormData({ ...formData, code: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Discount Type</Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={(value: "PERCENT" | "FIXED" | "FREE_SHIPPING") =>
                            setFormData({ ...formData, discountType: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">Percentage</SelectItem>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.discountType !== "FREE_SHIPPING" && (
                        <div className="space-y-2">
                          <Label htmlFor="value">Discount Value</Label>
                          <Input
                            id="value"
                            type="number"
                            step="0.01"
                            value={formData.value}
                            onChange={(e) =>
                              setFormData({ ...formData, value: e.target.value })
                            }
                            required
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expiryDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usageLimit">
                          Usage Limit (optional)
                        </Label>
                        <Input
                          id="usageLimit"
                          type="number"
                          value={formData.usageLimit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              usageLimit: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button type="submit" className="w-full bg-[#4ca626] hover:bg-[#5bbd31]">
                        {editingCoupon ? "Update Coupon" : "Create Coupon"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {coupons.length === 0 ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No coupons found.</p>
                  <Button onClick={() => setIsDialogOpen(true)} className="bg-[#4ca626] hover:bg-[#5bbd31]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Coupon
                  </Button>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.map((coupon) => (
                          <TableRow key={coupon.id}>
                            <TableCell className="font-medium">
                              {coupon.code}
                            </TableCell>
                            <TableCell>{formatDiscount(coupon)}</TableCell>
                            <TableCell>
                              {new Date(coupon.expiryDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                              className="bg-[#4ca626]/10 text-[#7ddc56] border-[#4ca626]/20"                                
                              variant={
                                  coupon.isActive ? "default" : "secondary"
                                }
                              >
                                {coupon.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {coupon.usedCount}
                              {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(coupon)}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the coupon "
                                        {coupon.code}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(coupon.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {coupon.code}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDiscount(coupon)}
                            </p>
                          </div>
                          <Badge
                            variant={coupon.isActive ? "default" : "secondary"}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Expiry Date:
                            </span>
                            <span className="text-sm text-black font-medium">
                              {new Date(coupon.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Usage:
                            </span>
                            <span className="text-sm text-black font-medium">
                              {coupon.usedCount}
                              {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(coupon)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 flex-1"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the coupon "{coupon.code}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(coupon.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
}
