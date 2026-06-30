"use client";

import { useEffect, useState, useCallback, type CSSProperties } from "react";
import Link from "next/link";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import { Badge, ServiceUnavailable, StockLogo, Skeleton } from "@/shared/ui";
import { RiLoaderLine } from "react-icons/ri";
import { portfolioApi } from "@/entities/portfolio";
import { stockApi } from "@/entities/stock";
import { formatPrice, formatChangeRate } from "@/shared/lib/format";
import type { PortfolioAssetResponse, PortfolioHoldingItem } from "@/entities/portfolio";
import styles from "./page.module.css";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface EnrichedHolding extends PortfolioHoldingItem {
  name: string;
}

interface DonutProps {
  holdings: EnrichedHolding[];
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

export default function PortfolioPage() {
  const [assets, setAssets] = useState<PortfolioAssetResponse | null | undefined>(undefined);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const assetRes = await portfolioApi.getAssets();
      setAssets(assetRes);
      if (!assetRes) return;
      const res = await portfolioApi.getHoldings();
      const raw = res.content;
      const nameResults = await Promise.allSettled(
        raw.map((h) => stockApi.getStockDetail(h.ticker))
      );
      setHoldings(raw.map((h, i) => ({
        ...h,
        name: nameResults[i].status === "fulfilled"
          ? (nameResults[i].value?.name ?? h.ticker)
          : h.ticker,
      })));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCreate = async () => {
    setCreating(true);
    try { await portfolioApi.createPortfolio(); await loadData(); }
    catch { /* ignore */ } finally { setCreating(false); }
  };

  const stockWeight = holdings.reduce((s, h) => s + h.weight, 0);
  const cashWeight = assets ? Math.max(0, 100 - stockWeight) : 0;

  return (
    <div className="app-page">
      <PageHeader title="포트폴리오" />

      {loading ? (
        <div>
          {/* 자산 요약 스켈레톤 */}
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

          {/* 투자 비율 스켈레톤 */}
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
      ) : assets ? (
        <>
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
                      <span
                        className={styles.legendDot}
                        style={{ "--dot-color": COLORS[i % COLORS.length] } as CSSProperties}
                      />
                      <span className={styles.legendName}>{h.name}</span>
                      <span className={styles.legendWeight}>{h.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ "--dot-color": "#e5e7eb" } as CSSProperties} />
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
              <h2 className={styles.sectionTitle}>보유 종목</h2>
              <div className={styles.holdingsList}>
                {holdings.map((h, i) => (
                  <Link href={`/main/stocks/${h.ticker}`} key={h.ticker} className={styles.holdingItem}>
                    <StockLogo code={h.ticker} name={h.name} size={40} />
                    <div className={styles.holdingInfo}>
                      <p className={styles.holdingName}>{h.name}</p>
                      <p className={styles.holdingQty}>
                        {h.quantity}주 · 평균 {formatPrice(h.averagePurchasePrice)}
                      </p>
                      <div className={styles.weightBarWrap}>
                        <div
                          className={styles.weightBar}
                          style={{
                            "--bar-width": `${Math.min(100, h.weight)}%`,
                            "--bar-color": COLORS[i % COLORS.length],
                          } as CSSProperties}
                        />
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
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI 포트폴리오 분석 */}
          <div className={styles.section}>
            <div className={styles.aiAnalysisCard}>
              <div className={styles.aiHeader}>
                <Badge variant="ai">AI 포트폴리오 분석</Badge>
                <span className={styles.aiHint}>무료 5회</span>
              </div>
              <p className={styles.aiTitle}>내 포트폴리오 진단받기</p>
              <p className={styles.aiDesc}>
                AI가 보유 종목을 분석하고 리스크·수익률·섹터 다양성을 종합 평가합니다.
              </p>
            </div>
          </div>

          <div className={styles.bottomPad} />
        </>
      ) : null}
    </div>
  );
}
