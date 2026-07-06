"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiHeartFill, RiLoaderLine } from "react-icons/ri";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import { Skeleton, StockLogo } from "@/shared/ui";
import { userApi } from "@/features/auth";
import { stockApi } from "@/entities/stock";
import { getStockName, getStockInfo } from "@/shared/data/stockMaster";
import { formatPrice } from "@/shared/lib/format";
import type { WatchlistResponse } from "@/entities/user";
import styles from "./page.module.css";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistResponse[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    userApi.getWatchlist()
      .then(async (list) => {
        setItems(list);
        if (list.length === 0) return;
        const results = await Promise.allSettled(
          list.map((item) => stockApi.getStockDetail(item.stockCode))
        );
        const priceMap: Record<string, number> = {};
        const nameMap: Record<string, string> = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            if (r.value.price != null) priceMap[list[i].stockCode] = r.value.price;
            nameMap[list[i].stockCode] = r.value.name;
          }
        });
        setPrices(priceMap);
        setNames(nameMap);
      })
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

      <div className={styles.stockList}>
        <div className={styles.sectionRow}>
          <span className={styles.sectionLabel}>국내 주식</span>
        </div>
        <div className={styles.stockCard}>
          {loading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.skelRow}>
                  <Skeleton width={42} height={42} borderRadius="50%" />
                  <div className={styles.skelInfo}>
                    <Skeleton width={100} height={14} />
                    <Skeleton width={60} height={11} />
                  </div>
                  <Skeleton width={72} height={15} />
                </div>
              ))}
              <div className={styles.loadingMore}>
                <RiLoaderLine size={18} className={styles.spinner} />
                <span>불러오는 중</span>
              </div>
            </>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <RiHeartFill size={40} className={styles.emptyIcon} />
              <p className={styles.emptyText}>관심 종목이 없습니다</p>
              <p className={styles.emptyDesc}>종목 검색에서 하트를 눌러 추가해보세요</p>
            </div>
          ) : (
            items.map((item) => {
              const info = getStockInfo(item.stockCode);
              const name = names[item.stockCode] ?? info?.name ?? getStockName(item.stockCode);
              const price = prices[item.stockCode];

              return (
                <div key={item.id} className={styles.stockRow}>
                  <Link href={`/main/stocks/${item.stockCode}`} className={styles.stockMain}>
                    <div className={styles.stockLeft}>
                      <StockLogo code={item.stockCode} name={name} size={42} />
                      <div>
                        <p className={styles.stockName}>{name}</p>
                        <div className={styles.tickerRow}>
                          {info?.market && (
                            <span className={styles.marketBadge}>
                              {info.market}
                            </span>
                          )}
                          <span className={styles.stockTicker}>{item.stockCode}</span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.stockPrice}>
                      {price !== undefined ? formatPrice(price) : "-"}
                    </p>
                  </Link>
                  <button
                    className={styles.favBtn}
                    onClick={() => handleRemove(item)}
                    disabled={removingIds.has(item.id)}
                    aria-label="관심종목 삭제"
                  >
                    <RiHeartFill size={20} color="var(--color-up)" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
