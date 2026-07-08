"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiArrowRightSLine } from "react-icons/ri";
import { useNotification } from "@/features/notification";
import styles from "./page.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { isDisabled, nightAd, setDisabled, setNightAd, requestPermission } = useNotification();

  const handleNotifToggle = async () => {
    if (isDisabled) {
      const granted = await requestPermission();
      if (!granted) return;
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로">
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>설정</span>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <p className={styles.sectionTitle}>알림</p>
          <div className={styles.itemList}>
            <div className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemLabel}>알림 활성화</span>
                <span className={styles.itemDesc}>모든 푸시 알림을 받습니다</span>
              </div>
              <label className={styles.switchWrap} aria-label="알림 활성화">
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  checked={!isDisabled}
                  onChange={handleNotifToggle}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            <div className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemLabel}>야간 광고성 수신</span>
                <span className={styles.itemDesc}>오후 9시 ~ 오전 8시 광고성 알림 수신</span>
              </div>
              <label className={styles.switchWrap} aria-label="야간 광고성 수신">
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  checked={nightAd}
                  onChange={() => setNightAd(!nightAd)}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionTitle}>앱 정보</p>
          <div className={styles.itemList}>
            <Link href="/main/mypage/licenses" className={styles.linkItem}>
              <span className={styles.itemLabel}>오픈소스 라이선스</span>
              <RiArrowRightSLine size={18} className={styles.chevron} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
