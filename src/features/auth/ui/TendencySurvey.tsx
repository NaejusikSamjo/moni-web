"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui";
import { SURVEY_QUESTIONS, calcSurveyScore } from "@/features/auth/lib/tendencyQuestions";
import styles from "./TendencySurvey.module.css";

interface Props {
  onComplete: (score: number) => void;
  onResult?: () => void;
  loading?: boolean;
}

type TendencyInfo = {
  key: "safe" | "stable" | "neutral" | "active" | "aggressive";
  label: string;
  emoji: string;
  desc: string;
};

function getTendencyInfo(score: number): TendencyInfo {
  if (score >= 81) return { key: "aggressive", label: "공격투자형", emoji: "🚀", desc: "높은 수익을 위해 큰 리스크도 기꺼이 감수하는 투자자예요" };
  if (score >= 61) return { key: "active",     label: "적극투자형", emoji: "📈", desc: "적극적으로 수익을 추구하며 어느 정도 리스크를 감수해요" };
  if (score >= 41) return { key: "neutral",    label: "위험중립형", emoji: "⚖️", desc: "수익과 안정 사이에서 균형 잡힌 투자를 추구해요" };
  if (score >= 21) return { key: "stable",     label: "안정추구형", emoji: "🌿", desc: "안정적인 수익을 추구하며 낮은 리스크를 선호해요" };
  return              { key: "safe",        label: "안전형",    emoji: "🛡️", desc: "리스크를 최소화하고 원금 보존을 우선으로 해요" };
}

export function TendencySurvey({ onComplete, onResult, loading }: Props) {
  const [singleAnswers, setSingleAnswers] = useState<Record<number, number>>({});
  const [multiAnswers, setMultiAnswers] = useState<Set<number>>(new Set());
  const [maxVisible, setMaxVisible] = useState(1);
  const [result, setResult] = useState<{ score: number; info: TendencyInfo } | null>(null);

  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const submitRef = useRef<HTMLDivElement | null>(null);

  const reveal = (qIndex: number) => {
    if (qIndex === maxVisible - 1 && maxVisible < SURVEY_QUESTIONS.length) {
      setMaxVisible((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const idx = maxVisible - 1;
    if (idx > 0) {
      setTimeout(() => {
        questionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [maxVisible]);

  const handleSingle = (qId: number, oIdx: number, qIndex: number) => {
    if (singleAnswers[qId] === oIdx) return;
    setSingleAnswers((prev) => ({ ...prev, [qId]: oIdx }));
    reveal(qIndex);
  };

  const handleMulti = (oIdx: number, qIndex: number) => {
    if (multiAnswers.has(oIdx)) return;
    setMultiAnswers((prev) => new Set([...prev, oIdx]));
    reveal(qIndex);
  };

  const visibleQuestions = SURVEY_QUESTIONS.slice(0, maxVisible);
  const isAllAnswered = visibleQuestions.every((q) =>
    q.multi ? multiAnswers.size > 0 : singleAnswers[q.id] !== undefined
  );
  const isLast = maxVisible === SURVEY_QUESTIONS.length;
  const canSubmit = isLast && isAllAnswered;

  useEffect(() => {
    if (canSubmit) {
      setTimeout(() => {
        submitRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    }
  }, [canSubmit]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const score = calcSurveyScore(singleAnswers, multiAnswers);
    setResult({ score, info: getTendencyInfo(score) });
    onResult?.();
  };

  if (result) {
    const { score, info } = result;
    return (
      <div className={styles.resultWrap}>
        <div className={styles.resultCard} data-tendency={info.key}>
          <span className={styles.resultEmoji}>{info.emoji}</span>
          <p className={styles.resultLabel}>{info.label}</p>
          <p className={styles.resultScore}>점수 {score}점</p>
          <p className={styles.resultDesc}>{info.desc}</p>
        </div>
        <p className={styles.resultHint}>투자 성향 등록은 마이 탭에서 언제든 다시 할 수 있어요</p>
        <Button variant="primary" size="lg" fullWidth onClick={() => onComplete(score)} disabled={loading}>
          {loading ? "저장 중..." : "다음 단계로"}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {visibleQuestions.map((q, qIndex) => (
        <div
          key={q.id}
          ref={(el) => { questionRefs.current[qIndex] = el; }}
          className={styles.questionBlock}
        >
          <p className={styles.questionText}>{q.question}</p>
          <div className={q.multi ? styles.optionGrid : styles.optionList}>
            {q.options.map((opt, oIdx) => {
              const isActive = q.multi ? multiAnswers.has(oIdx) : singleAnswers[q.id] === oIdx;
              return (
                <button
                  key={oIdx}
                  className={[styles.optionBtn, isActive ? styles.optionBtnActive : ""].join(" ")}
                  onClick={() =>
                    q.multi
                      ? handleMulti(oIdx, qIndex)
                      : handleSingle(q.id, oIdx, qIndex)
                  }
                  disabled={loading}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {canSubmit && (
        <div ref={submitRef} className={styles.submitWrap}>
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
            {loading ? "저장 중..." : "결과 확인하기"}
          </Button>
        </div>
      )}
    </div>
  );
}
