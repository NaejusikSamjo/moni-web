"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiHeartLine, RiHeartFill, RiLoaderLine, RiTimerLine } from "react-icons/ri";
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
import type { CompanyIssueResponse, NewsResponse } from "@/entities/ai";
import type { ReservedOrderResponse } from "@/entities/trade";
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
  const [newsList, setNewsList] = useState<NewsResponse[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveRefreshing, setLiveRefreshing] = useState(false);

  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [tradePrice, setTradePrice] = useState(0);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [holdingQty, setHoldingQty] = useState<number>(0);
  const [modalInfoLoading, setModalInfoLoading] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [orderMode, setOrderMode] = useState<"market" | "limit">("market");
  const [limitTargetPrice, setLimitTargetPrice] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const [showReserved, setShowReserved] = useState(false);
  const [reservedTradeType, setReservedTradeType] = useState<"BUY" | "SELL">("BUY");
  const [reservedAmount, setReservedAmount] = useState("");
  const [reservedLoading, setReservedLoading] = useState(false);
  const [reservedError, setReservedError] = useState<string | null>(null);

  const [stockReservedOrders, setStockReservedOrders] = useState<ReservedOrderResponse[]>([]);
  const [showReservedList, setShowReservedList] = useState(false);
  const [cancellingReservedId, setCancellingReservedId] = useState<string | null>(null);

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

    tradeApi.getReservedOrders()
      .then((orders) => setStockReservedOrders(orders.filter((o) => o.ticker === id && o.status === "PENDING")))
      .catch(() => {});

    setNewsLoading(true);
    setNewsList([]);
    aiApi.getNewsList({ ticker: id })
      .then((res) => setNewsList(res.content))
      .catch(() => {})
      .finally(() => setNewsLoading(false));
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
    setBuyAmount("");
    setSellAmount("");
    setOrderMode("market");
    setLimitTargetPrice("");
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
    if (holdingResult.status === "fulfilled" && holdingResult.value) {
      setHoldingQty(holdingResult.value.quantity);
    }
    setModalInfoLoading(false);
  };

  const openReservedModal = async () => {
    modalOpenRef.current = true;
    setShowReserved(true);
    setTradePrice(stock?.price ?? 0);
    setReservedTradeType("BUY");
    setReservedAmount("");
    setReservedError(null);
    setCashBalance(null);
    setHoldingQty(0);
    setModalInfoLoading(true);
    const [assetsResult, holdingResult] = await Promise.allSettled([
      portfolioApi.getAssets(),
      tradeApi.getHolding(id),
    ]);
    if (assetsResult.status === "fulfilled" && assetsResult.value) {
      setCashBalance(assetsResult.value.cashBalance);
    }
    if (holdingResult.status === "fulfilled" && holdingResult.value) {
      setHoldingQty(holdingResult.value.quantity);
    }
    setModalInfoLoading(false);
  };

  const closeModal = () => {
    modalOpenRef.current = false;
    setShowBuy(false);
    setShowSell(false);
    setShowReserved(false);
    setShowReservedList(false);
  };

  const handleCancelStockReserved = async (orderId: string) => {
    setCancellingReservedId(orderId);
    try {
      await tradeApi.cancelReservedOrder(orderId);
      setStockReservedOrders((prev) => prev.filter((o) => o.id !== orderId));
    } finally {
      setCancellingReservedId(null);
    }
  };

  const effectivePrice = (orderMode === "limit" && Number(limitTargetPrice) > 0)
    ? Number(limitTargetPrice)
    : tradePrice;

  const handleBuyQtyStep = (delta: number) => {
    if (effectivePrice <= 0) return;
    const next = (Number(buyAmount) || 0) + delta * effectivePrice;
    if (next < 0) return;
    if (cashBalance !== null && next > cashBalance) return;
    setBuyAmount(next > 0 ? String(next) : "");
  };

  const handleSellAmtStep = (delta: number) => {
    if (effectivePrice <= 0) return;
    const next = (Number(sellAmount) || 0) + delta * effectivePrice;
    if (next < 0) return;
    if (holdingQty > 0 && next > holdingQty * tradePrice) return;
    setSellAmount(next > 0 ? String(next) : "");
  };

  const handleReservedAmtStep = (delta: number) => {
    if (tradePrice <= 0) return;
    const next = (Number(reservedAmount) || 0) + delta * tradePrice;
    if (next < 0) return;
    if (reservedTradeType === "SELL" && holdingQty > 0 && next > holdingQty * tradePrice) return;
    setReservedAmount(next > 0 ? String(next) : "");
  };



  const handleTrade = async () => {
    setTradeError(null);
    setTradeLoading(true);
    try {
      if (showBuy) {
        if (orderMode === "limit") {
          const res = await tradeApi.createReservedBuyOrder({
            ticker: id,
            orderType: "LIMIT",
            targetPrice: Number(limitTargetPrice),
            amount: Number(buyAmount),
          });
          setStockReservedOrders((prev) => [res, ...prev]);
        } else {
          await tradeApi.buyStock({ ticker: id, amount: Number(buyAmount) });
        }
      } else {
        const price = orderMode === "limit" && Number(limitTargetPrice) > 0
          ? Number(limitTargetPrice) : tradePrice;
        const quantity = price > 0 ? Number(sellAmount) / price : 0;
        if (orderMode === "limit") {
          const res = await tradeApi.createReservedSellOrder({
            ticker: id,
            orderType: "LIMIT",
            targetPrice: Number(limitTargetPrice),
            quantity,
          });
          setStockReservedOrders((prev) => [res, ...prev]);
        } else {
          await tradeApi.sellStock({ ticker: id, quantity });
        }
      }
      closeModal();
    } catch (err) {
      setTradeError(err instanceof ApiException ? err.message : "주문 중 오류가 발생했습니다.");
    } finally {
      setTradeLoading(false);
    }
  };

  const handleReservedOrder = async () => {
    setReservedError(null);
    setReservedLoading(true);
    try {
      if (reservedTradeType === "BUY") {
        const res = await tradeApi.createReservedBuyOrder({
          ticker: id,
          orderType: "RESERVATION",
          amount: Number(reservedAmount),
        });
        setStockReservedOrders((prev) => [res, ...prev]);
      } else {
        const quantity = tradePrice > 0 ? Number(reservedAmount) / tradePrice : 0;
        const res = await tradeApi.createReservedSellOrder({
          ticker: id,
          orderType: "RESERVATION",
          quantity,
        });
        setStockReservedOrders((prev) => [res, ...prev]);
      }
      closeModal();
    } catch (err) {
      setReservedError(err instanceof ApiException ? err.message : "예약 주문 중 오류가 발생했습니다.");
    } finally {
      setReservedLoading(false);
    }
  };

  const toQtyStr = (amount: string, price?: number) => {
    const p = price ?? tradePrice;
    const n = Number(amount);
    if (!n || p <= 0) return "0주";
    return `${(n / p).toFixed(4).replace(/\.?0+$/, "")}주`;
  };

  const isBuyDisabled = (() => {
    if (orderMode === "limit" && !Number(limitTargetPrice)) return true;
    const amt = Number(buyAmount);
    if (amt <= 0) return true;
    return cashBalance !== null && amt > cashBalance;
  })();

  const isSellDisabled = (() => {
    if (orderMode === "limit" && !Number(limitTargetPrice)) return true;
    const amt = Number(sellAmount);
    if (amt <= 0) return true;
    return holdingQty > 0 && amt > holdingQty * tradePrice;
  })();

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

      {stockReservedOrders.length > 0 && (() => {
        const first = stockReservedOrders[0];
        const hhmm = new Date(first.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
        const typeLabel = first.orderType === "LIMIT" ? "지정가" : "예약";
        const tradeLabel = first.tradeType === "BUY" ? "매수" : "매도";
        const rest = stockReservedOrders.length - 1;
        return (
          <button className={styles.reservedSummaryBar} onClick={() => setShowReservedList(true)}>
            <RiTimerLine size={16} className={styles.reservedSummaryIcon} />
            <span className={styles.reservedSummaryText}>{hhmm} {typeLabel} {tradeLabel}</span>
            {rest > 0 && <span className={styles.reservedSummaryMore}>외 {rest}건</span>}
            <span className={styles.reservedSummaryArrow}>›</span>
          </button>
        );
      })()}

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

      <section className={styles.section}>
        <div className={styles.newsCard}>
          <p className={styles.newsCardTitle}>관련 뉴스</p>
          {newsLoading ? (
            <div className={styles.newsSkeletonWrap}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.newsSkeletonItem}>
                  <div className={styles.newsSkeletonLine} />
                  <div className={styles.newsSkeletonLine} data-w="80" />
                  <div className={styles.newsSkeletonMeta} />
                </div>
              ))}
            </div>
          ) : newsList.length === 0 ? (
            <p className={styles.newsEmpty}>관련 뉴스가 없습니다</p>
          ) : (
            newsList.map((item, i) => (
              <div key={i} className={styles.newsItem}>
                <p className={styles.newsTitle}>{item.title}</p>
                <div className={styles.newsBottom}>
                  <span className={styles.newsSource}>{item.source}</span>
                  <span className={styles.newsTime}>{item.published_at.slice(0, 10).replace(/-/g, ".")}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className={styles.tradeBar}>
        <div className={styles.tradeBtnRow}>
          <div className={styles.tradeBtnFlex}>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => openModal("sell", stock.price ?? 0)}
            >
              매도
            </Button>
          </div>
          <div className={styles.tradeBtnFlex}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => openModal("buy", stock.price ?? 0)}
            >
              매수
            </Button>
          </div>
          <button className={styles.reservedIconBtn} onClick={() => void openReservedModal()}>
            <RiTimerLine size={20} />
          </button>
        </div>
      </div>

      {showReservedList && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>{stock.name} 예약 주문</h3>
            <div className={styles.reservedListWrap}>
              {stockReservedOrders.map((o) => {
                const hhmm = new Date(o.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
                const typeLabel = o.orderType === "LIMIT" ? "지정가" : "예약";
                const tradeLabel = o.tradeType === "BUY" ? "매수" : "매도";
                const isBuy = o.tradeType === "BUY";
                const isPending = o.status === "PENDING";
                const STATUS_LABEL: Record<string, string> = { PENDING: "대기", EXECUTED: "체결", CANCELLED: "취소", FAILED: "실패" };
                return (
                  <div key={o.id} className={styles.reservedListItem}>
                    <div className={styles.reservedListLeft}>
                      <span className={[styles.tradeBadge, isBuy ? styles.tradeBadgeBuy : styles.tradeBadgeSell].join(" ")}>
                        {tradeLabel}
                      </span>
                      <div>
                        <p className={styles.reservedListType}>{typeLabel}{o.targetPrice != null ? ` · ${formatPrice(o.targetPrice)}` : ""}</p>
                        <p className={styles.reservedListTime}>{hhmm}</p>
                      </div>
                    </div>
                    <div className={styles.reservedListRight}>
                      <span className={[styles.reservedListStatus, styles[`reservedListStatus${o.status}`]].join(" ")}>
                        {STATUS_LABEL[o.status]}
                      </span>
                      {isBuy && o.amount != null && <p className={styles.reservedListMeta}>{formatPrice(o.amount)}</p>}
                      {!isBuy && o.quantity != null && <p className={styles.reservedListMeta}>{o.quantity}주</p>}
                      {isPending && (
                        <button
                          className={styles.reservedListCancelBtn}
                          onClick={() => void handleCancelStockReserved(o.id)}
                          disabled={cancellingReservedId === o.id}
                        >
                          {cancellingReservedId === o.id ? "취소 중" : "취소"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(showBuy || showSell) && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <div className={styles.modalTitleRow}>
              <h3 className={styles.modalTitle}>
                {stock.name} {showBuy ? "매수" : "매도"}
              </h3>
              <div className={styles.orderModeRow}>
                <button
                  className={[styles.orderModeChip, orderMode === "market" ? styles.orderModeActive : ""].join(" ")}
                  onClick={() => { setOrderMode("market"); setLimitTargetPrice(""); }}
                >
                  시장가
                </button>
                <button
                  className={[styles.orderModeChip, orderMode === "limit" ? styles.orderModeActive : ""].join(" ")}
                  onClick={() => setOrderMode("limit")}
                >
                  지정가
                </button>
              </div>
            </div>

            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>현재가</span>
              <div className={styles.modalValueGroup}>
                <span className={styles.modalValue}>{formatPrice(tradePrice)}</span>
                {isLive && <span className={styles.modalPriceNote}>실시간</span>}
              </div>
            </div>

            {orderMode === "limit" && (
              <div className={styles.modalRow}>
                <span className={styles.modalLabel}>목표가</span>
                <input
                  className={styles.amountInput}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={limitTargetPrice}
                  onChange={(e) => setLimitTargetPrice(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>
            )}

            {modalInfoLoading ? (
              <div className={styles.modalLoadingRow}>
                <RiLoaderLine size={18} className={styles.modalSpinner} />
                <span className={styles.modalLoadingText}>정보 불러오는 중...</span>
              </div>
            ) : (
              <>
                {showBuy && (
                  <>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>가용 현금</span>
                      <span className={styles.modalValue}>
                        {cashBalance !== null ? formatPrice(cashBalance) : "—"}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>보유 수량</span>
                      <span className={styles.modalValue}>
                        {holdingQty > 0 ? `${holdingQty}주` : "없음"}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>수량</span>
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => handleBuyQtyStep(-1)}>-</button>
                        <span className={styles.qtyDisplay}>{toQtyStr(buyAmount, effectivePrice)}</span>
                        <button className={styles.qtyBtn} onClick={() => handleBuyQtyStep(1)}>+</button>
                      </div>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>투자 금액</span>
                      <input
                        className={styles.amountInput}
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      />
                    </div>
                  </>
                )}

                {showSell && (
                  <>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>가용 현금</span>
                      <span className={styles.modalValue}>
                        {cashBalance !== null ? formatPrice(cashBalance) : "—"}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>보유 수량</span>
                      <span className={styles.modalValue}>
                        {holdingQty > 0 ? `${holdingQty}주` : "보유 없음"}
                      </span>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>수량</span>
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => handleSellAmtStep(-1)}>-</button>
                        <span className={styles.qtyDisplay}>{toQtyStr(sellAmount, effectivePrice)}</span>
                        <button className={styles.qtyBtn} onClick={() => handleSellAmtStep(1)}>+</button>
                      </div>
                    </div>
                    <div className={styles.modalRow}>
                      <span className={styles.modalLabel}>매도 금액</span>
                      <input
                        className={styles.amountInput}
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      />
                    </div>
                  </>
                )}
              </>
            )}

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
              disabled={
                tradeLoading || modalInfoLoading ||
                (showBuy && isBuyDisabled) ||
                (showSell && isSellDisabled)
              }
            >
              {tradeLoading ? "처리 중..." : orderMode === "limit"
                ? (showBuy ? "지정가 매수" : "지정가 매도")
                : (showBuy ? "매수 주문" : "매도 주문")}
            </Button>
          </div>
        </div>
      )}

      {showReserved && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>예약 주문</h3>

            <div className={styles.tradeModeToggle}>
              <button
                className={[styles.tradeModeBtn, reservedTradeType === "BUY" ? styles.tradeModeBuy : ""].join(" ")}
                onClick={() => { setReservedTradeType("BUY"); setReservedAmount(""); }}
              >
                매수
              </button>
              <button
                className={[styles.tradeModeBtn, reservedTradeType === "SELL" ? styles.tradeModeSell : ""].join(" ")}
                onClick={() => { setReservedTradeType("SELL"); setReservedAmount(""); }}
              >
                매도
              </button>
            </div>

            {modalInfoLoading ? (
              <div className={styles.modalLoadingRow}>
                <RiLoaderLine size={18} className={styles.modalSpinner} />
                <span className={styles.modalLoadingText}>정보 불러오는 중...</span>
              </div>
            ) : (
              <>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>가용 현금</span>
                  <span className={styles.modalValue}>
                    {cashBalance !== null ? formatPrice(cashBalance) : "—"}
                  </span>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>보유 수량</span>
                  <span className={styles.modalValue}>
                    {holdingQty > 0 ? `${holdingQty}주` : "없음"}
                  </span>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>수량</span>
                  <div className={styles.qtyRow}>
                    <button className={styles.qtyBtn} onClick={() => handleReservedAmtStep(-1)}>-</button>
                    <span className={styles.qtyDisplay}>{toQtyStr(reservedAmount)}</span>
                    <button className={styles.qtyBtn} onClick={() => handleReservedAmtStep(1)}>+</button>
                  </div>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>
                    {reservedTradeType === "BUY" ? "투자 금액" : "매도 금액"}
                  </span>
                  <input
                    className={styles.amountInput}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={reservedAmount}
                    onChange={(e) => setReservedAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  />
                </div>
              </>
            )}

            {reservedError && <p className={styles.modalError}>{reservedError}</p>}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleReservedOrder}
              disabled={reservedLoading || modalInfoLoading || !Number(reservedAmount)}
            >
              {reservedLoading ? "처리 중..." : "예약 주문"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
