"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RiUser3Line, RiBarChartLine, RiBankCardLine, RiQuestionLine, RiArrowRightSLine, RiGoogleLine, RiSettings3Line } from "react-icons/ri";
import { RiKakaoTalkFill } from "react-icons/ri";
import { useAuth, userApi } from "@/features/auth";
import { Badge, Skeleton } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import { tradeApi } from "@/entities/trade";
import { formatPrice } from "@/shared/lib/format";
import type { AccountResponse } from "@/entities/trade";
import styles from "./page.module.css";

const TENDENCY_LABEL: Record<string, string> = {
  AGGRESSIVE: "공격투자형",
  ACTIVE: "적극투자형",
  NEUTRAL: "위험중립형",
  STABLE: "안정추구형",
  SAFE: "안전형",
};

export default function MyPage() {
  const { user, isLoading, logout } = useAuth();
  const [tendencyLabel, setTendencyLabel] = useState<string | null | undefined>(undefined);
  const [account, setAccount] = useState<AccountResponse | null | undefined>(undefined);

  useEffect(() => {
    userApi.getTendency()
      .then((res) => setTendencyLabel(TENDENCY_LABEL[res.type] ?? "설문 완료"))
      .catch(() => setTendencyLabel(null));
    tradeApi.getAccount().then(setAccount).catch(() => setAccount(null));
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const joinDate = user?.createdAt ? user.createdAt.slice(0, 10).replace(/-/g, ".") : "";
  const providerLabel = user?.provider === "GOOGLE" ? "Google 계정"
    : user?.provider === "KAKAO" ? "카카오 계정"
    : "통합 회원";
  const ProviderIcon = user?.provider === "GOOGLE" ? RiGoogleLine
    : user?.provider === "KAKAO" ? RiKakaoTalkFill
    : null;

  return (
    <div className="app-page">
      <PageHeader title="마이" />

      {/* 프로필 카드 */}
      <section className={styles.profileCard}>
        {isLoading ? (
          <>
            <Skeleton className={styles.skeletonAvatar} />
            <div className={styles.profileInfo}>
              <Skeleton className={styles.skeletonName} />
              <Skeleton className={styles.skeletonEmail} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.avatar}><RiUser3Line size={30} color="white" /></div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{user?.name ?? "사용자"}</p>
              <p className={styles.profileEmail}>{user?.email ?? ""}</p>
              <div className={styles.profileBadges}>
                <span className={styles.providerBadge} data-provider={user?.provider ?? "default"}>
                  {ProviderIcon && <ProviderIcon size={12} />}
                  {providerLabel}
                </span>
                {joinDate && <span className={styles.joinDate}>{joinDate} 가입</span>}
              </div>
            </div>
          </>
        )}
      </section>

      {/* 자산 요약 */}
      {account === undefined ? (
        <div className={`${styles.assetSummary} ${styles.noPointerEvents}`}>
          <div className={styles.assetItem}>
            <Skeleton width={40} height={11} />
            <Skeleton width={88} height={18} />
          </div>
          <div className={styles.assetDivider} />
          <div className={styles.assetItem}>
            <Skeleton width={50} height={11} />
            <Skeleton width={76} height={18} />
          </div>
          <div className={styles.assetDivider} />
          <div className={styles.assetItem}>
            <Skeleton width={34} height={11} />
            <Skeleton width={76} height={18} />
          </div>
        </div>
      ) : account === null ? null : (
        <Link href="/main/mypage/holdings" className={styles.assetSummary}>
          <div className={styles.assetItem}>
            <span className={styles.assetLabel}>총 자산</span>
            <span className={styles.assetValue}>
              {formatPrice(account.balance + account.totalInvestment)}
            </span>
          </div>
          <div className={styles.assetDivider} />
          <div className={styles.assetItem}>
            <span className={styles.assetLabel}>가용 현금</span>
            <span className={styles.assetValue}>{formatPrice(account.balance)}</span>
          </div>
          <div className={styles.assetDivider} />
          <div className={styles.assetItem}>
            <span className={styles.assetLabel}>투자금</span>
            <span className={styles.assetValue}>{formatPrice(account.totalInvestment)}</span>
          </div>
        </Link>
      )}

      {/* 메뉴 */}
      <section className={styles.menuSection}>
        {[
          { icon: RiUser3Line, label: "내 정보 수정", href: "/main/mypage/profile" },
          { icon: RiBarChartLine, label: "투자 성향 설문", href: "/main/mypage/survey", badge: tendencyLabel },
          { icon: RiSettings3Line, label: "앱 설정", href: "/main/mypage/settings" },
          { icon: RiBankCardLine, label: "구독 관리", href: "/main/mypage/subscription" },
          { icon: RiQuestionLine, label: "고객센터", href: "/main/mypage/support" },
        ].map(({ icon: Icon, label, href, badge }) => (
          <Link key={href} href={href} className={styles.menuItem}>
            <div className={styles.menuIconWrap}>
              <Icon size={20} color="var(--color-primary)" />
            </div>
            <span className={styles.menuLabel}>{label}</span>
            {label === "투자 성향 설문" ? (
              badge === undefined
                ? <Skeleton width={48} height={22} borderRadius="999px" />
                : badge
                  ? <Badge variant="primary">{badge}</Badge>
                  : null
            ) : (
              badge && <Badge variant="primary">{badge}</Badge>
            )}
            <RiArrowRightSLine size={18} color="var(--color-text-muted)" />
          </Link>
        ))}
      </section>

      <div className={styles.logoutSection}>
        <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
      </div>
    </div>
  );
}
