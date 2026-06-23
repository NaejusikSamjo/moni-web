"use client";

import { useRouter } from "next/navigation";
import { RiBellLine, RiCloseLine } from "react-icons/ri";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import { ServiceUnavailable } from "@/shared/ui";
import styles from "./page.module.css";

export default function NotificationsPage() {
  const router = useRouter();

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
        <RiBellLine size={16} color="var(--color-primary)" />
        <p className={styles.settingsText}>미장 개장 전 알림, 목표가 도달 알림을 설정하세요</p>
        <button className={styles.settingsBtn}>설정</button>
      </div>

      <div className={styles.unavailWrap}>
        <ServiceUnavailable message="알림 서비스가 일시적으로 불안정합니다" />
      </div>
    </div>
  );
}
