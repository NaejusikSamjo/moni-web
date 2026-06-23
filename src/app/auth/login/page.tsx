"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiKakaoTalkFill, RiGoogleLine, RiEyeLine, RiEyeOffLine, RiArrowLeftLine } from "react-icons/ri";
import { Button } from "@/shared/ui";
import { authApi } from "@/features/auth/api/authApi";
import { ApiException } from "@/shared/api/types";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  savePendingOAuth,
} from "@/features/auth/lib/pkce";
import { useAuth } from "@/features/auth";
import type { OAuthProvider } from "@/entities/user";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/main/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.login({ email, password });
      await refreshUser();
      try {
        await authApi.getTendency();
        router.push("/main/dashboard");
      } catch {
        router.push("/main/mypage/survey");
      }
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: OAuthProvider) => {
    setError(null);
    setSocialLoading(provider);
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();
      savePendingOAuth({ codeVerifier, state });
      const { loginUrl } = await authApi.getSocialLoginUrl({ provider, codeChallenge, state });
      window.location.href = loginUrl;
    } catch (err) {
      setSocialLoading(null);
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("소셜 로그인 요청 중 오류가 발생했습니다.");
      }
    }
  };

  const isBusy = loading || !!socialLoading;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <RiArrowLeftLine size={22} />
        </Link>
      </header>

      <div className={styles.content}>
        <h1 className={styles.stepTitle}>로그인</h1>
        <p className={styles.stepDesc}>계속하려면 로그인하세요</p>

        <div className={styles.socialButtons}>
          <button
            className={styles.kakaoBtn}
            onClick={() => handleSocialLogin("KAKAO")}
            disabled={isBusy}
          >
            <RiKakaoTalkFill size={20} />
            {socialLoading === "KAKAO" ? "연결 중..." : "카카오로 계속하기"}
          </button>
          <button
            className={styles.googleBtn}
            onClick={() => handleSocialLogin("GOOGLE")}
            disabled={isBusy}
          >
            <RiGoogleLine size={18} />
            {socialLoading === "GOOGLE" ? "연결 중..." : "Google로 계속하기"}
          </button>
        </div>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>또는 이메일로 로그인</span>
          <div className={styles.dividerLine} />
        </div>

        <div className={styles.form}>
          {error && <p className={styles.errorBox}>{error}</p>}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>이메일</label>
            <input
              className={styles.input}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={isBusy}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>비밀번호</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type={showPw ? "text" : "password"}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={isBusy}
              />
              <button className={styles.eyeBtn} onClick={() => setShowPw(!showPw)} type="button">
                {showPw ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <Button variant="primary" size="lg" fullWidth onClick={handleLogin} disabled={isBusy}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
        <p className={styles.signupRow}>
          아직 계정이 없으신가요?&nbsp;
          <Link href="/auth/signup" className={styles.signupLink}>회원가입</Link>
        </p>
      </div>
    </div>
  );
}
