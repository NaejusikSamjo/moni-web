import type { ReactNode } from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "up" | "down" | "neutral" | "primary" | "ai";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant]].join(" ")}>
      {children}
    </span>
  );
}
