"use client";

import { useState, useEffect, useRef, use, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiHeartLine, RiHeartFill } from "react-icons/ri";
import { stockApi, StockChart } from "@/entities/stock";
import { tradeApi } from "@/entities/trade";
import { aiApi } from "@/entities/ai";
import { userApi } from "@/entities/user";
import { getStockInfo } from "@/shared/data/stockMaster";
import { formatPrice } from "@/shared/lib/format";
import { Badge, Button, MarkdownText, StockLogo } from "@/shared/ui";
import { ApiException } from "@/shared/api/types";
import type { StockResponse, ChartIndex, CandleData } from "@/entities/stock";
import type { CompanyIssueResponse } from "@/entities/ai";
import styles from "./page.module.css";

interface Props { params: Promise<{ id: string }> }

const CHART_TABS: { label: string; index: ChartIndex }[] = [
  { label: "1분", index: "MIN_1" },
  { label: "3분", index: "MIN_3" },
  { label: "5분", index: "MIN_5" },
  { label: "10분", index: "MIN_10" },
  { label: "30분", index: "MIN_30" },
  { label: "60분", index: "MIN_60" },
];

export default function StockDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [stock, setStock] = useState<StockResponse | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartIndex>("MIN_1");
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<CompanyIssueResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<"loading" | "done" | "unsupported">("loading");
  const [isLive, setIsLive] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [qty, setQty] = useState("1");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const aiCalledRef = useRef(false);

  const isMarketOpen = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const total = h * 60 + m;
    return total >= 9 * 60 && total < 18 * 60;
  };

  useEffect(() => {
    setStockLoading(true);
    stockApi.getStockDetail(id)
      .then(setStock)
      .catch(() => setStock(null))
      .finally(() => setStockLoading(false));

    setAiStatus("loading");
    setAiAnalysis(null);
    if (!aiCalledRef.current) {
      aiCalledRef.current = true;
      aiApi.getIssueAnalysis(id)
        .then(async (res) => {
          if (res) {
            setAiAnalysis(res);
            setAiStatus("done");
          } else {
            try {
              const created = await aiApi.createIssueAnalysis(id);
              setAiAnalysis(created);
              setAiStatus("done");
            } catch {
              // eslint-disable-next-line no-console
              console.log(`[없는 종목] AI 분석 미지원: ${id}`);
              setAiStatus("unsupported");
            }
          }
        })
        .catch(() => setAiStatus("unsupported"));
    }

    userApi.getWatchlist().then((items) => {
      setIsFavorite(items.some((i) => i.stockCode === id));
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!isLive) return;

    const tick = () => {
      if (document.hidden) return;
      stockApi.getStockDetail(id).then(setStock).catch(() => {});
      stockApi.getChart(id, activeChart)
        .then((res) => setCandles(res.candles ?? []))
        .catch(() => {});
    };

    const interval = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

    return () => {
      clearInterval(interval);
    };
  }, [isLive, id, activeChart]);

  useEffect(() => {
    setChartLoading(true);
    setCandles([]);
    stockApi.getChart(id, activeChart)
      .then((res) => setCandles(res.candles ?? []))
      .catch(() => setCandles([]))
      .finally(() => setChartLoading(false));
  }, [id, activeChart]);

  const toggleWatchlist = async () => {
    if (isFavorite) {
      setIsFavorite(false);
      await userApi.removeWatchlist(id).catch(() => setIsFavorite(true));
    } else {
      setIsFavorite(true);
      await userApi.addWatchlist(id).catch(() => setIsFavorite(false));
    }
  };

  const handleTrade = async () => {
    if (!stock) return;
    setTradeError(null);
    setTradeLoading(true);
    try {
      const quantity = Number(qty);
      if (showBuy) {
        await tradeApi.buyStock({ ticker: id, price: stock.price, quantity });
      } else {
        await tradeApi.sellStock({ ticker: id, price: stock.price, quantity });
      }
      setShowBuy(false);
      setShowSell(false);
    } catch (err) {
      setTradeError(err instanceof ApiException ? err.message : "주문 중 오류가 발생했습니다.");
    } finally {
      setTradeLoading(false);
    }
  };

  if (stockLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <RiArrowLeftLine size={22} />
          </button>
          <div className={styles.headerActions} />
        </header>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <RiArrowLeftLine size={22} />
          </button>
          <div className={styles.headerActions} />
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/main/stocks" className={styles.backBtn}>
          <RiArrowLeftLine size={22} />
        </Link>
        <div className={styles.headerActions}>
          <button onClick={toggleWatchlist} className={styles.iconBtn}>
            {isFavorite
              ? <RiHeartFill size={22} color="var(--color-up)" />
              : <RiHeartLine size={22} />}
          </button>
        </div>
      </header>

      <section className={styles.priceSection}>
        <div className={styles.stockIdentity}>
          <StockLogo code={stock.ticker} name={stock.name} size={44} />
          <div className={styles.stockIdentityInfo}>
            <p className={styles.stockIdentityName}>{stock.name}</p>
            <div className={styles.stockIdentityTickerRow}>
              {(() => {
                const market = getStockInfo(stock.ticker)?.market;
                return market ? (
                  <span className={styles.marketBadge}>
                    {market}
                  </span>
                ) : null;
              })()}
              <p className={styles.stockIdentityCode}>{stock.ticker}</p>
            </div>
          </div>
        </div>
        <p className={styles.price}>{formatPrice(stock.price)}</p>
      </section>

      <section className={styles.chartSection}>
        <div className={styles.chartTabs}>
          {CHART_TABS.map((t) => (
            <button
              key={t.index}
              className={[styles.chartTab, activeChart === t.index ? styles.chartTabActive : ""].join(" ")}
              onClick={() => setActiveChart(t.index)}
            >
              {t.label}
            </button>
          ))}
          <div className={styles.liveBtnWrap}>
            {!isMarketOpen() && (
              <div className={styles.liveTooltip}>장 마감 (09:00 ~ 18:00)</div>
            )}
            <button
              className={[styles.liveBtn, isLive ? styles.liveBtnActive : ""].join(" ")}
              onClick={() => isMarketOpen() && setIsLive((v) => !v)}
              disabled={!isMarketOpen()}
            >
              <span className={isLive ? styles.liveDot : styles.liveDotOff} />
              LIVE
            </button>
          </div>
        </div>
        <StockChart candles={candles} loading={chartLoading} />
      </section>

      <section className={styles.section}>
        <div className={styles.aiCard}>
          <div className={styles.aiHeader}>
            <Badge variant="ai">AI 분석</Badge>
            {aiStatus === "loading" && <div className={styles.aiSkeletonBadge} />}
            {aiStatus === "done" && aiAnalysis && (
              <div className={styles.aiHeaderRight}>
                <span className={styles[`sentiment${aiAnalysis.sentiment}`]}>
                  {aiAnalysis.sentiment === "POSITIVE" ? "긍정" : aiAnalysis.sentiment === "NEGATIVE" ? "부정" : "중립"}
                </span>
                <span className={styles.aiScore}>{aiAnalysis.analyzedAt?.slice(0, 10)}</span>
              </div>
            )}
          </div>
          {aiStatus === "loading" && (
            <div className={styles.aiSkeletonWrap}>
              <div className={styles.aiSkeletonLine} style={{ "--line-width": "100%" } as CSSProperties} />
              <div className={styles.aiSkeletonLine} style={{ "--line-width": "88%" } as CSSProperties} />
              <div className={styles.aiSkeletonLine} style={{ "--line-width": "94%" } as CSSProperties} />
              <div className={styles.aiSkeletonLine} style={{ "--line-width": "76%" } as CSSProperties} />
              <div className={styles.aiSkeletonLine} style={{ "--line-width": "60%" } as CSSProperties} />
            </div>
          )}
          {aiStatus === "done" && aiAnalysis && (
            <MarkdownText text={aiAnalysis.summary} className={styles.aiSummary} />
          )}
          {aiStatus === "unsupported" && (
            <p className={styles.aiUnsupported}>해당 종목은 지원되지 않는 종목입니다</p>
          )}
        </div>
      </section>

      <div className={styles.tradeBar}>
        <Button
          variant="outline"
          size="lg"
          onClick={() => { setShowSell(true); setShowBuy(false); setTradeError(null); }}
        >
          매도
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => { setShowBuy(true); setShowSell(false); setTradeError(null); }}
        >
          매수
        </Button>
      </div>

      {(showBuy || showSell) && (
        <div className={styles.modal} onClick={() => { setShowBuy(false); setShowSell(false); }}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>
              {stock.name} {showBuy ? "매수" : "매도"}
            </h3>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>현재가</span>
              <span className={styles.modalValue}>{formatPrice(stock.price)}</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>수량</span>
              <div className={styles.qtyRow}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQty(String(Math.max(1, Number(qty) - 1)))}
                >
                  -
                </button>
                <input
                  className={styles.qtyInput}
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/\D/g, "") || "1")}
                />
                <button className={styles.qtyBtn} onClick={() => setQty(String(Number(qty) + 1))}>
                  +
                </button>
              </div>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>총 금액</span>
              <span className={styles.modalTotal}>{formatPrice(stock.price * Number(qty))}</span>
            </div>

            <div className={styles.aiInModal}>
              <div className={styles.aiInModalHeader}>
                <p className={styles.aiInModalLabel}>AI 기업이슈 요약</p>
                {aiStatus === "done" && aiAnalysis && (
                  <span className={styles[`sentiment${aiAnalysis.sentiment}`]}>
                    {aiAnalysis.sentiment === "POSITIVE" ? "긍정" : aiAnalysis.sentiment === "NEGATIVE" ? "부정" : "중립"}
                  </span>
                )}
              </div>
              {aiStatus === "loading" && (
                <div className={styles.aiSkeletonWrap}>
                  <div className={styles.aiSkeletonLine} style={{ "--line-width": "100%" } as CSSProperties} />
                  <div className={styles.aiSkeletonLine} style={{ "--line-width": "85%" } as CSSProperties} />
                  <div className={styles.aiSkeletonLine} style={{ "--line-width": "70%" } as CSSProperties} />
                </div>
              )}
              {aiStatus === "done" && aiAnalysis && (
                <MarkdownText text={aiAnalysis.summary} className={styles.aiInModalText} />
              )}
              {aiStatus === "unsupported" && (
                <p className={styles.aiUnsupported}>해당 종목은 지원되지 않는 종목입니다</p>
              )}
            </div>

            {tradeError && <p className={styles.modalError}>{tradeError}</p>}
            <Button
              variant={showBuy ? "primary" : "outline"}
              size="lg"
              fullWidth
              onClick={handleTrade}
              disabled={tradeLoading}
            >
              {tradeLoading ? "처리 중..." : showBuy ? "매수 주문" : "매도 주문"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
