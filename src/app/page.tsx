import Link from "next/link";
import { AnimatedWord } from "./AnimatedWord";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.heroTitle}>
          투자, 이제<br />
          <span className={styles.heroAccent}><AnimatedWord /></span><span className={styles.heroCoda}>와</span><br />
          함께 시작하세요
        </h1>
        <p className={styles.heroDesc}>
          모의 투자로 리스크 없이 배우고,<br />
          AI 분석으로 현명하게 투자하세요
        </p>
      </main>

      <footer className={styles.footer}>
        <Link href="/auth/signup" className={styles.startBtn}>시작하기</Link>
        <p className={styles.loginRow}>
          이미 계정이 있나요?&nbsp;
          <Link href="/auth/login" className={styles.loginLink}>로그인</Link>
        </p>
        <p className={styles.disclaimer}>
          본 서비스는 투자 교육 목적의 모의 투자 플랫폼으로, 실제 투자 권유가 아닙니다.
        </p>
      </footer>
    </div>
  );
}
