"use client";

import { useState, use } from "react";
import Link from "next/link";
import { RiArrowLeftLine, RiHeartLine, RiHeartFill, RiShareLine } from "react-icons/ri";
import { mockStocks, mockAiAnalysis, mockNews } from "@/shared/lib/mockData";
import { formatPrice, formatChangeRate, formatVolume } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";
import { Button } from "@/shared/ui";
import styles from "./page.module.css";

interface Props { params: Promise<{ id: string }> }

export default function StockDetailPage({ params }: Props) {
  const { id } = use(params);
  const stock = mockStocks.find((s) => s.id === id) ?? mockStocks[0];
  const isAiStock = stock.id === mockAiAnalysis.stockId;
  const [isFavorite, setIsFavorite] = useState(stock.isFavorite);
  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [qty, setQty] = useState("1");
  const relatedNews = mockNews.filter((n) => n.stockId === stock.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/main/stocks" className={styles.backBtn}>
          <RiArrowLeftLine size={22} />
        </Link>
        <h1 className={styles.headerTitle}>{stock.name}</h1>
        <div className={styles.headerActions}>
          <button onClick={() => setIsFavorite(!isFavorite)} className={styles.iconBtn}>
            {isFavorite ? <RiHeartFill size={22} color="var(--color-up)" /> : <RiHeartLine size={22} />}
          </button>
          <button className={styles.iconBtn}>
            <RiShareLine size={22} />
          </button>
        </div>
      </header>

      {/* 주가 정보 */}
      <section className={styles.priceSection}>
        <div className={styles.priceMeta}>
          <Badge variant="default">{stock.market}</Badge>
          <span className={styles.stockId}>{stock.id}</span>
          <Badge variant="default">{stock.sector}</Badge>
        </div>
        <p className={styles.price}>{formatPrice(stock.price)}</p>
        <p
          className={[styles.priceChange, stock.changeRate > 0 ? "text-up" : stock.changeRate < 0 ? "text-down" : "text-neutral"].join(" ")}
        >
          {stock.change > 0 ? "+" : ""}{stock.change.toLocaleString()}원 ({formatChangeRate(stock.changeRate)})
        </p>
        <div className={styles.priceStats}>
          <div className={styles.priceStat}>
            <span className={styles.priceStatLabel}>거래량</span>
            <span className={styles.priceStatValue}>{formatVolume(stock.volume)}</span>
          </div>
          <div className={styles.priceStat}>
            <span className={styles.priceStatLabel}>시가총액</span>
            <span className={styles.priceStatValue}>{stock.marketCap}</span>
          </div>
        </div>
      </section>

      {/* 차트 placeholder */}
      <section className={styles.chartSection}>
        <div className={styles.chartTabs}>
          {["1일", "1주", "1개월", "3개월", "1년"].map((t) => (
            <button key={t} className={[styles.chartTab, t === "1개월" ? styles.chartTabActive : ""].join(" ")}>
              {t}
            </button>
          ))}
        </div>
        <div className={styles.chartPlaceholder}>
          <div className={styles.chartLine} />
          <p className={styles.chartHint}>실제 API 연결 시 차트 표시</p>
        </div>
      </section>

      {/* AI 분석 */}
      {isAiStock && (
        <section className={styles.section}>
          <div className={styles.aiCard}>
            <div className={styles.aiHeader}>
              <Badge variant="ai">AI 분석</Badge>
              <span className={styles.aiScore}>신뢰도 {mockAiAnalysis.score}점</span>
            </div>
            <p className={styles.aiRecommend}>
              투자 의견: <strong className="text-primary">{mockAiAnalysis.recommendation}</strong>
            </p>
            <p className={styles.aiSummary}>{mockAiAnalysis.summary}</p>
            <div className={styles.aiProsConsRow}>
              <div className={styles.aiProsCons}>
                <p className={[styles.aiProsConsTitle, "text-up"].join(" ")}>강점</p>
                {mockAiAnalysis.pros.map((p) => (
                  <p key={p} className={styles.aiProsConsItem}>+ {p}</p>
                ))}
              </div>
              <div className={styles.aiProsCons}>
                <p className={[styles.aiProsConsTitle, "text-down"].join(" ")}>리스크</p>
                {mockAiAnalysis.cons.map((c) => (
                  <p key={c} className={styles.aiProsConsItem}>- {c}</p>
                ))}
              </div>
            </div>
            <div className={styles.aiTargetRow}>
              <span className={styles.aiTargetLabel}>목표가</span>
              <span className={styles.aiTargetValue}>{formatPrice(mockAiAnalysis.targetPrice)}</span>
              <span className={[styles.aiTargetUpside, "text-up"].join(" ")}>
                +{(((mockAiAnalysis.targetPrice - mockAiAnalysis.currentPrice) / mockAiAnalysis.currentPrice) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 관련 뉴스 */}
      {relatedNews.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>관련 뉴스</h2>
          {relatedNews.map((n) => (
            <div key={n.id} className={styles.newsItem}>
              <div className={styles.newsTop}>
                <Badge variant={n.sentiment === "positive" ? "up" : "down"}>
                  {n.sentiment === "positive" ? "긍정" : "부정"}
                </Badge>
                <span className={styles.newsTime}>{n.publishedAt}</span>
              </div>
              <p className={styles.newsTitle}>{n.title}</p>
              <p className={styles.newsSummary}>{n.summary}</p>
            </div>
          ))}
        </section>
      )}

      {/* 매수/매도 버튼 */}
      <div className={styles.tradeBar}>
        <Button variant="outline" size="lg" onClick={() => { setShowSell(true); setShowBuy(false); }}>
          매도
        </Button>
        <Button variant="primary" size="lg" onClick={() => { setShowBuy(true); setShowSell(false); }}>
          매수
        </Button>
      </div>

      {/* 매수/매도 모달 */}
      {(showBuy || showSell) && (
        <div className={styles.modal} onClick={() => { setShowBuy(false); setShowSell(false); }}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />
            <h3 className={styles.modalTitle}>{stock.name} {showBuy ? "매수" : "매도"}</h3>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>현재가</span>
              <span className={styles.modalValue}>{formatPrice(stock.price)}</span>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>수량</span>
              <div className={styles.qtyRow}>
                <button className={styles.qtyBtn} onClick={() => setQty(String(Math.max(1, Number(qty) - 1)))}>-</button>
                <input
                  className={styles.qtyInput}
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/\D/g, "") || "1")}
                />
                <button className={styles.qtyBtn} onClick={() => setQty(String(Number(qty) + 1))}>+</button>
              </div>
            </div>
            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>총 금액</span>
              <span className={styles.modalTotal}>{formatPrice(stock.price * Number(qty))}</span>
            </div>
            <Button
              variant={showBuy ? "primary" : "outline"}
              size="lg"
              fullWidth
              onClick={() => { setShowBuy(false); setShowSell(false); }}
            >
              {showBuy ? "매수 주문" : "매도 주문"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
