"use client";

import {
  AlertCircle,
  CheckCircle2,
  CirclePlus,
  HelpCircle,
  ImagePlus,
  Package2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { Badge } from "@/components/ui/badge";

import { isAdmin } from "@/app/extras/isAdmis";
import { createClient } from "@supabase/supabase-js";
import { ProductGallery } from "@/app/_components/ProductGalleryAdmin";

interface ProductFormData {
  name: string;
  price: string;
  mrp: string;
  taxRate: string;
  stock: string;
  description: string;
  categoryId: string;
  variants: {
    name?: string;
  }[];
  images: { url: string; storagePath: string; altText: string }[];
}

interface CalculatedFields {
  finalPrice: string;
  discount: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AddProductPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    mrp: "",
    taxRate: "18",
    stock: "",
    description: "",
    categoryId: "",
    variants: [
      {
        name: "",
      },
    ],
    images: [{ url: "", storagePath: "", altText: "" }],
  });

  const [calculatedFields, setCalculatedFields] = useState<CalculatedFields>({
    finalPrice: "0",
    discount: "0",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  const [newCategoryName, setNewCategoryName] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [taxRates, setTaxRates] = useState<any[]>(["0", "5", "12", "18", "20", "40"]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");

        const data = await response.json();

        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchTaxRates = async () => {
      try {
        const response = await fetch("/api/tax-rates");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setTaxRates(data);
          }
        }
      } catch (error) {
        console.error("Error fetching tax rates:", error);
      }
    };

    fetchCategories();
    fetchTaxRates();
  }, []);

  useEffect(() => {
    const price = parseFloat(formData.price) || 0;

    const mrp = parseFloat(formData.mrp) || 0;

    const taxRate = parseFloat(formData.taxRate) || 0;

    const taxAmount = (price * taxRate) / 100;

    const finalPrice = price + taxAmount;

    const discount = mrp > 0 ? (((mrp - finalPrice) / mrp) * 100).toFixed(2) : "0";

    setCalculatedFields({
      finalPrice: Math.round(finalPrice).toString(),
      discount,
    });
  }, [formData.price, formData.mrp, formData.taxRate]);

  const missingFields = [];

  if (!formData.name.trim()) missingFields.push("Product Name");

  if (!formData.price.trim()) missingFields.push("Selling Price");

  if (!formData.stock.trim()) missingFields.push("Stock Quantity");

  if (!formData.description.trim()) missingFields.push("Description");

  if (!formData.categoryId) missingFields.push("Category");

  const hasTouchedFields =
    formData.name ||
    formData.price ||
    formData.stock ||
    formData.description ||
    formData.categoryId;

  const isReadyToPublish = missingFields.length === 0;

  const productStatus = !hasTouchedFields
    ? "empty"
    : isReadyToPublish
      ? "ready"
      : "incomplete";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      const payload = {
        name: formData.name,

        price: formData.price,

        mrp: formData.mrp || null,

        taxRate: formData.taxRate || "0",

        stock: parseInt(formData.stock) || 0,

        description: formData.description,

        categoryId: formData.categoryId,

        isLive: true,

        images: formData.images.filter(img => img.url),

        variants: formData.variants.map((variant) => ({
          name: variant.name || "",
        })),
      };

      const response = await fetch("/api/products", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/seller-dashboard/products");
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch("/api/categories", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: newCategoryName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      setCategories((prev) => [...prev, data]);

      setFormData((prev) => ({
        ...prev,
        categoryId: data.id,
      }));

      setNewCategoryName("");

      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Failed to create category",
      );
    }
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
        },
      ],
    }));
  };

  const updateVariant = (index: number, field: "name", value: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index
          ? {
              ...v,
              [field]: value,
            }
          : v,
      ),
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { url: "", storagePath: "", altText: "" }],
    }));
  };

  const updateImage = (index: number, field: "url" | "altText" | "storagePath", value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, [field]: value } : img,
      ),
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingImageIndex(index);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        images: prev.images.map((img, i) =>
          i === index ? { ...img, url: data.publicUrl, storagePath: filePath } : img
        ),
      }));
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = formData.images[index];

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    if (imageToRemove.storagePath) {
      try {
        await supabase.storage
          .from("product-images")
          .remove([imageToRemove.storagePath]);
      } catch (err) {
        console.error("Error removing image from storage:", err);
      }
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  if (!isAdmin(user)) {
    notFound();
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />

      <SidebarInset>
        <main className="min-h-screen bg-[#0a0a0a] text-white">
          <Header />

          <div className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
            <div className="mx-6 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#4ca626]/20 border border-[#4ca626]/30 flex items-center justify-center">
                  <CirclePlus className="text-[#7ddc56]" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Add Product
                  </h1>

                  <p className="text-sm text-zinc-400 mt-1">
                    Create a premium product listing
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                form="product-form"
                disabled={loading || !isReadyToPublish}
                className="h-12 px-7 rounded-xl bg-[#4ca626] hover:bg-[#5bbd31] text-white font-semibold shadow-[0_0_40px_rgba(76,166,38,0.35)] disabled:opacity-50"
              >
                {loading ? "Publishing..." : "Publish Product"}
              </Button>
            </div>
          </div>

          <div className="mx-8 px-6 py-8">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {error}
              </div>
            )}

            <form
              id="product-form"
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            >
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-8">
                  <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                      <Sparkles className="text-[#7ddc56]" />

                      <div>
                        <h2 className="text-xl font-semibold">
                          Product Information
                        </h2>

                        <p className="text-sm text-zinc-400 mt-1">
                          Basic information about your product
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Product Name
                        </Label>

                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter Your Product Name"
                          className="h-14 rounded-2xl bg-[#181818] border-white/10 focus-visible:ring-[#4ca626]"
                        />
                      </div>

                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Description
                        </Label>

                        <Textarea
                          rows={6}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Write a stunning product description..."
                          className="rounded-2xl bg-[#181818] border-white/10 resize-none focus-visible:ring-[#4ca626]"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-semibold">Pricing</h2>

                        <p className="text-sm text-zinc-400 mt-1">
                          Manage pricing and inventory
                        </p>
                      </div>

                      <Badge className="bg-[#4ca626]/20 text-[#8ded66] border border-[#4ca626]/30">
                        Live Calculation
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <Label className="mb-3 block text-zinc-300">MRP</Label>

                        <Input
                          value={formData.mrp}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              mrp: e.target.value,
                            }))
                          }
                          placeholder="₹ 4999"
                          className="h-14 rounded-2xl bg-[#181818] border-white/10"
                        />
                      </div>

                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Selling Price
                        </Label>

                        <Input
                          value={formData.price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          placeholder="₹ 3999"
                          className="h-14 rounded-2xl bg-[#181818] border-white/10"
                        />
                      </div>

                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Tax Rate
                        </Label>

                      <Select
                        value={formData.taxRate}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, taxRate: value }))
                        }
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-[#181818] border-white/10 w-full p-7">
                          <SelectValue placeholder="Select Tax Rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxRates.map((tax, idx) => {
                            const value = typeof tax === "string" ? tax : tax.rate?.toString() || tax.value?.toString() || tax.id?.toString();
                            const label = typeof tax === "string" ? `${tax}%` : tax.name || `${tax.rate}%`;
                            return value ? (
                              <SelectItem key={value || idx} value={value}>
                                {label}
                              </SelectItem>
                            ) : null;
                          })}
                        </SelectContent>
                      </Select>
                      </div>

                      <div>
                        <Label className="mb-3 block text-zinc-300">
                          Stock
                        </Label>

                        <Input
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              stock: e.target.value,
                            }))
                          }
                          placeholder="120"
                          className="h-14 rounded-2xl bg-[#181818] border-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 mt-7">
                      <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
                        <p className="text-sm text-zinc-400">Final Price</p>

                        <h3 className="text-3xl font-bold mt-2 text-[#7ddc56]">
                          ₹{calculatedFields.finalPrice}
                        </h3>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#181818] p-5">
                        <p className="text-sm text-zinc-400">Discount</p>

                        <h3 className="text-3xl font-bold mt-2 text-white">
                          {calculatedFields.discount}%
                        </h3>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-semibold">Category</h2>

                        <p className="text-sm text-zinc-400 mt-1">
                          Organize your product
                        </p>
                      </div>

                      <Dialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-[#111111] border-white/10 text-white">
                          <DialogHeader>
                            <DialogTitle>Create New Category</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <Input
                              value={newCategoryName}
                              onChange={(e) =>
                                setNewCategoryName(e.target.value)
                              }
                              placeholder="Category Name"
                              className="h-12 rounded-xl bg-[#181818] border-white/10"
                            />

                            <Button
                              onClick={handleCreateCategory}
                              className="w-full bg-[#4ca626] hover:bg-[#5bbd31]"
                            >
                              Create Category
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-14 w-full rounded-2xl bg-[#181818] border-white/10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>

                      <SelectContent>
                        {Array.isArray(categories) && categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Card>

                  <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-semibold">Product Images</h2>
                        <p className="text-sm text-zinc-400 mt-1">
                          Upload high-quality images of your product
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {formData.images.map((image, imageIndex) => (
                        <div key={imageIndex} className="p-5 border border-white/10 rounded-2xl bg-[#181818]">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-md font-medium text-white">
                              Image {imageIndex + 1}
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeImage(imageIndex)}
                              className="border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {image.url ? (
                              <div className="flex flex-col sm:flex-row items-start gap-5">
                                <img
                                  src={image.url}
                                  alt="Preview"
                                  className="w-28 h-28 object-cover rounded-xl border border-white/10 bg-[#111111]"
                                />
                                <div className="flex-1 space-y-3 w-full">
                                  <Label className="text-sm text-zinc-400">Alt Text</Label>
                                  <Input
                                    type="text"
                                    value={image.altText}
                                    onChange={(e) => updateImage(imageIndex, "altText", e.target.value)}
                                    placeholder="A descriptive alt text"
                                    className="w-full h-12 rounded-xl bg-[#111111] border-white/10"
                                  />
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-[#111111] hover:bg-[#1a1a1a] transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-400">
                                  {uploadingImageIndex === imageIndex ? (
                                    <Loader2 className="w-8 h-8 mb-3 text-[#4ca626] animate-spin" />
                                  ) : (
                                    <UploadCloud className="w-8 h-8 mb-3 text-zinc-500" />
                                  )}
                                  <p className="text-sm">
                                    <span className="font-semibold text-white">Click to upload</span> or drag and drop
                                  </p>
                                </div>
                                <Input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  disabled={uploadingImageIndex === imageIndex}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(imageIndex, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addImage} className="w-full border-white/10 bg-[#181818] hover:bg-[#1f1f1f] rounded-xl h-12">
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-semibold">Variants</h2>

                        <p className="text-sm text-zinc-400 mt-1">
                          Add product variations and images
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={addVariant}
                        className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {formData.variants.map((variant, variantIndex) => (
                        <div
                          key={variantIndex}
                          className="rounded-3xl border border-white/10 bg-[#181818] overflow-hidden"
                        >
                          <div className="border-b border-white/10 p-5 flex items-center justify-between bg-[#141414]">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-[#4ca626]/20 flex items-center justify-center">
                                <Package2 className="h-5 w-5 text-[#7ddc56]" />
                              </div>

                              <div>
                                <h3 className="font-semibold">
                                  Variant {variantIndex + 1}
                                </h3>

                                <p className="text-sm text-zinc-400">
                                  Configure this variation
                                </p>
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => removeVariant(variantIndex)}
                              className="border-red-500/20 bg-red-500/10 hover:bg-red-500/20 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>

                          <div className="p-6 space-y-6">
                            <div>
                              <Label className="mb-3 block text-zinc-300">
                                Variant Name
                              </Label>

                              <Input
                                value={variant.name}
                                onChange={(e) =>
                                  updateVariant(
                                    variantIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Black / XL / 256GB"
                                className="h-14 rounded-2xl bg-[#101010] border-white/10"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6 sticky top-28 h-fit">
                  <Card className="bg-gradient-to-br from-[#151515] to-[#101010] border border-white/10 rounded-3xl overflow-hidden">
                    <section className="p-4 pb-0">
                      <div className="overflow-hidden rounded-2xl h-80 bg-gradient-to-br from-[#4ca626]/30 to-transparent flex items-center justify-center border border-white/10">
                        {(() => {
                          const validImages = formData.images.filter(img => img.url);
                          return validImages.length > 0 ? (
                            <ProductGallery 
                              images={validImages.map((img, index) => ({ 
                                id: img.storagePath || index, 
                                src: img.url, 
                                alt: img.altText || `${formData.name} - Image ${index + 1}` 
                              }))} 
                              productName={formData.name} 
                            />
                          ) : (
                            <Package2 className="h-16 w-16 text-[#7ddc56]" />
                          )
                        })()}
                      </div>
                    </section>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold">
                            {formData.name || "Your Product"}
                          </h2>

                          <p className="text-zinc-400 text-sm mt-2 line-clamp-3">
                            {formData.description ||
                              "Your premium product description will appear here."}
                          </p>
                        </div>

                        <Badge className="bg-[#4ca626]/20 text-[#8ded66] border border-[#4ca626]/30">
                          Draft
                        </Badge>
                      </div>

                      <Separator className="my-6 bg-white/10" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Selling Price</span>

                          <span className="text-xl font-bold">
                            ₹{formData.price || "0"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">MRP</span>

                          <span className="text-zinc-500 line-through">
                            ₹{formData.mrp || "0"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Discount</span>

                          <span className="text-[#7ddc56] font-semibold">
                            {calculatedFields.discount}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Stock</span>

                          <span>{formData.stock || 0} units</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-[#111111] border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold">Product Status</h3>

                      {productStatus === "incomplete" && (
                        <HoverCard openDelay={150}>
                          <HoverCardTrigger asChild>
                            <button type="button">
                              <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-white transition-colors" />
                            </button>
                          </HoverCardTrigger>

                          <HoverCardContent className="w-72 bg-[#111111] border border-white/10 text-white">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-400" />

                                <p className="font-medium">
                                  Missing Required Fields
                                </p>
                              </div>

                              <div className="space-y-2">
                                {missingFields.map((field) => (
                                  <div
                                    key={field}
                                    className="text-sm text-zinc-300"
                                  >
                                    • {field}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>

                    <div
                      className={`
                        rounded-2xl border p-5 transition-all
                        ${
                          productStatus === "empty"
                            ? "bg-red-500/10 border-red-500/20"
                            : productStatus === "incomplete"
                              ? "bg-yellow-500/10 border-yellow-500/20"
                              : "bg-[#4ca626]/10 border-[#4ca626]/20"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                            h-3 w-3 rounded-full
                            ${
                              productStatus === "empty"
                                ? "bg-red-500"
                                : productStatus === "incomplete"
                                  ? "bg-yellow-400"
                                  : "bg-[#4ca626]"
                            }
                          `}
                        />

                        <div>
                          <p className="font-medium">
                            {productStatus === "empty"
                              ? "Not Ready"
                              : productStatus === "incomplete"
                                ? "Incomplete"
                                : "Ready to Publish"}
                          </p>

                          <p className="text-sm text-zinc-400 mt-1">
                            {productStatus === "empty"
                              ? "Fill required fields to continue"
                              : productStatus === "incomplete"
                                ? `${missingFields.length} required fields remaining`
                                : "Everything looks good"}
                          </p>
                        </div>

                        {productStatus === "ready" && (
                          <CheckCircle2 className="ml-auto text-[#7ddc56]" />
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
