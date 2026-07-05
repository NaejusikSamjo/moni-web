"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiNotification3Line, RiSettings3Line, RiMenuLine, RiArrowRightSLine,
  RiArrowUpSLine, RiArrowDownSLine, RiCloseLine, RiAddLine,
} from "react-icons/ri";
import { useAuth } from "@/features/auth";
import { ServiceUnavailable, StockLogo, Skeleton, MarkdownText } from "@/shared/ui";
import { stockApi } from "@/entities/stock";
import { tradeApi } from "@/entities/trade";
import { portfolioApi } from "@/entities/portfolio";
import { paymentApi } from "@/entities/payment";
import { aiApi, MARKET_KEYWORDS } from "@/entities/ai";
import { RiLoaderLine } from "react-icons/ri";
import { formatPrice, formatChangeRate } from "@/shared/lib/format";
import type { TopVolumeStockItem, ThemeRankingResponse } from "@/entities/stock";
import type { PortfolioAssetResponse } from "@/entities/portfolio";
import type { MarketKeyword } from "@/entities/ai";
import styles from "./page.module.css";

type FeedItem = {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  isExiting: boolean;
};

const DEFAULT_FEED: FeedItem[] = [
  { id: "asset",    title: "총 자산 현황",    order: 0, visible: true, isExiting: false },
  { id: "popular",  title: "실시간 인기 종목", order: 1, visible: true, isExiting: false },
  { id: "theme",    title: "오늘의 지수",     order: 2, visible: true, isExiting: false },
  { id: "news",     title: "뉴스 피드",       order: 3, visible: true, isExiting: false },
  { id: "news-ai",  title: "AI 뉴스 요약",   order: 4, visible: true, isExiting: false },
];

const STORAGE_KEY = "dashboard-feed-v2";

function AssetSkeleton() {
  return (
    <div className={styles.skelCard}>
      <div className={styles.skelHeaderRow}>
        <div className={styles.skelCol}>
          <Skeleton width={44} height={11} />
          <Skeleton width={120} height={22} />
        </div>
        <div className={styles.skelVDivider} />
        <div className={styles.skelCol}>
          <Skeleton width={44} height={11} />
          <Skeleton width={100} height={22} />
        </div>
      </div>
      <Skeleton height={38} />
    </div>
  );
}

function PopularSkeleton() {
  return (
    <div className={styles.skelList}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skelPopularRow}>
          <div className={styles.skelPopularLeft}>
            <Skeleton width={16} height={16} />
            <Skeleton width={36} height={36} borderRadius="50%" />
            <div className={styles.skelInfo}>
              <Skeleton width={90} height={14} />
              <Skeleton width={50} height={11} />
            </div>
          </div>
          <Skeleton width={70} height={16} />
        </div>
      ))}
    </div>
  );
}

