export type NotificationType =
  | "AI_PORTFOLIO_COMPLETED"
  | "MARKET_OPEN"
  | "MARKET_CLOSE"
  | "STOCK_PRICE_ALERT"
  | "PROMOTION";

export interface NotificationItem {
  id: string;
  receiver: string;
  content: string;
  type: NotificationType;
  createdAt: string;
}

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  AI_PORTFOLIO_COMPLETED: "AI 포트폴리오",
  MARKET_OPEN: "장 오픈",
  MARKET_CLOSE: "장 마감",
  STOCK_PRICE_ALERT: "주가 알림",
  PROMOTION: "공지",
};
