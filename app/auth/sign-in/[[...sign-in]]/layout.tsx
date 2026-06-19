import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | VAM Enterprises",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
      {children}
  );
}
