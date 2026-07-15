"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/admin/App-sidebar";
import Header from "@/app/_components/admin/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsAdmin } from "@/app/extras/useIsAdmin";
import {
  Loader2,
  Bell,
  Check,
  CheckCheck,
  MoreVertical,
  Trash2,
  Pin,
  Eye,
  EyeOff,
} from "lucide-react";
import RefreshButton from "@/app/_components/admin/RefreshApis";

interface Notification {
  id: string;
  message: string;
  type: "ORDER" | "COUPON" | "STOCK_UPDATE" | "GENERAL";
  isRead: boolean;
  isPinned: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && useIsAdmin()) {
      fetchNotifications();
    }
  }, [user]);

  // Refresh notifications when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && useIsAdmin()) {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError("Failed to fetch notifications");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "mark_read" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif,
        ),
      );
    } catch (err) {
      setError("Failed to mark notification as read");
    }
  };

  const markAsUnread = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "mark_unread" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as unread");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: false } : notif,
        ),
      );
    } catch (err) {
      setError("Failed to mark notification as unread");
    }
  };

  const pinNotification = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "pin" }),
      });

      if (!response.ok) {
        throw new Error("Failed to pin notification");
      }

      // Update local state - pinning also marks as read
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true, isPinned: true } : notif,
        ),
      );
    } catch (err) {
      setError("Failed to pin notification");
    }
  };

  const unpinNotification = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: "unpin" }),
      });

      if (!response.ok) {
        throw new Error("Failed to unpin notification");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isPinned: false } : notif,
        ),
      );
    } catch (err) {
      setError("Failed to unpin notification");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // Update local state
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (err) {
      setError("Failed to delete notification");
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((notif) => markAsRead(notif.id)),
      );
    } catch (err) {
      setError("Failed to mark all notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ORDER":
        return "bg-[#4ca626]/10 text-[#4ca626] border-[#4ca626]/20";
      case "COUPON":
        return "bg-blue-100 text-blue-800";
      case "STOCK_UPDATE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (!useIsAdmin()) {
    notFound();
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="w-full">
          <Header />
          <div className="container mx-auto p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 sm:gap-0">
              <section className="inline-flex items-center gap-4 justify-between w-full">
              <div className="flex gap-5 items-center">
                <Bell />
                <h1 className="text-2xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-[#4ca626] hover:bg-[#4ca626]/90 border-0 text-white">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <RefreshButton />
              </section>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#4ca626] hover:bg-[#4ca626]/90 text-white"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 h-4 w-4" />
                  )}
                  Mark All as Read
                </Button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications
                  .sort((a, b) => {
                    // Pinned notifications first, then by creation date (newest first)
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    );
                  })
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border bg-gray-900`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getTypeColor(notification.type)}>
                              {notification.type.replace("_", " ")}
                            </Badge>
                            {notification.isPinned && (
                              <Pin className="h-4 w-4 text-yellow-500" />
                            )}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[#4ca626] rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-sm`}>{notification.message}</p>
                          <p className="text-xs mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-4 h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {notification.isRead ? (
                              <DropdownMenuItem
                                onClick={() => markAsUnread(notification.id)}
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Mark as Unread
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            {notification.isPinned ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  unpinNotification(notification.id)
                                }
                              >
                                <Pin className="mr-2 h-4 w-4 rotate-45" />
                                Unpin Notification
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => pinNotification(notification.id)}
                              >
                                <Pin className="mr-2 h-4 w-4" />
                                Pin Notification
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
