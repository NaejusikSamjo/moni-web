"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// ssr: false → 서버에서 렌더하지 않으므로 hydration mismatch 없음
const PwaGuardOverlay = dynamic(
  () => import("./PwaGuardOverlay").then((m) => m.PwaGuardOverlay),
  { ssr: false }
);

export function PwaGuard({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PwaGuardOverlay />
    </>
  );
}