function ThemeSkeleton() {
  return (
    <div className={styles.skelList}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skelThemeRow}>
          <div className={styles.skelThemeLeft}>
            <Skeleton width={110} height={14} />
            <Skeleton width={70} height={11} />
          </div>
          <div className={styles.skelThemeRight}>
            <Skeleton width={60} height={14} />
            <Skeleton width={48} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetSection({ assets }: { assets: PortfolioAssetResponse }) {
  const isPositive = assets.totalProfitLoss >= 0;
  return (
    <Link href="/main/mypage/holdings" className={styles.assetCard}>
      <div className={styles.assetRow}>
        <div className={styles.assetItem}>
          <span className={styles.assetLabel}>총 자산</span>
          <span className={styles.assetValue}>{formatPrice(assets.totalAsset)}</span>
        </div>
        <div className={styles.assetDivider} />
        <div className={styles.assetItem}>
          <span className={styles.assetLabel}>가용 현금</span>
          <span className={styles.assetValue}>{formatPrice(assets.cashBalance)}</span>
        </div>
      </div>
      <div className={styles.assetReturnRow}>
        <span className={styles.assetReturnLabel}>평가 손익</span>
        <span className={[styles.assetReturnValue, isPositive ? "text-up" : "text-down"].join(" ")}>
          {isPositive ? "+" : ""}{formatPrice(assets.totalProfitLoss)}
        </span>
        <span className={[styles.assetReturnRate, isPositive ? "text-up" : "text-down"].join(" ")}>
          {formatChangeRate(assets.totalReturnRate)}
        </span>
      </div>
    </Link>
  );
}

function ThemeSection({ themes }: { themes: ThemeRankingResponse[] }) {
  return (
    <div className={styles.themeList}>
      {themes.map((theme) => {
        const rate = parseFloat(theme.changeRate);
        const rateClass = rate > 0 ? "text-up" : rate < 0 ? "text-down" : "";
        const rateSign = rate > 0 ? "+" : "";
        return (
          <div key={theme.themeCode} className={styles.themeItem}>
            <div className={styles.themeInfo}>
              <p className={styles.themeName}>{theme.themeName}</p>
              <p className={styles.themeMeta}>거래량 {theme.volume.toLocaleString()}</p>
            </div>
            <div className={styles.themePriceBlock}>
              <p className={styles.themeIndex}>{theme.currentIndex}</p>
              <p className={[styles.themeRate, rateClass].join(" ")}>
                {rateSign}{theme.changeRate}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function MarketNewsSection() {
  const [selectedKeyword, setSelectedKeyword] = useState<MarketKeyword | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSelect = async (keyword: MarketKeyword) => {
    if (loading) return;
    setSelectedKeyword(keyword);
    setSummary(null);
    setError(false);
    setLoading(true);
    try {
      const res = await aiApi.createMarketAnalysis(keyword);
      setSummary(res.summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.marketNewsCard}>
      <div className={styles.marketKeywordRow}>
        {MARKET_KEYWORDS.map(({ value, label }) => (
          <button
            key={value}
            className={[
              styles.marketKeywordChip,
              selectedKeyword === value ? styles.marketKeywordChipActive : "",
            ].join(" ")}
            onClick={() => { void handleSelect(value); }}
            disabled={loading}
          >
            {label}
          </button>
        ))}
      </div>
      {loading && (
        <div className={styles.marketLoading}>
          <RiLoaderLine size={16} className={styles.spinner} />
          <span>AI가 뉴스를 분석하는 중...</span>
        </div>
      )}
      {!loading && error && (
        <p className={styles.marketError}>분석 결과를 불러오지 못했어요</p>
      )}
      {!loading && summary && (
        <div className={styles.marketSummary}>
          <MarkdownText text={summary} />
        </div>
      )}
      {!loading && !summary && !error && !selectedKeyword && (
        <p className={styles.marketHint}>키워드를 선택하면 AI가 시장 뉴스를 분석해드려요</p>
      )}
    </div>
  );
}

function PopularSection({ stocks }: { stocks: TopVolumeStockItem[] }) {
  return (
    <div className={styles.popularList}>
      {stocks.slice(0, 5).map((stock) => (
        <Link href={`/main/stocks/${stock.ticker}`} key={stock.ticker} className={styles.popularItem}>
          <div className={styles.popularLeft}>
            <span className={styles.popularRank}>{stock.rank}</span>
            <StockLogo code={stock.ticker} name={stock.name} size={36} />
            <div className={styles.popularInfo}>
              <p className={styles.popularName}>{stock.name}</p>
              <p className={styles.popularMeta}>거래량 {stock.volume.toLocaleString()}</p>
            </div>
          </div>
          <div className={styles.popularPriceBlock}>
            <p className={styles.popularPrice}>{formatPrice(stock.price)}</p>
            <p className={styles.popularVolume}>{stock.ticker}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const displayName = (user?.nickname ?? user?.name ?? "사용자").split("#")[0];
  const [plan, setPlan] = useState<"free" | "ai-plus" | null>(null);

  const [feed, setFeed] = useState<FeedItem[]>(DEFAULT_FEED);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);

  const [popularStocks, setPopularStocks] = useState<TopVolumeStockItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [themes, setThemes] = useState<ThemeRankingResponse[]>([]);
  const [themesLoading, setThemesLoading] = useState(true);
  const [assets, setAssets] = useState<PortfolioAssetResponse | null | undefined>(undefined);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: FeedItem[] = JSON.parse(saved);
        const merged = DEFAULT_FEED.map((def) => {
          const p = parsed.find((s) => s.id === def.id);
          return p ? { ...def, order: p.order, visible: p.visible } : def;
        });
        setFeed(merged);
      }
    } catch { /* ignore */ }

    stockApi.getTopVolume().then((res) => setPopularStocks(res.stocks ?? [])).catch(() => {}).finally(() => setPopularLoading(false));
    stockApi.getThemes().then(setThemes).catch(() => {}).finally(() => setThemesLoading(false));
    portfolioApi.getAssets().then(setAssets).catch(() => setAssets(null));
    paymentApi.getSubscriptionStatus()
      .then((res) => { setPlan(res.subscribed ? "ai-plus" : "free"); })
      .catch(() => { setPlan("free"); });
  }, []);

  const handleCreateAccount = async () => {
    setCreatingAccount(true);
    try {
      await tradeApi.createAccount();
      const newAssets = await portfolioApi.getAssets();
      setAssets(newAssets);
    } catch { /* ignore */ } finally {
      setCreatingAccount(false);
    }
  };

  const save = (items: FeedItem[]) => {
    setFeed(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  };

  const removeSection = (id: string) => {
    setFeed(prev => prev.map(f => f.id === id ? { ...f, isExiting: true } : f));
    setTimeout(() => {
      save(feed.map(f => f.id === id ? { ...f, visible: false, isExiting: false } : f));
    }, 260);
  };

  const addSection = (id: string) => {
    const maxOrder = Math.max(...feed.filter(f => f.visible).map(f => f.order), -1);
    save(feed.map(f => f.id === id ? { ...f, visible: true, order: maxOrder + 1, isExiting: false } : f));
  };

  const moveUp = (id: string) => {
    const visible = [...feed.filter(f => f.visible)].sort((a, b) => a.order - b.order);
    const idx = visible.findIndex(f => f.id === id);
    if (idx <= 0) return;
    const [a, b] = [visible[idx], visible[idx - 1]];
    save(feed.map(f => {
      if (f.id === a.id) return { ...f, order: b.order };
      if (f.id === b.id) return { ...f, order: a.order };
      return f;
    }));
  };

  const moveDown = (id: string) => {
    const visible = [...feed.filter(f => f.visible)].sort((a, b) => a.order - b.order);
    const idx = visible.findIndex(f => f.id === id);
    if (idx >= visible.length - 1) return;
    const [a, b] = [visible[idx], visible[idx + 1]];
    save(feed.map(f => {
      if (f.id === a.id) return { ...f, order: b.order };
      if (f.id === b.id) return { ...f, order: a.order };
      return f;
    }));
  };

  const sectionContent = (id: string) => {
    switch (id) {
      case "asset":
        if (assets === undefined) return <AssetSkeleton />;
        if (!assets) return <ServiceUnavailable message="총 자산 현황을 불러올 수 없습니다" />;
        return <AssetSection assets={assets} />;
      case "popular":
        if (popularLoading) return <PopularSkeleton />;
        if (!popularStocks.length) return <ServiceUnavailable message="인기 종목 정보를 불러올 수 없습니다" />;
        return <PopularSection stocks={popularStocks} />;
      case "theme":
        if (themesLoading) return <ThemeSkeleton />;
        if (!themes.length) return <ServiceUnavailable message="테마 정보를 불러올 수 없습니다" />;
        return <ThemeSection themes={themes} />;
      case "news-ai":
        return <MarketNewsSection />;
      default: {
        const msgs: Record<string, string> = {
          news: "뉴스 피드를 불러올 수 없습니다",
        };
        return <ServiceUnavailable message={msgs[id] ?? "불러올 수 없습니다"} />;
      }
    }
  };

  const visibleFeed = [...feed.filter(f => f.visible)].sort((a, b) => a.order - b.order);
  const hiddenFeed  = feed.filter(f => !f.visible);

  return (
    <div className="app-page">
      <div className={styles.topBar}>
        <label className={styles.editToggleWrap} aria-label="피드 편집 모드">
          <span className={styles.editToggleLabel}>편집</span>
          <div className={styles.switchWrap}>
            <input
              type="checkbox"
              className={styles.switchInput}
              checked={isEditMode}
              onChange={e => {
                if (!e.target.checked) {
                  setIsEditClosing(true);
                  setTimeout(() => { setIsEditMode(false); setIsEditClosing(false); }, 220);
                } else {
                  setIsEditMode(true);
                }
              }}
            />
            <span className={styles.switchSlider} />
          </div>
        </label>

        <div className={styles.topBarRight}>
          <Link href="/main/notifications" className={styles.iconBtn} aria-label="알림">
            <RiNotification3Line size={22} />
          </Link>
          <Link href="/main/mypage/settings" className={styles.iconBtn} aria-label="환경설정">
            <RiSettings3Line size={22} />
          </Link>
          <Link href="/main/mypage" className={styles.iconBtn} aria-label="메뉴">
            <RiMenuLine size={22} />
          </Link>
        </div>
      </div>

      <div className={styles.greeting}>
        {isLoading ? (
          <>
            <div className={styles.skeletonName} />
            <div className={styles.skeletonSub} />
            <div className={styles.skeletonCard} />
          </>
        ) : (
          <>
            <div className={styles.nameRow}>
              <span className={styles.greetingName}>
                {displayName}<span className={styles.greetingNim}>님</span>
              </span>
              {plan !== null && (
                <span className={styles.planBadge} data-plan={plan}>
                  {plan === "free" ? "free" : "AI+"}
                </span>
              )}
            </div>
            <p className={styles.greetingSub}>좋은 하루 보내세요 ☀️</p>

            {assets === null && (
              <button
                className={styles.feedCard}
                onClick={handleCreateAccount}
                disabled={creatingAccount}
              >
                <div>
                  <p className={styles.feedCardTitle}>
                    {creatingAccount ? "계좌 생성 중..." : "빠르게 모의투자 계좌 생성하기"}
                  </p>
                  <p className={styles.feedCardDesc}>지금 바로 모의 투자를 시작해보세요</p>
                </div>
                <RiArrowRightSLine size={20} className={styles.feedCardArrow} />
              </button>
            )}
          </>
        )}
      </div>

      {visibleFeed.map((item, idx) => (
        <div
          key={item.id}
          className={[styles.feedSection, item.isExiting ? styles.feedSectionExit : ""].join(" ")}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>{item.title}</span>
            {(isEditMode || isEditClosing) && (
              <div className={[styles.editBarActions, isEditClosing ? styles.editActionsExit : ""].join(" ")}>
                <button
                  className={styles.editBtn}
                  onClick={() => moveUp(item.id)}
                  disabled={idx === 0}
                  aria-label="위로"
                >
                  <RiArrowUpSLine size={18} />
                </button>
                <button
                  className={styles.editBtn}
                  onClick={() => moveDown(item.id)}
                  disabled={idx === visibleFeed.length - 1}
                  aria-label="아래로"
                >
                  <RiArrowDownSLine size={18} />
                </button>
                {item.id !== "asset" && (
                  <button
                    className={[styles.editBtn, styles.editBtnRemove].join(" ")}
                    onClick={() => removeSection(item.id)}
                    aria-label="제거"
                  >
                    <RiCloseLine size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="app-section">
            {sectionContent(item.id)}
          </div>
        </div>
      ))}

      {(isEditMode || isEditClosing) && hiddenFeed.length > 0 && (
        <div className={[styles.hiddenWrap, isEditClosing ? styles.hiddenWrapExit : ""].join(" ")}>
          <p className={styles.hiddenLabel}>숨겨진 섹션</p>
          <div className={styles.hiddenList}>
            {hiddenFeed.map(item => (
              <button key={item.id} className={styles.hiddenItem} onClick={() => addSection(item.id)}>
                <span className={styles.hiddenItemTitle}>{item.title}</span>
                <RiAddLine size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.bottomPad} />
    </div>
  );
}
