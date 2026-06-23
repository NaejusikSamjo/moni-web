import styles from "./Skeleton.module.css";

interface Props {
  className?: string;
}

export function Skeleton({ className }: Props) {
  return <div className={[styles.skeleton, className ?? ""].join(" ")} />;
}
