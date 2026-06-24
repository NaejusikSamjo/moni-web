import styles from "./Skeleton.module.css";

interface Props {
  className?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
}

export function Skeleton({ className, width, height, borderRadius }: Props) {
  return (
    <div
      className={[styles.skeleton, className ?? ""].join(" ")}
      style={{
        width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
        borderRadius: borderRadius !== undefined ? (typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius) : undefined,
      }}
    />
  );
}
