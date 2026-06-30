"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { RiSearch2Line, RiHeartLine, RiHeartFill, RiLoaderLine } from "react-icons/ri";
import { stockApi } from "@/entities/stock";
import { userApi } from "@/entities/user";
import { StockLogo, Skeleton } from "@/shared/ui";
import { formatPrice } from "@/shared/lib/format";
import { getStockInfo } from "@/shared/data/stockMaster";
import type { StockResponse } from "@/entities/stock";
import styles from "./page.module.css";

export default function StocksPage() {
  const [keyword, setKeyword] = useState("");
  const [stocks, setStocks] = useState<StockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(0);
  const keywordRef = useRef("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchStocks = useCallback((kw: string, page: number, append: boolean) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    stockApi
      .getStockList(kw, page)
      .then((res) => {
        setStocks((prev) => append ? [...prev, ...res.content] : res.content);
        setIsLast(res.isLast || res.content.length === 0);
        pageRef.current = page;
      })
      .catch(() => { if (!append) setStocks([]); })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    userApi.getWatchlist().then((items) => {
      setWatchlist(new Set(items.map((i) => i.stockCode)));
    }).catch(() => {});
    fetchStocks("", 0, false);
  }, [fetchStocks]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !isLast) {
          fetchStocks(keywordRef.current, pageRef.current + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchStocks, loadingMore, isLast]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    keywordRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStocks(value, 0, false), 400);
  };

  const toggleWatchlist = async (ticker: string) => {
    if (watchlist.has(ticker)) {
      setWatchlist((prev) => { const next = new Set(prev); next.delete(ticker); return next; });
      await userApi.removeWatchlist(ticker).catch(() => {
        setWatchlist((prev) => new Set(prev).add(ticker));
      });
    } else {
      setWatchlist((prev) => new Set(prev).add(ticker));
      await userApi.addWatchlist(ticker).catch(() => {
        setWatchlist((prev) => { const next = new Set(prev); next.delete(ticker); return next; });
      });
    }
  };

  return (
    <div className="app-page">
      <div className={styles.header}>
        <h1 className={styles.title}>투자</h1>
        <div className={styles.searchBar}>
          <RiSearch2Line size={18} color="var(--color-text-muted)" />
          <input
            className={styles.searchInput}
            placeholder="종목명 또는 코드 검색"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.stockList}>
        <div className={styles.sectionRow}>
          <span className={styles.sectionLabel}>국내 주식</span>
        </div>
        <div className={styles.stockCard}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skelRow}>
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div className={styles.skelInfo}>
                  <Skeleton width={90} height={14} />
                  <Skeleton width={50} height={11} />
                </div>
                <Skeleton width={72} height={15} />
              </div>
            ))
          ) : stocks.length === 0 ? (
            <p className={styles.empty}>검색 결과가 없습니다</p>
          ) : (
            stocks.map((stock) => (
              <div key={stock.ticker} className={styles.stockRow}>
                <Link href={`/main/stocks/${stock.ticker}`} className={styles.stockMain}>
                  <div className={styles.stockLeft}>
                    <StockLogo code={stock.ticker} name={stock.name} size={42} />
                    <div>
                      <p className={styles.stockName}>{stock.name}</p>
                      <div className={styles.tickerRow}>
                        {(() => {
                          const market = getStockInfo(stock.ticker)?.market;
                          return market ? <span className={styles.marketBadge}>{market}</span> : null;
                        })()}
                        <span className={styles.stockTicker}>{stock.ticker}</span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.stockPrice}>{formatPrice(stock.price)}</p>
                </Link>
                <button
                  className={styles.favBtn}
                  onClick={() => toggleWatchlist(stock.ticker)}
                  aria-label={watchlist.has(stock.ticker) ? "관심 해제" : "관심 추가"}
                >
                  {watchlist.has(stock.ticker)
                    ? <RiHeartFill size={20} color="var(--color-up)" />
                    : <RiHeartLine size={20} color="var(--color-text-muted)" />}
                </button>
              </div>
            ))
          )}
        </div>
        <div ref={sentinelRef} className={styles.sentinel} />
        {loadingMore && stocks.length > 0 && (
          <div className={styles.loadingMore}>
            <RiLoaderLine size={18} className={styles.spinner} />
            <span>불러오는 중</span>
          </div>
        )}
      </div>
    </div>
  );
}
