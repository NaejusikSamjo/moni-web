"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiArrowRightSLine } from "react-icons/ri";
import styles from "./page.module.css";

type ToggleItem = {
  id: string;
  label: string;
  desc?: string;
};

const NOTIFICATION_ITEMS: ToggleItem[] = [
  { id: "notif-off",   label: "알림 끄기",          desc: "모든 푸시 알림을 끕니다" },
  { id: "night-ad",    label: "야간 광고성 수신",    desc: "오후 9시 ~ 오전 8시 광고성 알림 수신" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
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
            {NOTIFICATION_ITEMS.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemLabel}>{item.label}</span>
                  {item.desc && <span className={styles.itemDesc}>{item.desc}</span>}
                </div>
                <label className={styles.switchWrap} aria-label={item.label}>
                  <input
                    type="checkbox"
                    className={styles.switchInput}
                    checked={toggles[item.id] ?? false}
                    onChange={() => toggle(item.id)}
                  />
                  <span className={styles.switchSlider} />
                </label>
              </div>
            ))}
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
