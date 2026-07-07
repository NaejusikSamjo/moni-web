import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type { PageRes } from "@/shared/api/types";
import type {
  AccountResponse,
  TradeBuyRequest,
  TradeSellRequest,
  TradeResponse,
  HoldingResponse,
  ReservedBuyOrderRequest,
  ReservedSellOrderRequest,
  ReservedOrderResponse,
} from "@/entities/trade/model/types";

export const tradeApi = {
  getAccount: async (): Promise<AccountResponse | null> => {
    try {
      return await apiRequest<AccountResponse>("/api/v1/accounts");
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  },

  createAccount: (): Promise<AccountResponse> =>
    apiRequest("/api/v1/accounts", { method: "POST" }),

  buyStock: (data: TradeBuyRequest): Promise<TradeResponse> =>
    apiRequest("/api/v1/trades/buy", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sellStock: (data: TradeSellRequest): Promise<TradeResponse> =>
    apiRequest("/api/v1/trades/sell", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTrades: (page = 0, size = 20): Promise<PageRes<TradeResponse>> =>
    apiRequest(`/api/v1/trades?page=${page}&size=${size}`),

  getHoldings: (page = 0, size = 50): Promise<PageRes<HoldingResponse>> =>
    apiRequest(`/api/v1/holdings?page=${page}&size=${size}`),

  getHolding: async (ticker: string): Promise<HoldingResponse | null> => {
    try {
      return await apiRequest<HoldingResponse>(`/api/v1/holdings/${ticker}`);
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  },

  getReservedOrders: (): Promise<ReservedOrderResponse[]> =>
    apiRequest("/api/v1/reserved-orders"),

  createReservedBuyOrder: (data: ReservedBuyOrderRequest): Promise<ReservedOrderResponse> =>
    apiRequest("/api/v1/reserved-orders/buy", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createReservedSellOrder: (data: ReservedSellOrderRequest): Promise<ReservedOrderResponse> =>
    apiRequest("/api/v1/reserved-orders/sell", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancelReservedOrder: (orderId: string): Promise<void> =>
    apiRequest(`/api/v1/reserved-orders/${orderId}`, { method: "DELETE" }),
};
