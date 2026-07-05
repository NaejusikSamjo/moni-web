"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiArrowLeftLine,
  RiLoaderLine,
  RiCheckboxCircleFill,
  RiTimeLine,
  RiCalendarLine,
  RiCoinLine,
} from "react-icons/ri";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { paymentApi } from "@/entities/payment";
import type { SubscriptionStatusResponse, PaymentHistoryItem } from "@/entities/payment";
import { useAuth } from "@/features/auth";
import { Button, Skeleton, BottomSheet } from "@/shared/ui";
import { TOSS_CLIENT_KEY } from "@/shared/config/env";
import { ApiException } from "@/shared/api/types";
import styles from "./page.module.css";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "구독 중",
  CANCELLING: "구독 취소 예정",
  CANCELLED: "구독 해지됨",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION_INITIAL: "첫 결제",
  SUBSCRIPTION_AUTO: "자동 결제",
};

function formatDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, ".");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<SubscriptionStatusResponse | null | undefined>(undefined);
  const [history, setHistory] = useState<PaymentHistoryItem[] | undefined>(undefined);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelClosing, setCancelClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    paymentApi
      .getSubscriptionStatus()
      .then(setStatus)
      .catch(() => setStatus(null));

    paymentApi
      .getHistory()
      .then((res) => setHistory(res.content))
      .catch(() => setHistory([]));
  }, []);

  const handleSubscribe = async () => {
    if (!user) return;
    setSubscribing(true);
    setError(null);
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: user.id });
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user.email,
        customerName: user.name,
      });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code !== "USER_CANCEL") {
        setError("카드 등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setSubscribing(false);
    }
  };

  const closeCancelSheet = () => {
    setCancelClosing(true);
    setTimeout(() => {
      setCancelClosing(false);
      setShowCancelSheet(false);
    }, 280);
  };

  const handleCancel = async () => {
    closeCancelSheet();
    setTimeout(async () => {
      setCancelling(true);
      setError(null);
      try {
        await paymentApi.cancelSubscription();
        const updated = await paymentApi.getSubscriptionStatus();
        setStatus(updated);
      } catch (err) {
        setError(err instanceof ApiException ? err.message : "구독 취소 중 오류가 발생했습니다.");
      } finally {
        setCancelling(false);
      }
    }, 300);
  };

  const isSubscribed = status?.subscribed && status.status === "ACTIVE";
  const isResubscribable = status?.status === "CANCELLING";
  const isCancelling = status?.status === "CANCELLING";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.replace("/main/mypage")} aria-label="뒤로가기">
          <RiArrowLeftLine size={20} />
        </button>
        <span className={styles.headerTitle}>구독 관리</span>
      </header>

      <div className={styles.content}>
        {/* 구독 상태 카드 */}
        <section className={styles.statusCard}>
          {status === undefined ? (
            <div className={styles.skelSection}>
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={24} />
              <Skeleton width={160} height={13} />
            </div>
          ) : status === null || !status.subscribed ? (
            <div className={styles.noSubscription}>
              <p className={styles.noSubTitle}>구독 중인 플랜이 없어요</p>
              <p className={styles.noSubDesc}>모니 AI 구독으로 포트폴리오 분석과 뉴스 요약을 이용해보세요.</p>
              <div className={styles.priceRow}>
                <span className={styles.price}>₩9,900</span>
                <span className={styles.pricePer}> / 월</span>
              </div>
              {error && <p className={styles.errorBox}>{error}</p>}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? <><RiLoaderLine className={styles.spinnerInline} /> 처리 중...</> : "구독 시작하기"}
              </Button>
            </div>
          ) : (
            <div className={styles.activeSubscription}>
              <div className={styles.statusBadge} data-status={status.status}>
                <RiCheckboxCircleFill size={14} />
                {STATUS_LABEL[status.status ?? ""] ?? status.status}
              </div>
              <p className={styles.planName}>모니 AI 구독</p>
              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <RiCoinLine size={15} className={styles.infoIcon} />
                  <span>월 {status.amount?.toLocaleString()}원</span>
                </div>
                {status.nextBillingDate && (
                  <div className={styles.infoRow}>
                    <RiCalendarLine size={15} className={styles.infoIcon} />
                    <span>
                      {isCancelling
                        ? `${formatDate(status.nextBillingDate)} 까지 사용 가능`
                        : `다음 결제일 ${formatDate(status.nextBillingDate)}`}
                    </span>
                  </div>
                )}
                {isCancelling && (
                  <div className={styles.infoRow}>
                    <RiTimeLine size={15} className={styles.infoIcon} />
                    <span className={styles.cancellingNote}>기간 만료 후 자동 해지</span>
                  </div>
                )}
              </div>
              {error && <p className={styles.errorBox}>{error}</p>}
              {isSubscribed && (
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setShowCancelSheet(true)}
                  disabled={cancelling}
                >
                  {cancelling ? <><RiLoaderLine className={styles.spinnerInline} /> 처리 중...</> : "구독 취소"}
                </Button>
              )}
              {isResubscribable && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? <><RiLoaderLine className={styles.spinnerInline} /> 처리 중...</> : "재구독하기"}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* 결제 내역 */}
        <section className={styles.historySection}>
          <h2 className={styles.sectionTitle}>결제 내역</h2>
          {history === undefined ? (
            [1, 2].map((i) => (
              <div key={i} className={styles.skelRow}>
                <div className={styles.skelLeft}>
                  <Skeleton width={52} height={20} borderRadius="999px" />
                  <Skeleton width={100} height={13} />
                </div>
                <Skeleton width={64} height={16} />
              </div>
            ))
          ) : history.length === 0 ? (
            <p className={styles.empty}>결제 내역이 없어요</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyLeft}>
                  <span className={styles.historyTypeBadge}>
                    {PAYMENT_TYPE_LABEL[item.paymentType] ?? item.paymentType}
                  </span>
                  <span className={styles.historyDate}>{formatDateTime(item.createdAt)}</span>
                </div>
                <span className={styles.historyAmount}>₩{item.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </section>
      </div>

      <BottomSheet
        open={showCancelSheet}
        closing={cancelClosing}
        onClose={closeCancelSheet}
        title="구독을 취소하시겠어요?"
      >
        <p className={styles.cancelDesc}>
          취소 후에도 다음 결제일까지는 계속 이용할 수 있어요.
          기간이 지나면 AI 기능이 비활성화됩니다.
        </p>
        <div className={styles.cancelActions}>
          <Button variant="secondary" size="lg" fullWidth onClick={closeCancelSheet}>
            유지하기
          </Button>
          <Button variant="danger" size="lg" fullWidth onClick={handleCancel}>
            취소하기
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
