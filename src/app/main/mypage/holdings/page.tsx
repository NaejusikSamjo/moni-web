"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiLoaderLine } from "react-icons/ri";
import { tradeApi } from "@/entities/trade";
import { portfolioApi } from "@/entities/portfolio";
import { Skeleton, StockLogo } from "@/shared/ui";
import { formatPrice, formatChangeRate } from "@/shared/lib/format";
import { getStockInfo } from "@/shared/data/stockMaster";
import type { TradeResponse, ReservedOrderResponse, ReservedOrderStatus } from "@/entities/trade";
import type { PortfolioHoldingItem } from "@/entities/portfolio";
import styles from "./page.module.css";

const TRADE_TYPE_LABEL: Record<string, string> = { BUY: "매수", SELL: "매도" };
const RESERVED_ORDER_TYPE_LABEL: Record<string, string> = { LIMIT: "지정가", RESERVATION: "예약" };
const RESERVED_STATUS_LABEL: Record<ReservedOrderStatus, string> = {
  PENDING: "대기",
  EXECUTED: "체결",
  CANCELLED: "취소",
  FAILED: "실패",
};

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
  const [holdings, setHoldings] = useState<PortfolioHoldingItem[]>([]);
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [reservedOrders, setReservedOrders] = useState<ReservedOrderResponse[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradePage, setTradePage] = useState(0);
  const [tradeIsLast, setTradeIsLast] = useState(true);
  const [tradeLoadingMore, setTradeLoadingMore] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [holdingsRes, tradesRes, reservedRes] = await Promise.allSettled([
          portfolioApi.getHoldings(0, 50),
          tradeApi.getTrades(0, 30),
          tradeApi.getReservedOrders(),
        ]);

        setHoldings(holdingsRes.status === "fulfilled" ? holdingsRes.value.content : []);
        if (tradesRes.status === "fulfilled") {
          setTrades(tradesRes.value.content);
          setTradePage(tradesRes.value.pageNumber);
          setTradeIsLast(tradesRes.value.isLast);
        }
        setReservedOrders(reservedRes.status === "fulfilled" ? reservedRes.value : []);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  const totalEvaluation = holdings.reduce((s, h) => s + h.evaluationAmount, 0);

  const handleCancelReserved = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await tradeApi.cancelReservedOrder(orderId);
      setReservedOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally {
      setCancellingId(null);
    }
  };

  const handleLoadMoreTrades = async () => {
    setTradeLoadingMore(true);
    try {
      const next = tradePage + 1;
      const res = await tradeApi.getTrades(next, 30);
      setTrades((prev) => [...prev, ...res.content]);
      setTradePage(res.pageNumber);
      setTradeIsLast(res.isLast);
    } finally {
      setTradeLoadingMore(false);
    }
  };

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
                <Link key={h.ticker} href={`/main/stocks/${h.ticker}`} className={styles.holdingItem}>
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
                      {h.profitLoss >= 0 ? "+" : ""}
                      {formatPrice(Math.round(Math.abs(h.profitLoss)))} ({formatChangeRate(h.profitRate)})
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 예약 주문 */}
      {!loading && reservedOrders.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>예약 주문</h2>
          <div className={styles.tradeList}>
            {reservedOrders.map((o) => {
              const isBuy = o.tradeType === "BUY";
              const isPending = o.status === "PENDING";
              const stockInfo = getStockInfo(o.ticker);
              return (
                <div key={o.id} className={styles.reservedItem}>
                  <div className={styles.tradeLeft}>
                    <span className={[styles.tradeBadge, isBuy ? styles.tradeBuy : styles.tradeSell].join(" ")}>
                      {TRADE_TYPE_LABEL[o.tradeType]}
                    </span>
                    <div>
                      <p className={styles.tradeTicker}>{stockInfo?.name ?? o.ticker}</p>
                      <p className={styles.tradeDate}>
                        {RESERVED_ORDER_TYPE_LABEL[o.orderType]}
                        {o.targetPrice != null && ` · 목표가 ${formatPrice(o.targetPrice)}`}
                      </p>
                    </div>
                  </div>
                  <div className={styles.reservedRight}>
                    <span className={[styles.reservedStatus, styles[`reservedStatus${o.status}`]].join(" ")}>
                      {RESERVED_STATUS_LABEL[o.status]}
                    </span>
                    {isBuy && o.amount != null && (
                      <p className={styles.tradeMeta}>{formatPrice(o.amount)}</p>
                    )}
                    {!isBuy && o.quantity != null && (
                      <p className={styles.tradeMeta}>{o.quantity}주</p>
                    )}
                    {isPending && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => void handleCancelReserved(o.id)}
                        disabled={cancellingId === o.id}
                      >
                        {cancellingId === o.id ? "취소 중" : "취소"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 거래 내역 */}
      {!loading && trades.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>거래 내역</h2>
          <div className={styles.tradeList}>
            {trades.map((t) => {
              const isBuy = t.tradeType === "BUY";
              const stockInfo = getStockInfo(t.ticker);
              return (
                <div key={t.id} className={styles.tradeItem}>
                  <div className={styles.tradeLeft}>
                    <span className={[styles.tradeBadge, isBuy ? styles.tradeBuy : styles.tradeSell].join(" ")}>
                      {TRADE_TYPE_LABEL[t.tradeType] ?? t.tradeType}
                    </span>
                    <div>
                      <p className={styles.tradeTicker}>{stockInfo?.name ?? t.ticker}</p>
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
          {!tradeIsLast && (
            <button
              className={styles.loadMoreBtn}
              onClick={() => void handleLoadMoreTrades()}
              disabled={tradeLoadingMore}
            >
              {tradeLoadingMore
                ? <RiLoaderLine size={16} className={styles.spinner} />
                : "더보기"}
            </button>
          )}
        </section>
      )}

      <div className={styles.bottomPad} />
    </div>
  );
}
