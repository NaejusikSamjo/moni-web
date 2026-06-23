"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth";
import { BottomNav } from "@/widgets/bottom-nav/BottomNav";
import { OnboardingGuide } from "@/widgets/onboarding-guide/OnboardingGuide";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <div className="page-content">
        {children}
      </div>
      <BottomNav />
      <OnboardingGuide />
    </>
  );
}
