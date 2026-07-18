"use client";

import {
  Bell,
  CirclePlus,
  Home,
  Inbox,
  Megaphone,
  Package,
  Percent,
  Search,
  Settings,
  ShoppingCart,
  Tag,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const logo = "https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png";

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
    title: "Custom Cart",
    url: "/seller-dashboard/custom-orders",
    icon: ShoppingCart,
  },
  {
    title: "Create Custom Cart",
    url: "/seller-dashboard/custom-orders/new",
    icon: CirclePlus,
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="
        
      "
    >
      {/* SIDEBAR HEADER */}

      <SidebarHeader>
        <Link href="/seller-dashboard">
          <div
            className="
        relative overflow-hidden
        rounded-[1.8rem]
        border border-white/10
        bg-gradient-to-br
        from-[#4ca626]/15
        via-[#161616]
        to-[#111111]

        transition-all duration-300

        hover:border-[#4ca626]/30
        hover:shadow-xl
        hover:shadow-[#4ca626]/10

        group-data-[collapsible=icon]:rounded-2xl
        group-data-[collapsible=icon]:p-0
        group-data-[collapsible=icon]:border-none
        group-data-[collapsible=icon]:bg-transparent
        group-data-[collapsible=icon]:shadow-none
      "
          >
            {/* BACKGROUND GLOW ONLY WHEN OPEN */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4ca62625,transparent_40%)] group-data-[collapsible=icon]:hidden" />

            <div
              className="
          relative flex items-center gap-3
          p-4

          group-data-[collapsible=icon]:justify-center
          group-data-[collapsible=icon]:p-0
        "
            >
              {/* LOGO */}

              <div
                className="
            flex items-center justify-center
            rounded-2xl
            bg-black/20
            border border-white/5
            shadow-lg

            h-15 w-15

            transition-all duration-300

            group-data-[collapsible=icon]:h-15
            group-data-[collapsible=icon]:w-15
            group-data-[collapsible=icon]:rounded-2xl
            group-data-[collapsible=icon]:border-none
            group-data-[collapsible=icon]:shadow-xl
            group-data-[collapsible=icon]:shadow-black/30
          "
              >
                <Image
                  src={logo}
                  alt="VAM Enterprises Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>

              {/* TEXT */}

              <div
                className="
            min-w-0
            transition-all duration-200

            group-data-[collapsible=icon]:hidden
          "
              >
                <h1 className="text-[1.05rem] font-black leading-none tracking-tight text-white">
                  VAM Enterprises
                </h1>

                <p className="mt-1 text-xs font-medium text-zinc-400">
                  Seller Dashboard
                </p>
              </div>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* CONTENT */}

      <SidebarContent className="px-1 py-4 ">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => {
                const isActive =
                  item.url === "/seller-dashboard"
                    ? pathname === item.url
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={`
                        relative
                        h-12
                        rounded-2xl
                        px-3

                        transition-all duration-200

                        hover:bg-[#4ca626]/10
                        hover:text-[#7ddc56]

                        data-[active=true]:bg-[#4ca626]
                        data-[active=true]:text-white
                        data-[active=true]:shadow-lg
                        data-[active=true]:shadow-[#4ca626]/20

                        group-data-[collapsible=icon]:h-12
                        group-data-[collapsible=icon]:w-12
                        group-data-[collapsible=icon]:justify-center
                        group-data-[collapsible=icon]:rounded-2xl
                        group-data-[collapsible=icon]:p-0
                      `}
                    >
                      <Link
                        href={item.url}
                        className="
                          flex items-center gap-3
                          overflow-hidden
                        "
                      >
                        {/* ICON */}

                        <div
                          className="
                            flex items-center justify-center
                            shrink-0

                            h-9 w-9
                            rounded-xl

                            transition-all duration-200

                            

                            group-data-[collapsible=icon]:h-10
                            group-data-[collapsible=icon]:w-10
                          "
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                        </div>

                        {/* LABEL */}

                        <span
                          className="
                            font-medium
                            tracking-wide
                            whitespace-nowrap

                            transition-all duration-200

                            group-data-[collapsible=icon]:hidden
                          "
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
