import { apiRequest } from "@/shared/api/instance";
import type {
  SubscribeRequest,
  SubscribeResponse,
  PaymentHistoryResponse,
  SubscriptionStatusResponse,
  CancelSubscriptionResponse,
} from "@/entities/payment/model/types";

export const paymentApi = {
  subscribe: (data: SubscribeRequest): Promise<SubscribeResponse> =>
    apiRequest("/api/v1/payments/subscription", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSubscriptionStatus: (): Promise<SubscriptionStatusResponse> =>
    apiRequest("/api/v1/payments/subscriptions/status"),

  cancelSubscription: (): Promise<CancelSubscriptionResponse> =>
    apiRequest("/api/v1/payments/subscriptions", { method: "DELETE" }),

  getHistory: (page = 0): Promise<PaymentHistoryResponse> =>
    apiRequest(`/api/v1/payments?page=${page}&size=10`),
};
