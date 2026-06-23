import { Badge } from "@/shared/ui";
import { ServiceUnavailable } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header/PageHeader";
import styles from "./page.module.css";

export default function PortfolioPage() {
  return (
    <div className="app-page">
      <PageHeader
        title="포트폴리오"
        rightNode={<Badge variant="ai">AI 분석</Badge>}
      />
      <div className={styles.unavailWrap}>
        <ServiceUnavailable message="포트폴리오 서비스가 일시적으로 불안정합니다" />
      </div>
    </div>
  );
}
