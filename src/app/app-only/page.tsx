import styles from "./page.module.css";

export default function AppOnlyPage() {
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
          <div className={styles.guideTab}>
            <span className={styles.tabLabel}>iPhone / iPad</span>
            <div className={styles.stepList}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <span>하단 공유 버튼 탭</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <span><b>홈 화면에 추가</b> 선택</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <span>오른쪽 상단 <b>추가</b> 탭</span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.guideTab}>
            <span className={styles.tabLabel}>Android</span>
            <div className={styles.stepList}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <span>브라우저 우측 상단 메뉴 탭</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <span><b>앱 설치</b> 또는 <b>홈 화면에 추가</b> 선택</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <span>홈 화면에서 모니 실행</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
