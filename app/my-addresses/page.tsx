"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navbar from "@/app/_components/home/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { MapPin, Plus, Edit, Trash2, Star } from "lucide-react";
import BottomNav from "../_components/home/BottomNav";

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
  createdAt: string;
  updatedAt: string;
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

export default function MyAddressesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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

  useEffect(() => {
    const loadData = async () => {
      if (isLoaded && !user) {
        router.push("/sign-in");
        return;
      }

      if (user) {
        await fetchAddresses();
        setLoading(false);
      }
    };

    loadData();
  }, [user, isLoaded, router]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (response.ok) {
        const addressesData = await response.json();
        setAddresses(addressesData);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAddress
        ? `/api/addresses/${editingAddress.id}`
        : "/api/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAddresses();
        setIsDialogOpen(false);
        resetForm();
        toast.success(
          editingAddress
            ? "Address updated successfully"
            : "Address added successfully"
        , {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save address", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAddresses();
        toast.success("Address deleted successfully", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        toast.error("Failed to delete address", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
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
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAddress(null);
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

  const handlePincodeChange = async (pincode: string) => {
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />
            <p className="text-lg text-zinc-400">Loading Addresses...</p>
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

        <div className="py-6 px-4 md:py-8 relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                My Addresses
              </h1>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="rounded-3xl p-4 md:p-4 text-sm md:text-md bg-[#4ca626] text-white hover:bg-[#5cbf32]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl lg:max-w-3xl xl:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-white text-xl">
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-white text-sm font-medium"
                        >
                          Address Name *
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          placeholder="e.g., Home, Office, Work"
                          required
                        />
                      </div>
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
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          value={formData.contactNo}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              contactNo: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
                        />
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
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
                        />
                      </div>
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
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
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
                          value={formData.state}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
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
                          value={formData.pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          className="bg-black/50 border-white/10 text-white focus:border-[#4ca626] focus:ring-[#4ca626]/20"
                          required
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
                          value={formData.country}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              country: e.target.value,
                            }))
                          }
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
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isDefault: e.target.checked,
                          }))
                        }
                        className="rounded border-white/10 bg-black/50 text-[#4ca626] focus:ring-[#4ca626]"
                      />
                      <Label htmlFor="isDefault" className="text-white text-sm">
                        Set as default address
                      </Label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="border-white/10 text-white hover:bg-zinc-800"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-xl bg-[#4ca626] text-white hover:bg-[#5cbf32]">
                        {editingAddress ? "Update Address" : "Add Address"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
                <div className="text-zinc-300 text-base md:text-lg mb-4">
                  No addresses saved yet
                </div>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="rounded-3xl p-6 md:p-8 text-sm md:text-md bg-[#4ca626] text-white hover:bg-[#5cbf32]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Address
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] backdrop-blur-xl rounded-[2rem]"
                  >
                    <CardHeader>
                      <CardTitle className="text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {address.name}
                          </span>
                          {address.isDefault && (
                            <span className="bg-[#4ca626]/20 text-[#9be274] border border-[#4ca626]/30 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </span>
                          )}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(address)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1 h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(address.id)}
                            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 p-1 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-zinc-400 text-sm space-y-1">
                      <div>
                        <strong>{address.fullName}</strong>
                      </div>
                      <div>{address.address}</div>
                      <div>
                        {[address.city, address.state || (address as any).State || (address as any).region, address.pincode || (address as any).postalCode].filter(Boolean).join(', ')}
                      </div>
                      <div>{address.country}</div>
                      <div>{address.contactNo}</div>
                      <div>{address.email}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
  );
}