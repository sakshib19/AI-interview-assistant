"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext"; // Adjust path if needed
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define routes that ANYONE can access without being logged in
  const publicRoutes = ["/", "/Auth/login", "/Auth/signup"];

  useEffect(() => {
    // Don't do anything until we finish checking localStorage
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!token && !isPublicRoute) {
      // 1. User is NOT logged in and trying to access a protected page
      router.replace("/Auth/login");
    } else if (token && (pathname === "/Auth/login" || pathname === "/Auth/signup")) {
      // 2. User IS logged in but trying to access login/signup -> send to dashboard
      router.replace("/interview");
    }
  }, [token, loading, pathname, router]);

  // Show a loading state that matches your dark theme while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#cbe557]" />
      </div>
    );
  }

  // Prevent rendering the protected page content before the redirect fires
  const isPublicRoute = publicRoutes.includes(pathname);
  if (!token && !isPublicRoute) {
    return null; 
  }

  return <>{children}</>;
}