import { RiAlertLine } from "react-icons/ri";
import styles from "./ServiceUnavailable.module.css";

interface Props {
  message?: string;
  compact?: boolean;
}

export function ServiceUnavailable({ message = "서비스가 일시적으로 불안정합니다", compact }: Props) {
  return (
    <div className={[styles.wrap, compact ? styles.wrapCompact : ""].filter(Boolean).join(" ")}>
      <RiAlertLine size={compact ? 22 : 28} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      <p className={styles.hint}>잠시 후 다시 시도해주세요</p>
    </div>
  );
}
