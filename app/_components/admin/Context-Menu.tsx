"use client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Bell, CirclePlus, Home, Inbox, Megaphone,
  Package, Percent, Search, Settings, ShoppingCart, Tag, MonitorDot,
} from "lucide-react";
import React, { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ContMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextRef = useRef(false);

  const items = [
    { title: "Dashboard",         url: "/seller-dashboard",                icon: Home },
    { title: "Products",          url: "/seller-dashboard/products",       icon: Inbox },
    { title: "Inventory",         url: "/seller-dashboard/inventory",      icon: Package },
    { title: "Add Product",       url: "/seller-dashboard/add-product",    icon: CirclePlus },
    { title: "Categories",        url: "/seller-dashboard/categories",     icon: Tag },
    { title: "Coupons",           url: "/seller-dashboard/coupons",        icon: Percent },
    { title: "Orders",            url: "/seller-dashboard/orders",         icon: ShoppingCart },
    { title: "Notifications",     url: "/seller-dashboard/notifications",  icon: Bell },
    { title: "Announcements",     url: "/seller-dashboard/announcements",  icon: Megaphone },
    { title: "Create Order [POS]",url: "/seller-dashboard/create-order",   icon: ShoppingCart },
    { title: "Search",            url: "/seller-dashboard/search",         icon: Search },
    { title: "Settings",          url: "/seller-dashboard/settings",       icon: Settings },
  ];

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Native listener registered BEFORE Radix — runs first in capture chain
    const handler = (e: MouseEvent) => {
      if (skipNextRef.current) {
        skipNextRef.current = false;
        // Stop Radix from seeing this event → browser shows native menu
        e.stopPropagation();
        // Do NOT call preventDefault() → browser menu appears naturally
      }
      // Otherwise do nothing → Radix handles it normally
    };

    el.addEventListener("contextmenu", handler, true); // true = capture phase
    return () => el.removeEventListener("contextmenu", handler, true);
  }, []);

  const handleOpenLegacyMenu = useCallback(() => {
    skipNextRef.current = true;
    // The custom menu closes, user right-clicks once more → native menu shows
  }, []);

  return (
    <div ref={wrapperRef} className="w-full min-h-screen">
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
            <ContextMenuSubContent>
              {items.map((item) => (
                <ContextMenuItem
                  key={item.url}
                  onSelect={() => router.push(item.url)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem onSelect={handleOpenLegacyMenu}>
            <MonitorDot className="h-4 w-4" />
            Legacy Menu (right-click again)
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}