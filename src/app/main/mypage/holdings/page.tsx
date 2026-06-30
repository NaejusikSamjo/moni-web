"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiLoaderLine } from "react-icons/ri";
import { tradeApi } from "@/entities/trade";
import { stockApi } from "@/entities/stock";
import { Skeleton, StockLogo } from "@/shared/ui";
import { formatPrice, formatChangeRate } from "@/shared/lib/format";
import { getStockInfo } from "@/shared/data/stockMaster";
import type { HoldingResponse, TradeResponse } from "@/entities/trade";
import styles from "./page.module.css";

interface EnrichedHolding extends HoldingResponse {
  stockName: string;
  currentPrice: number;
  evaluationAmount: number;
  profitAmount: number;
  profitRate: number;
}

const TRADE_TYPE_LABEL: Record<string, string> = { BUY: "매수", SELL: "매도" };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${min}`;
}

export default function HoldingsPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [holdingsRes, tradesRes] = await Promise.allSettled([
          tradeApi.getHoldings(0, 50),
          tradeApi.getTrades(0, 30),
        ]);

        const rawHoldings = holdingsRes.status === "fulfilled" ? holdingsRes.value.content : [];
        const rawTrades = tradesRes.status === "fulfilled" ? tradesRes.value.content : [];
        setTrades(rawTrades);

        if (rawHoldings.length === 0) { setHoldings([]); return; }

        const stockResults = await Promise.allSettled(
          rawHoldings.map((h) => stockApi.getStockDetail(h.ticker))
        );

        setHoldings(
          rawHoldings.map((h, i) => {
            const detail = stockResults[i].status === "fulfilled" ? stockResults[i].value : null;
            const currentPrice = detail?.price ?? h.averagePrice;
            const evaluationAmount = currentPrice * h.quantity;
            const profitAmount = (currentPrice - h.averagePrice) * h.quantity;
            const profitRate = h.averagePrice > 0
              ? ((currentPrice - h.averagePrice) / h.averagePrice) * 100
              : 0;
            return {
              ...h,
              stockName: detail?.name ?? h.ticker,
              currentPrice,
              evaluationAmount,
              profitAmount,
              profitRate,
            };
          })
        );
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  const totalEvaluation = holdings.reduce((s, h) => s + h.evaluationAmount, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <RiArrowLeftLine size={22} />
        </button>
      </header>

      {/* 총 금액 */}
      <section className={styles.totalCard}>
        <p className={styles.totalLabel}>내 주식</p>
        {loading ? (
          <Skeleton width={160} height={34} />
        ) : (
          <p className={styles.totalValue}>{formatPrice(totalEvaluation)}</p>
        )}
      </section>

      {/* 보유 종목 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>국내 주식</h2>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skelRow}>
                <Skeleton width={42} height={42} borderRadius="50%" />
                <div className={styles.skelInfo}>
                  <Skeleton width={100} height={15} />
                  <Skeleton width={50} height={12} />
                </div>
                <div className={styles.skelRight}>
                  <Skeleton width={80} height={15} />
                  <Skeleton width={60} height={12} />
                </div>
              </div>
            ))}
            <div className={styles.loadingMore}>
              <RiLoaderLine size={18} className={styles.spinner} />
              <span>불러오는 중</span>
            </div>
          </>
        ) : holdings.length === 0 ? (
          <p className={styles.empty}>보유 종목이 없습니다</p>
        ) : (
          <div className={styles.holdingList}>
            {holdings.map((h) => {
              const rateClass = h.profitRate > 0 ? styles.up : h.profitRate < 0 ? styles.down : "";
              const market = getStockInfo(h.ticker)?.market;
              return (
                <Link key={h.id} href={`/main/stocks/${h.ticker}`} className={styles.holdingItem}>
                  <StockLogo code={h.ticker} name={h.stockName} size={42} />
                  <div className={styles.holdingInfo}>
                    <p className={styles.holdingName}>{h.stockName}</p>
                    <div className={styles.holdingMeta}>
                      {market && <span className={styles.marketBadge}>{market}</span>}
                      <span>{h.quantity}주</span>
                    </div>
                  </div>
                  <div className={styles.holdingRight}>
                    <p className={styles.holdingValue}>{formatPrice(h.evaluationAmount)}</p>
                    <p className={[styles.holdingRate, rateClass].join(" ")}>
                      {h.profitAmount >= 0 ? "+" : ""}
                      {formatPrice(Math.round(Math.abs(h.profitAmount)))} ({formatChangeRate(h.profitRate)})
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 거래 내역 */}
      {!loading && trades.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>거래 내역</h2>
          <div className={styles.tradeList}>
            {trades.map((t) => {
              const isBuy = t.tradeType === "BUY";
              return (
                <div key={t.id} className={styles.tradeItem}>
                  <div className={styles.tradeLeft}>
                    <span className={[styles.tradeBadge, isBuy ? styles.tradeBuy : styles.tradeSell].join(" ")}>
                      {TRADE_TYPE_LABEL[t.tradeType] ?? t.tradeType}
                    </span>
                    <div>
                      <p className={styles.tradeTicker}>{t.ticker}</p>
                      <p className={styles.tradeDate}>{formatDateTime(t.createdAt)}</p>
                    </div>
                  </div>
                  <div className={styles.tradeRight}>
                    <p className={styles.tradeAmount}>{formatPrice(t.totalAmount)}</p>
                    <p className={styles.tradeMeta}>{t.quantity}주 · {formatPrice(t.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className={styles.bottomPad} />
    </div>
  );
}
