"use client";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Bell, CirclePlus, Home, Inbox, Megaphone, Package, Percent, Search, Settings, ShoppingCart, Tag } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

export default function ContMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();

    const items = [
  {
    title: "Dashboard",
    url: "/seller-dashboard",
    icon: Home,
  },
  {
    title: "Products",
    url: "/seller-dashboard/products",
    icon: Inbox,
  },
  {
    title: "Inventory",
    url: "/seller-dashboard/inventory",
    icon: Package,
  },
  {
    title: "Add Product",
    url: "/seller-dashboard/add-product",
    icon: CirclePlus,
  },
  {
    title: "Categories",
    url: "/seller-dashboard/categories",
    icon: Tag,
  },
  {
    title: "Coupons",
    url: "/seller-dashboard/coupons",
    icon: Percent,
  },
  {
    title: "Orders",
    url: "/seller-dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Notifications",
    url: "/seller-dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Announcements",
    url: "/seller-dashboard/announcements",
    icon: Megaphone,
  },
  {
    title: "Create Order [POS]",
    url: "/seller-dashboard/create-order",
    icon: ShoppingCart,
  },
  {
    title: "Search",
    url: "/seller-dashboard/search",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/seller-dashboard/settings",
    icon: Settings,
  },
];

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block w-full min-h-screen">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => window.location.reload()}>
          Refresh
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Navigate To</ContextMenuSubTrigger>
          <ContextMenuContent>
            {items.map((item) => (
              <ContextMenuItem key={item.url} onSelect={() => router.push(item.url)}>
                <div className="flex items-center gap-2 w-full cursor-pointer">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </div>
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
