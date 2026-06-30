"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RiLoaderLine } from "react-icons/ri";
import { authApi } from "@/features/auth/api/authApi";
import { userApi } from "@/entities/user";
import { useAuth } from "@/features/auth";
import { clearPendingOAuth, getPendingOAuth } from "@/features/auth/lib/pkce";
import type { OAuthProvider } from "@/entities/user";
import styles from "./page.module.css";

function CallbackContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const provider = (params.provider as string).toUpperCase() as OAuthProvider;

    if (!code || !state) {
      setError("잘못된 콜백 요청입니다.");
      return;
    }

    const pending = getPendingOAuth();
    if (!pending) {
      setError("인증 세션이 만료되었습니다. 다시 시도해주세요.");
      return;
    }

    if (pending.state !== state) {
      clearPendingOAuth();
      setError("보안 검증에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    clearPendingOAuth();

    authApi
      .socialLogin({ provider, code, codeVerifier: pending.codeVerifier })
      .then(async () => {
        await refreshUser();
        try {
          await userApi.getTendency();
          router.replace("/main/dashboard");
        } catch {
          router.replace("/main/mypage/survey");
        }
      })
      .catch((err: Error) => setError(err.message ?? "소셜 로그인에 실패했습니다."));
  }, [searchParams, params, router, refreshUser]);

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={() => router.replace("/auth/login")}>
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <RiLoaderLine size={20} className={styles.spinner} />
        <p className={styles.loadingText}>로그인 중</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.loadingWrap}>
            <RiLoaderLine size={20} className={styles.spinner} />
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
