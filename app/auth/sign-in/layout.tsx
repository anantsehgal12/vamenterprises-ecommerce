import { Metadata } from "next";
import type { ReactNode } from "react";


export const metadata: Metadata = {
  title: "Sign In | VAM Enterprises",
};

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}