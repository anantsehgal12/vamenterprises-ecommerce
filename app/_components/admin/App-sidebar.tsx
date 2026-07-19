"use client";

import {
  Bell,
  CirclePlus,
  ChevronRight,
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "./nav-user";

const logo = "https://i.ibb.co/6785v806/VAM-Enterprises-Logo.png";

// Standalone top-level links
const topLinks = [{ title: "Dashboard", url: "/seller-dashboard", icon: Home }];

// Grouped links — collapsible sections for related items
const groups = [
  {
    label: "Catalog",
    icon: Package,
    items: [
      { title: "Products", url: "/seller-dashboard/products", icon: Inbox },
      { title: "Inventory", url: "/seller-dashboard/inventory", icon: Package },
      { title: "Add Product", url: "/seller-dashboard/add-product", icon: CirclePlus },
      { title: "Categories", url: "/seller-dashboard/categories", icon: Tag },
    ],
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    items: [
      { title: "Orders", url: "/seller-dashboard/orders", icon: ShoppingCart },
      { title: "Create Order [POS]", url: "/seller-dashboard/create-order", icon: ShoppingCart },
      { title: "Custom Cart", url: "/seller-dashboard/custom-orders", icon: ShoppingCart },
      { title: "Create Custom Cart", url: "/seller-dashboard/custom-orders/new", icon: CirclePlus },
      { title: "Coupons", url: "/seller-dashboard/coupons", icon: Percent },
    ],
  },
  {
    label: "Engage",
    icon: Megaphone,
    items: [
      { title: "Notifications", url: "/seller-dashboard/notifications", icon: Bell },
      { title: "Announcements", url: "/seller-dashboard/announcements", icon: Megaphone },
    ],
  },
];

// Standalone bottom-level links
const bottomLinks = [
  { title: "Search", url: "/seller-dashboard/search", icon: Search },
  { title: "Settings", url: "/seller-dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (url: string) =>
    url === "/seller-dashboard" ? pathname === url : pathname.startsWith(url);

  const renderLink = (item: { title: string; url: string; icon: any }) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={active}
          className="
            group/item relative h-12 rounded-2xl px-3
            transition-all duration-200
            hover:bg-[#4ca626]/10 hover:text-[#7ddc56]
            data-[active=true]:border data-[active=true]:border-[#4ca626]/30
            data-[active=true]:bg-gradient-to-r
            data-[active=true]:from-[#4ca626]
            data-[active=true]:to-[#3d8a1f]
            data-[active=true]:text-white
            data-[active=true]:shadow-lg
            data-[active=true]:shadow-[#4ca626]/25
            group-data-[collapsible=icon]:h-12
            group-data-[collapsible=icon]:w-12
            group-data-[collapsible=icon]:justify-center
            group-data-[collapsible=icon]:rounded-2xl
            group-data-[collapsible=icon]:p-0
          "
        >
          <Link href={item.url} className="flex items-center gap-3 overflow-hidden">
            {/* active indicator bar */}
            <span
              className={`
                absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full
                bg-white transition-all duration-200
                ${active ? "opacity-90" : "opacity-0"}
                group-data-[collapsible=icon]:hidden
              `}
            />
            <div
              className="
                flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                transition-all duration-200
                group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10
              "
            >
              <item.icon className="h-5 w-5 shrink-0" />
            </div>
            <span
              className="
                whitespace-nowrap font-medium tracking-wide
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
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* SIDEBAR HEADER */}
      <SidebarHeader>
        <Link href="/seller-dashboard">
          <div
            className="
              group relative overflow-hidden rounded-[1.8rem]
              border border-white/10
              bg-gradient-to-br from-[#4ca626]/15 via-[#161616] to-[#111111]
              transition-all duration-300
              hover:border-[#4ca626]/30 hover:shadow-xl hover:shadow-[#4ca626]/10
              group-data-[collapsible=icon]:rounded-2xl
              group-data-[collapsible=icon]:border-none
              group-data-[collapsible=icon]:bg-transparent
              group-data-[collapsible=icon]:p-0
              group-data-[collapsible=icon]:shadow-none
            "
          >
            {/* animated glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4ca62630,transparent_45%)] transition-opacity duration-500 group-hover:opacity-100 group-data-[collapsible=icon]:hidden" />
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#4ca626]/10 blur-2xl group-data-[collapsible=icon]:hidden" />

            <div className="relative flex items-center gap-3 p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
              <div
                className="
                  flex h-15 w-15 items-center justify-center rounded-2xl
                  border border-white/5 bg-black/20 shadow-lg
                  transition-all duration-300
                  group-data-[collapsible=icon]:h-15 group-data-[collapsible=icon]:w-15
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

              <div className="min-w-0 transition-all duration-200 group-data-[collapsible=icon]:hidden">
                <h1 className="font-serif text-[1.05rem] font-black leading-none tracking-tight text-white">
                  VAM Enterprises
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ca626] shadow-[0_0_6px_#4ca626]" />
                  Seller Dashboard
                </p>
              </div>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="px-1 py-4">
        {/* Standalone top links */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">{topLinks.map(renderLink)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible groups */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {groups.map((group) => {
                const groupActive = group.items.some((item) => isActive(item.url));
                return (
                  <Collapsible key={group.label} defaultOpen={groupActive} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={`
                            h-12 rounded-2xl px-3 font-medium tracking-wide
                            text-zinc-300
                            transition-all duration-200
                            hover:bg-[#4ca626]/10 hover:text-[#7ddc56]
                            ${groupActive ? "bg-white/[0.03] text-white" : ""}
                          `}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                            <group.icon className="h-5 w-5 shrink-0" />
                          </div>
                          <span className="group-data-[collapsible=icon]:hidden">{group.label}</span>
                          <ChevronRight
                            className="
                              ml-auto h-4 w-4 shrink-0 text-zinc-500
                              transition-transform duration-200
                              group-data-[state=open]/collapsible:rotate-90
                              group-data-[collapsible=icon]:hidden
                            "
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <SidebarMenuSub className="mr-0 border-l border-white/10 pl-3">
                          {group.items.map((item) => {
                            const active = isActive(item.url);
                            return (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={active}
                                  className="
                                    h-10 rounded-xl px-3
                                    transition-all duration-200
                                    hover:bg-[#4ca626]/10 hover:text-[#7ddc56]
                                    data-[active=true]:bg-[#4ca626]/15
                                    data-[active=true]:text-[#7ddc56]
                                    data-[active=true]:font-medium
                                  "
                                >
                                  <Link href={item.url} className="flex items-center gap-2.5">
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    <span className="whitespace-nowrap">{item.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Standalone bottom links */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {bottomLinks.map(renderLink)}
              <NavUser />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}