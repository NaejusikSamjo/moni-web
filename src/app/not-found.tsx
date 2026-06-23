import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
        <p className={styles.desc}>
          요청하신 페이지가 존재하지 않거나<br />
          주소가 잘못되었습니다.
        </p>
        <Link href="/" className={styles.homeBtn}>홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
