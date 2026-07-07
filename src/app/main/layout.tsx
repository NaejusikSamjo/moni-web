"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth";
import { NotificationProvider } from "@/features/notification";
import { BottomNav } from "@/widgets/bottom-nav/BottomNav";
import { OnboardingGuide } from "@/widgets/onboarding-guide/OnboardingGuide";

const HIDE_NAV_PATHS = [
  "/main/portfolio/history",
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  const showNav = !HIDE_NAV_PATHS.some((p) => pathname.startsWith(p));

  return (
    <NotificationProvider>
      <div className="page-content">
        {children}
      </div>
      {showNav && <BottomNav />}
      <OnboardingGuide />
    </NotificationProvider>
  );
}
