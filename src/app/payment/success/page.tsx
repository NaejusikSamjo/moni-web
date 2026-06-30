"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiLoaderLine, RiCheckboxCircleFill, RiCloseCircleFill } from "react-icons/ri";
import { paymentApi } from "@/entities/payment";
import { ApiException } from "@/shared/api/types";
import styles from "./page.module.css";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);

  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const authKey = searchParams.get("authKey");
    const customerKey = searchParams.get("customerKey");

    if (!authKey || !customerKey) {
      setState("error");
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      return;
    }

    paymentApi
      .subscribe({ authKey, customerKey, amount: 9900, orderName: "모니 AI 구독" })
      .then(() => setState("success"))
      .catch((err) => {
        setState("error");
        setErrorMsg(err instanceof ApiException ? err.message : "결제 처리 중 오류가 발생했습니다.");
      });
  }, [searchParams]);

  return (
    <div className={styles.page}>
      {state === "loading" && (
        <>
          <RiLoaderLine size={48} className={styles.spinner} />
          <p className={styles.msg}>결제를 처리하고 있어요...</p>
        </>
      )}
      {state === "success" && (
        <>
          <RiCheckboxCircleFill size={56} className={styles.iconSuccess} />
          <p className={styles.title}>구독이 시작되었어요!</p>
          <p className={styles.desc}>모니 AI 기능을 자유롭게 사용해보세요.</p>
          <button className={styles.btn} onClick={() => router.replace("/main/mypage/subscription")}>
            구독 관리로 이동
          </button>
        </>
      )}
      {state === "error" && (
        <>
          <RiCloseCircleFill size={56} className={styles.iconError} />
          <p className={styles.title}>결제에 실패했어요</p>
          <p className={styles.desc}>{errorMsg}</p>
          <button className={styles.btn} onClick={() => router.replace("/main/mypage/subscription")}>
            돌아가기
          </button>
        </>
      )}
    </div>
  );
}
