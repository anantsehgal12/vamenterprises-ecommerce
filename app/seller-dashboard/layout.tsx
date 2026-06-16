import { SidebarInset } from "@/components/ui/sidebar";
import { Metadata } from "next";
import ContMenu from "../_components/admin/Context-Menu";

export const metadata: Metadata = {
  title: "Seller Dashboard - VAM Enterprises",
  description:
    "Manage your products, view sales, and update your profile in the seller dashboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ContMenu>
      {children}
    </ContMenu>
  );
}
