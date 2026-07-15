import type { User } from "@clerk/nextjs/server";

export function isAdmin(user: User | null) {
  return user?.publicMetadata?.role === "admin";
}