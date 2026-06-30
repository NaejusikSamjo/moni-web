import { apiRequest } from "@/shared/api/instance";
import { ApiException } from "@/shared/api/types";
import type { PageRes } from "@/shared/api/types";
import type {
  AccountResponse,
  TradeBuyRequest,
  TradeSellRequest,
  TradeResponse,
  HoldingResponse,
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

  getHolding: (ticker: string): Promise<HoldingResponse> =>
    apiRequest(`/api/v1/holdings/${ticker}`),
};
