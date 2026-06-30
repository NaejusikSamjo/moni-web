"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RiCloseCircleFill } from "react-icons/ri";
import styles from "./page.module.css";

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "카드 등록에 실패했습니다.";

  return (
    <div className={styles.page}>
      <RiCloseCircleFill size={56} className={styles.icon} />
      <p className={styles.title}>카드 등록에 실패했어요</p>
      <p className={styles.desc}>{message}</p>
      <button className={styles.btn} onClick={() => router.replace("/main/mypage/subscription")}>
        돌아가기
      </button>
    </div>
  );
}
