"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import Link from "next/link";
import { Badge, MarkdownText, ServiceUnavailable, StockLogo, Skeleton } from "@/shared/ui";
import { RiArrowDownSLine, RiLoaderLine } from "react-icons/ri";
import { portfolioApi } from "@/entities/portfolio";
import { paymentApi } from "@/entities/payment";
import { tradeApi } from "@/entities/trade";
import { ApiException } from "@/shared/api/types";
import { formatPrice, formatChangeRate } from "@/shared/lib/format";
import type {
  PortfolioAssetResponse,
  PortfolioHoldingItem,
  PortfolioHoldingsResponse,
  PortfolioAnalysisResponse,
} from "@/entities/portfolio";
import styles from "./page.module.css";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type AiPhase = "loading" | "empty" | "pending" | "success" | "failed" | "error";

interface DonutProps {
  holdings: PortfolioHoldingItem[];
  cashWeight: number;
  returnRate: number;
}

function DonutChart({ holdings, cashWeight, returnRate }: DonutProps) {
  const R = 56;
  const cx = 80;
  const cy = 80;
  const C = 2 * Math.PI * R;

  const segments = [
    ...holdings.map((h, i) => ({ pct: h.weight, color: COLORS[i % COLORS.length] })),
    { pct: cashWeight, color: "#e5e7eb" },
  ];

  let cumulativePct = 0;
  const arcs = segments.map((seg, i) => {
    const angle = cumulativePct * 3.6;
    const dashLen = (seg.pct / 100) * C;
    cumulativePct += seg.pct;
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth={18}
        strokeDasharray={`${Math.max(0, dashLen - 1.5)} ${C}`}
        strokeDashoffset={0}
        transform={`rotate(${angle - 90} ${cx} ${cy})`}
      />
    );
  });

  const isPositive = returnRate >= 0;
  const rateColor = isPositive ? "var(--color-up)" : "var(--color-down)";

  return (
    <div className={styles.donutWrap}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={18} />
        {arcs}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)" fontWeight={600}>수익률</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={16} fill={rateColor} fontWeight={800}>
          {isPositive ? "+" : ""}{returnRate.toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}

function formatAnalyzedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${min}`;
}

const LOADING_MSGS = [
  "포트폴리오 분석 시작하는 중...",
  "얼마나 멋진 투자자인지 확인 중...",
  "보유 종목 꼼꼼히 살펴보는 중...",
  "수익률 계산하는 중...",
  "리스크 분석하는 중...",
  "AI가 투자 성향 파악하는 중...",
  "최적의 진단 준비하는 중...",
  "섹터 다양성 평가하는 중...",
  "집중도 점수 산출하는 중...",
];

export default function PortfolioPage() {
  const [assets, setAssets] = useState<PortfolioAssetResponse | null | undefined>(undefined);
  const [holdingsRes, setHoldingsRes] = useState<PortfolioHoldingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);

  // AI 분석 상태
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPhase, setAiPhase] = useState<AiPhase>("loading");
  const [aiResult, setAiResult] = useState<PortfolioAnalysisResponse | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const aiLoadedRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [limitExceeded, setLimitExceeded] = useState<"daily" | "free" | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const account = await tradeApi.getAccount();
      if (!account) {
        setNoAccount(true);
        setAssets(null);
        return;
      }
      setNoAccount(false);
      const assetRes = await portfolioApi.getAssets();
      setAssets(assetRes);
      if (!assetRes) return;
      const res = await portfolioApi.getHoldings();
      setHoldingsRes(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (requesting) {
      setLoadingMsgIdx(0);
      msgIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MSGS.length);
      }, 2500);
    } else {
      if (msgIntervalRef.current) {
        clearInterval(msgIntervalRef.current);
        msgIntervalRef.current = null;
      }
    }
    return () => {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, [requesting]);

  const loadLatestAnalysis = useCallback(async () => {
    setAiPhase("loading");
    setAiErr(null);
    try {
      const result = await portfolioApi.getLatestAnalysis();
      if (result === null) {
        setAiPhase("empty");
        setAiResult(null);
      } else {
        setAiResult(result);
        if (result.status === "SUCCESS") setAiPhase("success");
        else if (result.status === "FAILED") setAiPhase("failed");
        else setAiPhase("pending");
      }
    } catch (err) {
      setAiPhase("error");
      setAiErr(err instanceof ApiException ? err.message : "분석 정보를 불러오지 못했습니다.");
    }
  }, []);

  const pollAnalysis = useCallback(async () => {
    try {
      const result = await portfolioApi.getLatestAnalysis();
      if (!result) { setAiPhase("empty"); setAiResult(null); return; }
      setAiResult(result);
      if (result.status === "SUCCESS") setAiPhase("success");
      else if (result.status === "FAILED") setAiPhase("failed");
    } catch { /* 폴링 중 오류는 무시 */ }
  }, []);

  useEffect(() => {
    if (aiPhase !== "pending") return;
    pollingRef.current = setInterval(() => { void pollAnalysis(); }, 5000);
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [aiPhase, pollAnalysis]);

  const handleToggleAi = useCallback(async () => {
    if (aiOpen) {
      setAiOpen(false);
      return;
    }
    setAiOpen(true);
    if (!aiLoadedRef.current) {
      aiLoadedRef.current = true;
      const [, subRes] = await Promise.allSettled([
        loadLatestAnalysis(),
        paymentApi.getSubscriptionStatus(),
      ]);
      if (subRes.status === "fulfilled") {
        setIsSubscribed(subRes.value.subscribed);
      } else {
        setIsSubscribed(false);
      }
    }
  }, [aiOpen, loadLatestAnalysis]);

  const handleRequestAnalysis = useCallback(async () => {
    setRequesting(true);
    setAiErr(null);
    setLimitExceeded(null);
    try {
      await portfolioApi.requestAnalysis();
      setAiPhase("pending");
      setAiResult(null);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.code === "PORTFOLIO-007") {
          setLimitExceeded("daily");
        } else if (err.code === "PORTFOLIO-008") {
          setLimitExceeded("free");
        } else {
          setAiErr(err.message);
        }
      } else {
        setAiErr("분석 요청에 실패했습니다.");
      }
    } finally {
      setRequesting(false);
    }
  }, []);


  const handleCreateAccount = async () => {
    setCreatingAccount(true);
    try {
      await tradeApi.createAccount();
      setNoAccount(false);
    } catch { /* ignore */ } finally { setCreatingAccount(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    try { await portfolioApi.createPortfolio(); await loadData(); }
    catch { /* ignore */ } finally { setCreating(false); }
  };

  const holdings = holdingsRes?.content ?? [];
  const stockWeight = holdings.reduce((s, h) => s + h.weight, 0);
  const cashWeight = assets ? Math.max(0, 100 - stockWeight) : 0;

  return (
    <div className="app-page">
      <PageHeader title="포트폴리오" />

      {loading ? (
        <div>
          <div className={styles.skelSummaryCard}>
            <Skeleton width={44} height={12} />
            <Skeleton width={160} height={30} />
            <div className={styles.skelRow}>
              <div className={styles.skelCol}>
                <Skeleton width={44} height={11} />
                <Skeleton width={110} height={18} />
              </div>
              <div className={styles.skelDivider} />
              <div className={styles.skelCol}>
                <Skeleton width={50} height={11} />
                <Skeleton width={110} height={18} />
              </div>
            </div>
            <Skeleton height={42} />
          </div>
          <div className={styles.section}>
            <Skeleton className={styles.skelTitle} width={70} height={18} />
            <div className={styles.skelChartCard}>
              <Skeleton width={160} height={160} borderRadius="50%" />
              <div className={styles.skelLegendList}>
                {[90, 70, 50].map((w, i) => (
                  <div key={i} className={styles.skelLegendItem}>
                    <Skeleton width={10} height={10} borderRadius="50%" />
                    <Skeleton width={w} height={13} />
                    <div className={styles.skelLegendRight}>
                      <Skeleton width={36} height={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.loadingMore}>
            <RiLoaderLine size={18} className={styles.spinner} />
            <span>불러오는 중</span>
          </div>
        </div>
      ) : error ? (
        <div className={styles.unavailWrap}>
          <ServiceUnavailable message="포트폴리오 서비스가 일시적으로 불안정합니다" />
        </div>
      ) : assets === null ? (
        noAccount ? (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyIcon}>💳</div>
            <h2 className={styles.emptyTitle}>먼저 계좌를 만들어보세요</h2>
            <p className={styles.emptyDesc}>
              모의 투자 계좌를 만들면 주식을 사고팔고<br />
              포트폴리오를 관리할 수 있어요
            </p>
            <button className={styles.createBtn} onClick={handleCreateAccount} disabled={creatingAccount}>
              {creatingAccount ? "생성 중..." : "계좌 만들기"}
            </button>
          </div>
        ) : (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyIcon}>📊</div>
            <h2 className={styles.emptyTitle}>포트폴리오를 시작해보세요</h2>
            <p className={styles.emptyDesc}>
              포트폴리오를 생성하면 보유 종목의 수익률과<br />
              자산 현황을 한눈에 확인할 수 있어요
            </p>
            <button className={styles.createBtn} onClick={handleCreate} disabled={creating}>
              {creating ? "생성 중..." : "포트폴리오 만들기"}
            </button>
          </div>
        )
      ) : assets ? (
        <>
          {/* AI 포트폴리오 리포트 */}
          <div className={styles.section}>
            <div className={styles.aiAnalysisCard}>
              <button className={styles.aiToggle} onClick={() => { void handleToggleAi(); }}>
                <div className={styles.aiHeaderRow}>
                  <div className={styles.aiHeaderBadges}>
                    <Badge variant="ai">AI 리포트</Badge>
                    {isSubscribed !== null && (
                      <span className={[styles.tierBadge, isSubscribed ? styles.tierPremium : styles.tierFree].join(" ")}>
                        {isSubscribed ? "AI+" : "무료"}
                      </span>
                    )}
                  </div>
                  <RiArrowDownSLine
                    size={18}
                    className={[styles.aiChevron, aiOpen ? styles.aiChevronOpen : ""].join(" ")}
                  />
                </div>
                <p className={styles.aiTitle}>내 포트폴리오 진단받기</p>
                <p className={styles.aiDesc}>
                  AI가 보유 종목을 분석하고 리스크·수익률·집중도를 종합 평가합니다.
                </p>
              </button>

              {aiOpen && (
                <div className={styles.aiExpandContent}>
                  {requesting ? (
                    <div className={styles.aiLoadingState}>
                      <RiLoaderLine size={20} className={styles.spinner} />
                      <span key={loadingMsgIdx} className={styles.aiLoadingMsg}>
                        {LOADING_MSGS[loadingMsgIdx]}
                      </span>
                    </div>
                  ) : aiPhase === "loading" ? (
                    <div className={styles.loadingMore}>
                      <RiLoaderLine size={18} className={styles.spinner} />
                      <span>분석 정보 불러오는 중</span>
                    </div>
                  ) : aiPhase === "empty" ? (
                    <div className={styles.aiEmptyState}>
                      {limitExceeded ? (
                        <>
                          <p className={styles.aiEmptyTitle}>
                            {limitExceeded === "daily"
                              ? "오늘 사용할 수 있는 한도가 초과되었어요"
                              : "무료 플랜의 분석 횟수를 모두 사용했어요"}
                          </p>
                          <p className={styles.aiLimitDesc}>
                            {limitExceeded === "daily"
                              ? "내일 다시 분석을 요청할 수 있어요"
                              : "프리미엄 회원은 더 많은 분석을 이용할 수 있어요"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className={styles.aiEmptyTitle}>아직 분석한 기록이 없습니다</p>
                          {aiErr && <p className={styles.aiErrMsg}>{aiErr}</p>}
                          <button
                            className={styles.aiReqBtn}
                            onClick={() => { void handleRequestAnalysis(); }}
                            disabled={requesting}
                          >
                            첫 분석 시작하기
                          </button>
                        </>
                      )}
                    </div>
                  ) : aiPhase === "pending" ? (
                    <div className={styles.aiPending}>
                      <RiLoaderLine size={16} className={styles.spinner} />
                      <span>AI가 분석 중입니다... (약 30초 소요)</span>
                    </div>
                  ) : (aiPhase === "success" || aiPhase === "failed") && aiResult ? (
                    <div className={styles.aiResult}>
                      {aiResult.analyzedAt && (
                        <span className={styles.aiResultDate}>
                          {formatAnalyzedAt(aiResult.analyzedAt)} 분석
                        </span>
                      )}

                      {aiPhase === "failed" ? (
                        <p className={styles.aiErrMsg}>
                          {aiResult.errorMessage ?? "분석 처리 중 오류가 발생했습니다."}
                        </p>
                      ) : (
                        <>
                          {aiResult.summary && (
                            <MarkdownText text={aiResult.summary} className={styles.aiSummaryText} />
                          )}
                          {(aiResult.totalReturnRate !== null || aiResult.totalEvaluationAmount !== null || aiResult.concentrationScore !== null) && (
                            <div className={styles.aiMetrics}>
                              {aiResult.totalReturnRate !== null && (
                                <div className={styles.aiMetricItem}>
                                  <p className={styles.aiMetricLabel}>수익률</p>
                                  <p className={[
                                    styles.aiMetricValue,
                                    aiResult.totalReturnRate >= 0 ? "text-up" : "text-down",
                                  ].join(" ")}>
                                    {formatChangeRate(aiResult.totalReturnRate)}
                                  </p>
                                </div>
                              )}
                              {aiResult.totalEvaluationAmount !== null && (
                                <div className={styles.aiMetricItem}>
                                  <p className={styles.aiMetricLabel}>평가금액</p>
                                  <p className={styles.aiMetricValue}>
                                    {formatPrice(aiResult.totalEvaluationAmount)}
                                  </p>
                                </div>
                              )}
                              {aiResult.concentrationScore !== null && (
                                <div className={styles.aiMetricItem}>
                                  <p className={styles.aiMetricLabel}>집중도</p>
                                  <p className={styles.aiMetricValue}>
                                    {aiResult.concentrationScore.toFixed(1)}
                                    {aiResult.concentrationThreshold !== null && (
                                      <span className={styles.aiMetricSub}>
                                        {" "}/ {aiResult.concentrationThreshold.toFixed(1)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {aiErr && <p className={styles.aiErrMsg}>{aiErr}</p>}

                      <div className={styles.aiActions}>
                        {limitExceeded ? (
                          <p className={styles.aiLimitSmall}>
                            {limitExceeded === "daily" ? "오늘 한도를 모두 사용했어요" : "무료 플랜 한도를 초과했어요"}
                          </p>
                        ) : (
                          <button
                            className={[styles.aiActionBtn, styles.aiActionPrimary].join(" ")}
                            onClick={() => { void handleRequestAnalysis(); }}
                            disabled={requesting}
                          >
                            새로 리포트 생성
                          </button>
                        )}
                        <Link href="/main/portfolio/history" className={styles.aiActionBtn}>
                          이전 기록
                        </Link>
                      </div>
                    </div>
                  ) : aiPhase === "error" ? (
                    <div>
                      <p className={styles.aiErrMsg}>{aiErr}</p>
                      <div className={styles.aiActions}>
                        <button
                          className={styles.aiActionBtn}
                          onClick={() => { void loadLatestAnalysis(); }}
                        >
                          다시 시도
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* 자산 요약 */}
          <div className={styles.summaryCard}>
            <p className={styles.summaryTotalLabel}>총 자산</p>
            <p className={styles.summaryTotalValue}>{formatPrice(assets.totalAsset)}</p>
            <div className={styles.summaryRow}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>가용 현금</span>
                <span className={styles.summaryValue}>{formatPrice(assets.cashBalance)}</span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>주식 평가</span>
                <span className={styles.summaryValue}>{formatPrice(assets.stockEvaluationAmount)}</span>
              </div>
            </div>
            <div className={styles.principalRow}>
              <span className={styles.principalLabel}>투자 원금</span>
              <span className={styles.principalValue}>{formatPrice(assets.principalAmount)}</span>
            </div>
            <div className={styles.returnRow}>
              <span className={styles.returnLabel}>평가 손익</span>
              <span className={[
                styles.returnValue,
                assets.totalProfitLoss >= 0 ? "text-up" : "text-down",
              ].join(" ")}>
                {assets.totalProfitLoss >= 0 ? "+" : ""}{formatPrice(assets.totalProfitLoss)}
              </span>
              <span className={[
                styles.returnRate,
                assets.totalReturnRate >= 0 ? "text-up" : "text-down",
              ].join(" ")}>
                {formatChangeRate(assets.totalReturnRate)}
              </span>
            </div>
          </div>

          {/* 투자 비율 */}
          {holdings.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>투자 비율</h2>
              <div className={styles.chartCard}>
                <DonutChart
                  holdings={holdings}
                  cashWeight={cashWeight}
                  returnRate={assets.totalReturnRate}
                />
                <div className={styles.legendList}>
                  {holdings.map((h, i) => (
                    <div key={h.ticker} className={styles.legendItem}>
                      <span className={styles.legendDot} data-idx={String(i % COLORS.length)} />
                      <span className={styles.legendName}>{h.stockName || h.ticker}</span>
                      <span className={styles.legendWeight}>{h.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className={styles.legendItem}>
                    <span className={styles.legendDotCash} />
                    <span className={styles.legendName}>현금</span>
                    <span className={styles.legendWeight}>{cashWeight.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 보유 종목 */}
          {holdings.length > 0 && (
            <div className={styles.section}>
              <div className={styles.holdingsSectionHeader}>
                <h2 className={styles.sectionTitle}>보유 종목</h2>
                {holdingsRes && (
                  <div className={styles.holdingsSummaryRight}>
                    <span className={[
                      styles.holdingsSummaryPL,
                      holdingsRes.stockProfitLoss >= 0 ? "text-up" : "text-down",
                    ].join(" ")}>
                      {holdingsRes.stockProfitLoss >= 0 ? "+" : ""}{formatPrice(holdingsRes.stockProfitLoss)}
                    </span>
                    <span className={[
                      styles.holdingsSummaryRate,
                      holdingsRes.stockReturnRate >= 0 ? "text-up" : "text-down",
                    ].join(" ")}>
                      {formatChangeRate(holdingsRes.stockReturnRate)}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.holdingsList}>
                {holdings.map((h, i) => (
                  <a href={`/main/stocks/${h.ticker}`} key={h.ticker} className={styles.holdingItem}>
                    <StockLogo code={h.ticker} name={h.stockName || h.ticker} size={40} />
                    <div className={styles.holdingInfo}>
                      <p className={styles.holdingName}>{h.stockName || h.ticker}</p>
                      <p className={styles.holdingQty}>
                        {h.quantity}주 · 평균 {formatPrice(h.averagePurchasePrice)}
                      </p>
                      <p className={styles.holdingCurrentPrice}>현재 {formatPrice(h.currentPrice)}</p>
                      <div className={styles.weightBarWrap}>
                        <svg className={styles.weightBarSvg} viewBox="0 0 100 3" preserveAspectRatio="none">
                          <rect className={styles.weightBarBg} x="0" y="0" width="100" height="3" rx="1.5" />
                          <rect
                            className={styles.weightBarFill}
                            data-idx={String(i % COLORS.length)}
                            x="0" y="0"
                            width={Math.min(100, h.weight)}
                            height="3"
                            rx="1.5"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className={styles.holdingRight}>
                      <p className={styles.holdingCurrent}>{formatPrice(h.evaluationAmount)}</p>
                      <p className={[
                        styles.holdingReturn,
                        h.profitRate >= 0 ? "text-up" : "text-down",
                      ].join(" ")}>
                        {h.profitRate >= 0 ? "+" : ""}{h.profitRate.toFixed(2)}%
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className={styles.bottomPad} />
        </>
      ) : null}

    </div>
  );
}
