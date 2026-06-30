export interface SubscribeRequest {
  authKey: string;
  customerKey: string;
  amount: number;
  orderName: string;
}

export interface SubscribeResponse {
  paymentId: string;
  status: string;
  amount: number;
  nextBillingDate: string;
}

export type SubscriptionStatus = "ACTIVE" | "CANCELLING" | "CANCELLED";

export interface SubscriptionStatusResponse {
  subscribed: boolean;
  subscriptionId: string;
  status: SubscriptionStatus;
  nextBillingDate: string | null;
  amount: number;
}

export interface CancelSubscriptionResponse {
  subscriptionId: string;
  status: string;
  cancelledAt: string;
}

export type PaymentType = "SUBSCRIPTION_INITIAL" | "SUBSCRIPTION_AUTO";
export type PaymentStatus = "COMPLETED" | "FAILED" | "PENDING";

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  paymentType: PaymentType;
  status: PaymentStatus;
  pgPaymentKey: string;
  createdAt: string;
  expiresAt: string;
}

export interface PaymentHistoryResponse {
  content: PaymentHistoryItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
