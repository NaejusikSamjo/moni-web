"use client";

import { useState, useEffect } from "react";
import styles from "./PwaGuard.module.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function MobileGuide() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>모니</div>
        <h1 className={styles.title}>
          홈 화면에 추가하면<br />앱처럼 사용할 수 있어요
        </h1>
        <p className={styles.desc}>
          모니는 홈 화면에 추가해 앱으로 실행해야 이용 가능합니다.
        </p>
        <div className={styles.guideWrap}>
          <div className={styles.guideSection}>
            <span className={styles.sectionLabel}>iPhone / iPad</span>
            <div className={styles.stepList}>
              <div className={styles.step}>
                <span className={styles.num}>1</span>
                <span>하단 공유 버튼 탭</span>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>2</span>
                <span><b>홈 화면에 추가</b> 선택</span>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>3</span>
                <span>오른쪽 상단 <b>추가</b> 탭</span>
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.guideSection}>
            <span className={styles.sectionLabel}>Android</span>
            <div className={styles.stepList}>
              <div className={styles.step}>
                <span className={styles.num}>1</span>
                <span>브라우저 우측 상단 메뉴 탭</span>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>2</span>
                <span><b>앱 설치</b> 또는 <b>홈 화면에 추가</b> 선택</span>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>3</span>
                <span>홈 화면에서 모니 실행</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopGuide() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>모니</div>
        <h1 className={styles.title}>
          앱으로 설치하면<br />이용할 수 있어요
        </h1>
        <p className={styles.desc}>
          모니는 앱 환경에 최적화된 서비스입니다.<br />
          브라우저 주소창의 설치 버튼을 눌러 앱으로 추가해 주세요.
        </p>
        {installPrompt && !installed && (
          <button className={styles.installBtn} onClick={handleInstall}>
            지금 설치하기
          </button>
        )}
        {installed && (
          <p className={styles.successMsg}>설치 완료! 앱을 열어 시작하세요.</p>
        )}
        <div className={styles.guideWrap}>
          <div className={styles.guideSection}>
            <div className={styles.stepList}>
              <div className={styles.step}>
                <span className={styles.num}>1</span>
                <span>주소창 오른쪽 설치 아이콘 클릭</span>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>2</span>
                <span>&ldquo;설치&rdquo; 버튼 클릭</span>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>3</span>
                <span>바탕화면에서 모니 앱 실행</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type GuideType = "mobile" | "desktop" | null;

function detectGuide(): GuideType {
  // 로컬 개발환경에서는 가드 비활성화
  if (window.location.hostname === "localhost") return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const isStandalone = isIOS
    ? (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    : window.matchMedia("(display-mode: standalone)").matches;

  if (isStandalone) return null;

  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  return isMobile ? "mobile" : "desktop";
}

export function PwaGuardOverlay() {
  const [guide, setGuide] = useState<GuideType>(null);

  useEffect(() => {
    setGuide(detectGuide());
  }, []);

  if (!guide) return null;

  return (
    <div className={styles.overlay}>
      {guide === "mobile" ? <MobileGuide /> : <DesktopGuide />}
    </div>
  );
}
