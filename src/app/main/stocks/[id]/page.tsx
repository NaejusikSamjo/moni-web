"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiHeartLine, RiHeartFill, RiLoaderLine } from "react-icons/ri";
import { stockApi, StockChart } from "@/entities/stock";
import { tradeApi } from "@/entities/trade";
import { portfolioApi } from "@/entities/portfolio";
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
  const [liveRefreshing, setLiveRefreshing] = useState(false);

  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [tradePrice, setTradePrice] = useState(0);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [holdingQty, setHoldingQty] = useState<number>(0);
  const [modalInfoLoading, setModalInfoLoading] = useState(false);
  const [qty, setQty] = useState("1");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const aiCalledRef = useRef(false);
  const modalOpenRef = useRef(false);

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
      void (async () => {
        const [watchRes, analysisRes] = await Promise.allSettled([
          aiApi.getWatchCompanies(),
          aiApi.getIssueAnalysis(id),
        ]);

        const watchList = watchRes.status === "fulfilled" ? watchRes.value : [];
        // watchList가 비어있으면(API 실패) 지원 여부 불명 → 허용으로 간주
        const isSupported = watchList.length === 0 || watchList.some((c) => c.ticker === id);

        if (!isSupported) {
          setAiStatus("unsupported");
          return;
        }

        const cached = analysisRes.status === "fulfilled" ? analysisRes.value : null;
        if (cached) {
          setAiAnalysis(cached);
          setAiStatus("done");
          return;
        }

        try {
          const created = await aiApi.createIssueAnalysis(id);
          setAiAnalysis(created);
          setAiStatus("done");
        } catch {
          setAiStatus("unsupported");
        }
      })();
    }

    userApi.getWatchlist().then((items) => {
      setIsFavorite(items.some((i) => i.stockCode === id));
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!isLive) return;

    const tick = () => {
      if (document.hidden || modalOpenRef.current) return;
      setLiveRefreshing(true);
      stockApi.getStockDetail(id)
        .then(setStock)
        .catch(() => {})
        .finally(() => setLiveRefreshing(false));
      stockApi.getChart(id, activeChart)
        .then((res) => setCandles(res.candles ?? []))
        .catch(() => {});
    };

    const interval = setInterval(tick, 5000);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
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

  const openModal = async (type: "buy" | "sell", currentPrice: number) => {
    modalOpenRef.current = true;
    setTradePrice(currentPrice);
    setQty("1");
    setTradeError(null);
    setCashBalance(null);
    setHoldingQty(0);
    setModalInfoLoading(true);

    if (type === "buy") {
      setShowBuy(true);
      setShowSell(false);
    } else {
      setShowSell(true);
      setShowBuy(false);
    }

    const [assetsResult, holdingResult] = await Promise.allSettled([
      portfolioApi.getAssets(),
      tradeApi.getHolding(id),
    ]);

    if (assetsResult.status === "fulfilled" && assetsResult.value) {
      setCashBalance(assetsResult.value.cashBalance);
    }
    if (holdingResult.status === "fulfilled") {
      setHoldingQty(holdingResult.value.quantity);
    }
    setModalInfoLoading(false);
  };

  const closeModal = () => {
    modalOpenRef.current = false;
    setShowBuy(false);
    setShowSell(false);
  };

  const maxBuyQty = cashBalance !== null && tradePrice > 0
    ? Math.floor(cashBalance / tradePrice)
    : null;

  const handleQtyChange = (raw: string) => {
    const n = Number(raw.replace(/\D/g, "") || "1");
    if (showBuy && maxBuyQty !== null) {
      setQty(String(Math.min(n, Math.max(maxBuyQty, 1))));
    } else if (showSell) {
      setQty(String(Math.min(n, Math.max(holdingQty, 1))));
    } else {
      setQty(String(n));
    }
  };

  const handleQtyStep = (delta: number) => {
    const current = Number(qty);
    const next = current + delta;
    if (next < 1) return;
    if (showBuy && maxBuyQty !== null && next > maxBuyQty) return;
    if (showSell && next > holdingQty) return;
    setQty(String(next));
  };

  const handleTrade = async () => {
    setTradeError(null);
    setTradeLoading(true);
    try {
      const quantity = Number(qty);
      if (showBuy) {
        await tradeApi.buyStock({ ticker: id, price: tradePrice, quantity });
      } else {
        await tradeApi.sellStock({ ticker: id, price: tradePrice, quantity });
      }
      closeModal();
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
        <p className={[styles.price, liveRefreshing ? styles.priceRefreshing : ""].join(" ")}>
          {formatPrice(stock.price)}
        </p>
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
              <div className={styles.aiSkeletonLine} />
              <div className={styles.aiSkeletonLine} data-w="88" />
              <div className={styles.aiSkeletonLine} data-w="94" />
              <div className={styles.aiSkeletonLine} data-w="76" />
              <div className={styles.aiSkeletonLine} data-w="60" />
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
          onClick={() => openModal("sell", stock.price)}
        >
          매도
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => openModal("buy", stock.price)}
        >
          매수
        </Button>
      </div>

      {(showBuy || showSell) && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>
              {stock.name} {showBuy ? "매수" : "매도"}
            </h3>

            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>체결 가격</span>
              <div className={styles.modalValueGroup}>
                <span className={styles.modalValue}>{formatPrice(tradePrice)}</span>
                {isLive && <span className={styles.modalPriceNote}>주문 시점 가격 고정</span>}
              </div>
            </div>

            {modalInfoLoading ? (
              <div className={styles.modalLoadingRow}>
                <RiLoaderLine size={18} className={styles.modalSpinner} />
                <span className={styles.modalLoadingText}>정보 불러오는 중...</span>
              </div>
            ) : (
              <>
                {showBuy && (
                  <div className={styles.modalRow}>
                    <span className={styles.modalLabel}>가용 현금</span>
                    <span className={styles.modalValue}>
                      {cashBalance !== null ? formatPrice(cashBalance) : "—"}
                    </span>
                  </div>
                )}

                {showSell && (
                  <div className={styles.modalRow}>
                    <span className={styles.modalLabel}>보유 수량</span>
                    <span className={styles.modalValue}>
                      {holdingQty > 0 ? `${holdingQty}주` : "보유 없음"}
                    </span>
                  </div>
                )}

                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>
                    수량
                    {showBuy && maxBuyQty !== null && (
                      <span className={styles.modalLabelHint}>최대 {maxBuyQty}주</span>
                    )}
                  </span>
                  <div className={styles.qtyRow}>
                    <button className={styles.qtyBtn} onClick={() => handleQtyStep(-1)}>-</button>
                    <input
                      className={styles.qtyInput}
                      value={qty}
                      onChange={(e) => handleQtyChange(e.target.value)}
                    />
                    <button className={styles.qtyBtn} onClick={() => handleQtyStep(1)}>+</button>
                  </div>
                </div>
              </>
            )}

            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>총 금액</span>
              <span className={styles.modalTotal}>{formatPrice(tradePrice * Number(qty))}</span>
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
                  <div className={styles.aiSkeletonLine} />
                  <div className={styles.aiSkeletonLine} data-w="85" />
                  <div className={styles.aiSkeletonLine} data-w="70" />
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
              disabled={tradeLoading || modalInfoLoading || (showSell && !modalInfoLoading && holdingQty === 0)}
            >
              {tradeLoading ? "처리 중..." : showBuy ? "매수 주문" : "매도 주문"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
