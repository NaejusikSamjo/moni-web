import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

interface Props {
  title: string;
  subtitle?: string;
  rightNode?: ReactNode;
}

export function PageHeader({ title, subtitle, rightNode }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {rightNode && <div className={styles.right}>{rightNode}</div>}
    </header>
  );
}
