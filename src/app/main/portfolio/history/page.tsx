"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RiArrowLeftLine, RiLoaderLine } from "react-icons/ri";
import { portfolioApi } from "@/entities/portfolio";
import { MarkdownText } from "@/shared/ui";
import { formatChangeRate, formatPrice } from "@/shared/lib/format";
import type { PortfolioAnalysisResponse } from "@/entities/portfolio";
import styles from "./page.module.css";

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "완료",
  FAILED: "실패",
  PENDING: "분석 중",
};

const STATUS_CLASS: Record<string, string> = {
  SUCCESS: styles.statusSuccess,
  FAILED: styles.statusFailed,
  PENDING: styles.statusPending,
};

function formatAnalyzedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${min}`;
}

export default function PortfolioHistoryPage() {
  const [items, setItems] = useState<PortfolioAnalysisResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 0) setLoading(true); else setLoadingMore(true);
    try {
      const res = await portfolioApi.getAnalyses(pageNum, 10);
      setItems((prev) => append ? [...prev, ...res.content] : res.content);
      setPage(pageNum);
      setHasMore(!res.isLast);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { void loadPage(0, false); }, [loadPage]);

  return (
    <div className="app-page">
      <header className={styles.header}>
        <Link href="/main/portfolio" className={styles.backBtn}>
          <RiArrowLeftLine size={22} />
        </Link>
        <h1 className={styles.headerTitle}>분석 기록</h1>
        <div className={styles.headerRight} />
      </header>

      {loading ? (
        <div className={styles.loadingWrap}>
          <RiLoaderLine size={22} className={styles.spinner} />
          <p className={styles.loadingText}>불러오는 중</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>분석 기록이 없습니다</p>
          <p className={styles.emptyDesc}>포트폴리오 AI 분석을 시작해보세요</p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => {
            const isExpanded = expandedId === item.analysisId;
            return (
              <div
                key={item.analysisId}
                className={styles.item}
                onClick={() => setExpandedId(isExpanded ? null : item.analysisId)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemDate}>
                    {item.analyzedAt ? formatAnalyzedAt(item.analyzedAt) : "분석 중"}
                  </span>
                  <span className={[styles.itemStatus, STATUS_CLASS[item.status] ?? ""].join(" ")}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>
                {item.totalReturnRate !== null && (
                  <p className={[
                    styles.itemReturn,
                    item.totalReturnRate >= 0 ? "text-up" : "text-down",
                  ].join(" ")}>
                    {formatChangeRate(item.totalReturnRate)}
                  </p>
                )}
                {item.totalEvaluationAmount !== null && (
                  <p className={styles.itemEval}>{formatPrice(item.totalEvaluationAmount)}</p>
                )}
                {item.summary && (
                  <div className={[styles.itemSummary, isExpanded ? styles.itemSummaryExpanded : ""].join(" ")}>
                    <MarkdownText text={item.summary} />
                  </div>
                )}
              </div>
            );
          })}

          {hasMore && (
            <button
              className={styles.moreBtn}
              onClick={() => { void loadPage(page + 1, true); }}
              disabled={loadingMore}
            >
              {loadingMore
                ? <><RiLoaderLine size={14} className={styles.spinner} /> 불러오는 중</>
                : "더 보기"}
            </button>
          )}

          <div className={styles.bottomPad} />
        </div>
      )}
    </div>
  );
}
