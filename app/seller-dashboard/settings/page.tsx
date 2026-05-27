"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/App-sidebar";
import Header from "@/app/_components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { isAdmin } from "@/app/extras/isAdmis";
import { Loader2, Settings } from "lucide-react";

interface NotificationData {
  emailOrders: boolean;
  emailMarketing: boolean;
  emailUpdates: boolean;
}

interface FeesData {
  standardDeliveryFee: string;
  freeDeliveryThreshold: string;
  freeDeliveryCoupon: boolean;
}

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [notificationData, setNotificationData] = useState<NotificationData>({
    emailOrders: true,
    emailMarketing: false,
    emailUpdates: true,
  });

  const [feesData, setFeesData] = useState<FeesData>({
    standardDeliveryFee: "",
    freeDeliveryThreshold: "",
    freeDeliveryCoupon: false,
  });

  useEffect(() => {
    if (user) {
      const metadata = user.publicMetadata as any;
      setNotificationData({
        emailOrders: metadata?.emailOrders ?? true,
        emailMarketing: metadata?.emailMarketing ?? false,
        emailUpdates: metadata?.emailUpdates ?? true,
      });

      // Fetch fees data from API
      fetch("/api/settings/fees")
        .then((response) => response.json())
        .then((data) => {
          setFeesData({
            standardDeliveryFee: data.standardDeliveryFee || "",
            freeDeliveryThreshold: data.freeDeliveryThreshold || "",
            freeDeliveryCoupon: data.freeDeliveryCoupon ?? false,
          });
        })
        .catch((error) => {
          console.error("Failed to fetch fees data:", error);
        });
    }
  }, [user]);

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrders: notificationData.emailOrders,
          emailMarketing: notificationData.emailMarketing,
          emailUpdates: notificationData.emailUpdates,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification preferences");
      }

      setSuccess("Notification preferences updated successfully!");
    } catch (err) {
      setError("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleFeesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings/fees", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          standardDeliveryFee: feesData.standardDeliveryFee,
          freeDeliveryThreshold: feesData.freeDeliveryThreshold,
          freeDeliveryCoupon: feesData.freeDeliveryCoupon,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update delivery fees");
      }

      setSuccess("Delivery fees updated successfully!");
    } catch (err) {
      setError("Failed to update delivery fees");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="p-6">
            <div className="text-center">
              Please sign in with the admin account to access the Seller
              Dashboard.
            </div>
          </div>
        </main>
      </SidebarProvider>
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
              <Settings />
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
                    {success}
                  </div>
                )}

                <Tabs defaultValue="notifications" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notifications">
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="fees">Additional Charges</TabsTrigger>
                  </TabsList>

                  <TabsContent value="notifications" className="space-y-6">
                    <form
                      onSubmit={handleNotificationUpdate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="emailOrders">
                              Order Notifications
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive email notifications for new orders
                            </p>
                          </div>
                          <Switch
                            id="emailOrders"
                            checked={notificationData.emailOrders}
                            onCheckedChange={(checked) =>
                              setNotificationData((prev) => ({
                                ...prev,
                                emailOrders: checked,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="emailMarketing">
                              Marketing Emails
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive promotional emails and newsletters
                            </p>
                          </div>
                          <Switch
                            id="emailMarketing"
                            checked={notificationData.emailMarketing}
                            onCheckedChange={(checked) =>
                              setNotificationData((prev) => ({
                                ...prev,
                                emailMarketing: checked,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="emailUpdates">
                              Product Updates
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receive notifications about product updates and
                              features
                            </p>
                          </div>
                          <Switch
                            id="emailUpdates"
                            checked={notificationData.emailUpdates}
                            onCheckedChange={(checked) =>
                              setNotificationData((prev) => ({
                                ...prev,
                                emailUpdates: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#4ca626] hover:bg-[#4ca626]/90 text-white"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Update Notification Preferences
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="fees" className="space-y-6">
                    <form
                      onSubmit={handleFeesUpdate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="standardDeliveryFee">
                            Standard Delivery Fee
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <Input
                              id="standardDeliveryFee"
                              type="number"
                              step="0.01"
                              min="0"
                              value={feesData.standardDeliveryFee}
                              onChange={(e) =>
                                setFeesData((prev) => ({
                                  ...prev,
                                  standardDeliveryFee: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="freeDeliveryThreshold">
                            Free Delivery Threshold
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/3 transform -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <Input
                              id="freeDeliveryThreshold"
                              type="number"
                              step="0.01"
                              min="0"
                              value={feesData.freeDeliveryThreshold}
                              onChange={(e) =>
                                setFeesData((prev) => ({
                                  ...prev,
                                  freeDeliveryThreshold: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                              className="pl-8"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Minimum order amount for free delivery (leave
                              empty for no free delivery)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="freeDeliveryCoupon">
                              Free Delivery Coupon
                            </Label>
                            <p className="text-sm text-gray-500">
                              Allow customers to use free delivery coupons
                            </p>
                          </div>
                          <Switch
                            id="freeDeliveryCoupon"
                            checked={feesData.freeDeliveryCoupon}
                            onCheckedChange={(checked) =>
                              setFeesData((prev) => ({
                                ...prev,
                                freeDeliveryCoupon: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#4ca626] hover:bg-[#4ca626]/90 text-white"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Update Delivery Fees
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
