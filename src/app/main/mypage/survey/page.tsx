"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from "react-icons/ri";
import { Button } from "@/shared/ui";
import { userApi } from "@/features/auth/api/userApi";
import { useAuth, TendencySurvey } from "@/features/auth";
import { ApiException } from "@/shared/api/types";
import styles from "./page.module.css";

const interestOptions = ["반도체", "IT/플랫폼", "바이오", "배터리", "금융", "에너지", "소비재", "해외주식"];

export default function SurveyPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [surveyDone, setSurveyDone] = useState(false);
  const [surveyScore, setSurveyScore] = useState<number | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(item)) { next.delete(item); } else { next.add(item); }
      return next;
    });
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
      router.push("/main/mypage");
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          {[1, 2].map((s) => (
            <div key={s} className={[styles.step, s <= step ? styles.stepActive : ""].join(" ")} />
          ))}
        </div>
      </header>

      {step === 1 && (
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
              setStep(2);
            }}
            onResult={() => setSurveyDone(true)}
            loading={loading}
          />
        </div>
      )}

      {step === 2 && (
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
              {loading ? "저장 중..." : "완료"}
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
