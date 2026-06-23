"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function DesktopBlockPage() {
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

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span>주소창 오른쪽 설치 아이콘 클릭</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span>&ldquo;설치&rdquo; 버튼 클릭</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span>바탕화면에서 모니 앱 실행</span>
          </div>
        </div>
      </div>
    </div>
  );
}
