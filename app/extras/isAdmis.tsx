'use client'
import { useUser } from "@clerk/nextjs";

export function useIsAdmin() {
    const { isLoaded, isSignedIn, user } = useUser();
    return user?.publicMetadata?.role === "admin";
}

export const isAdmin = (user: any) => {
    return user?.publicMetadata?.role === "admin";
}