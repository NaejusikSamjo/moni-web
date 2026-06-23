"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiNotification3Line, RiSettings3Line, RiMenuLine, RiArrowRightSLine,
  RiArrowUpSLine, RiArrowDownSLine, RiCloseLine, RiAddLine,
} from "react-icons/ri";
import { useAuth } from "@/features/auth";
import { ServiceUnavailable } from "@/shared/ui";
import styles from "./page.module.css";

type FeedItem = {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  isExiting: boolean;
};

const DEFAULT_FEED: FeedItem[] = [
  { id: "asset",    title: "총 자산 현황",    order: 0, visible: true,  isExiting: false },
  { id: "index",    title: "오늘의 지수",     order: 1, visible: true,  isExiting: false },
  { id: "popular",  title: "실시간 인기 종목", order: 2, visible: true,  isExiting: false },
  { id: "news-ai",  title: "AI 뉴스 요약",   order: 3, visible: true,  isExiting: false },
  { id: "news",     title: "뉴스 피드",       order: 4, visible: true,  isExiting: false },
];

const STORAGE_KEY = "dashboard-feed-v1";

function sectionContent(id: string) {
  const map: Record<string, string> = {
    asset:    "총 자산 현황을 불러올 수 없습니다",
    index:    "시장 지수를 불러올 수 없습니다",
    popular:  "인기 종목 정보를 불러올 수 없습니다",
    "news-ai": "AI 뉴스 요약을 불러올 수 없습니다",
    news:     "뉴스 피드를 불러올 수 없습니다",
  };
  return <ServiceUnavailable message={map[id] ?? "불러올 수 없습니다"} />;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const displayName = (user?.nickname ?? user?.name ?? "사용자").split("#")[0];
  const plan: "free" | "ai-plus" = "free";

  const [feed, setFeed] = useState<FeedItem[]>(DEFAULT_FEED);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFeed(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

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

  const visibleFeed = [...feed.filter(f => f.visible)].sort((a, b) => a.order - b.order);
  const hiddenFeed  = feed.filter(f => !f.visible);

  return (
    <div className="app-page">
      {/* ── 상단 바 ── */}
      <div className={styles.topBar}>
        {/* 왼쪽: 피드 편집 토글 */}
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

        {/* 오른쪽: 아이콘 */}
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

      {/* ── 인사말 ── */}
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
              <span className={styles.planBadge} data-plan={plan}>
                {plan === "free" ? "free" : "AI 플러스"}
              </span>
            </div>
            <p className={styles.greetingSub}>좋은 하루 보내세요 ☀️</p>
            <Link href="/main/mypage/survey" className={styles.feedCard}>
              <div>
                <p className={styles.feedCardTitle}>맞춤형 피드 설정</p>
                <p className={styles.feedCardDesc}>필요한 정보만 모아보기</p>
              </div>
              <RiArrowRightSLine size={20} className={styles.feedCardArrow} />
            </Link>
          </>
        )}
      </div>

      {/* ── 피드 섹션 목록 ── */}
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

      {/* ── 숨겨진 섹션 (편집 모드) ── */}
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
