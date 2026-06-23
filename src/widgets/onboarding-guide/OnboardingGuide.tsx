"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RiCloseLine } from "react-icons/ri";
import styles from "./OnboardingGuide.module.css";

const STORAGE_KEY = "moni_onboarding_v2";

// 단일 알약 4개 탭 — 각 탭 중심 위치
const NAV_POSITIONS = ["14%", "38%", "62%", "86%"];

const STEPS = [
  {
    navIndex: 0,
    title: "어서오세요!",
    message: "홈에서 시장 현황과\nAI 뉴스를 확인해보세요",
  },
  {
    navIndex: 1,
    title: "종목 & 모의투자",
    message: "종목 확인이나 모의투자는\n여기서 할 수 있어요",
  },
  {
    navIndex: 2,
    title: "포트폴리오",
    message: "보유중인 모의 주식항목을\n포트폴리오로 한눈에 볼 수 있어요",
  },
  {
    navIndex: 3,
    title: "이제 둘러볼까요?",
    message: "알림 설정과 내 정보도\n마이 탭에서 관리할 수 있어요",
  },
];

export function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const prevStepRef = useRef(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  const goNext = () => {
    if (animating) return;
    if (step < STEPS.length - 1) {
      prevStepRef.current = step;
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimating(false);
      }, 220);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const arrowLeft = NAV_POSITIONS[current.navIndex];

  return (
    <div className={styles.overlay}>
      <div className={[styles.bubble, animating ? styles.bubbleExit : styles.bubbleEnter].join(" ")}>
        <div className={styles.bubbleHeader}>
          <div className={styles.dots}>
            {STEPS.map((_, i) => (
              <div key={i} className={[styles.dot, i === step ? styles.dotActive : i < step ? styles.dotDone : ""].join(" ")} />
            ))}
          </div>
          <button className={styles.closeBtn} onClick={dismiss} aria-label="닫기">
            <RiCloseLine size={16} />
          </button>
        </div>

        <p className={styles.title}>{current.title}</p>
        <p className={styles.message}>{current.message}</p>

        <button className={styles.nextBtn} onClick={goNext}>
          {isLast ? "시작하기 🌱" : "다음"}
        </button>
      </div>

      <div
        className={styles.arrow}
        style={{ "--arrow-left": arrowLeft } as CSSProperties}
      />
    </div>
  );
}
