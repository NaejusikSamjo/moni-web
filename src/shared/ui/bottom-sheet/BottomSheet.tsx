"use client";

import type { ReactNode } from "react";
import styles from "./BottomSheet.module.css";

interface Props {
  open: boolean;
  closing?: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, closing = false, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div
      className={[styles.overlay, closing ? styles.overlayClosing : ""].join(" ")}
      onClick={onClose}
    >
      <div
        className={[styles.sheet, closing ? styles.sheetClosing : ""].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} />
        {title && <h2 className={styles.title}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
