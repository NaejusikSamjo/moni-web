"use client";

import { useState, type CSSProperties } from "react";
import styles from "./StockLogo.module.css";

interface StockLogoProps {
  code: string;
  name: string;
  size?: number;
}

export function StockLogo({ code, name, size = 40 }: StockLogoProps) {
  const [showAvatar, setShowAvatar] = useState(false);

  if (showAvatar) {
    return (
      <div
        className={styles.avatar}
        style={{ "--logo-size": `${size}px`, "--logo-font": `${size * 0.38}px` } as CSSProperties}
        aria-label={name}
      >
        {name[0]}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/stock-logo/${code}`}
      alt={name}
      width={size}
      height={size}
      className={styles.img}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 1) setShowAvatar(true);
      }}
      onError={() => setShowAvatar(true)}
    />
  );
}
