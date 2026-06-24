"use client";

import { useState } from "react";
import { STOCK_LOGO_BASE_URL } from "@/shared/config/env";
import styles from "./StockLogo.module.css";

interface StockLogoProps {
  code: string;
  name: string;
  size?: number;
}

export function StockLogo({ code, name, size = 40 }: StockLogoProps) {
  const [error, setError] = useState(false);

  if (STOCK_LOGO_BASE_URL && !error) {
    return (
      <img
        src={`${STOCK_LOGO_BASE_URL}${code}.svg`}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "contain" }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {name[0]}
    </div>
  );
}
