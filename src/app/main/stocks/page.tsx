"use client";

import { PageHeader } from "@/widgets/page-header/PageHeader";
import { ServiceUnavailable } from "@/shared/ui";
import styles from "./page.module.css";

export default function StocksPage() {
  return (
    <div className="app-page">
      <PageHeader title="투자" />
      <div className={styles.unavailWrap}>
        <ServiceUnavailable message="종목 정보 서비스가 일시적으로 불안정합니다" />
      </div>
    </div>
  );
}
