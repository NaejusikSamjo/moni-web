"use client";

import { useRouter } from "next/navigation";
import { RiNotification3Line, RiCloseLine, RiSettings3Line } from "react-icons/ri";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import { useNotification } from "@/features/notification";
import { NOTIFICATION_TYPE_LABEL } from "@/entities/notification";
import styles from "./page.module.css";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return `${hh}:${mm}`;
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mo}.${dd} ${hh}:${mm}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications } = useNotification();

  return (
    <div className={styles.page}>
      <PageHeader
        title="알림"
        rightNode={
          <button className={styles.closeBtn} onClick={() => router.back()} aria-label="닫기">
            <RiCloseLine size={22} />
          </button>
        }
      />

      <div className={styles.settingsBanner}>
        <p className={styles.settingsText}>알림을 활성화해 더 빠른 소식을 전달받으세요</p>
        <button className={styles.settingsBtn} onClick={() => router.push("/main/mypage/settings")}>
          <RiSettings3Line size={12} />
          설정
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>
            <RiNotification3Line size={36} />
          </div>
          <p className={styles.emptyText}>새로운 알림이 없습니다</p>
          <p className={styles.emptyDesc}>장 시작·종료, AI 분석 완료 시 알림이 표시됩니다</p>
        </div>
      ) : (
        <div className={styles.notifList}>
          {notifications.map((n) => (
            <div key={n.id} className={[styles.notifItem, styles.notifUnread].join(" ")}>
              <div className={styles.unreadDot} />
              <div className={styles.notifContent}>
                <div className={styles.notifTop}>
                  <span className={styles.notifTitle}>{NOTIFICATION_TYPE_LABEL[n.type] ?? n.type}</span>
                  <span className={styles.notifTime}>{formatTime(n.createdAt)}</span>
                </div>
                <p className={styles.notifMessage}>{n.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
