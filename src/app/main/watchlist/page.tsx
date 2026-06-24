"use client";

import { useEffect, useState } from "react";
import { RiHeartFill } from "react-icons/ri";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import { Skeleton } from "@/shared/ui";
import { StockLogo } from "@/shared/ui";
import { userApi } from "@/features/auth";
import { getStockName, getStockInfo } from "@/shared/data/stockMaster";
import type { WatchlistResponse } from "@/entities/user";
import styles from "./page.module.css";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    userApi.getWatchlist()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (item: WatchlistResponse) => {
    setRemovingIds((prev) => new Set(prev).add(item.id));
    try {
      await userApi.removeWatchlist(item.stockCode);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className="app-page">
      <PageHeader title="관심종목" />

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton width={44} height={44} borderRadius="50%" />
              <div className={styles.skeletonText}>
                <Skeleton width={100} height={16} />
                <Skeleton width={60} height={13} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <RiHeartFill size={40} className={styles.emptyIcon} />
          <p className={styles.emptyText}>관심 종목이 없습니다</p>
          <p className={styles.emptyDesc}>종목 검색에서 하트를 눌러 추가해보세요</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const info = getStockInfo(item.stockCode);
            const name = info?.name ?? getStockName(item.stockCode);
            const market = info?.market;

            return (
              <li key={item.id} className={styles.row}>
                <StockLogo code={item.stockCode} name={name} size={44} />
                <div className={styles.info}>
                  <span className={styles.name}>{name}</span>
                  <div className={styles.meta}>
                    <span className={styles.code}>{item.stockCode}</span>
                    {market && <span className={styles.market}>{market}</span>}
                  </div>
                </div>
                <div className={styles.right}>
                  <span className={styles.price}>-</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(item)}
                    disabled={removingIds.has(item.id)}
                    aria-label="관심종목 삭제"
                  >
                    <RiHeartFill size={20} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
