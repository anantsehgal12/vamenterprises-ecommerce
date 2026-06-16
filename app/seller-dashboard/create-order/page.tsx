"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/admin/App-sidebar";
import Header from "@/app/_components/admin/Header";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { isAdmin } from "@/app/extras/isAdmis";
import { CirclePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderItem {
  productId: string;
  variant: string;
  quantity: string;
  price: string;
}

interface CustomerDetails {
  fullName: string;
  email: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export default function CreateOrderPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    razorpayOrderId: "",
    razorpayPaymentId: "",
    method: "Cash",
  });

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    fullName: "",
    email: "",
    contactNo: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [items, setItems] = useState<OrderItem[]>([
    { productId: "", variant: "", quantity: "1", price: "0" },
  ]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  if (!isAdmin(user)) {
    notFound();
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: "", variant: "", quantity: "1", price: "0" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePincodeChange = async (pincode: string) => {
    setCustomerDetails((prev) => ({ ...prev, pincode }));

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
          setCustomerDetails((prev) => ({
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

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === "productId") {
      const selectedProduct = products.find((p) => p.id === value);
      if (selectedProduct) {
        newItems[index].price = selectedProduct.price.replace(/[^\d.]/g, "");
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + price * quantity;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerDetails.fullName || !customerDetails.contactNo || !customerDetails.address) {
      toast.error("Please fill required customer details (Name, Contact, Address)", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    const validItems = items.filter((item) => item.productId && parseInt(item.quantity) > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid product to the order", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    setLoading(true);

    try {
      let invoiceUrl = "";
      if (invoiceFile) {
        setUploading(true);
        const fileExt = invoiceFile.name.split('.').pop();
        const fileName = `invoice-manual-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(fileName, invoiceFile, {
            contentType: invoiceFile.type,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from("invoices").getPublicUrl(fileName);
          invoiceUrl = data.publicUrl;
        }
        setUploading(false);
      }

      const payload = {
        isManual: true,
        customerDetails,
        items: validItems.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity),
        })),
        totalAmount: calculateTotal(),
        razorpayOrderId: paymentDetails.razorpayOrderId || "MANUAL",
        razorpayPaymentId: paymentDetails.razorpayPaymentId || "MANUAL",
        paymentMethod: paymentDetails.method,
        invoiceUrl,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Order created successfully!", {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
        router.push("/seller-dashboard/orders");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create order", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

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
                  <h1 className="text-3xl font-bold tracking-tight">Create Manual Order</h1>
                  <p className="text-sm text-zinc-400 mt-1">Create an order for walk-in or offline customers</p>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="h-12 px-7 rounded-xl bg-[#4ca626] hover:bg-[#5bbd31] text-white font-semibold shadow-[0_0_40px_rgba(76,166,38,0.35)] disabled:opacity-50"
              >
                {loading || uploading ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>

          <div className="mx-8 px-6 py-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
              <div className="space-y-8">
                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Customer Details</h2>
                    <p className="text-sm text-zinc-400 mt-1">Shipping and contact information</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div><Label className="mb-3 block text-zinc-300">Full Name *</Label><Input value={customerDetails.fullName} onChange={(e) => setCustomerDetails({ ...customerDetails, fullName: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="John Doe" required /></div>
                    <div><Label className="mb-3 block text-zinc-300">Contact No *</Label><Input value={customerDetails.contactNo} onChange={(e) => setCustomerDetails({ ...customerDetails, contactNo: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="+91 9876543210" required /></div>
                    <div><Label className="mb-3 block text-zinc-300">Email</Label><Input type="email" value={customerDetails.email} onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="john@example.com" /></div>
                    <div className="md:col-span-2"><Label className="mb-3 block text-zinc-300">Address *</Label><Input value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="123 Street Name" required /></div>
                    <div><Label className="mb-3 block text-zinc-300">City</Label><Input value={customerDetails.city} onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="City" /></div>
                    <div><Label className="mb-3 block text-zinc-300">State</Label><Input value={customerDetails.state} onChange={(e) => setCustomerDetails({ ...customerDetails, state: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="State" /></div>
                    <div><Label className="mb-3 block text-zinc-300">Pincode</Label><Input value={customerDetails.pincode} onChange={(e) => handlePincodeChange(e.target.value)} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="123456" /></div>
                    <div><Label className="mb-3 block text-zinc-300">Country</Label><Input value={customerDetails.country} onChange={(e) => setCustomerDetails({ ...customerDetails, country: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="India" /></div>
                  </div>
                </Card>

                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Payment Details</h2>
                    <p className="text-sm text-zinc-400 mt-1">Payment method and reference information</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <Label className="mb-3 block text-zinc-300">Payment Method *</Label>
                      <Select value={paymentDetails.method} onValueChange={(val) => setPaymentDetails({ ...paymentDetails, method: val })}>
                        <SelectTrigger className="h-14 py-6.5 rounded-2xl bg-[#181818] border-white/10 w-full"><SelectValue placeholder="Select Method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                          <SelectItem value="POS">POS</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Razorpay">Razorpay</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="mb-3 block text-zinc-300">Payment ID / Transaction ID</Label><Input value={paymentDetails.razorpayPaymentId} onChange={(e) => setPaymentDetails({ ...paymentDetails, razorpayPaymentId: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="e.g. pay_xxxxx or UTR" /></div>
                    <div><Label className="mb-3 block text-zinc-300">Order Reference ID</Label><Input value={paymentDetails.razorpayOrderId} onChange={(e) => setPaymentDetails({ ...paymentDetails, razorpayOrderId: e.target.value })} className="h-14 rounded-2xl bg-[#181818] border-white/10" placeholder="e.g. order_xxxxx" /></div>
                  </div>
                </Card>

                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Order Items</h2>
                      <p className="text-sm text-zinc-400 mt-1">Add products to this order</p>
                    </div>
                    <Button type="button" onClick={handleAddItem} className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                  </div>

                  <div className="space-y-6">
                    {items.map((item, index) => {
                      const selectedProduct = products.find((p) => p.id === item.productId);
                      
                      return (
                      <div key={index} className="p-5 border border-white/10 rounded-2xl bg-[#181818] relative">
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="grid md:grid-cols-2 gap-5 mt-2">
                          {selectedProduct?.images?.[0] && (
                            <div className="md:col-span-2 flex items-center gap-4 mb-2 p-3 bg-black/20 rounded-xl border border-white/5">
                              <img src={selectedProduct.images[0].url} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" alt="" />
                              <span className="font-semibold text-lg">{selectedProduct.name}</span>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <Label className="mb-2 block text-zinc-300">Product</Label>
                            <Select value={item.productId} onValueChange={(val) => updateItem(index, "productId", val)}>
                              <SelectTrigger className="h-12 rounded-xl bg-[#111111] border-white/10 w-full"><SelectValue placeholder="Select Product" /></SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name} (₹{p.price.replace(/[^\d.]/g, "")})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedProduct?.variants && selectedProduct.variants.some((v: any) => v.name) ? (
                            <div>
                              <Label className="mb-2 block text-zinc-300">Variant</Label>
                              <Select value={item.variant} onValueChange={(val) => updateItem(index, "variant", val)}>
                                <SelectTrigger className="h-12 py-6 rounded-xl bg-[#111111] border-white/10 w-full"><SelectValue placeholder="Select Variant" /></SelectTrigger>
                                <SelectContent>
                                  {selectedProduct.variants.filter((v: any) => v.name).map((v: any, i: number) => (
                                    <SelectItem key={i} value={v.name}>{v.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div><Label className="mb-2 block text-zinc-300">Variant (Optional)</Label><Input value={item.variant} onChange={(e) => updateItem(index, "variant", e.target.value)} className="h-12 rounded-xl bg-[#111111] border-white/10" placeholder="e.g. Red, XL" disabled={!!selectedProduct} title={selectedProduct ? "No variants available" : ""} /></div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div><Label className="mb-2 block text-zinc-300">Quantity</Label><Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} className="h-12 rounded-xl bg-[#111111] border-white/10" /></div>
                            <div><Label className="mb-2 block text-zinc-300">Price</Label><Input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} className="h-12 rounded-xl bg-[#111111] border-white/10" /></div>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </Card>

                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-7">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold">Invoice Upload</h2>
                    <p className="text-sm text-zinc-400 mt-1">Upload a manual invoice for this order</p>
                  </div>
                  <div>
                    <Label className="mb-3 block text-zinc-300">Invoice File (PDF/Image)</Label>
                    <Input type="file" accept=".pdf,image/*" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} className="h-14 rounded-2xl bg-[#181818] border-white/10 pt-3" />
                  </div>
                </Card>
              </div>

              <div className="space-y-6 sticky top-28 h-fit">
                <Card className="bg-[#111111] border border-white/10 rounded-3xl p-6">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      if (!product) return null;
                      const price = parseFloat(item.price) || 0;
                      const quantity = parseInt(item.quantity) || 0;
                      return (
                        <div key={index} className="flex justify-between items-start text-sm">
                          <div className="flex-1 pr-4 flex items-center gap-3">
                            {product.images?.[0] && <img src={product.images[0].url} className="w-10 h-10 rounded-md object-cover flex-shrink-0" alt="" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-zinc-500">{quantity} x ₹{price.toFixed(2)}</p>
                              {item.variant && <p className="text-xs text-zinc-500">Variant: {item.variant}</p>}
                            </div>
                          </div>
                          <span className="font-medium whitespace-nowrap">₹{(price * quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-center text-lg font-bold text-[#7ddc56]">
                      <span>Total Amount</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
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