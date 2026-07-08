"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { RiKakaoTalkFill, RiGoogleLine, RiArrowLeftLine, RiArrowRightLine, RiLoaderLine, RiCheckboxCircleFill } from "react-icons/ri";
import { Button } from "@/shared/ui";
import { authApi } from "@/features/auth/api/authApi";
import { userApi } from "@/entities/user";
import { ApiException } from "@/shared/api/types";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  savePendingOAuth,
} from "@/features/auth/lib/pkce";
import { useAuth, TendencySurvey } from "@/features/auth";
import type { OAuthProvider } from "@/entities/user";
import styles from "./page.module.css";

const interestOptions = ["반도체", "IT/플랫폼", "바이오", "배터리", "금융", "에너지", "소비재", "해외주식"];

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [surveyDone, setSurveyDone] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [surveyScore, setSurveyScore] = useState<number | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && step === 1) {
      router.replace("/main/dashboard");
    }
  }, [isAuthenticated, authLoading, router, step]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(item)) { next.delete(item); } else { next.add(item); }
      return next;
    });
  };

  const handleEmailSignup = async () => {
    if (!name || !email || !password) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.signup({ email, password, name, ...(phone ? { phone } : {}) });
      await authApi.login({ email, password });
      await refreshUser();
      setStep(2);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: OAuthProvider) => {
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

  const handleFinish = async () => {
    if (surveyScore === null) return;
    setError(null);
    setLoading(true);
    try {
      await userApi.saveTendency({ score: surveyScore });
      if (selectedInterests.size > 0) {
        await userApi.saveInterests({ categories: [...selectedInterests] });
      }
      await refreshUser();
      setShowComplete(true);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("설정 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || !!socialLoading;

  if (showComplete) {
    return (
      <div className={styles.page}>
        <div className={styles.completePage}>
          <RiCheckboxCircleFill size={64} className={styles.completeIcon} />
          <h1 className={styles.completeTitle}>준비가 완료되었어요!</h1>
          <p className={styles.completeDesc}>시작해볼까요?</p>
          <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/main/dashboard")}>
            시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
        >
          <RiArrowLeftLine size={22} />
        </button>
        <div className={styles.steps}>
          {[1, 2, 3].map((s) => (
            <div key={s} className={[styles.step, s <= step ? styles.stepActive : ""].join(" ")} />
          ))}
        </div>
      </header>

      {step === 1 && (
        <div className={styles.content}>
          <h1 className={styles.stepTitle}>계정을 만들어요</h1>
          <p className={styles.stepDesc}>소셜 계정이나 이메일로 가입하세요</p>

          <div className={styles.socialButtons}>
            <button
              className={styles.kakaoBtn}
              onClick={() => handleSocialSignup("KAKAO")}
              disabled={isBusy}
            >
              <RiKakaoTalkFill size={20} />
              {socialLoading === "KAKAO" ? "연결 중..." : "카카오로 가입하기"}
            </button>
            <button
              className={styles.googleBtn}
              onClick={() => handleSocialSignup("GOOGLE")}
              disabled={isBusy}
            >
              <RiGoogleLine size={18} />
              {socialLoading === "GOOGLE" ? "연결 중..." : "Google로 가입하기"}
            </button>
          </div>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>이메일로 가입</span>
            <div className={styles.dividerLine} />
          </div>

          <div className={styles.form}>
            {error && <p className={styles.errorBox}>{error}</p>}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>이름</label>
              <input
                className={styles.input}
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>이메일</label>
              <input
                className={styles.input}
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>비밀번호</label>
              <input
                className={styles.input}
                type="password"
                placeholder="8자 이상, 영문/숫자/특수문자 포함"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                전화번호 <span className={styles.labelOptional}>(선택)</span>
              </label>
              <input
                className={styles.input}
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={handlePhoneChange}
                disabled={isBusy}
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleEmailSignup}
              disabled={isBusy}
            >
              {loading ? <RiLoaderLine size={18} className={styles.spinner} /> : (
                <>다음 <RiArrowRightLine size={16} /></>
              )}
            </Button>
          </div>

          <div className={styles.links}>
            <span className={styles.linksText}>이미 계정이 있으신가요?</span>
            <Link href="/auth/login" className={styles.loginLink}>로그인</Link>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.content}>
          <h1 className={styles.stepTitle}>
            {surveyDone ? "측정이 완료되었어요!" : "투자 성향을 알려주세요"}
          </h1>
          <p className={styles.stepDesc}>
            {surveyDone ? "" : "질문에 답하고 나의 투자 스타일을 찾아보세요"}
          </p>
          <TendencySurvey
            onComplete={(score) => {
              setSurveyScore(score);
              setStep(3);
            }}
            onResult={() => setSurveyDone(true)}
            loading={loading}
          />
        </div>
      )}

      {step === 3 && (
        <div className={styles.content}>
          <h1 className={styles.stepTitle}>관심 섹터를 선택하세요</h1>
          <p className={styles.stepDesc}>복수 선택 가능해요</p>
          {error && <p className={styles.errorBox}>{error}</p>}
          <div className={styles.interestGrid}>
            {interestOptions.map((item) => (
              <button
                key={item}
                className={[styles.interestBtn, selectedInterests.has(item) ? styles.interestBtnActive : ""].join(" ")}
                onClick={() => toggleInterest(item)}
                disabled={loading}
              >
                {item}
              </button>
            ))}
          </div>
          <div className={styles.stickyAction}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? <RiLoaderLine size={18} className={styles.spinner} /> : "완료"}
            </Button>
            <button
              className={styles.skipBtn}
              onClick={handleFinish}
              disabled={loading}
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
