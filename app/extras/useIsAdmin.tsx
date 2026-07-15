"use client";

import { useUser } from "@clerk/nextjs";

export function useIsAdmin() {
  const { user } = useUser();
  return user?.publicMetadata?.role === "admin";
}