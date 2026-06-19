import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | VAM Enterprises",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
      {children}
  );
}
