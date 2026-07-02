import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

interface Props {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
}

function toPx(v: number | string): string {
  return typeof v === "number" ? `${v}px` : v;
}

export function Skeleton({ className, width, height, borderRadius }: Props) {
  return (
    <div
      className={[styles.skeleton, className ?? ""].join(" ")}
      style={{
        ...(width !== undefined && { "--skeleton-width": toPx(width) }),
        ...(height !== undefined && { "--skeleton-height": toPx(height) }),
        ...(borderRadius !== undefined && { "--skeleton-radius": toPx(borderRadius) }),
      } as CSSProperties}
    />
  );
}
